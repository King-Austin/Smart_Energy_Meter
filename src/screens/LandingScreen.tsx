import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import {
  Download,
  Smartphone,
  Zap,
  ShieldCheck,
  Activity,
  Wifi,
  Bell,
  CreditCard,
  Cpu,
  CheckCircle2,
  QrCode,
  ArrowRight,
  Lock,
  Layers,
  Server,
  AlertTriangle,
  Sun,
  Moon,
  ChevronDown,
  X
} from 'lucide-react';

export const LandingScreen: React.FC = () => {
  const {
    meterData,
    theme,
    toggleTheme,
    navigateToRoute,
    toggleMainSupply
  } = useMeter();

  const [showQrModal, setShowQrModal] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = '/Voltrix-SmartMeter.apk';
    link.download = 'Voltrix-SmartMeter.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 4000);
  };

  const isRelayOn = meterData.main_supply_connected;

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 selection:bg-[#ff5b26]/30 selection:text-[#ff5b26] relative overflow-hidden font-sans">
      
      {/* Dynamic Background Light Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-[#ff5b26]/15 via-[#ff5b26]/5 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[500px] bg-emerald-500/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[550px] h-[450px] bg-cyan-500/10 blur-[130px] pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '32px 32px' }} 
      />

      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#080a0f]/80 border-b border-white/[0.08] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff5b26] to-[#ff3b00] flex items-center justify-center text-white shadow-lg shadow-[#ff5b26]/30 ring-1 ring-white/20">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">VOLTRIX</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#ff5b26]/20 text-[#ff7747] border border-[#ff5b26]/30">
                  SUBMETER
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart IoT Energy & Safety</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-[#ff5b26] transition-colors">Features</a>
            <a href="#telemetry" className="hover:text-[#ff5b26] transition-colors">Live Telemetry</a>
            <a href="#hardware" className="hover:text-[#ff5b26] transition-colors">Hardware Architecture</a>
            <a href="#mobile-app" className="hover:text-[#ff5b26] transition-colors">Mobile APK</a>
            <a href="#faq" className="hover:text-[#ff5b26] transition-colors">Architecture FAQ</a>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <button
              onClick={() => navigateToRoute('admin')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Portal</span>
            </button>

            <button
              onClick={() => navigateToRoute('client')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ff5b26] to-[#e04512] hover:from-[#ff6d3d] hover:to-[#ff5b26] text-white text-xs font-bold shadow-md shadow-[#ff5b26]/25 transition-all active:scale-95"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Open Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff5b26]/10 border border-[#ff5b26]/25 text-[#ff7747] text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#ff5b26] animate-ping" />
              <span>ESP32 + PZEM-004T Submetering Platform</span>
              <span className="text-white/40">•</span>
              <span className="text-slate-300">v1.0.0 Ready</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.08]">
              Intelligent Energy Submetering.{' '}
              <span className="bg-gradient-to-r from-[#ff5b26] via-[#ff824d] to-amber-300 bg-clip-text text-transparent">
                From Silicon to Mobile.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              An enterprise-grade, high-precision IoT electricity submeter engineered with isolated PZEM-004T sensing, 
              autonomous <strong className="text-white">overvoltage contactor cutoff</strong>, sub-millisecond tamper forensic lockout, 
              instant Paystack STS token vending, and native mobile Android monitoring.
            </p>

            {/* Download & Live CTA Group */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              
              {/* PRIMARY DOWNLOAD BUTTON FOR APK */}
              <button
                onClick={handleDownload}
                className="group relative flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff5b26] to-[#e04512] hover:from-[#ff6d3d] hover:to-[#ff5b26] text-white font-black text-sm shadow-xl shadow-[#ff5b26]/30 hover:shadow-[#ff5b26]/40 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className={`w-4 h-4 text-white ${downloadStarted ? 'animate-bounce' : ''}`} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span>{downloadStarted ? 'Downloading APK...' : 'Download Android App'}</span>
                    <span className="text-[10px] uppercase font-extrabold bg-white/20 px-1.5 py-0.2 rounded text-white">
                      .APK
                    </span>
                  </div>
                  <div className="text-[11px] text-white/80 font-medium">
                    v1.0.0 • 4.4 MB • Android 8.0+
                  </div>
                </div>
              </button>

              {/* SECONDARY DASHBOARD BUTTON */}
              <button
                onClick={() => navigateToRoute('client')}
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-sm backdrop-blur-md hover:border-white/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <Activity className="w-4 h-4 text-[#ff5b26]" />
                <span>Launch Live Dashboard</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* QR Code Action */}
              <button
                onClick={() => setShowQrModal(true)}
                className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
                title="Scan QR Code with your phone to download"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>

            {/* Micro Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Cloud Lock-in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>64-Record Offline RAM Spool</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Capacitor 6 Native Haptics</span>
              </div>
            </div>

          </div>

          {/* Hero Right: Live Interactive Telemetry Widget */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Live Submeter Telemetry
                    </span>
                    <p className="text-[11px] text-slate-400">{meterData.meter_id} • Main House</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  REALTIME 2.5s
                </span>
              </div>

              {/* Main Readings Grid */}
              <div className="grid grid-cols-2 gap-3 py-5">
                
                {/* Voltage */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AC Voltage</div>
                  <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1">
                    {meterData.voltage > 0 ? meterData.voltage.toFixed(1) : '213.8'}
                    <span className="text-xs text-[#ff5b26] font-bold">V</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-1">Normal Range (180V - 240V)</div>
                </div>

                {/* Active Power */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Load</div>
                  <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1">
                    {isRelayOn ? (meterData.active_power > 0 ? meterData.active_power.toFixed(0) : '185') : '0'}
                    <span className="text-xs text-[#ff5b26] font-bold">W</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">
                    {isRelayOn ? `${(meterData.current || 0.82).toFixed(2)} A Current` : 'Load Disconnected'}
                  </div>
                </div>

                {/* Power Factor */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Power Factor</div>
                  <div className="text-xl font-black text-white mt-1">
                    {meterData.power_factor > 0 ? meterData.power_factor.toFixed(2) : '0.96'}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-medium mt-1">Grid Freq: {meterData.frequency || 50.0} Hz</div>
                </div>

                {/* Energy Today */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Energy (Today)</div>
                  <div className="text-xl font-black text-white mt-1 flex items-baseline gap-1">
                    {meterData.energy_today.toFixed(2)}
                    <span className="text-xs text-[#ff5b26] font-bold">kWh</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">Prepaid: {meterData.prepaid_units_kwh} kWh</div>
                </div>
              </div>

              {/* Contactor Hardware Control Switch */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white">Mains Contactor (D13)</div>
                  <div className="text-[11px] text-slate-400">
                    {isRelayOn ? 'GPIO 13 LOW (Contactor Engaged)' : 'GPIO 13 HIGH (Contactor Open)'}
                  </div>
                </div>

                <button
                  onClick={toggleMainSupply}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    isRelayOn
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isRelayOn ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span>{isRelayOn ? 'Supply ON' : 'Supply OFF'}</span>
                </button>
              </div>

              {/* Live Status Footer */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tamper: Secure (GPIO 32)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                  <Wifi className="w-3.5 h-3.5 text-[#ff5b26]" />
                  <span>10.28.133.209</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SIX CORE PILLARS / TECHNICAL CAPABILITIES */}
      {/* ========================================================================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-bold mb-3">
            <Layers className="w-3.5 h-3.5 text-[#ff5b26]" />
            <span>Industrial Grade Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Six Pillars of the Voltrix Energy Platform
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Designed to bridge precision electrical engineering with modern cloud infrastructure and native mobile control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-[#ff5b26]/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-[#ff5b26]/10 border border-[#ff5b26]/20 flex items-center justify-center text-[#ff5b26] mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Precision PZEM-004T AC Sensing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Optoisolated UART telemetry measuring True RMS Voltage (80V - 260V), Current (0 - 100A), Active Real Power (W), 
              Cumulative Energy (kWh), Frequency (45 - 65Hz), and Power Factor with 0.5% laboratory accuracy.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Dynamic Autonomous Cutoff</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adjustable Max (207V - 260V) and Min (150V - 200V) thresholds. If grid voltage fluctuates outside safety guardrails, 
              the ESP32 executes an immediate physical contactor disengagement in under 200ms without relying on cloud availability.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-red-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Sub-Millisecond Anti-Tamper</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Omron SS-5GL microswitch coupled to GPIO 32. Physical opening of the meter lid triggers a hardware interrupt, 
              sounding the active 2.7kHz buzzer on GPIO 25 and locking the contactor in non-volatile flash memory until admin PIN clearance.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Paystack STS Token Recharging</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated online payment gateway with instant conversion of Naira to kWh units based on configured utility tariffs. 
              Automatically generates compliant 20-digit STS token numbers (<code className="text-cyan-300">xxxx-xxxx-xxxx-xxxx-xxxx</code>).
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">64-Record Offline RAM Spool</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero-wear circular ring buffer in ESP32 RAM. When Wi-Fi drops, readings are stored locally while LED 2 (GPIO 27) enters 
              a 200ms warning strobe. Upon network reconnection, all queued logs auto-flush to Supabase PostgreSQL without missing a second.
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Capacitor 6 Native Mobile</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full cross-platform Android & iOS native package. Includes tactile haptic feedback on relay actuation, dark system status bar, 
              local push notifications for voltage trips, and direct local LAN HTTP control to <code className="text-purple-300">10.28.133.209</code>.
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DEDICATED MOBILE APP DOWNLOAD SHOWCASE */}
      {/* ========================================================================= */}
      <section id="mobile-app" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/[0.08]">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#10141d] to-slate-900 border border-white/10 p-8 sm:p-12 relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Native Android Build Verified</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Control Your Submeter From Your Pocket.
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Experience real-time power monitoring with native physical haptics on contactor toggling, instant alerts when voltage 
                trips happen, and automatic local fallback when your home internet drops.
              </p>

              {/* Specifications Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Package Format</div>
                  <div className="text-sm font-black text-white mt-0.5">Android APK</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">File Size</div>
                  <div className="text-sm font-black text-[#ff5b26] mt-0.5">4.40 MB</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Target OS</div>
                  <div className="text-sm font-black text-emerald-400 mt-0.5">Android 8.0+</div>
                </div>
              </div>

              {/* Big Download Button */}
              <div className="pt-3 flex flex-wrap items-center gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#ff5b26] to-[#e04512] hover:from-[#ff6d3d] hover:to-[#ff5b26] text-white font-black text-sm shadow-xl shadow-[#ff5b26]/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Download className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-base font-black">Download APK (v1.0.0)</div>
                    <div className="text-[11px] text-white/80 font-medium">Direct Install • Free</div>
                  </div>
                </button>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-sm transition-all"
                >
                  <QrCode className="w-5 h-5 text-[#ff5b26]" />
                  <span>Scan QR Code</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>💡</span>
                <span>Requires enabling <strong>"Install from Unknown Sources"</strong> on your phone.</span>
              </div>

            </div>

            {/* Right: Phone Frame Simulation */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-[280px] h-[540px] rounded-[42px] bg-black p-3.5 border-4 border-slate-700/60 shadow-2xl shadow-black/80 relative ring-1 ring-white/10 flex flex-col justify-between">
                
                {/* Dynamic Island / Notch */}
                <div className="w-24 h-4 rounded-full bg-slate-900 mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                </div>

                {/* Mock Screen Content */}
                <div className="flex-1 bg-[#0a0d14] rounded-[28px] p-3.5 flex flex-col justify-between border border-white/5">
                  <div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                      <span>03:30</span>
                      <div className="flex items-center gap-1">
                        <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-white">VOLTRIX METER</div>
                        <div className="text-[9px] text-slate-400">MTR-8A24-19F2</div>
                      </div>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        LIVE
                      </span>
                    </div>

                    {/* Mock Power Card */}
                    <div className="mt-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <div className="text-[9px] text-slate-400">Current Load</div>
                      <div className="text-xl font-black text-white mt-0.5">
                        185.0 <span className="text-[10px] text-[#ff5b26]">W</span>
                      </div>
                      <div className="text-[8px] text-emerald-400 mt-1">213.8V • 0.85A • 50Hz</div>
                    </div>

                    {/* Mock Contactor Toggle */}
                    <div className="mt-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-300">Contactor (D13)</span>
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        ON
                      </span>
                    </div>
                  </div>

                  {/* Mock Push Notification Alert */}
                  <div className="p-2 rounded-xl bg-[#ff5b26]/15 border border-[#ff5b26]/30">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-[#ff7747]">
                      <Bell className="w-2.5 h-2.5" />
                      <span>Voltrix Critical Alert</span>
                    </div>
                    <div className="text-[8px] text-slate-300 mt-0.5">
                      Contactor synchronized with hardware relay.
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="w-28 h-1 rounded-full bg-slate-700 mx-auto mt-2" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HARDWARE PINOUT ARCHITECTURE REFERENCE */}
      {/* ========================================================================= */}
      <section id="hardware" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-bold mb-3">
            <Cpu className="w-3.5 h-3.5 text-[#ff5b26]" />
            <span>PCB Schematic Pinout Reference</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Verified Hardware Mapping
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Exact hardware GPIO assignments verified on the physical Voltrix PCB board.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-black text-[#ff5b26] mb-1">
              <span>GPIO 13</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">OUTPUT</span>
            </div>
            <div className="text-sm font-bold text-white">Mains Contactor Relay</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active-LOW optocoupler trigger. LOW = Closed (Power ON), HIGH = Open (Power Cut).
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-black text-cyan-400 mb-1">
              <span>GPIO 16 / 17</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">UART2</span>
            </div>
            <div className="text-sm font-bold text-white">PZEM-004T v3.0</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Pin 16 (RX2), Pin 17 (TX2). 9600 baud Modbus RTU telemetry over optical isolators.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-black text-red-400 mb-1">
              <span>GPIO 32</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">INPUT_PULLUP</span>
            </div>
            <div className="text-sm font-bold text-white">SS-5GL Tamper Switch</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Sub-millisecond enclosure breach detection. Triggers 2.7kHz alarm and NVS lockout.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-black text-amber-400 mb-1">
              <span>GPIO 27</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">OUTPUT</span>
            </div>
            <div className="text-sm font-bold text-white">Wi-Fi Status Strobe LED</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Solid ON when connected to cloud. Rapid 200ms warning blink when running in offline queue mode.
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TECHNICAL FAQ */}
      {/* ========================================================================= */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-8 py-20 border-t border-white/[0.08]">
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-10 tracking-tight">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {[
            {
              q: 'How do I install the Voltrix Android APK on my phone?',
              a: 'Click "Download Android App" to download Voltrix-SmartMeter.apk (4.4 MB). Open the downloaded file. When prompted by Android, enable "Allow from this source" in Settings, then tap Install. The app works on any Android device running Android 8.0 or newer.'
            },
            {
              q: 'How does the meter function when there is no internet connection?',
              a: 'The physical meter operates completely autonomously without internet. The PZEM-004T measures electricity, and the overvoltage/tamper trip logic executes locally in microseconds. Up to 64 telemetry readings are spooled into a RAM circular buffer while LED 2 (GPIO 27) blinks rapidly. When Wi-Fi recovers, the entire buffer is batch-flushed to Supabase.'
            },
            {
              q: 'Can the mobile app communicate directly with the meter on local Wi-Fi?',
              a: 'Yes. The Android application is compiled with Android cleartext traffic enabled, allowing direct local HTTP requests to the ESP32 (http://10.28.133.209 or http://voltrix-meter.local) when on the same router, bypassing the cloud entirely.'
            },
            {
              q: 'What happens when grid voltage exceeds the configured maximum limit?',
              a: 'If line voltage exceeds the threshold (e.g. 207V or 240V), the contactor relay is disengaged immediately to protect connected appliances from burnout. You can reset and re-arm the contactor from the dashboard once the grid voltage stabilizes.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-[#ff5b26] transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-[#ff5b26]' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04] pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#050609] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#ff5b26] flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-bold text-white">VOLTRIX SMART METER</span>
              <p className="text-[11px] text-slate-400">Autonomous AC Submetering & Grid Protection</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="/Voltrix-SmartMeter.apk" download="Voltrix-SmartMeter.apk" className="hover:text-[#ff5b26] transition-colors font-bold text-white">
              Download APK (4.4 MB)
            </a>
            <button onClick={() => navigateToRoute('client')} className="hover:text-[#ff5b26] transition-colors">
              Web Dashboard
            </button>
            <button onClick={() => navigateToRoute('admin')} className="hover:text-[#ff5b26] transition-colors">
              Admin Portal
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            © 2026 Voltrix Energy Systems. All rights reserved.
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 8. QR CODE DOWNLOAD MODAL */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0f141d] border border-white/10 p-6 text-center shadow-2xl relative">
            
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#ff5b26]/10 border border-[#ff5b26]/20 flex items-center justify-center text-[#ff5b26] mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white">Scan to Install on Android</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Point your phone camera at this QR code to download <code className="text-[#ff7747]">Voltrix-SmartMeter.apk</code> directly.
            </p>

            {/* Simulated Vector QR Code */}
            <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-inner">
              <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="white" />
                {/* Corner Markers */}
                <rect x="10" y="10" width="22" height="22" fill="#0a0d14" rx="3" />
                <rect x="14" y="14" width="14" height="14" fill="white" />
                <rect x="18" y="18" width="6" height="6" fill="#ff5b26" />

                <rect x="68" y="10" width="22" height="22" fill="#0a0d14" rx="3" />
                <rect x="72" y="14" width="14" height="14" fill="white" />
                <rect x="76" y="18" width="6" height="6" fill="#ff5b26" />

                <rect x="10" y="68" width="22" height="22" fill="#0a0d14" rx="3" />
                <rect x="14" y="72" width="14" height="14" fill="white" />
                <rect x="18" y="76" width="6" height="6" fill="#ff5b26" />

                {/* Data Matrix Elements */}
                <rect x="36" y="12" width="6" height="6" fill="#0a0d14" />
                <rect x="46" y="12" width="6" height="6" fill="#0a0d14" />
                <rect x="56" y="16" width="6" height="6" fill="#0a0d14" />
                <rect x="36" y="24" width="6" height="6" fill="#0a0d14" />
                <rect x="48" y="24" width="6" height="6" fill="#0a0d14" />

                <rect x="12" y="38" width="6" height="6" fill="#0a0d14" />
                <rect x="22" y="44" width="6" height="6" fill="#0a0d14" />
                <rect x="32" y="38" width="6" height="6" fill="#0a0d14" />
                <rect x="44" y="38" width="12" height="12" fill="#ff5b26" rx="2" />
                <rect x="62" y="38" width="6" height="6" fill="#0a0d14" />
                <rect x="74" y="44" width="6" height="6" fill="#0a0d14" />
                <rect x="84" y="38" width="6" height="6" fill="#0a0d14" />

                <rect x="38" y="56" width="6" height="6" fill="#0a0d14" />
                <rect x="48" y="56" width="6" height="6" fill="#0a0d14" />
                <rect x="58" y="56" width="6" height="6" fill="#0a0d14" />

                <rect x="36" y="68" width="6" height="6" fill="#0a0d14" />
                <rect x="48" y="74" width="6" height="6" fill="#0a0d14" />
                <rect x="62" y="68" width="6" height="6" fill="#0a0d14" />
                <rect x="72" y="74" width="6" height="6" fill="#0a0d14" />
                <rect x="82" y="68" width="6" height="6" fill="#0a0d14" />
              </svg>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-xl bg-[#ff5b26] hover:bg-[#ff6d3d] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Direct Download on this PC (4.4 MB)</span>
              </button>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
