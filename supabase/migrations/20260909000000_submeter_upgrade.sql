-- ================================================================
-- VOLTRIX SMART SUBMETER - SOFTWARE UPGRADE & MULTI-METER FLEET MIGRATION
-- Migration: 20260909000000_submeter_upgrade.sql
-- ================================================================

-- 1. EXTEND METERS TABLE FOR MULTI-METER FLEET, BUDGET & PZEM TELEMETRY
ALTER TABLE public.meters
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Building Main',
  ADD COLUMN IF NOT EXISTS building_id TEXT NOT NULL DEFAULT 'BLD-01',
  ADD COLUMN IF NOT EXISTS over_current_limit NUMERIC NOT NULL DEFAULT 30.0,
  ADD COLUMN IF NOT EXISTS monthly_budget_naira NUMERIC NOT NULL DEFAULT 25000.0,
  ADD COLUMN IF NOT EXISTS monthly_budget_kwh NUMERIC NOT NULL DEFAULT 300.0,
  ADD COLUMN IF NOT EXISTS budget_alert_tiers JSONB NOT NULL DEFAULT '{"50":false,"80":false,"90":false,"100":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS tamper_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wifi_rssi INTEGER DEFAULT -68,
  ADD COLUMN IF NOT EXISTS free_heap_bytes INTEGER DEFAULT 185420,
  ADD COLUMN IF NOT EXISTS uptime_seconds BIGINT DEFAULT 3600,
  ADD COLUMN IF NOT EXISTS battery_mv INTEGER DEFAULT 3950,
  ADD COLUMN IF NOT EXISTS ota_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ota_version TEXT DEFAULT NULL;

-- 2. CREATE TAMPER EVENTS TABLE (SS-5GL Enclosure Lid Openings)
CREATE TABLE IF NOT EXISTS public.tamper_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id TEXT NOT NULL REFERENCES public.meters(meter_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'ss5gl_lid_opened',
  description TEXT NOT NULL DEFAULT 'Enclosure cover opened - SS-5GL limit switch triggered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tamper_events_meter 
ON public.tamper_events (meter_id, created_at DESC);

-- 3. CREATE OUTAGE LOGS TABLE (Battery-backed blackout duration records)
CREATE TABLE IF NOT EXISTS public.outage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id TEXT NOT NULL REFERENCES public.meters(meter_id) ON DELETE CASCADE,
  outage_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  outage_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  cause TEXT NOT NULL DEFAULT 'grid_loss_detected_by_battery'
);

CREATE INDEX IF NOT EXISTS idx_outage_logs_meter 
ON public.outage_logs (meter_id, outage_start DESC);

-- 4. SEED DEMO MULTI-METER FLEET IF NOT ALREADY PRESENT
INSERT INTO public.meters (
  meter_id, meter_name, location, building_id, user_id, 
  voltage, current, active_power, power_factor, frequency,
  tariff_rate, monthly_budget_naira, monthly_budget_kwh, over_current_limit,
  main_supply_connected, is_tampered, tamper_locked, grid_status, device_status
) VALUES 
  ('MTR-8A24-19F2', 'Main Residence', 'Flat 1 - Ground Floor', 'BLD-01', 'usr_9921',
   231.4, 6.8, 1.54, 0.98, 50.0, 68.5, 25000.0, 365.0, 30.0, true, false, false, 'online', 'online'),
  ('MTR-B310-44A1', 'Apartment 2B', 'Flat 2 - First Floor', 'BLD-01', 'usr_8832',
   229.8, 3.4, 0.77, 0.97, 50.0, 68.5, 18000.0, 260.0, 25.0, true, false, false, 'online', 'online'),
  ('MTR-C902-88F3', 'Commercial Storefront', 'Shop 1A - Street Front', 'BLD-01', 'usr_7714',
   232.0, 11.2, 2.55, 0.98, 50.0, 110.0, 45000.0, 410.0, 40.0, true, false, false, 'online', 'online')
