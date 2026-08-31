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
  Sparkles
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
    receivingSession
  } = useMeter();

  if (!isSimPanelOpen) return null;

  const isGridOnline = meterData.grid_status === 'online';
  const isMeterOnline = meterData.device_status === 'online';
  const isMainSupplyOn = meterData.main_supply_connected;
  const isReceiving = !!receivingSession;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full max-w-[440px] bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-t-3xl sm:rounded-3xl border border-neutral-800 shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Hardware & Demo Simulator</h2>
              <p className="text-xs text-neutral-400">
                Test real-time states and failure modes per PRD
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSimPanelOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Grid */}
        <div className="space-y-4 pt-4 text-sm">

          {/* 1. Grid Power Outage Simulation */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isGridOnline ? (
                  <Zap className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ZapOff className="w-4 h-4 text-amber-400" />
                )}
                <span className="font-semibold text-neutral-200">Grid Electricity Status</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isGridOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {isGridOnline ? 'Grid Online' : 'Grid Outage'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              When grid drops, Meter operates on lithium backup battery without house blackout crash.
            </p>
            <button
              onClick={() => toggleGridStatus()}
              className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors ${
                isGridOnline
                  ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
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
          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isMeterOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="font-semibold text-neutral-200">Meter Internet Connectivity</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMeterOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {isMeterOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Energy sharing requires cloud connection. Disconnecting interrupts active sessions safely.
            </p>
            <button
              onClick={() => toggleMeterOnline()}
              className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors ${
                isMeterOnline
                  ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
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
          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-neutral-200">Backup Battery ({meterData.battery_percentage}%)</span>
              </div>
              <span className="text-xs text-neutral-400 capitalize">{meterData.battery_status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => drainBattery(18)}
                className="py-2 px-3 rounded-xl font-medium text-xs bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <BatteryWarning className="w-3.5 h-3.5" /> Drain to 18% (Low)
              </button>
              <button
                onClick={() => rechargeBattery()}
                className="py-2 px-3 rounded-xl font-medium text-xs bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/20 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Recharge to 95%
              </button>
            </div>
          </div>

          {/* 4. Incoming Energy Transfer Simulation */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-neutral-200">Incoming Energy Sharing</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isReceiving ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-700 text-neutral-300'
              }`}>
                {isReceiving ? 'Receiving Active' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Simulate Family House sharing 380 W with your Meter in real time.
            </p>
            <button
              onClick={simulateIncomingShare}
              className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors ${
                isReceiving
                  ? 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              {isReceiving ? 'Stop Receiving Energy' : 'Simulate Incoming Transfer (Family House)'}
            </button>
          </div>

          {/* 5. Main House Supply Disconnect */}
          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-red-400" />
                <span className="font-semibold text-neutral-200">Whole-House Main Supply</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMainSupplyOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {isMainSupplyOn ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={toggleMainSupply}
              className="w-full py-2 px-3 rounded-xl font-medium text-xs bg-neutral-700 text-neutral-200 hover:bg-neutral-600 transition-colors"
            >
              {isMainSupplyOn ? 'Quick Disconnect House Supply' : 'Reconnect House Supply'}
            </button>
          </div>

        </div>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
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
