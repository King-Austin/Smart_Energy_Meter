import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import {
  X,
  CreditCard,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Building2,
  Copy
} from 'lucide-react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({ isOpen, onClose }) => {
  const { meterData, fundWallet } = useMeter();

  const [amount, setAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const unitsCredited = Number((amount / meterData.tariff_rate).toFixed(1));

  const handleFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      const generatedToken = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
        1000 + Math.random() * 9000
      )}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

      fundWallet(amount, paymentMethod, generatedToken);
      setIsProcessing(false);
      setSuccessToken(generatedToken);
    }, 1200);
  };

  const copyToken = () => {
    if (successToken) {
      navigator.clipboard.writeText(successToken.replace(/-/g, ''));
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-[440px] bg-neutral-900 dark:bg-neutral-950 text-white rounded-t-[32px] sm:rounded-[32px] border border-neutral-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        
        {/* iOS Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mb-4 sm:hidden"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">Fund Energy Wallet</h3>
              <p className="text-[11px] text-neutral-400">
                Instant electricity token recharge for {meterData.meter_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {successToken ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-glow">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-extrabold font-display text-white">
                Wallet Credited!
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                {meterData.currency_symbol}
                {amount.toLocaleString()} has been added (+{unitsCredited} kWh units)
              </p>
            </div>

            {/* Meter Token Box */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                20-Digit STS Meter Token
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                  {successToken}
                </span>
                <button
                  onClick={copyToken}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Token auto-synced with Meter {meterData.meter_id} via Cloud.
              </p>
            </div>

            <button
              onClick={() => {
                setSuccessToken(null);
                onClose();
              }}
              className="btn-primary w-full py-3.5 text-xs font-semibold"
            >
              <span>Done</span>
            </button>
          </div>
        ) : (
          /* Funding Input Form */
          <form onSubmit={handleFund} className="space-y-4 pt-4 text-xs">
            
            {/* Amount Presets (Apple Pay Style) */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-2">
                Select Recharge Amount
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[2000, 5000, 10000, 20000].map(val => {
                  const kwh = (val / meterData.tariff_rate).toFixed(0);
                  const isSelected = amount === val;
                  return (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                          : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="text-sm font-bold text-white block mono-num">
                        {meterData.currency_symbol}
                        {val.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        +{kwh} kWh units
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">
                Or Enter Custom Amount ({meterData.currency_symbol})
              </label>
              <input
                type="number"
                min="500"
                step="500"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full p-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-white font-bold text-base mono-num focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-neutral-300 font-medium">Credited Units</span>
              </div>
              <span className="text-sm font-bold text-emerald-400 mono-num">
                +{unitsCredited} kWh
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-neutral-400 font-semibold mb-2">
                Payment Method
              </label>
              <div className="space-y-2">
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-emerald-500 bg-neutral-800'
                      : 'border-neutral-800 bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-bold text-white block">Debit / Credit Card</span>
                      <span className="text-[10px] text-neutral-400">Visa, Mastercard, Verve</span>
                    </div>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border ${paymentMethod === 'card' ? 'border-4 border-emerald-400 bg-neutral-950' : 'border-neutral-600'}`}></span>
                </div>

                <div
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'apple_pay'
                      ? 'border-emerald-500 bg-neutral-800'
                      : 'border-neutral-800 bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-neutral-200" />
                    <div>
                      <span className="font-bold text-white block">Apple Pay / Instant Checkout</span>
                      <span className="text-[10px] text-neutral-400">Fast 1-touch biometric auth</span>
                    </div>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border ${paymentMethod === 'apple_pay' ? 'border-4 border-emerald-400 bg-neutral-950' : 'border-neutral-600'}`}></span>
                </div>

                <div
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-emerald-500 bg-neutral-800'
                      : 'border-neutral-800 bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white block">Bank Transfer / USSD</span>
                      <span className="text-[10px] text-neutral-400">Instant dedicated account</span>
                    </div>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border ${paymentMethod === 'transfer' ? 'border-4 border-emerald-400 bg-neutral-950' : 'border-neutral-600'}`}></span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing || amount <= 0}
                className="btn-primary w-full py-3.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                    <span>Processing Secure Recharge...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      Pay {meterData.currency_symbol}
                      {amount.toLocaleString()} & Generate Token
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