ON CONFLICT (meter_id) DO UPDATE SET
  location = EXCLUDED.location,
  building_id = EXCLUDED.building_id,
  tariff_rate = COALESCE(public.meters.tariff_rate, EXCLUDED.tariff_rate),
  monthly_budget_naira = COALESCE(public.meters.monthly_budget_naira, EXCLUDED.monthly_budget_naira),
  monthly_budget_kwh = COALESCE(public.meters.monthly_budget_kwh, EXCLUDED.monthly_budget_kwh),
  over_current_limit = COALESCE(public.meters.over_current_limit, EXCLUDED.over_current_limit);

-- 5. UPGRADED RECORD_TELEMETRY RPC WITH PZEM PARAMETERS & SAFETY ENFORCEMENT
CREATE OR REPLACE FUNCTION public.record_telemetry(
  p_meter_id TEXT,
  p_voltage NUMERIC,
  p_current NUMERIC,
  p_active_power NUMERIC,
  p_power_factor NUMERIC DEFAULT 0.95,
  p_frequency NUMERIC DEFAULT 50.0,
  p_energy_increment NUMERIC DEFAULT 0.0,
  p_is_tampered BOOLEAN DEFAULT false,
  p_battery_percentage INTEGER DEFAULT 82,
  p_wifi_rssi INTEGER DEFAULT -68,
  p_free_heap INTEGER DEFAULT 185000,
  p_uptime_sec BIGINT DEFAULT 3600
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meter RECORD;
  v_new_energy_today NUMERIC;
  v_new_units NUMERIC;
  v_new_wallet NUMERIC;
  v_new_cost_today NUMERIC;
  v_new_bill_month NUMERIC;
  v_relay_state BOOLEAN;
  v_voltage_trip BOOLEAN := false;
  v_current_trip BOOLEAN := false;
  v_bill_trip BOOLEAN := false;
  v_tamper_locked BOOLEAN;
  v_grid_status TEXT;
  v_open_outage RECORD;
BEGIN
  -- Fetch target meter row with row lock
  SELECT * INTO v_meter FROM public.meters WHERE meter_id = p_meter_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Meter not found');
  END IF;

  v_tamper_locked := v_meter.tamper_locked;

  -- 1. Check SS-5GL Lid Tamper Condition
  IF p_is_tampered AND NOT v_meter.is_tampered THEN
    v_tamper_locked := true;
    INSERT INTO public.tamper_events (meter_id, event_type, description, created_at, resolved)
    VALUES (p_meter_id, 'ss5gl_lid_opened', 'SS-5GL limit switch triggered: Enclosure lid opened', now(), false);
  ELSIF v_tamper_locked THEN
    v_tamper_locked := true;
  END IF;

  -- 2. Check Over-Current Protection (Cutoff if current exceeds configured limit)
  IF p_current > v_meter.over_current_limit THEN
    v_current_trip := true;
  END IF;

  -- 3. Check Over/Under Voltage (Brownout / Surge)
  IF p_voltage > v_meter.max_voltage_limit OR (p_voltage < v_meter.min_voltage_limit AND p_voltage >= 50.0) THEN
    v_voltage_trip := true;
  END IF;

  -- 4. Check Outage Condition (PZEM Voltage < 50V while ESP32 is powered on battery)
  IF p_voltage < 50.0 THEN
    v_grid_status := 'offline';
    -- Check if open outage record already exists
    SELECT * INTO v_open_outage FROM public.outage_logs 
    WHERE meter_id = p_meter_id AND outage_end IS NULL 
    ORDER BY outage_start DESC LIMIT 1;

    IF NOT FOUND THEN
      INSERT INTO public.outage_logs (meter_id, outage_start, cause)
      VALUES (p_meter_id, now(), 'grid_loss_detected_by_battery');
    END IF;
  ELSE
    v_grid_status := 'online';
    -- If electricity restored, close any open outage record
    UPDATE public.outage_logs 
    SET outage_end = now(),
        duration_seconds = EXTRACT(EPOCH FROM (now() - outage_start))::INTEGER
    WHERE meter_id = p_meter_id AND outage_end IS NULL;
  END IF;

  -- 5. Calculate cumulative energy and ₦ costs
  v_new_energy_today := v_meter.energy_today + p_energy_increment;
  v_new_cost_today := ROUND(v_new_energy_today * v_meter.tariff_rate, 2);
  v_new_bill_month := ROUND((v_meter.energy_month + p_energy_increment) * v_meter.tariff_rate, 2);

  -- 6. Check Monthly Budget Cap
  IF v_new_bill_month >= v_meter.monthly_budget_naira THEN
    v_bill_trip := true;
  END IF;

  -- Deduct prepaid units
  v_new_units := GREATEST(0.0, ROUND(v_meter.prepaid_units_kwh - p_energy_increment, 2));
  v_new_wallet := ROUND(v_new_units * v_meter.tariff_rate, 2);

  -- 7. Contactor Relay State: Trip OFF if tampered, overcurrent, out of units, voltage abnormal, or bill capped
  IF p_is_tampered OR v_tamper_locked OR v_current_trip OR v_voltage_trip OR v_bill_trip OR v_new_units <= 0.0 THEN
    v_relay_state := false;
  ELSE
    v_relay_state := v_meter.main_supply_connected;
  END IF;

  -- 8. Insert time-series log
  INSERT INTO public.telemetry_logs (
    meter_id, voltage, current, active_power, power_factor, frequency,
    energy_today, is_tampered, is_relay_on, created_at
  ) VALUES (
    p_meter_id, p_voltage, p_current, p_active_power, p_power_factor, p_frequency,
    v_new_energy_today, (p_is_tampered OR v_tamper_locked), v_relay_state, now()
  );

  -- 9. Update live meter row
  UPDATE public.meters SET
    voltage = p_voltage,
    current = p_current,
    active_power = CASE WHEN v_relay_state THEN p_active_power ELSE 0.0 END,
    power_factor = p_power_factor,
    frequency = p_frequency,
    apparent_power = ROUND((p_voltage * p_current) / 1000.0, 2),
    reactive_power = ROUND(SQRT(GREATEST(0, POW((p_voltage * p_current) / 1000.0, 2) - POW(p_active_power, 2))), 2),
    energy_today = v_new_energy_today,
    energy_month = v_meter.energy_month + p_energy_increment,
    estimated_cost_today = v_new_cost_today,
    estimated_bill_month = v_new_bill_month,
    prepaid_units_kwh = v_new_units,
    wallet_balance = v_new_wallet,
    grid_status = v_grid_status,
    battery_percentage = COALESCE(p_battery_percentage, battery_percentage),
    main_supply_connected = v_relay_state,
    is_tampered = (p_is_tampered OR v_tamper_locked),
    tamper_locked = v_tamper_locked,
    voltage_cutoff_tripped = v_voltage_trip,
    bill_cutoff_tripped = v_bill_trip,
    wifi_rssi = COALESCE(p_wifi_rssi, wifi_rssi),
    free_heap_bytes = COALESCE(p_free_heap, free_heap_bytes),
    uptime_seconds = COALESCE(p_uptime_sec, uptime_seconds),
    last_seen = now(),
    updated_at = now()
  WHERE meter_id = p_meter_id;

  RETURN jsonb_build_object(
    'success', true,
    'main_supply_connected', v_relay_state,
    'tamper_locked', v_tamper_locked,
    'voltage_cutoff_tripped', v_voltage_trip,
    'current_cutoff_tripped', v_current_trip,
    'bill_cutoff_tripped', v_bill_trip,
    'prepaid_units_kwh', v_new_units
  );
END;
$$;

-- 6. RPC: BATCH SYNC TELEMETRY (For LittleFS Offline Dump)
CREATE OR REPLACE FUNCTION public.batch_sync_telemetry(
  p_meter_id TEXT,
  p_records JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec JSONB;
  v_count INTEGER := 0;
BEGIN
  IF jsonb_array_length(p_records) = 0 THEN
    RETURN jsonb_build_object('success', true, 'synced_count', 0);
  END IF;

  FOR v_rec IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    INSERT INTO public.telemetry_logs (
      meter_id, voltage, current, active_power, power_factor, frequency,
      energy_today, is_tampered, is_relay_on, created_at
    ) VALUES (
      p_meter_id,
      (v_rec->>'voltage')::NUMERIC,
      (v_rec->>'current')::NUMERIC,
      (v_rec->>'active_power')::NUMERIC,
      COALESCE((v_rec->>'power_factor')::NUMERIC, 0.95),
      COALESCE((v_rec->>'frequency')::NUMERIC, 50.0),
      (v_rec->>'energy_today')::NUMERIC,
      COALESCE((v_rec->>'is_tampered')::BOOLEAN, false),
      COALESCE((v_rec->>'is_relay_on')::BOOLEAN, true),
      COALESCE((v_rec->>'created_at')::TIMESTAMPTZ, now())
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'synced_count', v_count);
END;
$$;

-- 7. RPC: ADMIN SET RELAY (With PIN Authorization)
CREATE OR REPLACE FUNCTION public.admin_set_relay(
  p_meter_id TEXT,
  p_state BOOLEAN,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meter RECORD;
BEGIN
  -- Validate standard default PIN '1234' (or environment PIN)
  IF p_admin_pin != '1234' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Admin Security PIN');
  END IF;

  SELECT * INTO v_meter FROM public.meters WHERE meter_id = p_meter_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Meter not found');
  END IF;

  -- Block turning relay ON if meter is physically tampered
  IF p_state = true AND v_meter.tamper_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot connect supply: Tamper lock active. Clear tamper first.');
  END IF;

  UPDATE public.meters 
  SET main_supply_connected = p_state,
      updated_at = now()
  WHERE meter_id = p_meter_id;

  RETURN jsonb_build_object(
    'success', true,
    'meter_id', p_meter_id,
    'main_supply_connected', p_state,
    'message', CASE WHEN p_state THEN 'Contactor relay connected' ELSE 'Contactor relay disconnected' END
  );
END;
$$;

-- 8. RPC: ADMIN CLEAR TAMPER & RESTORE SUPPLY
CREATE OR REPLACE FUNCTION public.admin_clear_tamper(
  p_meter_id TEXT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_admin_pin != '1234' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Admin Security PIN');
  END IF;

  -- Mark open tamper events as resolved
  UPDATE public.tamper_events
  SET resolved = true,
      resolved_by = 'Admin (PIN Verified)',
      resolved_at = now()
  WHERE meter_id = p_meter_id AND resolved = false;

  -- Reset tamper locks and reconnect contactor
  UPDATE public.meters
  SET is_tampered = false,
      tamper_locked = false,
      main_supply_connected = true,
      updated_at = now()
  WHERE meter_id = p_meter_id;

  RETURN jsonb_build_object(
    'success', true,
    'meter_id', p_meter_id,
    'message', 'Tamper lock cleared. Main supply contactor restored.'
  );
END;
$$;

-- 9. RPC: ADMIN UPDATE METER CONFIGURATION
CREATE OR REPLACE FUNCTION public.admin_update_meter_config(
  p_meter_id TEXT,
  p_tariff NUMERIC,
  p_budget_naira NUMERIC,
  p_budget_kwh NUMERIC,
  p_over_current NUMERIC,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_admin_pin != '1234' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Admin Security PIN');
  END IF;

  UPDATE public.meters SET
    tariff_rate = COALESCE(p_tariff, tariff_rate),
    monthly_budget_naira = COALESCE(p_budget_naira, monthly_budget_naira),
    monthly_budget_kwh = COALESCE(p_budget_kwh, monthly_budget_kwh),
    over_current_limit = COALESCE(p_over_current, over_current_limit),
    updated_at = now()
  WHERE meter_id = p_meter_id;

  RETURN jsonb_build_object(
    'success', true,
    'meter_id', p_meter_id,
    'message', 'Meter configuration successfully updated'
  );
END;
$$;
