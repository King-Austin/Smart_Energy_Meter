import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Sparkles,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  LineChart,
  Pause,
  Play
} from 'lucide-react';

interface ShowcaseItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  imageLight: string;
  imageDark: string;
  highlights: string[];
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'telemetry',
    badge: 'Real-Time Power',
    title: 'Live Tracking & Remote Master Switch',
    subtitle: 'See every watt live. Cut or restore power anywhere.',
    description:
      'Never guess what is consuming your electricity. Precision voltage, current, and active wattage stream live in real time. Switch off power to your entire apartment remotely with a single tap straight from your phone.',
    imageLight: '/screenshots/light/home_light.png',
    imageDark: '/screenshots/light/home_light.png',
    highlights: [
      'Sub-second live power & voltage tracking',
      'One-tap remote whole-home power switch',
      'Prepaid energy runway & days-remaining forecast'
    ]
  },
  {
    id: 'energy',
    badge: 'Consumption Analytics',
    title: 'High-Resolution Energy Analytics',
    subtitle: 'Granular load profiling across live seconds, hours, and days.',
    description:
      'Monitor total accumulated kilowatt-hours (kWh) alongside power factor, grid voltage, and peak load draw. View live sub-second load spikes alongside 24-hour and 7-day aggregated trends.',
    imageLight: '/screenshots/light/energy_light.png',
    imageDark: '/screenshots/light/energy_light.png',
    highlights: [
      'Multi-tier time resolution (Seconds, Hourly, Daily)',
      'Accurate ₦160/kWh dynamic cost computation',
      'Baseline standby idle vs. active load draw'
    ]
  },
  {
    id: 'ai',
    badge: 'AI Energy Intelligence',
    title: 'Voltrix AI Energy Advisor',
    subtitle: 'A dedicated energy intelligence expert in your pocket.',
    description:
      'Ask anything about your bill forecast, high-consumption appliances, or voltage fluctuations. The built-in AI advisor analyzes your live telemetry to help you cut electricity costs by up to 25%.',
    imageLight: '/screenshots/light/ai_light.png',
    imageDark: '/screenshots/light/ai_light.png',
    highlights: [
      'Proactive monthly bill forecasting',
      'Appliance energy breakdown suggestions',
      'Brownout and surge health insights'
    ]
  },
  {
    id: 'recharge',
    badge: 'Zero-Token Billing',
    title: 'Instant Smart Meter Recharge',
    subtitle: 'No 20-digit STS tokens. Units added directly in real time.',
    description:
      'The smart way to buy electricity. Enter any amount in Naira, see your exact kilowatt-hours calculated transparently, and have units credited to your meter hardware the exact second payment is approved.',
    imageLight: '/screenshots/light/wallet_light.png',
    imageDark: '/screenshots/light/wallet_light.png',
    highlights: [
      'Transparent ₦/kWh dynamic conversion',
      'Direct IoT cloud balance update',
      'Single, clean, ultra-minimalist CTA'
    ]
  },
  {
    id: 'safety',
    badge: 'Active Guardrails',
    title: 'Smart Surge & Appliance Guard',
    subtitle: 'Stop dangerous grid spikes from destroying your electronics.',
    description:
      'Erratic grid voltage ruins refrigerators, television sets, and inverters. Set your custom voltage safety threshold. When grid voltage spikes dangerously, Voltrix instantly cuts power to your home, protecting your appliances before any damage can occur.',
    imageLight: '/screenshots/light/settings_light.png',
    imageDark: '/screenshots/light/settings_light.png',
    highlights: [
      'Instant high-voltage surge cutoff',
      'One-tap trip reset after grid normalizes',
      'Zero expensive external surge protectors needed'
    ]
  }
];

const SLIDE_DURATION_MS = 5000;

interface LandingAppShowcaseProps {
  theme?: 'light' | 'dark';
}

