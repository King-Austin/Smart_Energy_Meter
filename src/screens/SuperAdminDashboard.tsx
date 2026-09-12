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
  Activity,
  RefreshCw,
  Search,
  Eye,
  ArrowLeft,
  Sun,
  Moon,
  Users,
  Clock
} from 'lucide-react';
import { LiveElectricalCard } from '../components/home/LiveElectricalCard';
import { CurrentPowerCard } from '../components/home/CurrentPowerCard';
import { EnergyTodayCard } from '../components/home/EnergyTodayCard';
import { BudgetSnapshotCard } from '../components/home/BudgetSnapshotCard';
import { OutageHistoryCard } from '../components/energy/OutageHistoryCard';
import { TamperHistoryModal } from '../components/notifications/TamperHistoryModal';
import { TamperQuickActionBar } from '../components/admin/TamperQuickActionBar';

export const SuperAdminDashboard: React.FC = () => {
  const {
    fleetMeters,
    switchMeter,
    refreshFleet,
    handleAdminSetRelay,
    handleAdminClearTamper,
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
  const [isBulkTariffOpen, setIsBulkTariffOpen] = useState(false);
  const [bulkTariffValue, setBulkTariffValue] = useState(85.5);

  // Config Form state
  const [configTariff, setConfigTariff] = useState<number>(85.5);
  const [configBudgetNaira, setConfigBudgetNaira] = useState<number>(25000);
  const [configBudgetKwh, setConfigBudgetKwh] = useState<number>(365);
  const [configOverCurrent, setConfigOverCurrent] = useState<number>(30);

  // PIN state
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fleet Calculations
  const totalMeters = fleetMeters.length;
  const onlineMeters = fleetMeters.filter(m => m.grid_status === 'online').length;
  const totalLoadKw = fleetMeters.reduce((acc, m) => acc + (m.main_supply_connected ? Number(m.active_power || 0) : 0), 0);
  const totalEnergyTodayKwh = fleetMeters.reduce((acc, m) => acc + Number(m.energy_today || 0), 0);
  const totalRevenueTodayNaira = fleetMeters.reduce(
    (acc, m) => acc + Math.round(Number(m.energy_today || 0) * Number(m.tariff_rate || 85.5)),
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
    setConfigTariff(meter.tariff_rate || 85.5);
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
    const allIds = fleetMeters.map(m => m.meter_id);
    const res = await handleAdminBulkTariff(allIds, bulkTariffValue, adminPin);
    setIsSubmitting(false);

    if (res.success) {
      setIsBulkTariffOpen(false);
      setAdminPin('');
    } else {
      setPinError(res.error || 'Failed to bulk-update tariff.');
    }
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
            {/* Live Sync Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800/80 text-xs font-semibold text-slate-700 dark:text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live RPC Telemetry</span>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors"
              title="Refresh Fleet Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ff5b26]' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Bulk Tariff Button */}
            <button
              onClick={() => {
                setBulkTariffValue(85.5);
                setAdminPin('');
                setPinError('');
                setIsBulkTariffOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Bulk Tariff (₦/kWh)</span>
            </button>

            {/* Switch to Client View Link */}
            <button
              onClick={() => navigateToRoute('client')}
              className="px-4 py-2 rounded-xl bg-[#ff5b26] hover:bg-[#e04818] text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Switch to Client Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Center Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* ========================================================================= */}
        {/* CLIENT DASHBOARD INSPECTION MODE BANNER (When inspecting a specific client) */}
        {/* ========================================================================= */}
        {inspectingMeterId ? (
          <div className="space-y-6 animate-fade-in">
            {/* Top Inspector Bar */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border-2 border-[#ff5b26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setInspectingMeterId(null)}
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
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

              {/* Submeter Quick Switcher Dropdown */}
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
                  onClick={() => openConfigModal(inspectedMeter)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>
            </div>

            {/* Embedded Client View Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Live Telemetry & Power Gauge */}
              <div className="space-y-4">
                <CurrentPowerCard />
                <LiveElectricalCard />
              </div>

              {/* Column 2: Cost, Today Breakdown & Budget Milestone Snapshot */}
              <div className="space-y-4">
                <EnergyTodayCard />
                <BudgetSnapshotCard />
              </div>

              {/* Column 3: Outage Forensics & Contactor Controls */}
              <div className="space-y-4">
                <OutageHistoryCard />

                {/* Submeter Actuator Quick Action Card */}
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
                    onClick={() =>
                      setSelectedForRelay({
                        meter: inspectedMeter,
                        targetState: !inspectedMeter?.main_supply_connected
                      })
                    }
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
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
          /* ========================================================================= */
          /* FLEET OVERVIEW MODE (Full Facility Metrics & Submeters Grid)               */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* 1. Facility KPI Metrics Banner */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              
              {/* Total Submeters */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
                  <span>Submeters</span>
                  <Building2 className="w-4 h-4 text-[#ff5b26]" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {totalMeters}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {onlineMeters} Online
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  100% Modbus True-RMS
                </span>
              </div>

              {/* Total Live Demand */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
                  <span>Estate Demand</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white mono-num">
                    {totalLoadKw.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">kW</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Active load across facility
                </span>
              </div>

              {/* Cumulative Energy Today */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
                  <span>Energy Today</span>
                  <Activity className="w-4 h-4 text-[#0284c7]" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white mono-num">
                    {totalEnergyTodayKwh.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">kWh</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Total client draw
                </span>
              </div>

              {/* Revenue Generated Today */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
                  <span>Revenue Today</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white mono-num">
                    ₦{totalRevenueTodayNaira.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Based on configured tariffs
                </span>
              </div>

              {/* Active Tamper Locks */}
              <div
                onClick={() => setIsTamperModalOpen(true)}
                className={`p-4 rounded-3xl border cursor-pointer transition-all shadow-2xs ${
                  activeTampers.length > 0
                    ? 'bg-red-500/10 border-red-500 hover:bg-red-500/15 animate-pulse'
                    : 'bg-white dark:bg-[#0d1219] border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={activeTampers.length > 0 ? 'text-red-700 dark:text-red-300 font-black' : 'text-slate-500 dark:text-neutral-400'}>
                    Tamper Alerts
                  </span>
                  <ShieldAlert className={`w-4 h-4 ${activeTampers.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${activeTampers.length > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                    {activeTampers.length}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {activeTampers.length > 0 ? 'TRIPPED' : 'Secure'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  SS-5GL Lid switches
                </span>
              </div>

              {/* Grid Outage Incidents */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
                  <span>Grid Incidents</span>
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    0
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600">
                    Normal 230V
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  AC supply continuous
                </span>
              </div>

            </div>

            {/* Tamper Lock Quick Action Command Strip (if any meter is locked) */}
            <TamperQuickActionBar />

            {/* 2. Submeter Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search submeters by tenant, apartment, or Meter ID (e.g. MTR-8A24)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#ff5b26]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    filterType === 'all'
                      ? 'bg-[#ff5b26] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
                  }`}
                >
                  All ({totalMeters})
                </button>
                <button
                  onClick={() => setFilterType('online')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    filterType === 'online'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
                  }`}
                >
                  Online ({onlineMeters})
                </button>
                <button
                  onClick={() => setFilterType('tampered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    filterType === 'tampered'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
                  }`}
                >
                  Tampered ({activeTampers.length})
                </button>
                <button
                  onClick={() => setFilterType('relay-off')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    filterType === 'relay-off'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
                  }`}
                >
                  Relay Cutoff ({fleetMeters.filter(m => !m.main_supply_connected).length})
                </button>
              </div>

            </div>

            {/* 3. Submeters Grid ("Submitters") */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMeters.map((meter) => {
                const isOnline = meter.grid_status === 'online';
                const isRelayOn = meter.main_supply_connected;
                const isTampered = meter.is_tampered || meter.tamper_locked;

                return (
                  <div
                    key={meter.meter_id}
                    className={`rounded-3xl p-5 bg-white dark:bg-[#0d1219] border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                      isTampered
                        ? 'border-red-500/80 bg-red-500/5'
                        : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      
                      {/* Card Header: Unit & Meter ID */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                              isTampered
                                ? 'bg-red-600'
                                : isRelayOn
                                ? 'bg-gradient-to-tr from-[#ff5b26] to-[#e04818]'
                                : 'bg-slate-400'
                            }`}
                          >
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                {meter.meter_name}
                              </h3>
                              {isOnline ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 block">
                              {meter.meter_id} • {meter.location || 'Block Main'}
                            </span>
                          </div>
                        </div>

                        {/* Relay State Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                            isRelayOn
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                              : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
                          }`}
                        >
                          {isRelayOn ? 'Contactor ON' : 'Contactor CUT'}
                        </span>
                      </div>

                      {/* Tamper Warning & Quick Action Banner */}
                      {isTampered && (
                        <div className="mt-3.5 p-3 rounded-2xl bg-red-500/15 border border-red-500 text-red-700 dark:text-red-300 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold">
                              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                              <span>SS-5GL Lid Tamper Locked</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 text-[11px] font-mono font-black text-[#ff5b26]">
                              Code: 1234
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleAdminClearTamper(meter.meter_id, '1234');
                              }}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 fill-white" />
                              <span>Clear & Connect Load</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                switchMeter(meter.meter_id);
                                setIsTamperModalOpen(true);
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-200 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Forensics
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Telemetry Matrix (PZEM True-RMS) */}
                      <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-neutral-800/80 text-center">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Active Load
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white mono-num">
                            {Number(meter.active_power || 0).toFixed(2)} kW
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Voltage
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white mono-num">
                            {Number(meter.voltage || 230).toFixed(1)} V
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Current
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white mono-num">
                            {Number(meter.current || 0).toFixed(1)} A
                          </span>
                        </div>
                      </div>

                      {/* Financial & Tariff Details */}
                      <div className="mt-3.5 flex items-center justify-between text-xs px-1">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Tariff:</span>
                          <span className="font-bold text-slate-900 dark:text-white mono-num">
                            ₦{meter.tariff_rate || 85.5}/kWh
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400">
                          <Activity className="w-3.5 h-3.5 text-[#ff5b26]" />
                          <span>Today:</span>
                          <span className="font-bold text-slate-900 dark:text-white mono-num">
                            {Number(meter.energy_today || 0).toFixed(1)} kWh
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Card Footer Actions: "Inspect Client Dashboard" & Relay Toggle */}
                    <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-neutral-800 flex items-center gap-2">
                      
                      {/* Primary Hero Action: Inspect this Client's Dashboard */}
                      <button
                        onClick={() => handleInspectClient(meter)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#ff5b26]" />
                        <span>Inspect Client View</span>
                      </button>

                      {/* Toggle Contactor Relay */}
                      <button
                        onClick={() =>
                          setSelectedForRelay({
                            meter,
                            targetState: !meter.main_supply_connected
                          })
                        }
                        className={`p-2.5 rounded-xl border transition-colors ${
                          meter.main_supply_connected
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-200 dark:border-red-900/40'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/40'
                        }`}
                        title={meter.main_supply_connected ? 'Disconnect Relay' : 'Connect Relay'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* Meter Config Settings */}
                      <button
                        onClick={() => openConfigModal(meter)}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition-colors"
                        title="Configure Meter Tariff & Limits"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>

            {/* Empty state if search has no results */}
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
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-xs font-bold hover:bg-slate-200 text-slate-700 dark:text-neutral-200"
                >
                  Clear Filters
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: Contactor Relay Toggle with Admin PIN Verification               */}
      {/* ========================================================================= */}
      {selectedForRelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  selectedForRelay.targetState
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-red-500/15 text-red-600'
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedForRelay.targetState ? 'Connect Contactor Relay' : 'Cut Supply Contactor'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {selectedForRelay.meter.meter_name} ({selectedForRelay.meter.meter_id})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              {selectedForRelay.targetState
                ? 'This will restore high-voltage 230V AC mains to the client sub-panel.'
                : 'This will physically trip the 30A contactor relay and disconnect client electrical supply.'}
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500 block">
                Enter Admin PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:border-[#ff5b26] focus:outline-hidden"
              />
              {pinError && <p className="text-xs text-red-500 font-bold">{pinError}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedForRelay(null);
                  setAdminPin('');
                  setPinError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRelayToggle}
                disabled={isSubmitting || adminPin.length !== 4}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-40 ${
                  selectedForRelay.targetState
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Switching...' : 'Authorize Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Individual Submeter Configuration                                */}
      {/* ========================================================================= */}
      {selectedForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={executeConfigUpdate}
            className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#ff5b26]/15 text-[#ff5b26]">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Configure Submeter
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {selectedForConfig.meter_name} ({selectedForConfig.meter_id})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Tariff (₦/kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={configTariff}
                  onChange={(e) => setConfigTariff(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Overcurrent Limit (A)
                </label>
                <input
                  type="number"
                  value={configOverCurrent}
                  onChange={(e) => setConfigOverCurrent(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Monthly Budget (₦)
                </label>
                <input
                  type="number"
                  value={configBudgetNaira}
                  onChange={(e) => setConfigBudgetNaira(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Monthly Budget (kWh)
                </label>
                <input
                  type="number"
                  value={configBudgetKwh}
                  onChange={(e) => setConfigBudgetKwh(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase text-slate-500 block">
                Admin PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:border-[#ff5b26] focus:outline-hidden"
              />
              {pinError && <p className="text-xs text-red-500 font-bold">{pinError}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedForConfig(null);
                  setAdminPin('');
                  setPinError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || adminPin.length !== 4}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04818] text-white text-xs font-bold transition-colors disabled:opacity-40"
              >
                {isSubmitting ? 'Saving...' : 'Save Config'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Global Bulk Tariff Update                                        */}
      {/* ========================================================================= */}
      {isBulkTariffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={executeBulkTariff}
            className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Bulk Tariff Update
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Apply new ₦/kWh rate to all {totalMeters} submeters
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">
                New Tariff Rate (₦/kWh)
              </label>
              <input
                type="number"
                step="0.1"
                value={bulkTariffValue}
                onChange={(e) => setBulkTariffValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500 block">
                Admin PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:border-[#ff5b26] focus:outline-hidden"
              />
              {pinError && <p className="text-xs text-red-500 font-bold">{pinError}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBulkTariffOpen(false);
                  setAdminPin('');
                  setPinError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || adminPin.length !== 4}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-40"
              >
                {isSubmitting ? 'Applying...' : 'Apply to Fleet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global Tamper History / PIN Unlock Modal */}
      <TamperHistoryModal
        isOpen={useMeter().isTamperModalOpen}
        onClose={() => useMeter().setIsTamperModalOpen(false)}
      />

    </div>
  );
};
