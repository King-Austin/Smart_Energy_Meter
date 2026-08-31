import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { HOURLY_DATA } from '../../services/mockData';
import { BarChart2, ArrowRight } from 'lucide-react';

export const MiniEnergySnapshot: React.FC = () => {
  const { setActiveTab } = useMeter();
  const maxKwh = Math.max(...HOURLY_DATA.map(d => d.kwh));

  return (
    <div className="glass-card p-4">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Today's Usage Snapshot
          </span>
        </div>

        <span className="text-[11px] text-neutral-500 font-medium">Hourly curve</span>
      </div>

      {/* Mini Bar Chart */}
      <div className="flex items-end justify-between gap-1.5 h-20 pt-2 pb-1 px-1">
        {HOURLY_DATA.map((item, idx) => {
          const heightPercent = Math.max(12, Math.round((item.kwh / maxKwh) * 100));
          const isPeak = item.kwh === maxKwh;
          const isLatest = idx === HOURLY_DATA.length - 1;

          return (
            <div
              key={item.hourLabel}
              className="flex-1 flex flex-col items-center h-full justify-end group/bar relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-7 hidden group-hover/bar:flex bg-neutral-900 text-white text-[10px] py-0.5 px-1.5 rounded shadow-lg whitespace-nowrap z-10 mono-num pointer-events-none">
                {item.kwh} kWh
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isPeak
                    ? 'bg-amber-400 dark:bg-amber-400'
                    : isLatest
                    ? 'bg-emerald-400'
                    : 'bg-emerald-500/30 dark:bg-emerald-500/30 group-hover/bar:bg-emerald-500/60'
                }`}
                style={{ height: `${heightPercent}%` }}
              ></div>

              {/* Label */}
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
                {item.hourLabel.replace(' ', '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Link to Energy Tab */}
      <button
        onClick={() => setActiveTab('energy')}
        className="w-full mt-3 pt-2.5 border-t border-neutral-200/50 dark:border-neutral-800/60 flex items-center justify-between text-xs font-semibold text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 transition-colors group"
      >
        <span>View full energy analytics & insights</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
