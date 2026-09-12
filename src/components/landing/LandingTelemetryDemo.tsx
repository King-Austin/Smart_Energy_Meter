import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, Power } from 'lucide-react';
import { MeterTelemetry } from '../../types/meter';
import { formatPower } from '../../utils/formatters';

export interface LandingTelemetryDemoProps {
  meterData?: MeterTelemetry;
  toggleMainSupply?: () => void;
  theme?: 'light' | 'dark';
}

export const LandingTelemetryDemo: React.FC<LandingTelemetryDemoProps> = ({
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Self-contained high-fidelity simulated telemetry loop (instantaneous loading, zero network latency)
  const [isRelayOn, setIsRelayOn] = useState<boolean>(true);
  const [voltage, setVoltage] = useState<number>(220.4);
  const [activeWatts, setActiveWatts] = useState<number>(185.0);
  const [currentAmps, setCurrentAmps] = useState<number>(0.84);
  const [powerFactor] = useState<number>(0.96);
  const [frequency] = useState<number>(50.0);
  const [prepaidUnits] = useState<number>(124.95);

  // Smooth realistic micro-fluctuation simulation
  useEffect(() => {
    if (!isRelayOn) return;

    const interval = setInterval(() => {
      setVoltage((prev) => {
        const delta = (Math.random() - 0.48) * 0.8;
        return Number(Math.max(217.5, Math.min(223.5, prev + delta)).toFixed(1));
      });

      setActiveWatts((prev) => {
        const delta = (Math.random() - 0.48) * 6;
        return Number(Math.max(178, Math.min(198, prev + delta)).toFixed(1));
      });

      setCurrentAmps((prev) => {
        const delta = (Math.random() - 0.48) * 0.02;
        return Number(Math.max(0.80, Math.min(0.90, prev + delta)).toFixed(2));
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isRelayOn]);

  const toggleRelay = () => {
    setIsRelayOn((prev) => !prev);
  };

  const displayWatts = isRelayOn ? activeWatts : 0;
  const powerFormatted = formatPower(displayWatts / 1000);

  return (
    <div className={`relative rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl border transition-all ${
      isDark
        ? 'bg-gradient-to-b from-slate-900/90 via-[#0c1017] to-slate-950/90 border-white/10 ring-1 ring-white/5'
        : 'bg-white border-slate-200/90 shadow-slate-200/70'
    }`}>
      {/* Header Bar */}
      <div className={`flex items-center justify-between pb-4 border-b ${
        isDark ? 'border-white/[0.08]' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${isRelayOn ? 'bg-emerald-500 animate-ping' : 'bg-red-500'} opacity-75`} />
            <div className={`w-2.5 h-2.5 rounded-full absolute ${isRelayOn ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Live Submeter Telemetry
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#ff5b26]/15 text-[#ff5b26]">
                LIVE APARTMENT
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              MTR-8A24-19F2 • Cloud Synchronized
            </p>
          </div>
        </div>

        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
          isRelayOn
            ? isDark
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : isDark
              ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {isRelayOn ? 'LIVE 50Hz' : 'POWER OFF'}
        </span>
      </div>

      {/* Main Readings Grid */}
      <div className="grid grid-cols-2 gap-3 py-5">
        {/* Voltage */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            AC Line Voltage
          </div>
          <div className={`text-2xl font-black mt-1 flex items-baseline gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {voltage.toFixed(1)}
            <span className="text-xs text-[#ff5b26] font-bold">V</span>
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-1">Normal Range (180V - 250V)</div>
        </div>

        {/* Active Power */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Active Load
          </div>
          <div className={`text-2xl font-black mt-1 flex items-baseline gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {powerFormatted.value}
            <span className="text-xs text-[#ff5b26] font-bold">{powerFormatted.unit}</span>
          </div>
          <div className={`text-[10px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isRelayOn ? `${currentAmps.toFixed(2)} A Current` : 'Power Disconnected'}
          </div>
        </div>

        {/* Power Factor & Frequency */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Power Factor
          </div>
          <div className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {powerFactor.toFixed(2)}
          </div>
          <div className="text-[10px] text-cyan-500 font-semibold mt-1">Grid Freq: {frequency.toFixed(1)} Hz</div>
        </div>

        {/* Prepaid Runway Units */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Prepaid Units
          </div>
          <div className={`text-xl font-black mt-1 flex items-baseline gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {prepaidUnits.toFixed(2)}
            <span className="text-xs text-[#ff5b26] font-bold">kWh</span>
          </div>
          <div className={`text-[10px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ≈ ₦19,992 • ~12 days left
          </div>
        </div>
      </div>

      {/* Smart Mains Power Control Switch */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
        isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div>
          <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Smart Mains Power Switch
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isRelayOn ? 'Connected (Home Power Live)' : 'Power Cut (Appliances Protected)'}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleRelay}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
            isRelayOn
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
              : isDark
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isRelayOn ? 'Disconnect' : 'Connect'}</span>
        </button>
      </div>

      {/* Live Hardware Status Footer */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
        isDark ? 'border-white/[0.06] text-slate-400' : 'border-slate-100 text-slate-500'
      }`}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Tamper Guard Active</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[#ff5b26]">
          <Wifi className="w-3.5 h-3.5" />
          <span>Live Cloud Sync</span>
        </div>
      </div>
    </div>
  );
};
