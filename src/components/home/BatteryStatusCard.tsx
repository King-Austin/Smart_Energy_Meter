import React from 'react';
import { Battery, Info } from 'lucide-react';

export const BatteryStatusCard: React.FC = () => {
  const percentage = 50;

  return (
    <div className="glass-card p-4 border border-slate-200/80 dark:border-neutral-800">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Battery className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Meter Backup
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mono-num">
                {percentage}%
              </h3>
              <span className="text-xs text-neutral-500 font-medium">
                · Internal Standby
              </span>
            </div>
          </div>
        </div>

        {/* Battery Progress Bar */}
        <div className="w-16 bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mt-1.5 border border-neutral-300/40 dark:border-neutral-700/50">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-start gap-1.5 mt-2.5 text-[11px] text-neutral-500 dark:text-neutral-400">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />
        <p className="leading-tight">
          Internal backup maintains real-time clock and memory integrity during grid power outages.
        </p>
      </div>
    </div>
  );
};
