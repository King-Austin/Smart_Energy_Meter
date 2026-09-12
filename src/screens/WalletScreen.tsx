import React from 'react';

import { useMeter } from '../context/MeterContext';
import { WalletCard } from '../components/wallet/WalletCard';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { WalletTransaction } from '../types/meter';

export const WalletScreen: React.FC = () => {
  const {
    meterData,
    walletTransactions
  } = useMeter();

  return (
    <div className="space-y-4 pb-12 animate-fade-in max-w-2xl mx-auto">
      
      {/* Minimalist Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Prepaid Electricity
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Smart energy balance & direct recharge history
          </p>
        </div>
      </div>

      {/* Main Centerpiece Balance Card with Single Prominent CTA */}
      <WalletCard />

      {/* Recharge & Transaction History (No STS Token Boxes) */}
      <div className="glass-card p-4 sm:p-5 border-slate-200/80 dark:border-neutral-800/80">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Recharge History
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
            {walletTransactions.length} records
          </span>
        </div>

        {walletTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs italic">
            No recharge history yet. Units will appear here upon payment.
          </div>
        ) : (
          <div className="space-y-2.5">
            {walletTransactions.map((tx: WalletTransaction) => {
              const isFunding = tx.type === 'funding';
              const isShared = tx.type === 'shared_sent';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isFunding
                          ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isShared
                          ? 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isFunding ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isShared ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <Zap className="w-4 h-4 fill-current" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {tx.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        {tx.timestamp} • {tx.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black mono-num block ${
                      isFunding ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-neutral-200'
                    }`}>
                      {isFunding ? '+' : '-'}
                      {meterData.currency_symbol}
                      {tx.amount_currency.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold capitalize bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {tx.status}
                    </span>
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
