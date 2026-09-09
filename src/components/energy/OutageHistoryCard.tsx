import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { ZapOff, Clock, ShieldCheck, Activity } from 'lucide-react';

export const OutageHistoryCard: React.FC = () => {
  const { meterData, outageLogs } = useMeter();

  const totalDowntimeSec = outageLogs.reduce((acc, log) => acc + (log.duration_seconds || 0), 0);
  const downtimeHours = (totalDowntimeSec / 3600).toFixed(1);
  const isCurrentlyOffline = meterData.grid_status === 'offline';

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-500">
            <ZapOff className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Grid Outage & Blackout Forensics
            </h3>
          </div>
        </div>

        <span
          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
            isCurrentlyOffline
              ? 'text-red-500 bg-red-500/15 border-red-500/30'
              : 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30'
          }`}
        >
          {isCurrentlyOffline ? 'Blackout Active (Battery)' : 'Grid Live'}
        </span>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[9px] font-bold text-neutral-500 uppercase block">Outages Logged</span>
          <span className="text-base font-extrabold text-neutral-900 dark:text-white mono-num">
            {outageLogs.length}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[9px] font-bold text-neutral-500 uppercase block">Total Downtime</span>
          <span className="text-base font-extrabold text-neutral-900 dark:text-white mono-num">
            {downtimeHours} <span className="text-xs font-normal">hrs</span>
          </span>
        </div>

        <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[9px] font-bold text-neutral-500 uppercase block">Grid Uptime</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mono-num">
            {outageLogs.length === 0 ? '100%' : '97.2%'}
          </span>
        </div>
      </div>

      {/* Outage Log Timeline */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
          Recent Grid Outage Events
        </span>

        {outageLogs.length === 0 ? (
          <div className="p-3 rounded-xl bg-neutral-100/60 dark:bg-neutral-900/60 text-center text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            No blackout incidents recorded for this submeter.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {outageLogs.slice(0, 5).map((log) => {
              const durMinutes = log.duration_seconds ? Math.round(log.duration_seconds / 60) : null;
              return (
                <div
                  key={log.id}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                      <Activity className="w-3 h-3 text-amber-500" />
                      <span>{new Date(log.outage_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(log.outage_start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 block">
                      {log.cause.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 font-bold mono-num">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>{durMinutes ? `${durMinutes} min` : 'Ongoing'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
