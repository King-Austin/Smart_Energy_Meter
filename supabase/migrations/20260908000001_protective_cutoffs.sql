-- ================================================================
-- VOLTRIX SMART ENERGY METER - PROTECTIVE CUTOFFS MIGRATION
-- Migration: 20260908000001_protective_cutoffs.sql
-- ================================================================

-- 1. Add voltage and bill threshold columns to meters table
ALTER TABLE public.meters
  ADD COLUMN IF NOT EXISTS max_voltage_limit NUMERIC NOT NULL DEFAULT 250.0,
  ADD COLUMN IF NOT EXISTS min_voltage_limit NUMERIC NOT NULL DEFAULT 180.0,
  ADD COLUMN IF NOT EXISTS bill_limit_threshold NUMERIC NOT NULL DEFAULT 35000.0,
  ADD COLUMN IF NOT EXISTS voltage_cutoff_tripped BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bill_cutoff_tripped BOOLEAN NOT NULL DEFAULT false;

-- 2. Update record_telemetry function to enforce automated safety cutoffs
CREATE OR REPLACE FUNCTION public.record_telemetry(
  p_meter_id TEXT,
  p_voltage NUMERIC,
  p_current NUMERIC,
  p_active_power NUMERIC,
  p_power_factor NUMERIC DEFAULT 0.95,
  p_frequency NUMERIC DEFAULT 50.0,
  p_energy_increment NUMERIC DEFAULT 0.0,
  p_is_tampered BOOLEAN DEFAULT false,
  p_battery_percentage INTEGER DEFAULT 82
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
  v_bill_trip BOOLEAN := false;
BEGIN
  -- Fetch existing meter row
  SELECT * INTO v_meter FROM public.meters WHERE meter_id = p_meter_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Meter not found');
  END IF;

  -- Check Overvoltage & Undervoltage safety conditions
  IF p_voltage > v_meter.max_voltage_limit OR p_voltage < v_meter.min_voltage_limit THEN
    v_voltage_trip := true;
  END IF;

  -- Calculate cumulative energy and cost
  v_new_energy_today := v_meter.energy_today + p_energy_increment;
  v_new_cost_today := ROUND(v_new_energy_today * v_meter.tariff_rate, 2);
  v_new_bill_month := ROUND(v_meter.energy_month * v_meter.tariff_rate, 2);

  -- Check Bill threshold condition
  IF v_new_bill_month >= v_meter.bill_limit_threshold THEN
    v_bill_trip := true;
  END IF;

  -- Deduct prepaid units
  v_new_units := GREATEST(0.0, ROUND(v_meter.prepaid_units_kwh - p_energy_increment, 2));
  v_new_wallet := ROUND(v_new_units * v_meter.tariff_rate, 2);

  -- Determine relay contactor state: cut off if tampered, out of units, voltage exceeded, or bill capped
  IF p_is_tampered OR v_new_units <= 0.0 OR v_voltage_trip OR v_bill_trip THEN
    v_relay_state := false;
  ELSE
    v_relay_state := v_meter.main_supply_connected;
  END IF;

  -- 1. Insert time-series log
  INSERT INTO public.telemetry_logs (
    meter_id,
    voltage,
    current,
    active_power,
    power_factor,
    frequency,
    energy_today,
    is_tampered,
    is_relay_on,
    created_at
  ) VALUES (
    p_meter_id,
    p_voltage,
    p_current,
    p_active_power,
    p_power_factor,
    p_frequency,
    v_new_energy_today,
    p_is_tampered,
    v_relay_state,
    now()
  );

  -- 2. Update meter state
  UPDATE public.meters SET
    voltage = p_voltage,
    current = p_current,
    active_power = CASE WHEN v_relay_state THEN p_active_power ELSE 0.0 END,
    power_factor = p_power_factor,
    frequency = p_frequency,
    apparent_power = ROUND((p_voltage * p_current) / 1000.0, 2),
    reactive_power = ROUND(SQRT(GREATEST(0, POW((p_voltage * p_current) / 1000.0, 2) - POW(p_active_power, 2))), 2),
    energy_today = v_new_energy_today,
    estimated_cost_today = v_new_cost_today,
    estimated_bill_month = v_new_bill_month,
    prepaid_units_kwh = v_new_units,
    wallet_balance = v_new_wallet,
    battery_percentage = COALESCE(p_battery_percentage, battery_percentage),
    main_supply_connected = v_relay_state,
    is_tampered = p_is_tampered,
    voltage_cutoff_tripped = v_voltage_trip,
    bill_cutoff_tripped = v_bill_trip,
    last_seen = now(),
    updated_at = now()
  WHERE meter_id = p_meter_id;

  RETURN jsonb_build_object(
    'success', true,
    'main_supply_connected', v_relay_state,
    'voltage_cutoff_tripped', v_voltage_trip,
    'bill_cutoff_tripped', v_bill_trip,
    'prepaid_units_kwh', v_new_units
  );
END;
$$;
