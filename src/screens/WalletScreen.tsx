import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { WalletCard } from '../components/wallet/WalletCard';
import { FundWalletModal } from '../components/wallet/FundWalletModal';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Zap,
  Check,
  CreditCard
} from 'lucide-react';
import { WalletTransaction } from '../types/meter';

const RECENT_METERS = [
  { id: '1', initials: 'MH', label: 'My Home 1', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: '2', initials: 'MO', label: 'My Office', color: 'bg-orange-100 text-[#ff5b26] border-orange-200' },
  { id: '3', initials: 'M2', label: 'My Home 2', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: '4', initials: 'WS', label: 'Wife Shop', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export const WalletScreen: React.FC = () => {
  const {
    meterData,
    walletTransactions
  } = useMeter();

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const copyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Buy Electricity
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Prepaid balance, Paystack top-up, and 20-digit STS tokens
          </p>
        </div>

        <button
          onClick={() => setIsFundModalOpen(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buy Light</span>
        </button>
      </div>

      {/* Recent Added Meters Carousel (Reference Design Pattern) */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
            Recent Added Meters
          </span>
          <span className="text-xs font-bold text-[#ff5b26] cursor-pointer hover:underline">
            See All
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {RECENT_METERS.map(m => (
            <button
              key={m.id}
              onClick={() => setIsFundModalOpen(true)}
              className="flex flex-col items-center gap-1.5 text-center group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border shadow-2xs group-hover:scale-105 transition-transform ${m.color}`}>
                {m.initials}
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 truncate w-full">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Active Balance Card */}
      <WalletCard />

      {/* Quick Paystack Gateway Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-[#ff5b26]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#ff5b26] text-white shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              Instant Paystack Checkout
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Tariff: ₦{meterData.tariff_rate}/kWh · Generates official 20-digit STS token
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFundModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04818] text-white text-xs font-bold shadow-xs transition-all"
        >
          Fund Now
        </button>
      </div>

      {/* Transaction & Token History */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Transactions & STS Tokens
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">{walletTransactions.length} records</span>
        </div>

        <div className="space-y-2.5">
          {walletTransactions.map((tx: WalletTransaction) => {
            const isFunding = tx.type === 'funding';
            const isShared = tx.type === 'shared_sent';

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl ${
                        isFunding
                          ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                          : isShared
                          ? 'bg-sky-500/12 text-sky-600 dark:text-sky-400'
                          : 'bg-amber-500/12 text-amber-600 dark:text-amber-400'
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
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                        {tx.timestamp} · {tx.description}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-black mono-num block ${
                      isFunding ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-neutral-200'
                    }`}>
                      {isFunding ? '+' : '-'}
                      {meterData.currency_symbol}
                      {tx.amount_currency.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-bold capitalize">
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* 20-digit STS Token Copy Block if available */}
                {tx.token_number && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">STS Token:</span>
                      <span className="font-mono font-bold text-[#ff5b26] tracking-wider select-all">
                        {tx.token_number}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToken(tx.id, tx.token_number!)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      title="Copy Token"
                    >
                      {copiedTokenId === tx.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Funding Modal Sheet */}
      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </div>
  );
};
