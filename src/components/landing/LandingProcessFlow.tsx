import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Waves,
  RefreshCw,
  Sparkles,
  Wallet
} from 'lucide-react';

interface LandingProcessFlowProps {
  theme?: 'light' | 'dark';
}

interface ProcessStep {
  stepNumber: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  technicalDetails: string[];
  animationHint: string;
  color: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    stepNumber: '01',
    title: 'True-RMS AC Sensing',
    subtitle: 'High-speed 50Hz continuous sampling',
    badge: 'Hardware Input',
    icon: Waves,
    color: '#38bdf8', // sky
    description:
      'The incoming mains supply passes through the PZEM-004T dedicated analog front-end. Voltage, current, active power, and frequency are sampled simultaneously with zero noise drift.',
    technicalDetails: [
      'True-RMS AC voltage (80V - 260V)',
      '100A current transformer (CT) coil',
      'Modbus-RTU UART2 bidirectional telemetry'
    ],
    animationHint: 'Continuous AC waveform sampling'
  },
  {
    stepNumber: '02',
    title: 'Automatic Surge Defense',
    subtitle: 'Autonomous millisecond appliance protection',
    badge: 'Safety Defense',
    icon: ShieldCheck,
    color: '#ff5b26', // orange
    description:
      'Voltage surges from erratic utility power destroy home electronics in seconds. Voltrix continuously monitors grid stability. If voltage spikes dangerously or your prepaid units run out, the meter safely isolates power in milliseconds to protect your home.',
    technicalDetails: [
      'Sub-second high-voltage surge cutoff',
      'Protects refrigerators, TVs & inverters',
      'Works autonomously even if internet is down'
    ],
    animationHint: 'Instantaneous power protection trigger'
  },
  {
    stepNumber: '03',
    title: 'Tokenless Direct Recharge',
    subtitle: 'No 20-digit STS slips or keypad typing',
    badge: 'IoT Billing',
    icon: Wallet,
    color: '#10b981', // emerald
    description:
      'Pay via Paystack using card, USSD, or bank transfer. The exact kWh is calculated dynamically from the official tariff (₦160/kWh) and credited directly to the smart meter hardware in real time.',
    technicalDetails: [
      'Automatic kWh = Amount / ₦160 formula',
      'Instant cloud IoT balance update',
      'Auto-restores power the second balance is paid'
    ],
    animationHint: 'Instant cloud-to-hardware credit pulse'
  },
  {
    stepNumber: '04',
    title: 'AI Analytics & Consumption Insights',
    subtitle: 'Proactive energy conservation in your pocket',
    badge: 'Cloud Intelligence',
    icon: Sparkles,
    color: '#a855f7', // purple
    description:
      'Live power consumption streams to the mobile and web dashboard. The embedded Voltrix AI Energy Advisor analyzes historical trends to forecast bills and flag power-hungry appliances.',
    technicalDetails: [
      'Real-time power charts (Seconds, Daily, Weekly)',
      'End-of-month budget runaway alerts',
      'Direct natural language energy advice'
    ],
    animationHint: 'Predictive neural forecast generation'
  }
];

