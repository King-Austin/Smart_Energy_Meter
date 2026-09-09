import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { MeterTelemetry, WalletTransaction, RegisteredRecipient } from '../types/meter';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://kmosslvdjdhrjgvitctr.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_kqmfZWv3kcKV5v4QMvlZkQ_x8ohW0Oj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// 1. Fetch latest live meter state from Supabase
export async function fetchLiveMeterFromSupabase(meterId: string = 'MTR-8A24-19F2'): Promise<MeterTelemetry | null> {
  try {
    const { data, error } = await supabase
      .from('meters')
      .select('*')
      .eq('meter_id', meterId)
      .single();

    if (error) {
      console.warn('[Supabase] Failed to fetch meter:', error.message);
      return null;
    }
    return data as MeterTelemetry;
  } catch (err) {
    console.error('[Supabase] Error in fetchLiveMeterFromSupabase:', err);
    return null;
  }
}

// 2. Subscribe to Realtime meter updates (listens to ESP32 5-second updates)
export function subscribeToMeterUpdates(
  meterId: string,
  onUpdate: (meter: MeterTelemetry) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`meter-${meterId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meters',
        filter: `meter_id=eq.${meterId}`
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as MeterTelemetry);
        }
      }
    )
    .subscribe();

  return channel;
}

// Subscribe to new raw telemetry logs coming directly from ESP32
export function subscribeToTelemetryLogs(
  meterId: string,
  onNewLog: (log: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`telemetry-logs-${meterId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'telemetry_logs',
        filter: `meter_id=eq.${meterId}`
      },
      (payload) => {
        if (payload.new) {
          onNewLog(payload.new);
        }
      }
    )
    .subscribe();

  return channel;
}

// 3. Update relay state remotely from web app
export async function toggleRemoteSupplyRelay(meterId: string, connected: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('meters')
      .update({
        main_supply_connected: connected,
        updated_at: new Date().toISOString()
      })
      .eq('meter_id', meterId);

    if (error) {
      console.error('[Supabase] Failed to update relay state:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error toggling relay state:', err);
    return false;
  }
}

// 4. Fetch recent telemetry history logs
export async function fetchTelemetryLogs(meterId: string = 'MTR-8A24-19F2', limit: number = 30) {
  const { data, error } = await supabase
    .from('telemetry_logs')
    .select('*')
    .eq('meter_id', meterId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

// 5. Fetch wallet transactions
export async function fetchSupabaseTransactions(meterId: string = 'MTR-8A24-19F2'): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('meter_id', meterId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as WalletTransaction[];
}

// 6. Fetch recipients
export async function fetchSupabaseRecipients(): Promise<RegisteredRecipient[]> {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .order('meter_name', { ascending: true });

  if (error) return [];
  return data as RegisteredRecipient[];
}

// 7. Fetch hourly consumption aggregated directly from telemetry_logs in Supabase DB
export async function fetchHourlyUsageFromDB(meterId: string = 'MTR-8A24-19F2', tariffRate: number = 68.5) {
  try {
    const { data: logs, error } = await supabase
      .from('telemetry_logs')
      .select('active_power, created_at')
      .eq('meter_id', meterId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error || !logs || logs.length === 0) {
      return null;
    }

    // Group logs into hourly buckets
    const hourlyMap = new Map<string, { totalKw: number; count: number }>();
    logs.forEach(row => {
      const date = new Date(row.created_at);
      const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
      const current = hourlyMap.get(hourStr) || { totalKw: 0, count: 0 };
      current.totalKw += Number(row.active_power || 0);
      current.count += 1;
      hourlyMap.set(hourStr, current);
    });

    const result = Array.from(hourlyMap.entries()).map(([hourLabel, stat]) => {
      const avgKw = stat.count > 0 ? stat.totalKw / stat.count : 0;
      const kwh = Number((avgKw * 1.0).toFixed(2));
      return {
        hourLabel,
        kwh: Math.max(0.1, kwh),
        cost: Math.round(kwh * tariffRate)
      };
    });

    return result.length > 0 ? result : null;
  } catch (err) {
    console.warn('[Supabase] Error aggregating hourly usage from DB:', err);
    return null;
  }
}

// 8. Update protective safety cutoff settings in Supabase
export async function updateProtectionSettings(
  meterId: string,
  settings: {
    max_voltage_limit?: number;
    min_voltage_limit?: number;
    bill_limit_threshold?: number;
    main_supply_connected?: boolean;
    voltage_cutoff_tripped?: boolean;
    bill_cutoff_tripped?: boolean;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('meters')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('meter_id', meterId);

    return !error;
  } catch {
    return false;
  }
}

// 9. Record Paystack transaction and credit meter balance in Supabase
export async function recordPaystackTransaction(
  meterId: string,
  amount: number,
  units: number,
  tokenNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const txId = `TXN-PST-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Insert into wallet_transactions
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        meter_id: meterId,
        id: txId,
        type: 'funding',
        title: 'Paystack Instant Recharge',
        description: `Paystack Test Card Payment (${units} kWh units credited)`,
        amount_currency: amount,
        units_kwh: units,
        status: 'successful',
        token_number: tokenNumber,
        timestamp: 'Just now'
      });

    if (txError) {
      console.warn('[Supabase] Transaction insert notice:', txError.message);
    }

    // Fetch current meter to increment
    const { data: meter } = await supabase
      .from('meters')
      .select('wallet_balance, prepaid_units_kwh')
      .eq('meter_id', meterId)
      .single();

    if (meter) {
      const newBal = Number(meter.wallet_balance || 0) + amount;
      const newUnits = Number(meter.prepaid_units_kwh || 0) + units;

      await supabase
        .from('meters')
        .update({
          wallet_balance: newBal,
          prepaid_units_kwh: newUnits,
          updated_at: new Date().toISOString()
        })
        .eq('meter_id', meterId);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to record Paystack funding' };
  }
}
