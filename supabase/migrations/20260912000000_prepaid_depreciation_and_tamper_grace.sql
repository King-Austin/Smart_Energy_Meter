-- ================================================================
-- VOLTRIX SMART METER - PREPAID DEPRECIATION, TAMPER GRACE PERIOD & ADMIN UNITS
-- Migration: 20260912000000_prepaid_depreciation_and_tamper_grace.sql
-- ================================================================

-- 1. Add tamper_cleared_at tracking column
ALTER TABLE public.meters ADD COLUMN IF NOT EXISTS tamper_cleared_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create admin_set_units RPC
CREATE OR REPLACE FUNCTION public.admin_set_units(
  p_meter_id text,
  p_units numeric,
  p_admin_pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tariff NUMERIC;
BEGIN
  IF p_admin_pin != '1234' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Admin Security PIN');
  END IF;

  SELECT COALESCE(tariff_rate, 85.5) INTO v_tariff FROM public.meters WHERE meter_id = p_meter_id;

  UPDATE public.meters
  SET prepaid_units_kwh = ROUND(p_units, 3),
      wallet_balance = ROUND(p_units * COALESCE(v_tariff, 85.5), 2),
      main_supply_connected = CASE WHEN p_units > 0 AND NOT COALESCE(tamper_locked, false) THEN true ELSE main_supply_connected END,
      updated_at = now()
  WHERE meter_id = p_meter_id;

  RETURN jsonb_build_object(
    'success', true,
    'meter_id', p_meter_id,
    'prepaid_units_kwh', p_units,
    'message', 'Prepaid units updated successfully to ' || p_units || ' kWh.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_units TO anon, authenticated, service_role;

-- 3. Upgraded admin_clear_tamper with grace period
CREATE OR REPLACE FUNCTION public.admin_clear_tamper(
  p_meter_id text,
  p_admin_pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_admin_pin != '1234' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Admin Security PIN');
  END IF;

  -- Mark all active tamper events as resolved
  UPDATE public.tamper_events
  SET resolved = true,
      resolved_by = 'Admin (PIN Verified)',
      resolved_at = now()
  WHERE meter_id = p_meter_id AND resolved = false;

  -- Reset tamper locks, set tamper_cleared_at to grace period, and reconnect supply
  UPDATE public.meters
  SET is_tampered = false,
      tamper_locked = false,
      main_supply_connected = true,
      hardware_relay_ack = true,
      tamper_cleared_at = now(),
      updated_at = now()
  WHERE meter_id = p_meter_id;

  RETURN jsonb_build_object(
    'success', true,
    'meter_id', p_meter_id,
    'main_supply_connected', true,
    'tamper_locked', false,
    'message', 'Tamper lock cleared. Main supply contactor restored.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_clear_tamper TO anon, authenticated, service_role;

-- 4. Upgraded record_telemetry with autonomous unit depreciation and tamper grace
CREATE OR REPLACE FUNCTION public.record_telemetry(
  p_meter_id text,
  p_voltage numeric,
  p_current numeric,
  p_active_power numeric,
  p_power_factor numeric,
  p_frequency numeric,
  p_is_tampered boolean,
  p_is_relay_on boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meter RECORD;
  v_tamper_locked BOOLEAN;
  v_main_supply BOOLEAN;
  v_voltage_trip BOOLEAN := false;
  v_max_voltage NUMERIC := 250.0;
  v_min_voltage NUMERIC := 180.0;
  v_new_units NUMERIC;
  v_new_wallet NUMERIC;
  v_new_energy_today NUMERIC;
  v_new_energy_month NUMERIC;
  v_grid_status TEXT;
  v_elapsed_sec NUMERIC;
  v_energy_increment NUMERIC := 0.0;
  v_in_grace_period BOOLEAN := false;
BEGIN
  -- 1. Fetch current meter record with row locking
  SELECT * INTO v_meter FROM public.meters WHERE meter_id = p_meter_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.meters (
      meter_id, meter_name, voltage, current, active_power, power_factor, frequency,
      is_tampered, tamper_locked, main_supply_connected, prepaid_units_kwh, wallet_balance,
      max_voltage_limit, min_voltage_limit, hardware_relay_ack, last_seen
    ) VALUES (
      p_meter_id, 'My Home', p_voltage, p_current, p_active_power, p_power_factor, p_frequency,
      p_is_tampered, p_is_tampered, NOT p_is_tampered, 100.0, 8550.0,
      240.0, 180.0, p_is_relay_on, now()
    )
    RETURNING * INTO v_meter;
  END IF;

  -- Check if admin recently cleared tamper (15-second grace period)
  IF v_meter.tamper_cleared_at IS NOT NULL AND (now() - v_meter.tamper_cleared_at) < interval '15 seconds' THEN
    v_in_grace_period := true;
  END IF;

  IF v_in_grace_period THEN
    v_tamper_locked := false;
  ELSE
    v_tamper_locked := COALESCE(v_meter.tamper_locked, false);
    -- Detect new tamper transition if not in grace period
    IF p_is_tampered AND NOT v_tamper_locked THEN
      v_tamper_locked := true;
      INSERT INTO public.tamper_events (meter_id, event_type, description, created_at, resolved)
      VALUES (p_meter_id, 'ss5gl_lid_opened', 'SS-5GL microswitch triggered: Enclosure lid opened', now(), false);
    END IF;
  END IF;

  v_max_voltage := COALESCE(v_meter.max_voltage_limit, 240.0);
  v_min_voltage := COALESCE(v_meter.min_voltage_limit, 180.0);

  -- 2. Evaluate Dynamic Voltage Cutoff Guardrail
  IF p_voltage > 10.0 AND (p_voltage > v_max_voltage OR p_voltage < v_min_voltage) THEN
    v_voltage_trip := true;
  END IF;

  -- 3. Calculate Energy Consumption & Prepaid Unit Depreciation
  IF v_meter.last_seen IS NOT NULL THEN
    v_elapsed_sec := GREATEST(1.0, LEAST(60.0, EXTRACT(EPOCH FROM (now() - v_meter.last_seen))));
  ELSE
    v_elapsed_sec := 2.0;
  END IF;

  IF COALESCE(v_meter.main_supply_connected, true) AND p_voltage >= 50.0 AND p_active_power > 0.002 THEN
    v_energy_increment := ROUND((p_active_power * (v_elapsed_sec / 3600.0)), 5);
  ELSE
    v_energy_increment := 0.0;
  END IF;

  v_new_units := GREATEST(0.0, ROUND(COALESCE(v_meter.prepaid_units_kwh, 100.0) - v_energy_increment, 4));
  v_new_energy_today := ROUND(COALESCE(v_meter.energy_today, 0.0) + v_energy_increment, 4);
  v_new_energy_month := ROUND(COALESCE(v_meter.energy_month, 0.0) + v_energy_increment, 4);
  v_new_wallet := ROUND(v_new_units * COALESCE(v_meter.tariff_rate, 85.5), 2);

  -- 4. Calculate Final Contactor Relay Authorization
  IF v_tamper_locked OR v_voltage_trip OR v_new_units <= 0.0 THEN
    v_main_supply := false;
  ELSE
    v_main_supply := COALESCE(v_meter.main_supply_connected, true);
  END IF;

  IF p_voltage < 10.0 THEN
    v_grid_status := 'offline';
  ELSE
    v_grid_status := 'online';
  END IF;

  -- 5. Update Master Meter Record
  UPDATE public.meters SET
    voltage = p_voltage,
    current = CASE WHEN p_voltage < 10.0 THEN 0.0 ELSE p_current END,
    active_power = CASE WHEN v_main_supply AND p_voltage >= 10.0 THEN p_active_power ELSE 0.0 END,
    power_factor = CASE WHEN p_voltage < 10.0 THEN 0.0 ELSE p_power_factor END,
    frequency = CASE WHEN p_voltage < 10.0 THEN 0.0 ELSE p_frequency END,
    grid_status = v_grid_status,
    is_tampered = (CASE WHEN v_in_grace_period THEN false ELSE (p_is_tampered OR v_tamper_locked) END),
    tamper_locked = v_tamper_locked,
    voltage_cutoff_tripped = v_voltage_trip,
    main_supply_connected = v_main_supply,
    prepaid_units_kwh = v_new_units,
    wallet_balance = v_new_wallet,
    energy_today = v_new_energy_today,
    energy_month = v_new_energy_month,
    hardware_relay_ack = p_is_relay_on,
    device_status = 'online',
    last_seen = now(),
    updated_at = now()
  WHERE meter_id = p_meter_id;

  -- 6. Insert Historical Telemetry Log
  INSERT INTO public.telemetry_logs (
    meter_id, voltage, current, active_power, power_factor, frequency,
    energy_today, is_tampered, is_relay_on, created_at
  ) VALUES (
    p_meter_id, 
    p_voltage, 
    CASE WHEN p_voltage < 10.0 THEN 0.0 ELSE p_current END, 
    CASE WHEN v_main_supply AND p_voltage >= 10.0 THEN p_active_power ELSE 0.0 END, 
    CASE WHEN p_voltage < 10.0 THEN 0.0 ELSE p_power_factor END, 
    CASE WHEN p_voltage < 10.0 THEN 0.0 ELSE p_frequency END,
    v_new_energy_today,
    (CASE WHEN v_in_grace_period THEN false ELSE (p_is_tampered OR v_tamper_locked) END), 
    v_main_supply, 
    now()
  );

  -- 7. Return Synchronization Payload to ESP32
  RETURN jsonb_build_object(
    'success', true,
    'meter_id', p_meter_id,
    'main_supply_connected', v_main_supply,
    'voltage_cutoff_tripped', v_voltage_trip,
    'max_voltage_limit', v_max_voltage,
    'min_voltage_limit', v_min_voltage,
    'tamper_locked', v_tamper_locked,
    'prepaid_units_kwh', v_new_units,
    'hardware_relay_ack', p_is_relay_on,
    'received_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_telemetry TO anon, authenticated, service_role;
