import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { MeterTelemetry, OutageLog } from '../../types/meter';

// Fetch latest live meter state from Supabase
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

// Subscribe to Realtime meter updates
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

// Subscribe to new raw telemetry logs coming from hardware
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

// Fetch Outage History Logs
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

// Toggle relay state directly (standard client)
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

// Fetch recent telemetry history logs
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

// Fetch recent telemetry snapshots for live seconds/real-time streaming bar graph
export async function fetchRecentTelemetryLogs(meterId: string = 'MTR-8A24-19F2', limit: number = 20) {
  try {
    const { data: logs, error } = await supabase
      .from('telemetry_logs')
      .select('active_power, voltage, current, is_relay_on, created_at')
      .eq('meter_id', meterId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !logs || logs.length === 0) {
      return [];
    }

    return logs.reverse().map(row => {
      const d = new Date(row.created_at);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      const kw = Number(row.active_power || 0);
      const watts = Math.round(kw * 1000);
      return {
        timeStr,
        watts,
        kw,
        voltage: Number(row.voltage || 0),
        current: Number(row.current || 0),
        isRelayOn: row.is_relay_on !== false
      };
    });
  } catch (err) {
    console.warn('[Supabase] Error fetching recent telemetry logs:', err);
    return [];
  }
}

// Fetch hourly consumption with 12 distinct 2-hour time slots across the 24h day
export async function fetchHourlyUsageFromDB(meterId: string = 'MTR-8A24-19F2', tariffRate: number = 160.0) {
  try {
    const { data: logs, error } = await supabase
      .from('telemetry_logs')
      .select('active_power, created_at')
      .eq('meter_id', meterId)
      .order('created_at', { ascending: true })
      .limit(300);

    if (error) {
      console.warn('[Supabase] Error fetching hourly logs:', error.message);
    }

    const slotHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    const slotMap = new Map<number, { totalKw: number; count: number }>();
    slotHours.forEach(h => slotMap.set(h, { totalKw: 0, count: 0 }));

    if (logs && logs.length > 0) {
      logs.forEach(row => {
        const date = new Date(row.created_at);
        const hour = date.getHours();
        const nearestSlot = Math.floor(hour / 2) * 2;
        const current = slotMap.get(nearestSlot) || { totalKw: 0, count: 0 };
        current.totalKw += Number(row.active_power || 0);
        current.count += 1;
        slotMap.set(nearestSlot, current);
      });
    }

    return slotHours.map(h => {
      const stat = slotMap.get(h)!;
      const avgKw = stat.count > 0 ? stat.totalKw / stat.count : 0;
      const kwh = Number((avgKw * 2.0).toFixed(2));
      const hourLabel = `${h.toString().padStart(2, '0')}:00`;
      return {
        hourLabel,
        kwh,
        watts: Math.round(avgKw * 1000),
        cost: Math.round(kwh * tariffRate)
      };
    });
  } catch (err) {
    console.warn('[Supabase] Error aggregating hourly usage from DB:', err);
    return null;
  }
}

// Fetch daily usage across all 7 days of the week (Mon - Sun)
export async function fetchDailyUsageFromDB(meterId: string = 'MTR-8A24-19F2', tariffRate: number = 160.0) {
  try {
    const { data: logs, error } = await supabase
      .from('telemetry_logs')
      .select('active_power, created_at')
      .eq('meter_id', meterId)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) {
      console.warn('[Supabase] Error fetching daily logs:', error.message);
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = new Map<string, { totalKw: number; count: number }>();
    days.forEach(d => dayMap.set(d, { totalKw: 0, count: 0 }));

    if (logs && logs.length > 0) {
      logs.forEach(row => {
        const date = new Date(row.created_at);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (dayMap.has(dayStr)) {
          const current = dayMap.get(dayStr)!;
          current.totalKw += Number(row.active_power || 0);
          current.count += 1;
          dayMap.set(dayStr, current);
        }
      });
    }

    return days.map(dayLabel => {
      const stat = dayMap.get(dayLabel)!;
      const avgKw = stat.count > 0 ? stat.totalKw / stat.count : 0;
      const kwh = Number((avgKw * 24.0).toFixed(1));
      return {
        dayLabel,
        kwh,
        cost: Math.round(kwh * tariffRate)
      };
    });
  } catch (err) {
    console.warn('[Supabase] Error aggregating daily usage from DB:', err);
    return null;
  }
}

// Update protective safety cutoff settings in Supabase
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
