import { useState, useEffect, useCallback, useRef } from 'react';
import { MeterTelemetry, TamperEvent, OutageLog, NotificationItem } from '../../types/meter';
import { INITIAL_METER_DATA } from '../../services/mockData';
import {
  fetchLiveMeterFromSupabase,
  subscribeToMeterUpdates,
  subscribeToTelemetryLogs,
  fetchTamperEvents,
  fetchOutageHistory
} from '../../services/supabase';

export interface UseMeterTelemetryProps {
  selectedMeterId: string;
  setSelectedMeterId: (id: string) => void;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
  onMeterUpdated?: (updated: MeterTelemetry) => void;
}

export function useMeterTelemetry({
  selectedMeterId,
  setSelectedMeterId,
  addNotification,
  onMeterUpdated
}: UseMeterTelemetryProps) {
  const [meterData, setMeterData] = useState<MeterTelemetry>(INITIAL_METER_DATA);
  const [tamperEvents, setTamperEvents] = useState<TamperEvent[]>([]);
  const [outageLogs, setOutageLogs] = useState<OutageLog[]>([]);
  const lastStateRef = useRef<{ isTampered: boolean; isRelayOn: boolean; gridStatus: string }>({
    isTampered: false,
    isRelayOn: true,
    gridStatus: 'online'
  });

  // Load tamper events and outages for a meter
  const loadTamperAndOutages = useCallback(async (meterId: string) => {
    try {
      const [tampers, outages] = await Promise.all([
        fetchTamperEvents(meterId),
        fetchOutageHistory(meterId)
      ]);
      setTamperEvents(tampers);
      setOutageLogs(outages);
    } catch (err) {
      console.warn('[useMeterTelemetry] Error loading forensics:', err);
    }
  }, []);

  // Fetch meter data from Supabase
  const loadLiveMeter = useCallback(async (meterId: string) => {
    try {
      const liveData = await fetchLiveMeterFromSupabase(meterId);
      if (liveData) {
        setMeterData(prev => ({
          ...prev,
          ...liveData,
          prepaid_units_kwh: liveData.prepaid_units_kwh !== undefined ? Number(liveData.prepaid_units_kwh) : prev.prepaid_units_kwh,
          wallet_balance: liveData.wallet_balance !== undefined ? Number(liveData.wallet_balance) : prev.wallet_balance,
          energy_today: liveData.energy_today !== undefined ? Number(liveData.energy_today) : prev.energy_today,
          currency_symbol: prev.currency_symbol,
          currency_code: prev.currency_code
        }));

        // Detect state changes for notifications
        const isTampered = Boolean(liveData.is_tampered || liveData.tamper_locked);
        if (isTampered && !lastStateRef.current.isTampered) {
          addNotification(
            'TAMPER BREACH DETECTED',
            `SS-5GL enclosure lid switch triggered on ${liveData.meter_name} (${liveData.meter_id}). Power isolated!`,
            'tamper'
          );
        }
        if (!liveData.main_supply_connected && lastStateRef.current.isRelayOn) {
          addNotification(
            'Supply Cutoff',
            `Main contactor disconnected on ${meterId}.`,
            'outage'
          );
        }

        lastStateRef.current = {
          isTampered,
          isRelayOn: Boolean(liveData.main_supply_connected),
          gridStatus: liveData.grid_status || 'online'
        };
      }
    } catch (err) {
      console.warn('[useMeterTelemetry] Error fetching live meter:', err);
    }
  }, [addNotification]);

  // Initial load and subscriptions
  useEffect(() => {
    loadLiveMeter(selectedMeterId);
    loadTamperAndOutages(selectedMeterId);

    // 1. Subscribe to meters table row changes
    const meterChannel = subscribeToMeterUpdates(selectedMeterId, (updated) => {
      setMeterData(prev => {
        // High-priority state transition notifications
        if (updated.is_tampered && !prev.is_tampered) {
          addNotification(
            'TAMPER BREACH DETECTED',
            `SS-5GL enclosure lid switch triggered on ${updated.meter_name || prev.meter_name} (${updated.meter_id}). Power isolated!`,
            'tamper'
          );
          loadTamperAndOutages(selectedMeterId);
        }

        if (updated.grid_status === 'offline' && prev.grid_status === 'online') {
          addNotification(
            'GRID BLACKOUT DETECTED',
            `Mains supply dropped to 0V. Submeter ${updated.meter_id} is running on internal backup battery.`,
            'outage'
          );
          loadTamperAndOutages(selectedMeterId);
        } else if (updated.grid_status === 'online' && prev.grid_status === 'offline') {
          addNotification(
            'GRID POWER RESTORED',
            `Mains voltage recovered (${updated.voltage}V). Contactor re-energized.`,
            'restored'
          );
          loadTamperAndOutages(selectedMeterId);
        }

        return {
          ...prev,
          ...updated,
          prepaid_units_kwh: updated.prepaid_units_kwh !== undefined ? Number(updated.prepaid_units_kwh) : prev.prepaid_units_kwh,
          wallet_balance: updated.wallet_balance !== undefined ? Number(updated.wallet_balance) : prev.wallet_balance,
          energy_today: updated.energy_today !== undefined ? Number(updated.energy_today) : prev.energy_today,
          currency_symbol: prev.currency_symbol,
          currency_code: prev.currency_code
        };
      });

      if (onMeterUpdated) {
        onMeterUpdated(updated);
      }
    });

    // 2. Subscribe to telemetry_logs inserts with live real-time unit deduction
    const logChannel = subscribeToTelemetryLogs(selectedMeterId, (newLog) => {
      setMeterData(prev => {
        const newEnergyToday = newLog.energy_today !== undefined ? Number(newLog.energy_today) : prev.energy_today;
        const energyDelta = Math.max(0, newEnergyToday - (prev.energy_today || 0));
        const updatedUnits = energyDelta > 0 
          ? Math.max(0, Number((prev.prepaid_units_kwh - energyDelta).toFixed(4))) 
          : prev.prepaid_units_kwh;
        const updatedWallet = energyDelta > 0 
          ? Math.max(0, Math.round(updatedUnits * (prev.tariff_rate || 160.0))) 
          : prev.wallet_balance;

        return {
          ...prev,
          voltage: Number(newLog.voltage ?? prev.voltage),
          current: Number(newLog.current ?? prev.current),
          active_power: Number(newLog.active_power ?? prev.active_power),
          power_factor: Number(newLog.power_factor ?? prev.power_factor),
          frequency: Number(newLog.frequency ?? prev.frequency),
          energy_today: newEnergyToday,
          prepaid_units_kwh: updatedUnits,
          wallet_balance: updatedWallet,
          is_tampered: newLog.is_tampered ?? prev.is_tampered,
          hardware_relay_ack: newLog.is_relay_on !== undefined ? Boolean(newLog.is_relay_on) : prev.hardware_relay_ack,
          last_seen: newLog.created_at ?? new Date().toISOString()
        };
      });
    });

    // 3. Fallback polling every 3s
    const pollInterval = setInterval(() => {
      loadLiveMeter(selectedMeterId);
    }, 3000);

    return () => {
      meterChannel.unsubscribe();
      logChannel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [selectedMeterId, loadLiveMeter, loadTamperAndOutages, addNotification, onMeterUpdated]);

  // Switch meter
  const switchMeter = useCallback(
    async (meterId: string) => {
      setSelectedMeterId(meterId);
      await Promise.all([loadLiveMeter(meterId), loadTamperAndOutages(meterId)]);
    },
    [setSelectedMeterId, loadLiveMeter, loadTamperAndOutages]
  );

  return {
    meterData,
    setMeterData,
    tamperEvents,
    outageLogs,
    switchMeter,
    loadTamperAndOutages
  };
}
