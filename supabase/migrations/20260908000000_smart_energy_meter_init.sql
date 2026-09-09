-- ================================================================
-- VOLTRIX SMART ENERGY METER - DATABASE INITIALIZATION
-- Target Project: kmosslvdjdhrjgvitctr (Smart_energy_meter)
-- ================================================================

-- 1. METERS TABLE
CREATE TABLE IF NOT EXISTS public.meters (
  meter_id TEXT PRIMARY KEY,
  meter_name TEXT NOT NULL DEFAULT 'My Home',
  user_id TEXT NOT NULL DEFAULT 'usr_9921',
  voltage NUMERIC NOT NULL DEFAULT 230.0,
  current NUMERIC NOT NULL DEFAULT 0.0,
  active_power NUMERIC NOT NULL DEFAULT 0.0,
  power_factor NUMERIC NOT NULL DEFAULT 0.95,
  frequency NUMERIC NOT NULL DEFAULT 50.0,
  apparent_power NUMERIC NOT NULL DEFAULT 0.0,
  reactive_power NUMERIC NOT NULL DEFAULT 0.0,
  wallet_balance NUMERIC NOT NULL DEFAULT 14500.0,
  prepaid_units_kwh NUMERIC NOT NULL DEFAULT 96.6,
  estimated_days_remaining INTEGER NOT NULL DEFAULT 12,
  auto_topup_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_topup_threshold NUMERIC NOT NULL DEFAULT 2000.0,
  energy_today NUMERIC NOT NULL DEFAULT 8.42,
  energy_yesterday NUMERIC NOT NULL DEFAULT 9.56,
  energy_week NUMERIC NOT NULL DEFAULT 54.8,
  energy_month NUMERIC NOT NULL DEFAULT 214.6,
  projected_month NUMERIC NOT NULL DEFAULT 246.0,
  estimated_cost_today NUMERIC NOT NULL DEFAULT 1263.0,
  estimated_bill_month NUMERIC NOT NULL DEFAULT 32190.0,
  projected_bill_month NUMERIC NOT NULL DEFAULT 36900.0,
  grid_status TEXT NOT NULL DEFAULT 'online',
  device_status TEXT NOT NULL DEFAULT 'online',
  connection_quality TEXT NOT NULL DEFAULT 'good',
  battery_percentage INTEGER NOT NULL DEFAULT 82,
  battery_status TEXT NOT NULL DEFAULT 'charging',
  main_supply_connected BOOLEAN NOT NULL DEFAULT true,
  is_tampered BOOLEAN NOT NULL DEFAULT false,
  tariff_rate NUMERIC NOT NULL DEFAULT 150.0,
  currency_symbol TEXT NOT NULL DEFAULT '₦',
  currency_code TEXT NOT NULL DEFAULT 'NGN',
  firmware_version TEXT NOT NULL DEFAULT 'v1.0.4',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TELEMETRY LOGS (Historical Time-Series)
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
  id BIGSERIAL PRIMARY KEY,
  meter_id TEXT NOT NULL REFERENCES public.meters(meter_id) ON DELETE CASCADE,
  voltage NUMERIC NOT NULL,
  current NUMERIC NOT NULL,
  active_power NUMERIC NOT NULL,
  power_factor NUMERIC DEFAULT 0.95,
  frequency NUMERIC DEFAULT 50.0,
  energy_today NUMERIC,
  is_tampered BOOLEAN DEFAULT false,
  is_relay_on BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_logs_meter_time 
ON public.telemetry_logs (meter_id, created_at DESC);

-- 3. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  meter_id TEXT REFERENCES public.meters(meter_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount_currency NUMERIC NOT NULL,
  units_kwh NUMERIC,
  status TEXT NOT NULL DEFAULT 'successful',
  token_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. REGISTERED RECIPIENTS (P2P Sharing)
CREATE TABLE IF NOT EXISTS public.recipients (
  meter_id TEXT PRIMARY KEY,
  meter_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT true,
  is_saved BOOLEAN NOT NULL DEFAULT true,
  last_used_date TEXT
);

-- 5. SHARING SESSIONS
CREATE TABLE IF NOT EXISTS public.sharing_sessions (
  session_id TEXT PRIMARY KEY,
  source_meter_id TEXT REFERENCES public.meters(meter_id) ON DELETE CASCADE,
  source_meter_name TEXT,
  destination_meter_id TEXT,
  destination_meter_name TEXT,
  direction TEXT NOT NULL DEFAULT 'sending',
  status TEXT NOT NULL DEFAULT 'idle',
  power_limit_w NUMERIC NOT NULL DEFAULT 500,
  energy_limit_kwh NUMERIC NOT NULL DEFAULT 2.0,
  duration_limit_seconds INTEGER NOT NULL DEFAULT 3600,
  current_power_w NUMERIC NOT NULL DEFAULT 0,
  energy_transferred_kwh NUMERIC NOT NULL DEFAULT 0,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  source_online BOOLEAN NOT NULL DEFAULT true,
  destination_online BOOLEAN NOT NULL DEFAULT true,
  cloud_sync_status TEXT NOT NULL DEFAULT 'live'
);

-- 6. ATOMIC TELEMETRY INGESTION RPC (ESP32 & Monitoring)
CREATE OR REPLACE FUNCTION public.record_telemetry(
  p_meter_id TEXT,
  p_voltage NUMERIC,
  p_current NUMERIC,
  p_active_power NUMERIC,
  p_power_factor NUMERIC DEFAULT 0.95,
  p_frequency NUMERIC DEFAULT 50.0,
  p_is_tampered BOOLEAN DEFAULT false,
  p_is_relay_on BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_main_supply BOOLEAN;
  v_prepaid_kwh NUMERIC;
  v_result JSONB;
BEGIN
  -- 1. Ensure meter exists; if not, insert basic default
  INSERT INTO public.meters (meter_id, meter_name, voltage, current, active_power, is_tampered, main_supply_connected, last_seen)
  VALUES (p_meter_id, 'My Home', p_voltage, p_current, p_active_power, p_is_tampered, p_is_relay_on, now())
  ON CONFLICT (meter_id) DO UPDATE
  SET
    voltage = EXCLUDED.voltage,
    current = EXCLUDED.current,
    active_power = EXCLUDED.active_power,
    power_factor = COALESCE(p_power_factor, meters.power_factor),
    frequency = COALESCE(p_frequency, meters.frequency),
    is_tampered = EXCLUDED.is_tampered,
    device_status = 'online',
    last_seen = now(),
    updated_at = now()
  RETURNING main_supply_connected, prepaid_units_kwh INTO v_main_supply, v_prepaid_kwh;

  -- 2. Insert into historical time-series log
  INSERT INTO public.telemetry_logs (
    meter_id, voltage, current, active_power, power_factor, frequency, is_tampered, is_relay_on, created_at
  )
  VALUES (
    p_meter_id, p_voltage, p_current, p_active_power, p_power_factor, p_frequency, p_is_tampered, p_is_relay_on, now()
  );

  -- 3. Return status payload to ESP32 / monitor
  v_result := jsonb_build_object(
    'success', true,
    'meter_id', p_meter_id,
    'main_supply_connected', COALESCE(v_main_supply, true),
    'prepaid_units_kwh', COALESCE(v_prepaid_kwh, 0.0),
    'received_at', now()
  );

  RETURN v_result;
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated read/write for demo and monitoring
DROP POLICY IF EXISTS "Allow anon read meters" ON public.meters;
CREATE POLICY "Allow anon read meters" ON public.meters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon update meters" ON public.meters;
CREATE POLICY "Allow anon update meters" ON public.meters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read telemetry_logs" ON public.telemetry_logs;
CREATE POLICY "Allow anon read telemetry_logs" ON public.telemetry_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert telemetry_logs" ON public.telemetry_logs;
CREATE POLICY "Allow anon insert telemetry_logs" ON public.telemetry_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Allow anon read wallet_transactions" ON public.wallet_transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Allow anon insert wallet_transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read recipients" ON public.recipients;
CREATE POLICY "Allow anon read recipients" ON public.recipients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon update recipients" ON public.recipients;
CREATE POLICY "Allow anon update recipients" ON public.recipients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read sharing_sessions" ON public.sharing_sessions;
CREATE POLICY "Allow anon read sharing_sessions" ON public.sharing_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon update sharing_sessions" ON public.sharing_sessions;
CREATE POLICY "Allow anon update sharing_sessions" ON public.sharing_sessions FOR ALL USING (true) WITH CHECK (true);

-- 8. INITIAL SEED DATA
INSERT INTO public.meters (
  meter_id, meter_name, user_id, voltage, current, active_power, power_factor, frequency,
  apparent_power, reactive_power, wallet_balance, prepaid_units_kwh, estimated_days_remaining,
  auto_topup_enabled, auto_topup_threshold, energy_today, energy_yesterday, energy_week,
  energy_month, projected_month, estimated_cost_today, estimated_bill_month, projected_bill_month,
  grid_status, device_status, connection_quality, battery_percentage, battery_status,
  main_supply_connected, is_tampered, tariff_rate, currency_symbol, currency_code, firmware_version
) VALUES (
  'MTR-8A24-19F2', 'My Home', 'usr_9921', 231.4, 10.7, 2.46, 0.96, 50.0,
  2.56, 0.72, 14500.0, 96.6, 12,
  true, 2000.0, 8.42, 9.56, 54.8,
  214.6, 246.0, 1263.0, 32190.0, 36900.0,
  'online', 'online', 'good', 82, 'charging',
  true, false, 150.0, '₦', 'NGN', 'v1.0.4'
) ON CONFLICT (meter_id) DO NOTHING;

INSERT INTO public.recipients (meter_id, meter_name, owner_name, is_online, is_saved, last_used_date)
VALUES 
  ('MTR-72AF-2091', 'Neighbour House', 'Adebayo T.', true, true, '14 Aug, 7:32 PM'),
  ('MTR-19BC-4402', 'Shop / Clinic', 'Dr. Okafor', true, true, 'Yesterday'),
  ('MTR-55EE-9912', 'Family Annex', 'Mama Kemi', false, false, NULL)
ON CONFLICT (meter_id) DO NOTHING;

INSERT INTO public.wallet_transactions (id, meter_id, type, title, description, amount_currency, units_kwh, status, token_number)
VALUES
  ('TXN-9021', 'MTR-8A24-19F2', 'funding', 'Wallet Funded', 'Instant Bank Card Top Up (Visa •••• 4092)', 10000, 66.6, 'successful', '4820-9182-3910-4821'),
  ('TXN-8840', 'MTR-8A24-19F2', 'shared_sent', 'Energy Shared', '1.42 kWh shared with Neighbour House', 213, 1.42, 'successful', NULL),
  ('TXN-7731', 'MTR-8A24-19F2', 'energy_purchase', 'Electricity Token Purchase', 'Purchased 33.3 kWh prepaid energy units', 5000, 33.3, 'successful', '1928-3849-5021-9941')
ON CONFLICT (id) DO NOTHING;
