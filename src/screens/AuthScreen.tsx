import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import {
  Zap,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Home
} from 'lucide-react';

type AuthStep = 'welcome' | 'signin' | 'register' | 'otp' | 'add_meter' | 'meter_success';

export const AuthScreen: React.FC = () => {
  const { login } = useMeter();
  const [step, setStep] = useState<AuthStep>('welcome');
  const [emailOrPhone, setEmailOrPhone] = useState('austin@meterenergy.io');
  const [password, setPassword] = useState('••••••••');
  const [otpCode, setOtpCode] = useState(['4', '8', '2', '1', '9', '0']);
  
  // Meter Setup State
  const [meterId, setMeterId] = useState('MTR-8A24-19F2');
  const [meterName, setMeterName] = useState('My Home');
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [isConnectingMeter, setIsConnectingMeter] = useState(false);

  const handleSimulateScan = () => {
    setIsScanningQR(true);
    setTimeout(() => {
      setIsScanningQR(false);
      setMeterId('MTR-8A24-19F2');
    }, 1500);
  };

  const handleConnectMeter = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingMeter(true);
    setTimeout(() => {
      setIsConnectingMeter(false);
      setStep('meter_success');
    }, 1500);
  };

  const handleFinishSetup = () => {
    login(meterName, meterId);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-neutral-950 text-neutral-100 animate-fade-in">
      
      {/* ====================================================================
          1. WELCOME ONBOARDING SCREEN (PRD Section 4)
         ==================================================================== */}
      {step === 'welcome' && (
        <div className="flex-1 flex flex-col justify-between py-12">
          {/* Top Logo */}
          <div className="text-center pt-8">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-6 shadow-glow">
              <Zap className="w-8 h-8" />
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
              Meter
            </h1>
            <p className="text-sm text-neutral-400 max-w-xs mx-auto mt-3 leading-relaxed">
              Know your energy. Understand your usage. Share when needed.
            </p>
          </div>

          {/* Value Pillars */}
          <div className="space-y-3 max-w-xs mx-auto w-full my-6 text-xs text-neutral-300">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
              <span>Real-time whole-house electricity consumption</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0"></div>
              <span>Accurate bill estimates & peak trends</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></div>
              <span>Cloud-synchronized energy sharing with peers</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 w-full max-w-sm mx-auto">
            <button
              onClick={() => setStep('register')}
              className="btn-primary w-full py-3.5 text-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setStep('signin')}
              className="btn-secondary w-full py-3 text-xs"
            >
              <span>Sign In to Existing Account</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          2. SIGN IN / REGISTER FLOW
         ==================================================================== */}
      {(step === 'signin' || step === 'register') && (
        <div className="flex-1 flex flex-col justify-between py-6">
          <div>
            <button
              onClick={() => setStep('welcome')}
              className="text-xs text-neutral-400 hover:text-white mb-6"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold font-display text-white">
              {step === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 mb-6">
              {step === 'signin'
                ? 'Sign in to access your whole-house Meter telemetry'
                : 'Register to connect and monitor your smart electrical meter'}
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                setStep('otp');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Email Address or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 text-sm text-neutral-100 border border-neutral-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 text-sm text-neutral-100 border border-neutral-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="btn-primary w-full py-3.5 text-xs font-semibold"
                >
                  <span>{step === 'signin' ? 'Sign In' : 'Continue to Verification'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="text-center text-xs text-neutral-500 pt-6">
            {step === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setStep('register')}
                  className="text-emerald-400 font-semibold underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setStep('signin')}
                  className="text-emerald-400 font-semibold underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          3. OTP VERIFICATION CODE SCREEN
         ==================================================================== */}
      {step === 'otp' && (
        <div className="flex-1 flex flex-col justify-between py-6">
          <div>
            <button
              onClick={() => setStep('signin')}
              className="text-xs text-neutral-400 hover:text-white mb-6"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold font-display text-white">
              Verification Code
            </h2>
            <p className="text-xs text-neutral-400 mt-1 mb-8">
              We sent a 6-digit code to <span className="text-neutral-200">{emailOrPhone}</span>
            </p>

            {/* OTP Boxes */}
            <div className="flex justify-between gap-2 max-w-xs mx-auto mb-8">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const newOtp = [...otpCode];
                    newOtp[idx] = e.target.value;
                    setOtpCode(newOtp);
                  }}
                  className="w-11 h-13 text-center text-lg font-bold rounded-xl bg-neutral-900 border border-neutral-700 focus:outline-none focus:border-emerald-500 text-emerald-400 mono-num"
                />
              ))}
            </div>

            <button
              onClick={() => setStep('add_meter')}
              className="btn-primary w-full py-3.5 text-xs font-semibold"
            >
              <span>Verify & Continue to Device Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center text-xs text-neutral-500">
            Didn't receive code?{' '}
            <button className="text-emerald-400 underline">Resend Code</button>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. ADD A METER DEVICE (PRD Section 6)
         ==================================================================== */}
      {step === 'add_meter' && (
        <div className="flex-1 flex flex-col justify-between py-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-white">
              Connect Your Meter
            </h2>
            <p className="text-xs text-neutral-400 mt-1 mb-6">
              Scan the QR code printed on the physical enclosure or enter the Meter ID manually.
            </p>

            {/* QR Scanner Simulator */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-center mb-5 relative overflow-hidden">
              {isScanningQR ? (
                <div className="py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto"></div>
                  <p className="text-xs text-emerald-400 font-semibold">
                    Reading QR Code Optical Pattern...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-24 h-24 rounded-2xl bg-neutral-950 border border-neutral-700 mx-auto flex items-center justify-center relative group">
                    <QrCode className="w-12 h-12 text-emerald-400" />
                    {/* Viewfinder corners */}
                    <div className="absolute inset-1 border-2 border-emerald-500/40 rounded-xl pointer-events-none"></div>
                  </div>
                  <button
                    onClick={handleSimulateScan}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    <span>Simulate Scan Enclosure QR</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Form */}
            <form onSubmit={handleConnectMeter} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Meter Hardware ID
                </label>
                <input
                  type="text"
                  required
                  value={meterId}
                  onChange={e => setMeterId(e.target.value)}
                  placeholder="e.g. MTR-8A24-19F2"
                  className="w-full p-3 rounded-xl bg-neutral-900 text-sm text-emerald-400 font-mono border border-neutral-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Friendly Property Name
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={meterName}
                    onChange={e => setMeterName(e.target.value)}
                    placeholder="e.g. My Home, Main House, Shop"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 text-sm text-neutral-100 border border-neutral-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-2 pt-1">
                {['My Home', 'Apartment', 'Shop', 'Office'].map(name => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => setMeterName(name)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isConnectingMeter}
                  className="btn-primary w-full py-3.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  {isConnectingMeter ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                      <span>Connecting to your Meter...</span>
                    </>
                  ) : (
                    <>
                      <span>Pair & Validate Cloud Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. METER CONNECTED SUCCESS SCREEN
         ==================================================================== */}
      {step === 'meter_success' && (
        <div className="flex-1 flex flex-col justify-between py-12 text-center animate-fade-in">
          <div className="pt-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6 shadow-glow">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-extrabold font-display text-white">
              Meter Connected!
            </h2>
            <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto">
              Your hardware has successfully established telemetry synchronization with the cloud backend.
            </p>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 max-w-xs mx-auto mt-6 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Device Name:</span>
                <span className="font-bold text-neutral-200">{meterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Meter ID:</span>
                <span className="font-mono text-emerald-400">{meterId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Firmware:</span>
                <span className="text-neutral-300">v1.0.4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cloud Link:</span>
                <span className="text-emerald-400 font-semibold">Online & Synchronized</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleFinishSetup}
            className="btn-primary w-full max-w-sm mx-auto py-3.5 text-xs font-semibold"
          >
            <span>Enter Meter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
