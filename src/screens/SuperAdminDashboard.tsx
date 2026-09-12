import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { MeterSummary } from '../types/meter';
import {
  Building2,
  RefreshCw,
  Search,
  ArrowLeft,
  Sun,
  Moon,
  Users,
  DollarSign,
  Settings,
  Power
} from 'lucide-react';
import { LiveElectricalCard } from '../components/home/LiveElectricalCard';
import { CurrentPowerCard } from '../components/home/CurrentPowerCard';
import { EnergyTodayCard } from '../components/home/EnergyTodayCard';
import { BudgetSnapshotCard } from '../components/home/BudgetSnapshotCard';
import { OutageHistoryCard } from '../components/energy/OutageHistoryCard';
import { TamperHistoryModal } from '../components/notifications/TamperHistoryModal';
import { TamperQuickActionBar } from '../components/admin/TamperQuickActionBar';
import { FleetKpiBanner } from '../components/admin/FleetKpiBanner';
import { FleetSearchToolbar } from '../components/admin/FleetSearchToolbar';
import { SubmeterCard } from '../components/admin/SubmeterCard';
import { AdminRelayModal } from '../components/admin/AdminRelayModal';
import { AdminConfigModal } from '../components/admin/AdminConfigModal';
import { AdminBulkTariffModal } from '../components/admin/AdminBulkTariffModal';
import { AdminAdjustUnitsModal } from '../components/admin/AdminAdjustUnitsModal';

