import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import {
  Power,
  Cpu,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Wifi,
  Battery,
  Clock,
  Terminal,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { WirelessConsoleCard } from '../components/device/WirelessConsoleCard';

export const DeviceDetailsScreen: React.FC = () => {
  const { meterData, toggleMainSupply, setActiveTab } = useMeter();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isConnected = meterData.main_supply_connected;

  return (
    <div className="space-y-4 pb-12 animate-fade-in text-neutral-900 dark:text-neutral-100 max-w-2xl mx-auto">
      
      {/* Top Header with Back Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('home')}
          className="p-2 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-2xs transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Device
          </h2>
          <span className="text-xs text-slate-500 dark:text-neutral-400">
            {meterData.meter_name} • {meterData.meter_id}
          </span>
        </div>
      </div>

      {/* 1. Mains Supply Contactor Control (Apple Action Card) */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${
            isConnected
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
          }`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Mains Supply
            </h3>
            <span className={`text-xs font-semibold ${
              isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {isConnected ? 'Connected • Power ON' : 'Isolated • Power OFF'}
            </span>
          </div>
        </div>

        <button
          onClick={toggleMainSupply}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer ${
            isConnected
              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* 2. Device Specifications (Apple Inset Grouped List) */}
      <div className="glass-card overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-neutral-400">
            <Cpu className="w-4 h-4 text-[#ff5b26]" />
            <span>Hardware Model</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            Voltrix Meter {meterData.firmware_version || 'v3.2'}
          </span>
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Operational Status</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{meterData.device_status}</span>
          </span>
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-neutral-400">
            <Wifi className="w-4 h-4 text-sky-500" />
            <span>Network</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white mono-num">
            Wi-Fi ({meterData.wifi_rssi ? `${meterData.wifi_rssi} dBm` : 'Connected'})
          </span>
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-neutral-400">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span>Backup Battery</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white mono-num flex items-center gap-1.5">
            <span>50%</span>
            <span className="text-[10px] font-normal text-slate-500 dark:text-neutral-400">(Internal Standby)</span>
          </span>
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-neutral-400">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Last Sync</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            Live
          </span>
        </div>
      </div>

      {/* 3. Collapsible Developer Diagnostics Section */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Diagnostics Console & OTA
              </h4>
              <span className="text-[11px] text-slate-400">
                Technical logs & firmware flashing
              </span>
            </div>
          </div>

          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800 animate-fade-in">
            <WirelessConsoleCard />
          </div>
        )}
      </div>

    </div>
  );
};
