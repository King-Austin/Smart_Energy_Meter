import React from 'react';
import { useMeter } from '../context/MeterContext';
import { EnergyFlowDiagram } from '../components/home/EnergyFlowDiagram';
import { CurrentPowerCard } from '../components/home/CurrentPowerCard';
import { WalletCard } from '../components/wallet/WalletCard';
import { EnergyTodayCard } from '../components/home/EnergyTodayCard';
import { LiveElectricalCard } from '../components/home/LiveElectricalCard';
import {
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  Activity
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { setActiveTab, walletTransactions, meterData, resetSafetyCutoff } = useMeter();

  const isSafetyTripped = meterData.voltage_cutoff_tripped || meterData.bill_cutoff_tripped;

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      
      {/* 1. Primary Active Balance Hero Card */}
      <WalletCard />

      {/* 2. Safety Trip Alert Banner (Shown when Voltage or Bill Cap is Tripped) */}
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
                  : `Monthly Budget Limit Exceeded (₦${meterData.estimated_cost_today.toLocaleString()} > ₦${meterData.bill_limit_threshold.toLocaleString()})`}
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

      {/* 3. Quick Action 3-Card Grid */}
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
          className="glass-card p-3 flex flex-col items-center justify-center text-center group hover:border-slate-300 dark:hover:border-neutral-700 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            View Usage
          </span>
          <span className="text-[10px] text-slate-500 dark:text-neutral-400">
            Analytics
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`glass-card p-3 flex flex-col items-center justify-center text-center group transition-all ${
            isSafetyTripped
              ? 'border-rose-500/40 bg-rose-500/5'
              : 'hover:border-slate-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform ${
            isSafetyTripped
              ? 'bg-rose-500/15 text-rose-600'
              : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isSafetyTripped ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            Safety Cutoffs
          </span>
          <span className={`text-[10px] font-bold ${
            isSafetyTripped ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isSafetyTripped ? 'Tripped' : 'Protected'}
          </span>
        </button>
      </div>

      {/* 4. Real Protective Cutoff Status Bar */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ff5b26]" />
          <span className="font-semibold text-slate-700 dark:text-neutral-300">
            Active Guard Limits
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-neutral-400">
          <span className="bg-slate-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md font-bold">
            Max {meterData.max_voltage_limit}V
          </span>
          <span className="bg-slate-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md font-bold">
            Cap ₦{meterData.bill_limit_threshold.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 5. Live Power Gauge (Instant hardware reading) */}
      <CurrentPowerCard />

      {/* 6. Live Power Distribution Topology (Grid Synced) */}
      <EnergyFlowDiagram />

      {/* 7. Today's Energy & Cost Breakdown */}
      <EnergyTodayCard />

      {/* 8. Grid & Hardware Live Electrical Parameters */}
      <LiveElectricalCard />

      {/* 9. Recent Purchase & Activity Ledger */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Purchase History
            </h3>
          </div>

          <button
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1 text-xs font-bold text-[#ff5b26] hover:text-[#e04818] transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {walletTransactions.slice(0, 3).map(tx => (
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
                    {tx.title || 'Ikeja Electric (Prepaid)'}
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