export const SuperAdminDashboard: React.FC = () => {
  const {
    fleetMeters,
    switchMeter,
    refreshFleet,
    handleAdminSetRelay,
    handleAdminClearTamper,
    handleAdminSetUnits,
    handleAdminUpdateConfig,
    handleAdminBulkTariff,
    theme,
    toggleTheme,
    navigateToRoute,
    inspectingMeterId,
    setInspectingMeterId,
    setIsTamperModalOpen
  } = useMeter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'tampered' | 'relay-off'>('all');

  // Modal States
  const [selectedForRelay, setSelectedForRelay] = useState<{ meter: MeterSummary; targetState: boolean } | null>(null);
  const [selectedForConfig, setSelectedForConfig] = useState<MeterSummary | null>(null);
  const [selectedForUnits, setSelectedForUnits] = useState<{ meter: MeterSummary; units: number } | null>(null);
  const [isBulkTariffOpen, setIsBulkTariffOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fleet Calculations
  const totalMeters = fleetMeters.length;
  const onlineMeters = fleetMeters.filter(m => m.grid_status === 'online').length;
  const totalLoadKw = fleetMeters.reduce((acc, m) => acc + (m.main_supply_connected ? Number(m.active_power || 0) : 0), 0);
  const totalEnergyTodayKwh = fleetMeters.reduce((acc, m) => acc + Number(m.energy_today || 0), 0);
  const totalRevenueTodayNaira = fleetMeters.reduce(
    (acc, m) => acc + Math.round(Number(m.energy_today || 0) * Number(m.tariff_rate || 160.0)),
    0
  );
  const activeTampers = fleetMeters.filter(m => m.is_tampered || m.tamper_locked);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshFleet();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleInspectClient = (meter: MeterSummary) => {
    switchMeter(meter.meter_id);
    setInspectingMeterId(meter.meter_id);
  };

  // Filtered meters
  const filteredMeters = fleetMeters.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.meter_name.toLowerCase().includes(q) ||
      m.meter_id.toLowerCase().includes(q) ||
      (m.location && m.location.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterType === 'online') return m.grid_status === 'online';
    if (filterType === 'tampered') return m.is_tampered || m.tamper_locked;
    if (filterType === 'relay-off') return !m.main_supply_connected;
    return true;
  });

  const inspectedMeter = fleetMeters.find(m => m.meter_id === inspectingMeterId) || fleetMeters[0];

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#080b11] text-[#0f172a] dark:text-white transition-colors duration-200">
      
      {/* 1. Super Admin Enterprise Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1219]/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 px-4 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Brand & Command Center Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5b26] to-[#e04818] text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Voltrix Super Admin Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#ff5b26]/12 text-[#ff5b26] border border-[#ff5b26]/30">
                  Fleet Manager
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Facility Grid: Lekki Phase 1 Estate • Centralized Submeter Control Room
              </p>
            </div>
          </div>

          {/* Quick Actions & Portal Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800/80 text-xs font-semibold text-slate-700 dark:text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live RPC Telemetry</span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
              title="Refresh Fleet Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ff5b26]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={() => setIsBulkTariffOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Bulk Tariff (₦/kWh)</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToRoute('client')}
              className="px-4 py-2 rounded-xl bg-[#ff5b26] hover:bg-[#e04818] text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Switch to Client Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Center Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* CLIENT DASHBOARD INSPECTION MODE BANNER */}
        {inspectingMeterId ? (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border-2 border-[#ff5b26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setInspectingMeterId(null)}
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Fleet Overview</span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-[#ff5b26] tracking-wider">
                      Live Client Inspector
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      Super Admin View
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    Viewing: {inspectedMeter?.meter_name} ({inspectedMeter?.meter_id})
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  Switch Client:
                </span>
                <select
                  value={inspectingMeterId}
                  onChange={(e) => {
                    switchMeter(e.target.value);
                    setInspectingMeterId(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#ff5b26]"
                >
                  {fleetMeters.map((m) => (
                    <option key={m.meter_id} value={m.meter_id}>
                      {m.meter_name} ({m.meter_id})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedForConfig(inspectedMeter)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>
            </div>

            {/* Embedded Client View Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <CurrentPowerCard />
                <LiveElectricalCard />
              </div>

              <div className="space-y-4">
                <EnergyTodayCard />
                <BudgetSnapshotCard />
              </div>

              <div className="space-y-4">
                <OutageHistoryCard />

                <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                      Remote Contactor Actuator
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        inspectedMeter?.main_supply_connected
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {inspectedMeter?.main_supply_connected ? 'CONNECTED (ON)' : 'CUTOFF (OFF)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-neutral-400">
                    Remotely isolate or restore the main 30A electrical contactor for this specific client. Requires Admin PIN.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedForRelay({
                        meter: inspectedMeter,
                        targetState: !inspectedMeter?.main_supply_connected
                      })
                    }
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                      inspectedMeter?.main_supply_connected
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>
                      {inspectedMeter?.main_supply_connected
                        ? 'Disconnect Supply Contactor'
                        : 'Restore Supply Contactor'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FLEET OVERVIEW MODE */
          <div className="space-y-6">
            {/* 1. Facility KPI Metrics Banner */}
            <FleetKpiBanner
              totalMeters={totalMeters}
              onlineMeters={onlineMeters}
              totalLoadKw={totalLoadKw}
              totalEnergyTodayKwh={totalEnergyTodayKwh}
              totalRevenueTodayNaira={totalRevenueTodayNaira}
              activeTampersCount={activeTampers.length}
              onTamperClick={() => setIsTamperModalOpen(true)}
            />

            {/* Tamper Lock Quick Action Command Strip */}
            <TamperQuickActionBar />

            {/* 2. Submeter Filter & Search Toolbar */}
            <FleetSearchToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              counts={{
                all: totalMeters,
                online: onlineMeters,
                tampered: activeTampers.length,
                relayOff: fleetMeters.filter(m => !m.main_supply_connected).length
              }}
            />

            {/* 3. Submeters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMeters.map((meter) => (
                <SubmeterCard
                  key={meter.meter_id}
                  meter={meter}
                  onInspect={handleInspectClient}
                  onToggleRelay={(m) =>
                    setSelectedForRelay({
                      meter: m,
                      targetState: !m.main_supply_connected
                    })
                  }
                  onOpenConfig={(m) => setSelectedForConfig(m)}
                  onOpenUnits={(m) =>
                    setSelectedForUnits({
                      meter: m,
                      units: m.prepaid_units_kwh !== undefined ? m.prepaid_units_kwh : 100.0
                    })
                  }
                  onClearTamper={(id) => handleAdminClearTamper(id, '1234')}
                  onOpenTamperModal={(id) => {
                    switchMeter(id);
                    setIsTamperModalOpen(true);
                  }}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredMeters.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#0d1219] rounded-3xl border border-slate-200 dark:border-neutral-800">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  No submeters found matching "{searchQuery}"
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Try clearing your search query or switching filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-xs font-bold hover:bg-slate-200 text-slate-700 dark:text-neutral-200 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: Contactor Relay Toggle */}
      <AdminRelayModal
        isOpen={Boolean(selectedForRelay)}
        onClose={() => setSelectedForRelay(null)}
        meter={selectedForRelay?.meter || null}
        targetState={Boolean(selectedForRelay?.targetState)}
        onConfirm={handleAdminSetRelay}
      />

      {/* MODAL 2: Individual Submeter Configuration */}
      <AdminConfigModal
        isOpen={Boolean(selectedForConfig)}
        onClose={() => setSelectedForConfig(null)}
        meter={selectedForConfig}
        onSave={handleAdminUpdateConfig}
      />

      {/* MODAL 3: Global Bulk Tariff Update */}
      <AdminBulkTariffModal
        isOpen={isBulkTariffOpen}
        onClose={() => setIsBulkTariffOpen(false)}
        meterCount={totalMeters}
        onSave={(tariff, pin) =>
          handleAdminBulkTariff(
            fleetMeters.map(m => m.meter_id),
            tariff,
            pin
          )
        }
      />

      {/* MODAL 4: Adjust Prepaid Units */}
      <AdminAdjustUnitsModal
        isOpen={Boolean(selectedForUnits)}
        onClose={() => setSelectedForUnits(null)}
        meter={selectedForUnits?.meter || null}
        currentUnits={selectedForUnits?.units || 100.0}
        onSave={handleAdminSetUnits}
      />

      {/* Global Tamper History / PIN Unlock Modal */}
      <TamperHistoryModal
        isOpen={useMeter().isTamperModalOpen}
        onClose={() => useMeter().setIsTamperModalOpen(false)}
      />
    </div>
  );
};
