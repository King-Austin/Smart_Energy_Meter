import React from 'react';
import { Layers, Zap, ShieldCheck, CreditCard, Sparkles, Smartphone, Power } from 'lucide-react';

interface LandingFeaturesProps {
  theme?: 'light' | 'dark';
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <section id="features" className={`max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t transition-colors ${
      isDark ? 'border-white/[0.08] text-slate-100' : 'border-slate-200 text-slate-900'
    }`}>
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mb-3 border ${
          isDark
            ? 'bg-white/[0.04] border-white/[0.08] text-slate-300'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <Layers className="w-3.5 h-3.5 text-[#ff5b26]" />
          <span>Core Capabilities</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
          Engineered for Total Control
        </h2>
        <p className={`text-sm sm:text-base mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Six foundational capabilities engineered into the Voltrix hardware and software architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pillar 1 */}
        <div className={`p-7 rounded-3xl border transition-all group ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.07] hover:border-[#ff5b26]/40 hover:bg-white/[0.05]'
            : 'bg-white border-slate-200 hover:border-[#ff5b26]/50 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-[#ff5b26]/10 border border-[#ff5b26]/20 flex items-center justify-center text-[#ff5b26] mb-5 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black mb-2">100% Bill Transparency</h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            End unfair estimated bills once and for all. Watch your voltage, current, and true kilowatt-hours live as you use them. Know exactly which appliances consume your money down to the kobo.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className={`p-7 rounded-3xl border transition-all group ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.07] hover:border-emerald-500/40 hover:bg-white/[0.05]'
            : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-5 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black mb-2">Smart Surge & Appliance Guard</h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Erratic grid voltage ruins refrigerators, TVs, and inverters. Voltrix detects dangerous surges instantly and cuts power in milliseconds, saving your electronics from costly burnout.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className={`p-7 rounded-3xl border transition-all group ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.07] hover:border-amber-500/40 hover:bg-white/[0.05]'
            : 'bg-white border-slate-200 hover:border-amber-500/50 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-5 group-hover:scale-110 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black mb-2">Zero-Token Direct Recharging</h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            No more typing 20-digit numbers on a screeching keypad. Enter your recharge amount, see exact kilowatt-hours credited directly to your meter, and keep your lights on effortlessly.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className={`p-7 rounded-3xl border transition-all group ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.07] hover:border-purple-500/40 hover:bg-white/[0.05]'
            : 'bg-white border-slate-200 hover:border-purple-500/50 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-5 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black mb-2">Voltrix AI Energy Advisor</h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Conversational energy insights trained on live telemetry. Get instant monthly bill forecasts, appliance energy optimization tips, and safety checks.
          </p>
        </div>

        {/* Pillar 5 */}
        <div className={`p-7 rounded-3xl border transition-all group ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.07] hover:border-cyan-500/40 hover:bg-white/[0.05]'
            : 'bg-white border-slate-200 hover:border-cyan-500/50 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-5 group-hover:scale-110 transition-transform">
            <Power className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black mb-2">Remote Whole-Home Switch</h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Heading out and forgot to turn off heavy loads? Disconnect or reconnect your electricity straight from your phone wherever you are. Absolute peace of mind for landlords and tenants.
          </p>
        </div>

        {/* Pillar 6 */}
        <div className={`p-7 rounded-3xl border transition-all group ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.07] hover:border-rose-500/40 hover:bg-white/[0.05]'
            : 'bg-white border-slate-200 hover:border-rose-500/50 shadow-sm hover:shadow-md'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-5 group-hover:scale-110 transition-transform">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black mb-2">Mobile & Web Parity</h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            A beautiful, unified design across Android and Web. Access live charts, historical consumption, and instant top-ups from any screen or device.
          </p>
        </div>
      </div>
    </section>
  );
};
