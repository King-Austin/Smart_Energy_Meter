import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  MeterTelemetry,
  MeterSummary,
  TamperEvent,
  OutageLog,
  WalletTransaction,
  RegisteredRecipient
} from '../types/meter';

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

// 2. Fetch all registered fleet meters for Multi-Meter Admin Panel
export async function fetchFleetMeters(): Promise<MeterSummary[]> {
  try {
    const { data, error } = await supabase
      .from('meters')
      .select('*')
      .order('meter_id', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase] Failed to fetch fleet meters:', error?.message);
      return [];
    }
    return data as MeterSummary[];
  } catch (err) {
    console.error('[Supabase] Error in fetchFleetMeters:', err);
    return [];
  }
}

// 3. Subscribe to Realtime meter updates
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

// 4. Subscribe to all fleet meters (for Admin Fleet Screen)
export function subscribeToFleetUpdates(
  onFleetUpdate: () => void
): RealtimeChannel {
  const channel = supabase
    .channel('fleet-meters-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meters'
      },
      () => {
        onFleetUpdate();
      }
    )
    .subscribe();

  return channel;
}

// 5. Subscribe to new raw telemetry logs coming from hardware
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

// 6. Fetch Tamper Events Audit Trail
export async function fetchTamperEvents(meterId?: string): Promise<TamperEvent[]> {
  try {
    let query = supabase
      .from('tamper_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (meterId) {
      query = query.eq('meter_id', meterId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as TamperEvent[];
  } catch (err) {
    console.error('[Supabase] Error fetching tamper events:', err);
    return [];
  }
}

// 7. Fetch Outage History Logs
export async function fetchOutageHistory(meterId?: string): Promise<OutageLog[]> {
  try {
    let query = supabase
      .from('outage_logs')
      .select('*')
      .order('outage_start', { ascending: false })
      .limit(50);

    if (meterId) {
      query = query.eq('meter_id', meterId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as OutageLog[];
  } catch (err) {
    console.error('[Supabase] Error fetching outage history:', err);
    return [];
  }
}

// 8. Admin RPC: Set Contactor Relay with PIN validation
export async function adminSetRelay(
  meterId: string,
  state: boolean,
  pin: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('admin_set_relay', {
      p_meter_id: meterId,
      p_state: state,
      p_admin_pin: pin
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (data?.success === false) {
      return { success: false, error: data.error };
    }
    return { success: true, message: data?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

// 9. Admin RPC: Clear Tamper Lock & Restore Supply
export async function adminClearTamper(
  meterId: string,
  pin: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('admin_clear_tamper', {
      p_meter_id: meterId,
      p_admin_pin: pin
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (data?.success === false) {
      return { success: false, error: data.error };
    }
    return { success: true, message: data?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

// 10. Admin RPC: Update Meter Configuration
export async function adminUpdateMeterConfig(
  meterId: string,
  config: {
    tariff?: number;
    budgetNaira?: number;
    budgetKwh?: number;
    overCurrent?: number;
  },
  pin: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('admin_update_meter_config', {
      p_meter_id: meterId,
      p_tariff: config.tariff ?? null,
      p_budget_naira: config.budgetNaira ?? null,
      p_budget_kwh: config.budgetKwh ?? null,
      p_over_current: config.overCurrent ?? null,
      p_admin_pin: pin
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (data?.success === false) {
      return { success: false, error: data.error };
    }
    return { success: true, message: data?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

// 11. Admin Bulk Update Tariff across multiple meters
export async function adminBulkSetTariff(
  meterIds: string[],
  newTariff: number,
  pin: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (pin !== '1234') {
      return { success: false, error: 'Invalid Admin PIN' };
    }

    const { error } = await supabase
      .from('meters')
      .update({
        tariff_rate: newTariff,
        updated_at: new Date().toISOString()
      })
      .in('meter_id', meterIds);

    if (error) return { success: false, error: error.message };
    return { success: true, message: `Updated tariff to ₦${newTariff}/kWh across ${meterIds.length} meters.` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Bulk update failed' };
  }
}

// 12. Toggle relay state directly (standard client)
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

// 13. Fetch recent telemetry history logs
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

// 14. Fetch wallet transactions
export async function fetchSupabaseTransactions(meterId: string = 'MTR-8A24-19F2'): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('meter_id', meterId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as WalletTransaction[];
}

// 15. Fetch recipients
export async function fetchSupabaseRecipients(): Promise<RegisteredRecipient[]> {
  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .order('meter_name', { ascending: true });

  if (error) return [];
  return data as RegisteredRecipient[];
}

// 16. Fetch hourly consumption aggregated directly from telemetry_logs in Supabase DB
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

// 17. Record Paystack transaction and credit meter balance in Supabase
export async function recordPaystackTransaction(
  meterId: string,
  amount: number,
  units: number,
  tokenNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const txId = `TXN-PST-${Math.floor(1000 + Math.random() * 9000)}`;
    
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

// 18. Update protective safety cutoff settings in Supabase
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
