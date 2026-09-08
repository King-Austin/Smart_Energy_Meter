import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import { Zap, Plus, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { FundWalletModal } from './FundWalletModal';

export const WalletCard: React.FC = () => {
  const { meterData, setActiveTab } = useMeter();
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  const isLowUnits = meterData.prepaid_units_kwh < 20;

  return (
    <>
      <div className="glass-card p-5 relative overflow-hidden group">
        {/* Subtle Warm Brand Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#ff5b26]/8 dark:bg-[#ff5b26]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#ff5b26]/15 transition-all duration-500"></div>

        {/* Header Row */}
        <div className="flex items-center justify-between relative z-10 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5b26]">
                Active Balance
              </span>
              <h4 className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                {meterData.meter_name}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1 text-xs font-bold text-[#ff5b26] hover:text-[#e04818] transition-colors"
          >
            <span>Wallet History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Large Unit Balance Display */}
        <div className="my-2 relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
              {meterData.prepaid_units_kwh.toFixed(1)}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-600 dark:text-slate-400">
              Units (kWh)
            </span>
          </div>

          {/* Currency Equivalent & Duration Runway */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ff5b26]/10 text-[#ff5b26] border border-[#ff5b26]/20 mono-num">
              ≈ {meterData.currency_symbol}{meterData.wallet_balance.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Estimated duration: ~{meterData.estimated_days_remaining} days remaining
            </span>
          </div>
        </div>

        {/* In-Card Low Units Alert Banner */}
        {isLowUnits && (
          <div
            onClick={() => setIsFundModalOpen(true)}
            className="mt-3 p-2.5 rounded-xl bg-[#ff5b26]/10 border border-[#ff5b26]/20 flex items-center justify-between cursor-pointer hover:bg-[#ff5b26]/15 transition-all text-xs text-[#ff5b26] font-semibold"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You are running low on units. Recharge now</span>
            </div>
            <span className="font-bold underline underline-offset-2">Top Up</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-4 mt-3 border-t border-slate-200/80 dark:border-neutral-800/80 relative z-10">
          <button
            onClick={() => setIsFundModalOpen(true)}
            className="btn-primary text-xs py-2.5 px-3 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buy Light / Fund</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="text-xs py-2.5 px-3 rounded-2xl border font-bold flex items-center justify-center gap-1.5 transition-all bg-slate-100 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#ff5b26]" />
            <span>
              Tariff: ₦{meterData.tariff_rate}/kWh
            </span>
          </button>
        </div>
      </div>

      {/* Funding Modal Sheet */}
      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </>
  );
};
