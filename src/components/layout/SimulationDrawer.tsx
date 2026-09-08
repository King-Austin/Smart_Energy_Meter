import React from 'react';
import { useMeter } from '../../context/MeterContext';
import {
  X,
  Zap,
  ZapOff,
  Wifi,
  WifiOff,
  Battery,
  BatteryWarning,
  ArrowDownLeft,
  Power,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const SimulationDrawer: React.FC = () => {
  const {
    isSimPanelOpen,
    setIsSimPanelOpen,
    meterData,
    toggleGridStatus,
    toggleMeterOnline,
    toggleMainSupply,
    drainBattery,
    rechargeBattery,
    simulateIncomingShare,
    receivingSession,
    simulateVoltageSpike,
    resetSafetyCutoff
  } = useMeter();

  if (!isSimPanelOpen) return null;

  const isGridOnline = meterData.grid_status === 'online';
  const isMeterOnline = meterData.device_status === 'online';
  const isMainSupplyOn = meterData.main_supply_connected;
  const isReceiving = !!receivingSession;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full max-w-[440px] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#ff5b26]/10 text-[#ff5b26]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white font-display">Hardware & Demo Simulator</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Test real-time states and failure modes per PRD
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSimPanelOpen(false)}
            className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Grid */}
        <div className="space-y-4 pt-4 text-sm">

          {/* 1. Grid Power Outage Simulation */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isGridOnline ? (
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ZapOff className="w-4 h-4 text-amber-500" />
                )}
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Grid Electricity Status</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isGridOnline ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
              }`}>
                {isGridOnline ? 'Grid Online' : 'Grid Outage'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              When grid drops, Meter operates on lithium backup battery without house blackout crash.
            </p>
            <button
              onClick={() => toggleGridStatus()}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                isGridOnline
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
              }`}
            >
              {isGridOnline ? (
                <>
                  <ZapOff className="w-3.5 h-3.5" /> Simulate Grid Power Outage
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" /> Restore Grid Power
                </>
              )}
            </button>
          </div>

          {/* 2. Meter Cloud Connectivity Simulation */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isMeterOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Meter Internet Connectivity</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMeterOnline ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/15 text-red-600 dark:text-red-300'
              }`}>
                {isMeterOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Energy sharing requires cloud connection. Disconnecting interrupts active sessions safely.
            </p>
            <button
              onClick={() => toggleMeterOnline()}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                isMeterOnline
                  ? 'bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/25 border border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
              }`}
            >
              {isMeterOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" /> Cut Meter Internet (Go Offline)
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" /> Reconnect Meter to Cloud
                </>
              )}
            </button>
          </div>

          {/* 3. Lithium Backup Battery Controls */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-[#ff5b26]" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Backup Battery ({meterData.battery_percentage}%)</span>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{meterData.battery_status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => drainBattery(18)}
                className="py-2 px-3 rounded-xl font-semibold text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <BatteryWarning className="w-3.5 h-3.5" /> Drain to 18% (Low)
              </button>
              <button
                onClick={() => rechargeBattery()}
                className="py-2 px-3 rounded-xl font-semibold text-xs bg-[#ff5b26]/10 text-[#ff5b26] hover:bg-[#ff5b26]/20 border border-[#ff5b26]/20 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Recharge to 95%
              </button>
            </div>
          </div>

          {/* 4. Incoming Energy Transfer Simulation */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-[#ff5b26]" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Incoming Energy Sharing</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isReceiving ? 'bg-[#ff5b26]/15 text-[#ff5b26]' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}>
                {isReceiving ? 'Receiving Active' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Simulate Family House sharing 380 W with your Meter in real time.
            </p>
            <button
              onClick={simulateIncomingShare}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                isReceiving
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                  : 'bg-[#ff5b26]/15 text-[#ff5b26] hover:bg-[#ff5b26]/25 border border-[#ff5b26]/30'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              {isReceiving ? 'Stop Receiving Energy' : 'Simulate Incoming Transfer (Family House)'}
            </button>
          </div>

          {/* 5. Main House Supply Disconnect */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Whole-House Main Supply</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMainSupplyOn ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/15 text-red-600 dark:text-red-300'
              }`}>
                {isMainSupplyOn ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={toggleMainSupply}
              className="w-full py-2 px-3 rounded-xl font-semibold text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              {isMainSupplyOn ? 'Quick Disconnect House Supply' : 'Reconnect House Supply'}
            </button>
          </div>

          {/* 6. Overvoltage & Protective Cutoff Spike Injection */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ff5b26]" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Protective Cutoff Guard ({meterData.max_voltage_limit}V Max)
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                meterData.voltage_cutoff_tripped
                  ? 'bg-rose-500/15 text-rose-600 font-bold'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
              }`}>
                {meterData.voltage_cutoff_tripped ? 'Tripped' : 'Armed'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Test real overvoltage protection: inject a 265V line surge to automatically trip the contactor relay.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => simulateVoltageSpike(265.0)}
                className="py-2 px-3 rounded-xl font-bold text-xs bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Inject 265V Surge</span>
              </button>
              <button
                onClick={resetSafetyCutoff}
                className="py-2 px-3 rounded-xl font-bold text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reset & Re-arm</span>
              </button>
            </div>
          </div>

        </div>

        <div className="mt-5 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={() => setIsSimPanelOpen(false)}
            className="btn-secondary w-full text-xs py-2.5"
          >
            Close Simulator Panel
          </button>
        </div>

      </div>
    </div>
  );
};
