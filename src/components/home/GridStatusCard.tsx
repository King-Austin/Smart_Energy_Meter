import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Zap, ZapOff, CheckCircle2, ShieldCheck } from 'lucide-react';

export const GridStatusCard: React.FC = () => {
  const { meterData, toggleGridStatus } = useMeter();
  const isOnline = meterData.grid_status === 'online';

  return (
    <div
      onClick={() => toggleGridStatus()}
      className={`glass-card p-4 cursor-pointer transition-all border ${
        isOnline
          ? 'hover:border-emerald-500/30'
          : 'border-amber-500/40 bg-amber-500/5'
      }`}
      title="Click to toggle Grid Outage test"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/15 text-amber-400'
            }`}
          >
            {isOnline ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Grid Status
            </span>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {isOnline ? 'Grid Power Available' : 'Power Outage'}
            </h3>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            isOnline
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
          }`}
        >
          {isOnline ? 'Online' : 'Outage'}
        </span>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2.5 flex items-center gap-1.5">
        {isOnline ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Stable utility feed (230V Nominal)</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Meter operating safely on backup battery</span>
          </>
        )}
      </p>
    </div>
  );
};
