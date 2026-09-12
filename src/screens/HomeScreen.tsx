import React from 'react';
import { useMeter } from '../context/MeterContext';
import { EnergyFlowDiagram } from '../components/home/EnergyFlowDiagram';
import { CurrentPowerCard } from '../components/home/CurrentPowerCard';
import { WalletCard } from '../components/wallet/WalletCard';
import { BudgetSnapshotCard } from '../components/home/BudgetSnapshotCard';
import { QuickTamperUnlockCard } from '../components/home/QuickTamperUnlockCard';
import {
  Zap,
  Activity,
  ShieldCheck,
  Share2,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const HomeScreen: React.FC = () => {
  const {
    setActiveTab,
    walletTransactions,
    meterData,
    resetSafetyCutoff
  } = useMeter();

  const isSafetyTripped = meterData.voltage_cutoff_tripped || meterData.bill_cutoff_tripped;
  const isTampered = meterData.is_tampered || meterData.tamper_locked;

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      
      {/* 1. Tamper Alert Notice (if latched) */}
      <QuickTamperUnlockCard />

      {/* 2. Safety Trip Alert Banner (Compact iOS Banner) */}
      {isSafetyTripped && (
        <div className="rounded-2xl p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight">
                {meterData.voltage_cutoff_tripped
                  ? `Overvoltage Cutoff (${meterData.voltage.toFixed(0)}V > ${meterData.max_voltage_limit}V)`
                  : 'Monthly Budget Limit Exceeded'}
              </h4>
              <span className="text-[11px] text-rose-600/80 dark:text-rose-400">Power isolated for appliance protection</span>
            </div>
          </div>

          <button
            onClick={resetSafetyCutoff}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* 3. Hero Active Power & Contactor Switch (Flexible Watts / kW) */}
      <CurrentPowerCard />

      {/* 4. Prepaid Balance & Quick Recharge */}
      <WalletCard />

      {/* 5. 4-Squircle Quick Actions (Icon-First) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('wallet')}
          className="glass-card p-3 flex flex-col items-center justify-center text-center group hover:border-[#ff5b26]/50 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#ff5b26]/12 text-[#ff5b26] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-2xs">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-neutral-200">
            Top Up
          </span>
        </button>

        <button
          onClick={() => setActiveTab('energy')}
          className="glass-card p-3 flex flex-col items-center justify-center text-center group hover:border-[#0284c7]/50 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0284c7]/15 text-[#0284c7] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-2xs">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-neutral-200">
            Analytics
          </span>
        </button>

        <button
          onClick={() => setActiveTab('share')}
          className="glass-card p-3 flex flex-col items-center justify-center text-center group hover:border-purple-500/50 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-2xs">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-neutral-200">
            Share
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`glass-card p-3 flex flex-col items-center justify-center text-center group transition-all cursor-pointer ${
            isSafetyTripped || isTampered
              ? 'border-rose-500/40 bg-rose-500/5'
              : 'hover:border-slate-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-2xs ${
            isSafetyTripped || isTampered
              ? 'bg-rose-500/15 text-rose-600'
              : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isSafetyTripped || isTampered ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-neutral-200">
            Safety
          </span>
        </button>
      </div>

      {/* 6. Today's Consumption & Monthly Budget */}
      <BudgetSnapshotCard />

      {/* 7. Live Energy Flow Diagram */}
      <EnergyFlowDiagram />

      {/* 8. Siri / Dynamic Island Style AI Assistant Trigger */}
      <button
        onClick={() => setActiveTab('ai')}
        className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#ff5b26]/10 via-white to-sky-500/10 dark:from-[#ff5b26]/15 dark:via-neutral-900 dark:to-sky-500/15 border border-slate-200 dark:border-neutral-800 flex items-center justify-between transition-all hover:border-[#ff5b26]/40 shadow-2xs group cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ff5b26] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Ask Voltrix AI Advisor
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff5b26] group-hover:translate-x-0.5 transition-all" />
      </button>

      {/* 9. Recent Transactions (Compact Apple Pay Style) */}
      {walletTransactions.length > 0 && (
        <div className="glass-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Recent Activity
            </h3>
            <button
              onClick={() => setActiveTab('wallet')}
              className="text-xs font-bold text-[#ff5b26] hover:underline cursor-pointer"
            >
              See All
            </button>
          </div>

          <div className="space-y-2">
            {walletTransactions.slice(0, 2).map(tx => (
              <div
                key={tx.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {tx.title || 'Prepaid Units'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tx.timestamp}
                    </span>
                  </div>
                </div>

                <span className="font-black text-slate-900 dark:text-white mono-num">
                  +{formatCurrency(tx.amount_currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