export const LandingAppShowcase: React.FC<LandingAppShowcaseProps> = ({ theme = 'dark' }) => {
  const isGlobalDark = theme === 'dark';
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>(theme);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Sync preview theme if global theme changes
  useEffect(() => {
    setPreviewTheme(theme);
  }, [theme]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    setProgress(0);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length);
    setProgress(0);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Smooth progress bar and auto-advance timer
  useEffect(() => {
    if (isPaused) return;

    const intervalStep = 50; // update every 50ms
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + (intervalStep / SLIDE_DURATION_MS) * 100;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch swipe support for mobile devices
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      // Swiped Left -> Next
      nextSlide();
    } else if (distance < -45) {
      // Swiped Right -> Prev
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeItem = SHOWCASE_ITEMS[currentIndex];
  const activeImage = previewTheme === 'light' ? activeItem.imageLight : activeItem.imageDark;

  return (
    <section
      id="experience"
      className={`max-w-7xl mx-auto px-3.5 sm:px-8 py-16 sm:py-24 border-t transition-colors relative ${
        isGlobalDark ? 'border-white/[0.08] text-slate-100' : 'border-slate-200 text-slate-900'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[800px] h-[300px] sm:h-[500px] bg-gradient-to-tr from-[#ff5b26]/10 to-amber-500/5 blur-[120px] sm:blur-[160px] pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3 sm:space-y-4 px-2">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
          isGlobalDark
            ? 'bg-white/[0.05] border-white/10 text-slate-300'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-[#ff5b26]" />
          <span>The Voltrix Experience</span>
        </div>

        <h2 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
          Power. Precision.{' '}
          <span className="bg-gradient-to-r from-[#ff5b26] via-[#ff7e54] to-amber-400 bg-clip-text text-transparent">
            Pure Clarity.
          </span>
        </h2>

        <p className={`text-xs sm:text-base leading-relaxed max-w-2xl mx-auto ${
          isGlobalDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Crafted to Apple-grade standards. Fully automated slideshow highlighting live telemetry, zero-token billing, and 30A relay protection.
        </p>

        {/* Controls Bar: Theme Switcher & Auto-Play Pause */}
        <div className="pt-2 flex items-center justify-center flex-wrap gap-2.5">
          {/* Mockup Theme Toggle */}
          <div className={`inline-flex p-1 rounded-xl border ${
            isGlobalDark ? 'bg-slate-900/90 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setPreviewTheme('light')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                previewTheme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Light Mode</span>
            </button>
            <button
              onClick={() => setPreviewTheme('dark')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                previewTheme === 'dark'
                  ? 'bg-[#ff5b26] text-white shadow-xs'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[11px]">Dark Mode</span>
            </button>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isGlobalDark
                ? 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
            title={isPaused ? 'Resume auto-advance' : 'Pause slideshow'}
          >
            {isPaused ? <Play className="w-3 h-3 text-[#ff5b26]" /> : <Pause className="w-3 h-3 text-amber-400" />}
            <span className="text-[11px]">{isPaused ? 'Paused' : 'Auto-Advancing'}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tabs with Animated Progress Indicators */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 pt-1 px-1 mb-8 no-scrollbar snap-x">
        {SHOWCASE_ITEMS.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={item.id}
              onClick={() => goToSlide(idx)}
              className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 snap-center overflow-hidden ${
                isActive
                  ? 'bg-[#ff5b26] text-white shadow-lg shadow-[#ff5b26]/25 scale-[1.03]'
                  : isGlobalDark
                    ? 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              {item.id === 'telemetry' && <Zap className="w-3.5 h-3.5" />}
              {item.id === 'energy' && <LineChart className="w-3.5 h-3.5" />}
              {item.id === 'ai' && <Sparkles className="w-3.5 h-3.5" />}
              {item.id === 'recharge' && <Wallet className="w-3.5 h-3.5" />}
              {item.id === 'safety' && <ShieldCheck className="w-3.5 h-3.5" />}
              <span className="text-[11px] sm:text-xs whitespace-nowrap">{item.badge}</span>

              {/* Filling progress line on the active slide */}
              {isActive && !isPaused && (
                <div
                  className="absolute bottom-0 left-0 h-[3px] bg-white/60 transition-all"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Carousel Display Card */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center border rounded-[32px] sm:rounded-[40px] p-5 sm:p-10 lg:p-12 backdrop-blur-xl shadow-2xl transition-all relative ${
          isGlobalDark
            ? 'bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/10'
            : 'bg-white border-slate-200 shadow-slate-200/80'
        }`}
      >
        {/* Left Information & Copy */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6 order-2 lg:order-1">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5b26]/12 border border-[#ff5b26]/25 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#ff5b26]">
              <span>Step {currentIndex + 1} of {SHOWCASE_ITEMS.length}</span>
              <span>•</span>
              <span>{activeItem.badge}</span>
            </div>

            {/* Quick Arrow Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevSlide}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isGlobalDark
                    ? 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/10'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isGlobalDark
                    ? 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/10'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h3 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            {activeItem.title}
          </h3>

          <p className={`text-sm sm:text-base font-semibold ${isGlobalDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {activeItem.subtitle}
          </p>

          <p className={`text-xs sm:text-sm leading-relaxed ${isGlobalDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {activeItem.description}
          </p>

          <div className="space-y-2.5 pt-1">
            {activeItem.highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className={isGlobalDark ? 'text-slate-300' : 'text-slate-700'}>{highlight}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 flex items-center gap-3">
            <a
              href="#mobile-app"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all hover:gap-3 ${
                isGlobalDark
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              <span>Download Mobile App (.APK)</span>
              <ChevronRight className="w-4 h-4 text-[#ff5b26]" />
            </a>
          </div>
        </div>

        {/* Right Phone Device Display Frame (Matching Exact Screenshot Aspect Ratio 560x912) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative order-1 lg:order-2">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-[#ff5b26]/15 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Fluid Smartphone Mockup Frame Matching Screenshot 1:1.63 Aspect Ratio */}
          <div className={`w-full max-w-[280px] xs:max-w-[310px] sm:max-w-[340px] md:max-w-[360px] rounded-[36px] sm:rounded-[44px] p-2 sm:p-2.5 border-4 sm:border-[5px] shadow-2xl relative overflow-hidden group transition-all select-none ${
            isGlobalDark
              ? 'bg-[#0c1017] border-slate-800 shadow-black/80 ring-1 ring-white/10'
              : 'bg-slate-100 border-slate-300 shadow-slate-400/50 ring-1 ring-slate-200'
          }`}>
            {/* Pristine Screen Content - Stretched cleanly to fill phone viewport edge-to-edge from top to bottom */}
            <div className={`rounded-[28px] sm:rounded-[36px] overflow-hidden border relative shadow-inner aspect-[560/912] w-full ${
              isGlobalDark ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <img
                key={activeItem.id + previewTheme}
                src={activeImage}
                alt={activeItem.title}
                className="w-full h-full object-cover object-top select-none animate-fade-in transition-transform duration-700"
                loading="lazy"
              />
            </div>
          </div>

          {/* Mobile Dot Indicators */}
          <div className="flex items-center gap-1.5 mt-4 sm:hidden">
            {SHOWCASE_ITEMS.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentIndex ? 'w-5 bg-[#ff5b26]' : 'w-1.5 bg-slate-400 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
