import React from 'react';
import {
  GraduationCap,
  Cpu,
  Zap,
  ShieldCheck,
  Activity,
  Award,
  BookOpen,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface LandingAcademicSectionProps {
  theme?: 'light' | 'dark';
}

export const LandingAcademicSection: React.FC<LandingAcademicSectionProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <section id="academic" className={`max-w-7xl mx-auto px-4 sm:px-8 py-24 border-t transition-colors ${
      isDark ? 'border-white/[0.08] text-slate-100' : 'border-slate-200 text-slate-900'
    }`}>
      {/* Institutional / Academic Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${
          isDark
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          <GraduationCap className="w-4 h-4 text-amber-500" />
          <span>Undergraduate Engineering Capstone Project</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Academic Research &{' '}
          <span className="bg-gradient-to-r from-[#ff5b26] via-[#ff7e54] to-amber-500 bg-clip-text text-transparent">
            Engineering Architecture
          </span>
        </h2>

        <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          A fully realized software and live hardware prototype engineered to solve the real-world operational challenges of domestic power distribution.
        </p>
      </div>

      {/* Hero Attribution Banner */}
      <div className={`rounded-3xl p-6 sm:p-10 border mb-12 relative overflow-hidden transition-all shadow-xl ${
        isDark
          ? 'bg-gradient-to-br from-slate-900/90 via-[#0c1017] to-slate-950/90 border-white/10'
          : 'bg-gradient-to-br from-white via-slate-50 to-amber-50/30 border-slate-200/80 shadow-slate-200/50'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff5b26]">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Approved Undergraduate Research Project Topic</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black leading-snug">
              &ldquo;Design and Implementation of an IoT-Enabled Smart Energy Meter with Consumption Analytics&rdquo;
            </h3>

            <div className={`flex flex-wrap items-center gap-4 text-xs sm:text-sm pt-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
                isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <Award className="w-4 h-4 text-[#ff5b26]" />
                <span>Supervision: <strong>Prof. Mrs. Okezie</strong></span>
              </div>

              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Live Hardware & Software Co-Design</span>
              </div>
            </div>
          </div>

          {/* Abstract / Scope Summary */}
          <div className={`lg:col-span-4 p-5 rounded-2xl border text-xs space-y-2.5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.08] text-slate-300'
              : 'bg-white/80 border-slate-200 text-slate-700 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Thesis Abstract</span>
            </div>
            <p className="leading-relaxed">
              This work replaces outdated 20-digit keypad STS tokens with a direct, automated IoT smart-recharge pipeline, incorporates autonomous <strong>30A high-power relay</strong> protection against line surges, and integrates real-time AI consumption analytics for proactive household energy conservation.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Core Research Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
        {/* Pillar 1 */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
            : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-[#ff5b26]/15 text-[#ff5b26] flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold mb-2">1. Edge Sensing Engine</h4>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            PZEM-004T v3.0 True-RMS sensor sampling AC line voltage (80–260V), active current (0–100A), active wattage, and grid frequency at 50Hz over isolated UART Modbus-RTU.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
            : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold mb-2">2. 30A Power Relay Cutoff</h4>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Heavy-duty 30A power relay module actuated via ESP32 GPIO 13. Provides autonomous sub-200ms isolation during overvoltage, brownout, or zero prepaid units without cloud dependency.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
            : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold mb-2">3. Tokenless Direct Billing</h4>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Eliminates 20-digit STS slips. Calculates exact kWh units directly from the tariff rate (₦160/kWh) via Paystack checkout and automatically credits the smart meter hardware in real time.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
            : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center mb-4">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold mb-2">4. AI Consumption Analytics</h4>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Embedded LLM consumption intelligence analyzes live power fluctuations, forecasts end-of-month expenditure, and alerts users to inefficient appliances.
          </p>
        </div>
      </div>

      {/* Hardware-in-the-Loop Implementation Specs */}
      <div className={`rounded-3xl p-6 sm:p-8 border transition-all ${
        isDark
          ? 'bg-slate-900/40 border-white/[0.08]'
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff5b26]/15 flex items-center justify-center text-[#ff5b26]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold">Physical Prototype Bill of Materials & Subsystems</h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Hardware components deployed on the live testbench
              </p>
            </div>
          </div>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
            isDark ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-700'
          }`}>
            Revision 3.2.0 Prototype
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs">
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Compute Core</span>
            <div className="font-bold text-sm">ESP32-WROOM-32</div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Dual-Core 240MHz, 2.4GHz Wi-Fi + BLE, FreeRTOS edge firmware</p>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Metering Sensor</span>
            <div className="font-bold text-sm">PZEM-004T v3.0</div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Modbus-RTU UART2 (GPIO 16/17), 100A current transformer</p>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className="text-[10px] uppercase font-bold text-[#ff5b26] block mb-1">Power Actuator</span>
            <div className="font-bold text-sm">30A Power Relay Module</div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active-LOW optocoupled trigger (GPIO 13), 250VAC 30A load cutoff</p>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Display & Security</span>
            <div className="font-bold text-sm">1602 LCD & Tamper Switch</div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>I2C PCF8574 LCD + SS-5GL physical enclosure tamper detector</p>
          </div>
        </div>
      </div>
    </section>
  );
};
