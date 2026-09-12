import React, { useState, useEffect } from 'react';
import { useMeter } from '../../context/MeterContext';
import { loadPaystackScript } from '../../services/paymentService';
import {
  X,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Calculator,
  ArrowRight,
  CreditCard,
  Key,
  ChevronDown,
  Lock,
  Sparkles
} from 'lucide-react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({ isOpen, onClose }) => {
  const { meterData, fundWalletWithPaystack } = useMeter();

  const [amount, setAmount] = useState<number>(5000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [creditedUnits, setCreditedUnits] = useState<number>(0);
  const [newMeterUnits, setNewMeterUnits] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Paystack Key State (defaults to test key, user can input custom key)
  const defaultKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_5f1c91e190d20311b19a5158002dc747912e534a';
  const [customPaystackKey, setCustomPaystackKey] = useState<string>(defaultKey);
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);

  // Simulated Paystack Interactive Checkout Modal State
  const [showSimulatedCheckout, setShowSimulatedCheckout] = useState<boolean>(false);
  const [simCardNumber] = useState<string>('4084 0841 1111 1111');
  const [simExpiry] = useState<string>('08/28');
  const [simCvv] = useState<string>('824');
  const [simOtp, setSimOtp] = useState<string>('123456');
  const [simStep, setSimStep] = useState<'card' | 'otp' | 'processing'>('card');

  useEffect(() => {
    if (isOpen) {
      loadPaystackScript();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tariff = meterData.tariff_rate > 0 ? meterData.tariff_rate : 160.0;
  const unitsCredited = Number((amount / tariff).toFixed(2));

  const handleStartCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    setErrorMessage(null);

    const paystackPop = (window as any).PaystackPop;
    const isTestKeyValid = customPaystackKey.trim().startsWith('pk_test_');

    // If user provided a valid test key and PaystackPop is available, open real Paystack
    if (isTestKeyValid && paystackPop && typeof paystackPop.setup === 'function') {
      setIsProcessing(true);
      try {
        const handler = paystackPop.setup({
          key: customPaystackKey.trim(),
          email: 'energy.meter@voltrix.internal',
          amount: Math.round(amount * 100),
          currency: 'NGN',
          ref: `PST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          callback_url: window.location.origin,
          metadata: {
            custom_fields: [
              { display_name: 'Meter ID', variable_name: 'meter_id', value: meterData.meter_id },
              { display_name: 'Units Credited (kWh)', variable_name: 'units_kwh', value: unitsCredited.toString() },
              { display_name: 'Tariff Rate (NGN/kWh)', variable_name: 'tariff_rate', value: tariff.toString() }
            ]
          },
          callback: async (response: any) => {
            console.log('Paystack payment complete:', response);
            await completeCredit();
          },
          onClose: () => {
            setIsProcessing(false);
          }
        });
        handler.openIframe();
      } catch (err: any) {
        console.warn('Fallback to interactive simulation:', err);
        setIsProcessing(false);
        setSimStep('card');
        setShowSimulatedCheckout(true);
      }
    } else {
      // Launch Interactive Authentic Paystack Test Simulation
      setSimStep('card');
      setShowSimulatedCheckout(true);
    }
  };

  const completeCredit = async () => {
    setIsProcessing(true);
    const res = await fundWalletWithPaystack(amount);
    setIsProcessing(false);
    setShowSimulatedCheckout(false);

    if (res.success) {
      setCreditedUnits(res.units);
      setNewMeterUnits(res.newBalanceUnits ?? 0);
      setPaymentSuccess(true);
    } else {
      setErrorMessage(res.error || 'Failed to credit meter hardware.');
    }
  };

  const handleSimulateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSimStep('otp');
  };

  const handleSimulateOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimStep('processing');
    setTimeout(async () => {
      await completeCredit();
    }, 1200);
  };

  const handleClose = () => {
    setPaymentSuccess(false);
    setErrorMessage(null);
    setShowSimulatedCheckout(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#151b25] text-slate-900 dark:text-white rounded-t-[32px] sm:rounded-[32px] border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up relative">
        
        {/* iOS Grab Handle */}
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700 mx-auto mb-4 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#ff5b26]/12 text-[#ff5b26]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Recharge Electricity</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Direct smart meter top-up • {meterData.meter_name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Direct Credit Success Screen (NO STS TOKEN REQUIRED) */}
        {paymentSuccess ? (
          <div className="py-5 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Recharge Successful!
              </h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Units have been credited directly to your smart meter hardware in real time.
              </p>
            </div>

            {/* Smart Meter Credit Hero Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#fff6f2] to-amber-500/5 dark:from-[#26150f] dark:to-neutral-900 border border-[#ff5b26]/25 text-center space-y-1.5 shadow-xs">
              <span className="text-[11px] uppercase font-black tracking-wider text-[#ff5b26] block">
                Units Added to Smart Meter
              </span>
              <div className="text-4xl font-black text-slate-950 dark:text-white mono-num">
                +{creditedUnits || unitsCredited} <span className="text-lg font-bold text-slate-500">kWh</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero STS Tokens Required • Meter Armed</span>
              </p>
            </div>

            {/* Receipt Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 text-xs text-slate-600 dark:text-neutral-400 space-y-2 border border-slate-200/70 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span>Meter ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{meterData.meter_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold text-slate-900 dark:text-white mono-num">₦{amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tariff Applied:</span>
                <span className="font-semibold text-slate-700 dark:text-neutral-300 mono-num">₦{tariff}/kWh</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-neutral-800 pt-2">
                <span className="font-bold text-slate-900 dark:text-white">New Balance:</span>
                <span className="font-black text-slate-950 dark:text-white mono-num text-sm text-emerald-600 dark:text-emerald-400">
                  {newMeterUnits > 0 ? newMeterUnits.toFixed(2) : Number(meterData.prepaid_units_kwh).toFixed(2)} kWh
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="btn-primary w-full py-3.5 text-xs font-bold rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Done</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : showSimulatedCheckout ? (
          /* 2. Authentic Interactive Paystack Test Simulation Modal */
          <div className="py-4 space-y-4 animate-fade-in">
            {/* Paystack Header */}
            <div className="p-3 rounded-2xl bg-[#09a5db]/10 border border-[#09a5db]/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#09a5db] text-white flex items-center justify-center font-bold text-xs">
                  P
                </div>
                <div>
                  <div className="font-bold text-[#09a5db]">Paystack Checkout (Test Mode)</div>
                  <div className="text-[10px] text-slate-400">energy.meter@voltrix.internal</div>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                ₦{amount.toLocaleString()}
              </span>
            </div>

            {simStep === 'card' && (
              <form onSubmit={handleSimulateCardSubmit} className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-neutral-400">
                    <span>Card Details (Pre-filled Test Card)</span>
                    <CreditCard className="w-4 h-4 text-[#09a5db]" />
                  </div>
                  <input
                    type="text"
                    value={simCardNumber}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono text-xs font-bold text-slate-800 dark:text-neutral-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={simExpiry}
                      readOnly
                      className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono text-xs text-slate-800 dark:text-neutral-200"
                    />
                    <input
                      type="text"
                      value={simCvv}
                      readOnly
                      className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono text-xs text-slate-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#09a5db] hover:bg-[#088ec0] text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorize ₦{amount.toLocaleString()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSimulatedCheckout(false)}
                  className="w-full py-2 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel Transaction
                </button>
              </form>
            )}

            {simStep === 'otp' && (
              <form onSubmit={handleSimulateOtpSubmit} className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-center space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                    Bank OTP Verification
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    A test verification code has been sent. Use test PIN:
                  </p>
                  <input
                    type="text"
                    value={simOtp}
                    onChange={(e) => setSimOtp(e.target.value)}
                    className="w-36 text-center tracking-widest font-mono text-lg font-black py-2 rounded-xl bg-white dark:bg-neutral-800 border border-[#09a5db] text-slate-900 dark:text-white mx-auto block"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Submit OTP & Credit +{unitsCredited} kWh</span>
                </button>
              </form>
            )}

            {simStep === 'processing' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#09a5db] border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                  Authorizing with Paystack & Synchronizing IoT Meter...
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 3. Recharge Input & Dynamic Unit Calculation Form */
          <form onSubmit={handleStartCheckout} className="space-y-4 pt-4 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs">
                {errorMessage}
              </div>
            )}

            {/* Zero-Token Notice Banner */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-tight">
                <strong>Zero STS Tokens:</strong> Units credit automatically to your smart meter in real time upon payment confirmation.
              </p>
            </div>

            {/* Quick Amount Presets */}
            <div>
              <label className="block text-slate-700 dark:text-neutral-300 font-bold mb-2">
                Select Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1000, 2000, 5000, 10000].map(val => {
                  const isSelected = amount === val;
                  return (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2.5 px-1 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#ff5b26] bg-[#ff5b26] text-white shadow-xs'
                          : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                      }`}
                    >
                      <span>₦{val.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-slate-700 dark:text-neutral-300 font-bold mb-1">
                Or Custom Amount ({meterData.currency_symbol})
              </label>
              <input
                type="number"
                min="200"
                step="100"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white font-black text-lg mono-num focus:outline-none focus:border-[#ff5b26]"
              />
            </div>

            {/* Dynamic Tariff Formula Conversion Card */}
            <div className="p-3.5 rounded-2xl bg-[#fff6f2] dark:bg-[#26150f] border border-[#ff5b26]/25 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#ff5b26]" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                    Units Computed
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#ff5b26]">
                  ₦{tariff}/kWh
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 text-center font-mono text-xs text-slate-800 dark:text-neutral-200 font-bold">
                ₦{amount.toLocaleString()} ÷ ₦{tariff} = <span className="text-[#ff5b26] font-black text-sm">+{unitsCredited} kWh</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
                <span>Direct Smart Meter Credit</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">No token entry needed</span>
              </div>
            </div>

            {/* Paystack Test Key Config Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowKeyConfig(prev => !prev)}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-neutral-200 flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Paystack Test Mode Config</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showKeyConfig ? 'rotate-180' : ''}`} />
              </button>

              {showKeyConfig && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Paystack Test Public Key
                  </label>
                  <input
                    type="text"
                    value={customPaystackKey}
                    onChange={(e) => setCustomPaystackKey(e.target.value)}
                    placeholder="pk_test_..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-[11px] font-mono focus:outline-none focus:border-[#ff5b26]"
                  />
                  <p className="text-[10px] text-slate-400">
                    You can paste your personal Paystack test key here or use the built-in simulator.
                  </p>
                </div>
              )}
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary w-full py-4 text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isProcessing
                  ? 'Connecting Gateway...'
                  : `Pay ₦${amount.toLocaleString()} • Add +${unitsCredited} kWh`}
              </span>
            </button>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant real-time balance update via Voltrix Cloud</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
