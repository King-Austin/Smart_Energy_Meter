import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import { ChevronDown, ChevronUp, Gauge } from 'lucide-react';

export const LiveElectricalCard: React.FC = () => {
  const { meterData } = useMeter();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#ff5b26]/10 text-[#ff5b26]">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Live Electrical Diagnostics
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <span>{isExpanded ? 'Less' : 'More Specs'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3 Core Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Voltage */}
        <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-center">
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Voltage
          </span>
          <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
            <span className="text-base font-extrabold text-neutral-900 dark:text-white mono-num">
              {meterData.voltage.toFixed(1)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500">V</span>
          </div>
        </div>

        {/* Current */}
        <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-center">
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Current
          </span>
          <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
            <span className="text-base font-extrabold text-neutral-900 dark:text-white mono-num">
              {meterData.current.toFixed(1)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500">A</span>
          </div>
        </div>

        {/* Power Factor */}
        <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-center">
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Power Factor
          </span>
          <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mono-num">
              {meterData.power_factor.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Engineering Telemetry */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-2 animate-fade-in text-center">
          <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/60">
            <span className="text-[9px] font-bold text-neutral-500 uppercase block">Frequency</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-white mono-num">{meterData.frequency.toFixed(1)} Hz</span>
          </div>

          <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/60">
            <span className="text-[9px] font-bold text-neutral-500 uppercase block">Apparent</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-white mono-num">{meterData.apparent_power.toFixed(2)} kVA</span>
          </div>

          <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/60">
            <span className="text-[9px] font-bold text-neutral-500 uppercase block">Reactive</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-white mono-num">{meterData.reactive_power.toFixed(2)} kVAR</span>
          </div>
        </div>
      )}
    </div>
  );
};
