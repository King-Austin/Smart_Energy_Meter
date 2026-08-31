import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Battery, BatteryCharging, BatteryWarning, Info } from 'lucide-react';

export const BatteryStatusCard: React.FC = () => {
  const { meterData, drainBattery, rechargeBattery } = useMeter();
  const percentage = meterData.battery_percentage;
  const isCharging = meterData.battery_status === 'charging';
  const isLow = percentage < 20;

  const handleToggle = () => {
    if (isLow) {
      rechargeBattery();
    } else {
      drainBattery(18);
    }
  };

  return (
    <div
      onClick={handleToggle}
      className={`glass-card p-4 cursor-pointer transition-all border ${
        isLow
          ? 'border-amber-500/40 bg-amber-500/5'
          : 'hover:border-emerald-500/30'
      }`}
      title="Click to test Battery Low state"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isLow
                ? 'bg-amber-500/15 text-amber-400'
                : isCharging
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {isCharging ? (
              <BatteryCharging className="w-4 h-4" />
            ) : isLow ? (
              <BatteryWarning className="w-4 h-4" />
            ) : (
              <Battery className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Meter Backup
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mono-num">
                {percentage}%
              </h3>
              <span className="text-xs text-neutral-500 font-medium capitalize">
                · {isCharging ? 'Charging' : isLow ? 'Battery Low' : 'On battery'}
              </span>
            </div>
          </div>
        </div>

        {/* Battery Progress Bar */}
        <div className="w-16 bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mt-1.5 border border-neutral-300/40 dark:border-neutral-700/50">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isLow
                ? 'bg-amber-500'
                : percentage > 50
                ? 'bg-emerald-500'
                : 'bg-cyan-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-start gap-1.5 mt-2.5 text-[11px] text-neutral-500 dark:text-neutral-400">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />
        <p className="leading-tight">
          Backup keeps your Meter connected during outages. Does not power the whole house.
        </p>
      </div>
    </div>
  );
};
