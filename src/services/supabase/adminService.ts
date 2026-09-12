import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { MeterSummary, TamperEvent } from '../../types/meter';

// Fetch all registered fleet meters for Multi-Meter Admin Panel
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

// Subscribe to all fleet meters (for Admin Fleet Screen)
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

// Fetch Tamper Events Audit Trail
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

// Admin RPC: Set Contactor Relay with PIN validation
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

// Admin RPC: Clear Tamper Lock & Restore Supply
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

// Admin RPC: Update Meter Configuration
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

// Admin RPC: Set or Top-up Prepaid Units (kWh) Balance
export async function adminSetUnits(
  meterId: string,
  units: number,
  pin: string
): Promise<{ success: boolean; message?: string; error?: string; units?: number }> {
  try {
    const { data, error } = await supabase.rpc('admin_set_units', {
      p_meter_id: meterId,
      p_units: units,
      p_admin_pin: pin
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (data?.success === false) {
      return { success: false, error: data.error };
    }
    return { success: true, message: data?.message, units: data?.units };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

// Admin Bulk Update Tariff across multiple meters
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
