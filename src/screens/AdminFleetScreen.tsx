import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { MeterSummary } from '../types/meter';
import {
  Building2,
  Zap,
  ShieldAlert,
  Power,
  Settings,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const AdminFleetScreen: React.FC = () => {
  const {
    fleetMeters,
    selectedMeterId,
    switchMeter,
    refreshFleet,
    handleAdminSetRelay,
    handleAdminClearTamper,
    handleAdminUpdateConfig,
    handleAdminBulkTariff,
    setIsTamperModalOpen
  } = useMeter();

  // Modal States
  const [selectedForRelay, setSelectedForRelay] = useState<{ meter: MeterSummary; targetState: boolean } | null>(null);
  const [selectedForConfig, setSelectedForConfig] = useState<MeterSummary | null>(null);
  const [isBulkTariffOpen, setIsBulkTariffOpen] = useState<boolean>(false);
  const [bulkTariffValue, setBulkTariffValue] = useState<number>(68.5);

  // Config Form state
  const [configTariff, setConfigTariff] = useState<number>(68.5);
  const [configBudgetNaira, setConfigBudgetNaira] = useState<number>(25000);
  const [configBudgetKwh, setConfigBudgetKwh] = useState<number>(365);
  const [configOverCurrent, setConfigOverCurrent] = useState<number>(30);

  // PIN state
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fleet Calculations
  const totalMeters = fleetMeters.length;
  const onlineMeters = fleetMeters.filter(m => m.grid_status === 'online').length;
  const totalLoadKw = fleetMeters.reduce((acc, m) => acc + (m.main_supply_connected ? Number(m.active_power || 0) : 0), 0);
  const totalEnergyTodayKwh = fleetMeters.reduce((acc, m) => acc + Number(m.energy_today || 0), 0);
  const totalRevenueTodayNaira = fleetMeters.reduce((acc, m) => acc + Math.round(Number(m.energy_today || 0) * Number(m.tariff_rate || 68.5)), 0);
  const activeTampers = fleetMeters.filter(m => m.is_tampered || m.tamper_locked);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshFleet();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const executeRelayToggle = async () => {
    if (!selectedForRelay) return;
    setPinError('');
    if (adminPin !== '1234') {
      setPinError('Invalid Admin PIN. (Default: 1234)');
      return;
    }

    setIsSubmitting(true);
    const res = await handleAdminSetRelay(selectedForRelay.meter.meter_id, selectedForRelay.targetState, adminPin);
    setIsSubmitting(false);

    if (res.success) {
      setSelectedForRelay(null);
      setAdminPin('');
    } else {
      setPinError(res.error || 'Failed to toggle contactor.');
    }
  };

  const openConfigModal = (meter: MeterSummary) => {
    setSelectedForConfig(meter);
    setConfigTariff(meter.tariff_rate || 68.5);
    setConfigBudgetNaira(meter.monthly_budget_naira || 25000);
    setConfigBudgetKwh(meter.monthly_budget_kwh || 365);
    setConfigOverCurrent(meter.over_current_limit || 30);
    setAdminPin('');
    setPinError('');
  };

  const executeConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForConfig) return;
    setPinError('');
    if (adminPin !== '1234') {
      setPinError('Invalid Admin PIN. (Default: 1234)');
      return;
    }

    setIsSubmitting(true);
    const res = await handleAdminUpdateConfig(
      selectedForConfig.meter_id,
      {
        tariff: configTariff,
        budgetNaira: configBudgetNaira,
        budgetKwh: configBudgetKwh,
        overCurrent: configOverCurrent
      },
      adminPin
    );
    setIsSubmitting(false);

    if (res.success) {
      setSelectedForConfig(null);
      setAdminPin('');
    } else {
      setPinError(res.error || 'Failed to update configuration.');
    }
  };

  const executeBulkTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (adminPin !== '1234') {
      setPinError('Invalid Admin PIN. (Default: 1234)');
      return;
    }

    setIsSubmitting(true);
    const meterIds = fleetMeters.map(m => m.meter_id);
    const res = await handleAdminBulkTariff(meterIds, bulkTariffValue, adminPin);
    setIsSubmitting(false);

    if (res.success) {
      setIsBulkTariffOpen(false);
      setAdminPin('');
    } else {
      setPinError(res.error || 'Failed to update fleet tariff.');
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#ff5b26]" />
            <span>Multi-Meter Fleet Command Center</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time management, tariff provisioning & contactor controls
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Refresh Fleet Telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ff5b26]' : ''}`} />
        </button>
      </div>

      {/* Facility KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Submeters</span>
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-neutral-900 dark:text-white mono-num">
              {onlineMeters}/{totalMeters}
            </span>
            <span className="text-[10px] font-semibold text-emerald-500">Online</span>
          </div>
        </div>

        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Facility Load</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-neutral-900 dark:text-white mono-num">
              {totalLoadKw.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-neutral-500">kW</span>
          </div>
        </div>

        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fleet Energy Today</span>
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-neutral-900 dark:text-white mono-num">
              {totalEnergyTodayKwh.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-neutral-500">kWh</span>
          </div>
        </div>

        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Revenue Today</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#ff5b26]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-neutral-900 dark:text-white mono-num">
              ₦{totalRevenueTodayNaira.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Global Actions Bar */}
      <div className="p-3 glass-card flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {activeTampers.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{activeTampers.length} Active Tamper Alert(s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Enclosures Secure</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkTariffOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-500 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Set Global Fleet Tariff</span>
          </button>

          <button
            onClick={() => setIsTamperModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-500 text-xs font-bold border border-red-500/30 flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Tamper Forensics Log</span>
          </button>
        </div>
      </div>

      {/* Multi-Meter Submeter Cards Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Registered Submeters ({fleetMeters.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {fleetMeters.map((meter) => {
            const isCurrent = meter.meter_id === selectedMeterId;
            const isTampered = meter.is_tampered || meter.tamper_locked;
            const isConnected = meter.main_supply_connected;

            return (
              <div
                key={meter.meter_id}
                className={`glass-card p-4 space-y-3 transition-all ${
                  isCurrent ? 'ring-2 ring-[#ff5b26]' : ''
                } ${isTampered ? 'border-red-500/40 bg-red-500/5' : ''}`}
              >
                {/* Meter Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                        {meter.meter_name}
                      </h4>
                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#ff5b26] text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500 block">
                      {meter.location} ({meter.meter_id})
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      meter.grid_status === 'online'
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-500 border-red-500/30'
                    }`}
                  >
                    {meter.grid_status}
                  </span>
                </div>

                {/* Key Electrical Stats */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/70">
                    <span className="text-[9px] text-neutral-500 block">Voltage</span>
                    <span className="font-bold mono-num text-neutral-900 dark:text-white">
                      {meter.voltage}V
                    </span>
                  </div>

                  <div className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/70">
                    <span className="text-[9px] text-neutral-500 block">Load (kW)</span>
                    <span className="font-bold mono-num text-neutral-900 dark:text-white">
                      {meter.active_power} kW
                    </span>
                  </div>

                  <div className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/70">
                    <span className="text-[9px] text-neutral-500 block">Tariff</span>
                    <span className="font-bold mono-num text-neutral-900 dark:text-white">
                      ₦{meter.tariff_rate}/kWh
                    </span>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-ping'
                      }`}
                    />
                    <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      Contactor: {isConnected ? 'LIVE' : 'CUT'}
                    </span>
                  </div>

                  {isTampered && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Lid Tampered
                    </span>
                  )}
                </div>

                {/* Meter Card Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {!isCurrent && (
                    <button
                      onClick={() => switchMeter(meter.meter_id)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-bold transition-colors"
                    >
                      View Live
                    </button>
                  )}

                  {isTampered && (
                    <button
                      onClick={() => handleAdminClearTamper(meter.meter_id, '1234')}
                      className="py-1 px-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] font-bold transition-colors"
                      title="Clear Tamper Lock (Admin PIN 1234)"
                    >
                      Clear Tamper
                    </button>
                  )}

                  <button
                    onClick={() => openConfigModal(meter)}
                    className="p-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    title="Configure Tariff & Budget"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setSelectedForRelay({
                        meter,
                        targetState: !isConnected
                      })
                    }
                    className={`p-1.5 rounded-xl border font-bold text-xs flex items-center gap-1 transition-colors ${
                      isConnected
                        ? 'bg-red-500/15 text-red-500 border-red-500/30 hover:bg-red-500/25'
                        : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25'
                    }`}
                    title={isConnected ? 'Cut Power Supply (Contactor)' : 'Re-connect Power Supply'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Contactor Relay Toggle with Admin PIN */}
      {selectedForRelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="glass-card max-w-sm w-full p-4 space-y-3 border border-neutral-300 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
              <Power className="w-5 h-5 text-[#ff5b26]" />
              <h3 className="text-sm font-extrabold">
                {selectedForRelay.targetState ? 'Connect Power Supply?' : 'Disconnect Power Supply?'}
              </h3>
            </div>

            <p className="text-xs text-neutral-500">
              You are about to switch the main contactor relay for{' '}
              <span className="font-bold text-neutral-900 dark:text-white">
                {selectedForRelay.meter.meter_name} ({selectedForRelay.meter.meter_id})
              </span>{' '}
              to <span className="font-bold">{selectedForRelay.targetState ? 'LIVE (ON)' : 'CUT (OFF)'}</span>.
            </p>

            <div>
              <label className="text-xs text-neutral-500 block mb-1">
                Enter 4-Digit Admin Security PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center text-lg tracking-widest font-mono font-bold border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:border-[#ff5b26]"
              />
            </div>

            {pinError && <p className="text-xs text-red-500 font-bold">{pinError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedForRelay(null);
                  setAdminPin('');
                  setPinError('');
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={executeRelayToggle}
                disabled={isSubmitting || adminPin.length !== 4}
                className="px-4 py-1.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04f1e] text-white text-xs font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Switch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Meter Configuration */}
      {selectedForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="glass-card max-w-md w-full p-4 space-y-3 border border-neutral-300 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
              <Settings className="w-5 h-5 text-[#ff5b26]" />
              <h3 className="text-sm font-extrabold">
                Configure {selectedForConfig.meter_name}
              </h3>
            </div>

            <form onSubmit={executeConfigUpdate} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-500 block mb-1">Tariff Rate (₦/kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={configTariff}
                  onChange={(e) => setConfigTariff(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-500 block mb-1">Monthly Budget (₦)</label>
                  <input
                    type="number"
                    value={configBudgetNaira}
                    onChange={(e) => setConfigBudgetNaira(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-bold"
                  />
                </div>
                <div>
                  <label className="text-neutral-500 block mb-1">Over-Current Limit (A)</label>
                  <input
                    type="number"
                    value={configOverCurrent}
                    onChange={(e) => setConfigOverCurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-500 block mb-1">Enter Admin PIN (Default: 1234)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center font-mono font-bold tracking-widest border border-neutral-300 dark:border-neutral-700"
                />
              </div>

              {pinError && <p className="text-red-500 font-bold">{pinError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForConfig(null)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adminPin.length !== 4}
                  className="px-4 py-1.5 rounded-xl bg-[#ff5b26] text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Bulk Fleet Tariff Updater */}
      {isBulkTariffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="glass-card max-w-sm w-full p-4 space-y-3 border border-cyan-500/30">
            <div className="flex items-center gap-2 text-cyan-500">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                Set Global Tariff for All Submeters
              </h3>
            </div>

            <p className="text-xs text-neutral-500">
              This will update the tariff rate for all {fleetMeters.length} registered submeters across your property.
            </p>

            <form onSubmit={executeBulkTariff} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-500 block mb-1">New Uniform Tariff (₦/kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bulkTariffValue}
                  onChange={(e) => setBulkTariffValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-neutral-500 block mb-1">Enter Admin PIN (Default: 1234)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center font-mono font-bold tracking-widest border border-neutral-300 dark:border-neutral-700"
                />
              </div>

              {pinError && <p className="text-red-500 font-bold">{pinError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkTariffOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adminPin.length !== 4}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating Fleet...' : 'Apply Fleetwide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
