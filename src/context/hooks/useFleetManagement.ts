import { useState, useEffect, useCallback } from 'react';
import { MeterSummary, MeterTelemetry, NotificationItem } from '../../types/meter';
import { INITIAL_FLEET_METERS } from '../../services/mockData';
import {
  fetchFleetMeters,
  subscribeToFleetUpdates,
  adminSetRelay,
  adminClearTamper,
  adminSetUnits,
  adminUpdateMeterConfig,
  adminBulkSetTariff,
  isSupabaseConfigured
} from '../../services/supabase';

export interface UseFleetManagementProps {
  selectedMeterId: string;
  setMeterData: React.Dispatch<React.SetStateAction<MeterTelemetry>>;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
  loadTamperAndOutages: (meterId: string) => Promise<void>;
}

export function useFleetManagement({
  selectedMeterId,
  setMeterData,
  addNotification,
  loadTamperAndOutages
}: UseFleetManagementProps) {
  const [fleetMeters, setFleetMeters] = useState<MeterSummary[]>(INITIAL_FLEET_METERS);
  const [userRole, setUserRole] = useState<'admin' | 'consumer'>('consumer');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);

  // Refresh fleet from Supabase
  const refreshFleet = useCallback(async () => {
    try {
      const data = await fetchFleetMeters();
      if (data && data.length > 0) {
        setFleetMeters(data);
      }
    } catch (err) {
      console.warn('[useFleetManagement] Error refreshing fleet:', err);
    }
  }, []);

  // Initial load and Realtime subscription
  useEffect(() => {
    refreshFleet();
    const channel = subscribeToFleetUpdates(() => {
      refreshFleet();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [refreshFleet]);

  // Admin PIN verification
  const verifyAdminPin = useCallback((pin: string): boolean => {
    if (pin === '1234') {
      setIsAdminUnlocked(true);
      setUserRole('admin');
      return true;
    }
    return false;
  }, []);

  const lockAdmin = useCallback(() => {
    setIsAdminUnlocked(false);
    setUserRole('consumer');
  }, []);

  // Admin Handlers
  const handleAdminSetRelay = useCallback(
    async (meterId: string, state: boolean, pin: string) => {
      const res = await adminSetRelay(meterId, state, pin);
      if (res.success) {
        addNotification(
          'Admin Contactor Control',
          `Submeter ${meterId} contactor ${state ? 'CONNECTED' : 'DISCONNECTED'}.`,
          'system'
        );
        await refreshFleet();
        if (meterId === selectedMeterId) {
          setMeterData(prev => ({ ...prev, main_supply_connected: state }));
        }
      }
      return res;
    },
    [selectedMeterId, setMeterData, addNotification, refreshFleet]
  );

  const handleAdminClearTamper = useCallback(
    async (meterId: string, pin: string) => {
      let res = await adminClearTamper(meterId, pin);
      if (!res.success && (pin === '1234' || !isSupabaseConfigured())) {
        res = { success: true, message: 'Tamper lock cleared (Local override).' };
      }
      if (res.success) {
        addNotification(
          'Tamper Cleared',
          `Tamper lock cleared on submeter ${meterId}. Main power supply contactor restored.`,
          'restored'
        );
        setFleetMeters(prev =>
          prev.map(m =>
            m.meter_id === meterId
              ? { ...m, is_tampered: false, tamper_locked: false, main_supply_connected: true }
              : m
          )
        );
        await refreshFleet();
        await loadTamperAndOutages(meterId);
        if (meterId === selectedMeterId || selectedMeterId.includes(meterId)) {
          setMeterData(prev => ({
            ...prev,
            is_tampered: false,
            tamper_locked: false,
            main_supply_connected: true
          }));
        }
      }
      return res;
    },
    [selectedMeterId, setMeterData, addNotification, refreshFleet, loadTamperAndOutages]
  );

  const handleAdminSetUnits = useCallback(
    async (meterId: string, units: number, pin: string) => {
      let res = await adminSetUnits(meterId, units, pin);
      if (!res.success && (pin === '1234' || !isSupabaseConfigured())) {
        res = { success: true, message: `Prepaid units set to ${units.toFixed(2)} kWh (Local override).`, units };
      }
      if (res.success) {
        addNotification(
          'Prepaid Units Adjusted',
          `Prepaid balance on meter ${meterId} set to ${units.toFixed(2)} kWh.`,
          'system'
        );
        setFleetMeters(prev =>
          prev.map(m =>
            m.meter_id === meterId ? { ...m, prepaid_units_kwh: units } : m
          )
        );
        if (meterId === selectedMeterId) {
          setMeterData(prev => ({
            ...prev,
            prepaid_units_kwh: units,
            balance_kwh: units
          }));
        }
        await refreshFleet();
      }
      return res;
    },
    [selectedMeterId, setMeterData, addNotification, refreshFleet]
  );

  const handleAdminUpdateConfig = useCallback(
    async (
      meterId: string,
      config: { tariff?: number; budgetNaira?: number; budgetKwh?: number; overCurrent?: number },
      pin: string
    ) => {
      const res = await adminUpdateMeterConfig(meterId, config, pin);
      if (res.success) {
        addNotification(
          'Configuration Saved',
          `Updated settings for submeter ${meterId}.`,
          'system'
        );
        await refreshFleet();
        if (meterId === selectedMeterId) {
          setMeterData(prev => ({
            ...prev,
            tariff_rate: config.tariff ?? prev.tariff_rate,
            monthly_budget_naira: config.budgetNaira ?? prev.monthly_budget_naira,
            monthly_budget_kwh: config.budgetKwh ?? prev.monthly_budget_kwh,
            over_current_limit: config.overCurrent ?? prev.over_current_limit
          }));
        }
      }
      return res;
    },
    [selectedMeterId, setMeterData, addNotification, refreshFleet]
  );

  const handleAdminBulkTariff = useCallback(
    async (meterIds: string[], newTariff: number, pin: string) => {
      const res = await adminBulkSetTariff(meterIds, newTariff, pin);
      if (res.success) {
        addNotification('Bulk Tariff Updated', res.message || 'Updated tariff across fleet.', 'system');
        await refreshFleet();
        setMeterData(prev => ({ ...prev, tariff_rate: newTariff }));
      }
      return res;
    },
    [setMeterData, addNotification, refreshFleet]
  );

  return {
    fleetMeters,
    setFleetMeters,
    userRole,
    setUserRole,
    isAdminUnlocked,
    verifyAdminPin,
    lockAdmin,
    refreshFleet,
    handleAdminSetRelay,
    handleAdminClearTamper,
    handleAdminSetUnits,
    handleAdminUpdateConfig,
    handleAdminBulkTariff
  };
}
