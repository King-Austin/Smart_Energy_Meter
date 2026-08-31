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
  RefreshCw,
  Zap
} from 'lucide-react';
import { WalletTransaction } from '../types/meter';

export const WalletScreen: React.FC = () => {
  const {
    meterData,
    walletTransactions,
    toggleAutoTopup,
    setAutoTopupThreshold
  } = useMeter();

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [selectedThreshold, setSelectedThreshold] = useState(meterData.auto_topup_threshold);

  const copyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token.replace(/-/g, ''));
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  return (
    <div className="space-y-4 pb-8 animate-fade-in text-neutral-100">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-display">
            Energy Wallet
          </h2>
          <p className="text-xs text-neutral-400">
            Prepaid balance, tokens, and auto-recharge settings
          </p>
        </div>

        <button
          onClick={() => setIsFundModalOpen(true)}
          className="btn-primary text-xs py-2 px-3 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Top Up</span>
        </button>
      </div>

      {/* Main Apple Wallet Style Card */}
      <WalletCard />

      {/* Auto-Recharge Rules Card */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Smart Auto-Recharge
              </h3>
              <p className="text-[11px] text-neutral-400">
                Never run out of power unexpectedly
              </p>
            </div>
          </div>

          <button
            onClick={toggleAutoTopup}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              meterData.auto_topup_enabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
          >
            {meterData.auto_topup_enabled ? 'Active' : 'Disabled'}
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Recharge Trigger Threshold:</span>
            <span className="font-bold text-white mono-num">
              Below {meterData.currency_symbol}{selectedThreshold.toLocaleString()}
            </span>
          </div>

          {/* Threshold presets */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1000, 2000, 5000].map(val => (
              <button
                key={val}
                onClick={() => {
                  setSelectedThreshold(val);
                  setAutoTopupThreshold(val);
                }}
                className={`py-1.5 rounded-xl font-semibold text-[11px] border transition-all ${
                  selectedThreshold === val
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                {meterData.currency_symbol}{val.toLocaleString()}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-neutral-500 pt-1">
            When your meter drops below this balance, the cloud automatically purchases a ₦5,000 token using your default card.
          </p>
        </div>
      </div>

      {/* Transaction & Token History (PRD Section 45) */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Transactions & Tokens
            </h3>
          </div>
          <span className="text-xs text-neutral-400">{walletTransactions.length} records</span>
        </div>

        <div className="space-y-2.5">
          {walletTransactions.map((tx: WalletTransaction) => {
            const isFunding = tx.type === 'funding';
            const isShared = tx.type === 'shared_sent';

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl ${
                        isFunding
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isShared
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {isFunding ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isShared ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {tx.title}
                      </h4>
                      <span className="text-[10px] text-neutral-400">
                        {tx.timestamp} · {tx.description}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold mono-num block ${
                      isFunding ? 'text-emerald-400' : 'text-neutral-200'
                    }`}>
                      {isFunding ? '+' : '-'}
                      {meterData.currency_symbol}
                      {tx.amount_currency.toLocaleString()}
                    </span>
                    {tx.units_kwh && (
                      <span className="text-[10px] text-neutral-400">
                        {tx.units_kwh} kWh
                      </span>
                    )}
                  </div>
                </div>

                {/* If there is a 20-digit token */}
                {tx.token_number && (
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-500">Token:</span>
                      <span className="font-mono text-emerald-400 font-bold tracking-wider">
                        {tx.token_number}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToken(tx.id, tx.token_number!)}
                      className="text-neutral-400 hover:text-white p-1"
                      title="Copy Token"
                    >
                      {copiedTokenId === tx.id ? (
                        <span className="text-[10px] text-emerald-400 font-bold">Copied</span>
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

      {/* Fund Modal */}
      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />

    </div>
  );
};
