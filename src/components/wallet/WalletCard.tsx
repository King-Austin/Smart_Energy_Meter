import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import { Wallet, Plus, Zap, RefreshCw, ChevronRight } from 'lucide-react';
import { FundWalletModal } from './FundWalletModal';

export const WalletCard: React.FC = () => {
  const { meterData, toggleAutoTopup, setActiveTab } = useMeter();
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-neutral-950 border border-neutral-800/80 shadow-lg group">
        {/* Ambient Top Glow (Apple Wallet style) */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-500"></div>

        {/* Card Header */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Prepaid Electricity Wallet
              </span>
              <h4 className="text-xs font-semibold text-neutral-400">
                {meterData.meter_name} ({meterData.meter_id})
              </h4>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <span>History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Large Balance Display */}
        <div className="my-2 relative z-10">
          <span className="text-[11px] text-neutral-400 font-medium block">
            Current Credit Balance
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mono-num">
              {meterData.currency_symbol}
              {meterData.wallet_balance.toLocaleString()}
            </span>
          </div>

          {/* Units Remaining & Days Runway */}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mono-num">
              <Zap className="w-3 h-3" />
              {meterData.prepaid_units_kwh.toFixed(1)} kWh remaining
            </span>
            <span className="text-xs text-neutral-400 font-medium">
              ≈ {meterData.estimated_days_remaining} days at current rate
            </span>
          </div>
        </div>

        {/* Quick Action Pill Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-4 mt-3 border-t border-neutral-800/80 relative z-10">
          <button
            onClick={() => setIsFundModalOpen(true)}
            className="btn-primary text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Fund Wallet</span>
          </button>

          <button
            onClick={toggleAutoTopup}
            className={`text-xs py-2.5 px-3 rounded-2xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
              meterData.auto_topup_enabled
                ? 'bg-neutral-800 text-emerald-400 border-emerald-500/30'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${meterData.auto_topup_enabled ? 'text-emerald-400' : ''}`} />
            <span>
              Auto-Topup: {meterData.auto_topup_enabled ? 'ON' : 'OFF'}
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