export const LandingProcessFlow: React.FC<LandingProcessFlowProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [activeStep, setActiveStep] = useState<number>(0);

  const selectedStep = PROCESS_STEPS[activeStep];

  return (
    <section id="process-flow" className={`max-w-7xl mx-auto px-4 sm:px-8 py-24 border-t transition-colors ${
      isDark ? 'border-white/[0.08] text-slate-100' : 'border-slate-200 text-slate-900'
    }`}>
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${
          isDark
            ? 'bg-[#ff5b26]/10 border-[#ff5b26]/25 text-[#ff7747]'
            : 'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <RefreshCw className="w-3.5 h-3.5 text-[#ff5b26] animate-spin" style={{ animationDuration: '6s' }} />
          <span>Continuous Automated Flow</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          How Voltrix Operates.{' '}
          <span className="bg-gradient-to-r from-[#ff5b26] via-[#ff7e54] to-amber-500 bg-clip-text text-transparent">
            From Grid to Cloud.
          </span>
        </h2>

        <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Four coordinated stages bridge physical high-voltage AC electricity, autonomous edge safety, and instantaneous digital payments without manual friction.
        </p>
      </div>

      {/* 4 Steps Interactive Pipeline Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {PROCESS_STEPS.map((step, idx) => {
          const isActive = idx === activeStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.stepNumber}
              onClick={() => setActiveStep(idx)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isActive
                  ? isDark
                    ? 'bg-white/[0.06] border-[#ff5b26] shadow-lg shadow-[#ff5b26]/10 scale-[1.02]'
                    : 'bg-white border-[#ff5b26] shadow-md shadow-orange-500/10 scale-[1.02]'
                  : isDark
                    ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              {/* Top Accent Indicator */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-opacity"
                style={{
                  backgroundColor: step.color,
                  opacity: isActive ? 1 : 0.2
                }}
              />

              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-mono font-black"
                  style={{ color: isActive ? step.color : isDark ? '#64748b' : '#94a3b8' }}
                >
                  {step.stepNumber}
                </span>
                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                  isActive
                    ? isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-900 text-white border-slate-900'
                    : isDark ? 'bg-white/[0.03] text-slate-500 border-transparent' : 'bg-slate-200 text-slate-600 border-transparent'
                }`}>
                  {step.badge}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${step.color}20`,
                    color: step.color
                  }}
                >
                  <StepIcon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black leading-snug">{step.title}</h4>
              </div>

              <p className={`text-[11px] line-clamp-2 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {step.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Featured Stage Showcase Box */}
      <div className={`rounded-3xl p-6 sm:p-10 border relative overflow-hidden transition-all shadow-xl ${
        isDark
          ? 'bg-gradient-to-br from-slate-900/90 via-[#0c1017] to-slate-950/90 border-white/10'
          : 'bg-white border-slate-200 shadow-slate-200/60'
      }`}>
        {/* Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-25"
          style={{ backgroundColor: selectedStep.color }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Description */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: `${selectedStep.color}15`,
                  borderColor: `${selectedStep.color}40`,
                  color: selectedStep.color
                }}
              >
                Stage {selectedStep.stepNumber} • {selectedStep.badge}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedStep.animationHint}
              </span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {selectedStep.title}
            </h3>

            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {selectedStep.description}
            </p>

            <div className="space-y-2.5 pt-2">
              {selectedStep.technicalDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${selectedStep.color}25`, color: selectedStep.color }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Simulation Panel */}
          <div className="lg:col-span-5 flex justify-center">
            <div className={`w-full max-w-sm rounded-2xl p-6 border transition-all ${
              isDark
                ? 'bg-slate-950/80 border-white/10 shadow-2xl'
                : 'bg-slate-50 border-slate-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-inherit text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[#ff5b26]">
                  <span className="w-2 h-2 rounded-full bg-[#ff5b26] animate-ping" />
                  Live Hardware Status
                </span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>ESP32 Edge Core</span>
              </div>

              {/* Stage-Specific Graphic Simulation */}
              <div className="py-6 space-y-4">
                {activeStep === 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">AC Line Voltage</span>
                      <span className="font-mono font-bold text-sky-400">220.4 V (50.0 Hz)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-sky-500/20 overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full animate-pulse w-3/4" />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Active Load Draw</span>
                      <span className="font-mono font-bold text-sky-400">185.0 W (0.85 A)</span>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-3 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                      <ShieldCheck className="w-4 h-4" />
                      <span>30A Relay Armed & Connected</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Overvoltage guard set to 250V. Cutoff response latency &lt;200ms.
                    </p>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <div className="text-[10px] uppercase font-bold text-emerald-500">Instant Smart Credit</div>
                      <div className="text-base font-black text-white mt-0.5 flex items-baseline justify-between">
                        <span className={isDark ? 'text-white' : 'text-slate-900'}>₦5,000 Recharge</span>
                        <span className="text-emerald-400 font-mono">+31.25 kWh</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-center text-slate-400 font-medium">
                      Zero 20-digit STS slips. Meter credits automatically via Paystack.
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25">
                      <div className="text-[10px] uppercase font-bold text-purple-400">Voltrix AI Advisor</div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        &ldquo;Current usage trends show 12 days remaining at 185W load.&rdquo;
                      </div>
                    </div>
                    <div className="text-[11px] text-center text-slate-400">
                      Predictive forecasting based on live True-RMS sampling.
                    </div>
                  </div>
                )}
              </div>

              {/* Stage progress dots */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-inherit">
                {PROCESS_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      i === activeStep ? 'bg-[#ff5b26] w-6' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
