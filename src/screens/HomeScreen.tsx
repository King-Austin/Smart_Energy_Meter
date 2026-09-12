import React from 'react';
import { useMeter } from '../context/MeterContext';
import { EnergyFlowDiagram } from '../components/home/EnergyFlowDiagram';
import { CurrentPowerCard } from '../components/home/CurrentPowerCard';
import { WalletCard } from '../components/wallet/WalletCard';
import { EnergyTodayCard } from '../components/home/EnergyTodayCard';
import { LiveElectricalCard } from '../components/home/LiveElectricalCard';
import { BudgetSnapshotCard } from '../components/home/BudgetSnapshotCard';
import { QuickTamperUnlockCard } from '../components/home/QuickTamperUnlockCard';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  Activity,
  Sparkles
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    setActiveTab,
    walletTransactions,
    meterData,
    resetSafetyCutoff,
    setIsAIAssistantOpen
  } = useMeter();

  const isSafetyTripped = meterData.voltage_cutoff_tripped || meterData.bill_cutoff_tripped;
  const isTampered = meterData.is_tampered || meterData.tamper_locked;

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      
      {/* 1. Quick Tamper Unlock & Load Reconnect (High Priority) */}
      <QuickTamperUnlockCard />

      {/* 2. Primary Active Balance Hero Card */}
      <WalletCard />

      {/* 3. Monthly Budget Milestone Snapshot Card */}
      <BudgetSnapshotCard />

      {/* 4. Safety Trip Alert Banner (Overvoltage / Bill cap) */}
      {isSafetyTripped && (
        <div className="rounded-2xl p-4 bg-rose-500/10 border-2 border-rose-500 text-rose-700 dark:text-rose-300 shadow-md animate-bounce-short">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-tight">
                {meterData.voltage_cutoff_tripped
                  ? `Overvoltage Protection Tripped (${meterData.voltage.toFixed(1)}V > ${meterData.max_voltage_limit}V)`
                  : `Monthly Spend Threshold Exceeded (₦${meterData.estimated_cost_today.toLocaleString()} > ₦${meterData.bill_limit_threshold.toLocaleString()})`}
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-1 leading-relaxed">
                The safety contactor automatically disconnected the supply to protect your building appliances.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={resetSafetyCutoff}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset & Re-arm Contactor</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-200 text-xs font-semibold transition-colors"
                >
                  Adjust Thresholds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Quick Action Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setActiveTab('wallet')}
          className="glass-card p-3 flex flex-col items-center justify-center text-center group hover:border-[#ff5b26]/50 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#ff5b26]/12 text-[#ff5b26] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            Buy Units
          </span>
          <span className="text-[10px] text-slate-500 dark:text-neutral-400">
            Top Up
          </span>
        </button>

        <button
          onClick={() => setActiveTab('energy')}
          className="glass-card p-3 flex flex-col items-center justify-center text-center group hover:border-[#0284c7]/50 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0284c7]/15 text-[#0284c7] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            Analytics
          </span>
          <span className="text-[10px] text-slate-500 dark:text-neutral-400">
            Usage & Outages
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`glass-card p-3 flex flex-col items-center justify-center text-center group transition-all ${
            isSafetyTripped || isTampered
              ? 'border-rose-500/40 bg-rose-500/5'
              : 'hover:border-slate-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform ${
            isSafetyTripped || isTampered
              ? 'bg-rose-500/15 text-rose-600'
              : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isSafetyTripped || isTampered ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            Safety Limits
          </span>
          <span className={`text-[10px] font-bold ${
            isSafetyTripped || isTampered ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isTampered ? 'Tampered' : isSafetyTripped ? 'Tripped' : 'Protected'}
          </span>
        </button>
      </div>

      {/* 6. Real Protective Cutoff Status Bar */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ff5b26]" />
          <span className="font-semibold text-slate-700 dark:text-neutral-300">
            Active Guard Limits
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-neutral-400">
          <span className="bg-slate-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md font-bold">
            Max {meterData.max_voltage_limit}V
          </span>
          <span className="bg-slate-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md font-bold">
            Limit {meterData.over_current_limit || 30}A
          </span>
        </div>
      </div>

      {/* 7. Live Instant Power Gauge (PZEM digital reading) */}
      <CurrentPowerCard />

      {/* 8. Live Power Distribution Topology */}
      <EnergyFlowDiagram />

      {/* 9. Today's Energy & Naira Cost Breakdown */}
      <EnergyTodayCard />

      {/* 10. PZEM Live Electrical Telemetry (V, I, PF, Hz, kVA, kVAR) */}
      <LiveElectricalCard />

      {/* 11. Voltrix AI Advisor Chat Trigger */}
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#ff5b26]/8 via-white to-[#0284c7]/8 dark:from-[#ff5b26]/15 dark:via-neutral-900 dark:to-[#0284c7]/15 border border-slate-200 dark:border-neutral-800 hover:border-[#ff5b26]/50 flex items-center justify-between transition-all shadow-2xs group text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ff5b26] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Voltrix AI Advisor
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#ff5b26]/15 text-[#ff5b26]">
                Groq ⚡
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Tap to chat about today's consumption, bill forecast, and outage forensics
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff5b26] group-hover:translate-x-0.5 transition-all" />
      </button>

      {/* 12. Recent Purchase Ledger */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
            Recent Purchases & Tokens
          </h3>

          <button
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1 text-xs font-bold text-[#ff5b26] hover:text-[#e04818] transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {walletTransactions.slice(0, 2).map(tx => (
            <div
              key={tx.id}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {tx.title || 'Prepaid Energy Units'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {tx.timestamp}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-slate-900 dark:text-white block mono-num">
                  {meterData.currency_symbol}{tx.amount_currency.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  • Success
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};
