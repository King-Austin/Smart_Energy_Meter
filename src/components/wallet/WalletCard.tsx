import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import { Zap, AlertCircle, Clock } from 'lucide-react';
import { FundWalletModal } from './FundWalletModal';
import { formatCurrency } from '../../utils/formatters';

export const WalletCard: React.FC = () => {
  const { meterData } = useMeter();
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  const isLowUnits = meterData.prepaid_units_kwh < 20;
  const tariff = meterData.tariff_rate > 0 ? meterData.tariff_rate : 160.0;
  const nairaEquivalent = Math.round(meterData.prepaid_units_kwh * tariff);

  return (
    <>
      <div className="glass-card p-5 sm:p-6 relative overflow-hidden group border-slate-200/90 dark:border-neutral-800/90">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#ff5b26]/10 dark:bg-[#ff5b26]/18 rounded-full blur-3xl pointer-events-none group-hover:bg-[#ff5b26]/20 transition-all duration-500" />

        {/* Top Row: Title + Meter Badge */}
        <div className="flex items-center justify-between relative z-10 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ff5b26]/12 text-[#ff5b26] flex items-center justify-center border border-[#ff5b26]/20">
              <Zap className="w-4.5 h-4.5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5b26]">
                Prepaid Units
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate max-w-[170px]">
                {meterData.meter_name}
              </h4>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-neutral-800/90 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
            ₦{tariff}/kWh
          </span>
        </div>

        {/* Large Unit Balance Display */}
        <div className="my-4 relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
              {Number(meterData.prepaid_units_kwh || 0).toFixed(2)}
            </span>
            <span className="text-2xl font-extrabold text-slate-500 dark:text-neutral-400">
              kWh
            </span>
          </div>

          {/* Currency Equivalent & Duration Runway Pills */}
          <div className="flex items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ff5b26]/10 text-[#ff5b26] border border-[#ff5b26]/25 mono-num">
              ≈ {formatCurrency(nairaEquivalent)}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>~{meterData.estimated_days_remaining} days left</span>
            </span>
          </div>
        </div>

        {/* Low Units Notice (if applicable) */}
        {isLowUnits && (
          <div className="my-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Low balance alert — units are running low</span>
          </div>
        )}

        {/* The Single Prominent Call to Action */}
        <div className="pt-3 mt-3 border-t border-slate-200/70 dark:border-neutral-800/80 relative z-10">
          <button
            onClick={() => setIsFundModalOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#ff5b26] to-[#ff7a45] hover:from-[#e04a1a] hover:to-[#ff5b26] text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#ff5b26]/25 hover:shadow-xl hover:shadow-[#ff5b26]/35 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Zap className="w-4.5 h-4.5 fill-current" />
            <span>Recharge Units</span>
          </button>
        </div>
      </div>

      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </>
  );
};
