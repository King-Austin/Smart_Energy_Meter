import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import {
  Zap,
  Power,
  ShieldAlert,
  Cpu,
  ChevronLeft,
  AlertOctagon
} from 'lucide-react';

export const DeviceDetailsScreen: React.FC = () => {
  const { meterData, toggleMainSupply, setActiveTab } = useMeter();

  const [isPressingCutoff, setIsPressingCutoff] = useState(false);
  const [cutoffProgress, setCutoffProgress] = useState(0);
  const [pressTimer, setPressTimer] = useState<any>(null);
  const [showConfirmRelay, setShowConfirmRelay] = useState(false);

  const isConnected = meterData.main_supply_connected;

  // 3-Second Press-and-Hold for Whole-House Disconnect
  const handleMouseDown = () => {
    if (!isConnected) return;
    setIsPressingCutoff(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setCutoffProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsPressingCutoff(false);
        setCutoffProgress(0);
        setShowConfirmRelay(true);
      }
    }, 300); // 300ms * 10 = 3000ms (3s)
    setPressTimer(interval);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearInterval(pressTimer);
      setPressTimer(null);
    }
    setIsPressingCutoff(false);
    setCutoffProgress(0);
  };

  return (
    <div className="space-y-4 pb-8 animate-fade-in text-neutral-900 dark:text-neutral-100">
      
      {/* Top Header with Back Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('home')}
          className="p-2 rounded-2xl bg-neutral-200/60 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-display">
            Meter Hardware Details
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Diagnostics, firmware, and whole-house supply relay switch
          </p>
        </div>
      </div>

      {/* Main Hardware Info Card */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {meterData.meter_name}
              </h3>
              <span className="text-xs font-mono text-neutral-500">
                {meterData.meter_id}
              </span>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {meterData.device_status}
          </span>
        </div>

        {/* Spec Table */}
        <div className="space-y-2 text-xs pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Firmware:</span>
            <span className="font-mono text-neutral-900 dark:text-white font-bold">{meterData.firmware_version} (Latest)</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Cloud Connection:</span>
            <span className="text-neutral-900 dark:text-white flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Wi-Fi (RSSI -58 dBm · Good)
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Last Cloud Ping:</span>
            <span className="text-neutral-900 dark:text-white">{meterData.last_seen} (27ms latency)</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Internal Lithium Backup:</span>
            <span className="text-neutral-900 dark:text-white font-bold">
              {meterData.battery_percentage}% · {meterData.battery_status}
            </span>
          </div>
        </div>
      </div>

      {/* WHOLE-HOUSE EMERGENCY SUPPLY RELAY CONTROL */}
      <div className="glass-card p-5 border-red-500/30 bg-red-500/5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Whole-House Electricity Relay Control
            </h3>
            <p className="text-[11px] text-neutral-500">
              Remotely open or close the primary household contactor
            </p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-neutral-900 dark:text-white block">
              Contactor Relay Status
            </span>
            <span className="text-neutral-500 text-[11px]">
              {isConnected ? 'Supply is ON (Drawing power)' : 'Supply is OFF (House Isolated)'}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isConnected
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
            }`}
          >
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* 3-Second Press-and-Hold Button or Reconnect Button */}
        {isConnected ? (
          <div className="space-y-2">
            <button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className="relative w-full py-3.5 rounded-2xl border border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 font-bold text-xs flex items-center justify-center gap-2 overflow-hidden select-none transition-all shadow-sm"
            >
              {/* Progress Bar inside Button */}
              {isPressingCutoff && (
                <div
                  style={{ width: `${cutoffProgress}%` }}
                  className="absolute inset-0 bg-red-500/30 transition-all duration-100 -z-0"
                ></div>
              )}

              <Power className="w-4 h-4 relative z-10" />
              <span className="relative z-10">
                {isPressingCutoff
                  ? `Hold to Disconnect (${Math.ceil((100 - cutoffProgress) / 33)}s)...`
                  : 'Press and Hold 3s to Disconnect House Supply'}
              </span>
            </button>
            <p className="text-[10px] text-neutral-500 text-center">
              Requires 3-second continuous hold to prevent accidental triggers.
            </p>
          </div>
        ) : (
          <button
            onClick={toggleMainSupply}
            className="btn-primary w-full py-3.5 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Zap className="w-4 h-4" />
            <span>Reconnect Main Household Supply</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmRelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm glass-card p-6 text-center space-y-4 bg-white dark:bg-neutral-900">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Disconnect House Electricity?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                All appliances and circuits connected to {meterData.meter_name} will immediately lose power.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmRelay(false)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleMainSupply();
                  setShowConfirmRelay(false);
                }}
                className="btn-primary flex-1 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-500 border-red-400"
              >
                Confirm Cutoff
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
