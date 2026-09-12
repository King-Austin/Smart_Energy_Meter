import React from 'react';
import { Zap, Sun, Moon, Users, ShieldAlert, GraduationCap } from 'lucide-react';
import { AppRoute } from '../../types/meter';

export interface LandingNavProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  navigateToRoute: (route: AppRoute) => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  theme,
  toggleTheme,
  navigateToRoute
}) => {
  const isDark = theme === 'dark';

  return (
    <nav className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 sm:px-8 py-3.5 transition-colors ${
      isDark
        ? 'bg-[#080a0f]/85 border-white/[0.08] text-slate-100'
        : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo with Academic Badge */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff5b26] to-[#ff3b00] flex items-center justify-center text-white shadow-lg shadow-[#ff5b26]/30 ring-1 ring-white/20">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                VOLTRIX
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#ff5b26]/15 text-[#ff5b26] border border-[#ff5b26]/30">
                SUBMETER
              </span>
            </div>
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Academic Prototype • Prof. Mrs. Okezie
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className={`hidden lg:flex items-center gap-6 text-xs font-semibold ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}>
          <a href="#experience" className="hover:text-[#ff5b26] transition-colors">App Experience</a>
          <a href="#process-flow" className="hover:text-[#ff5b26] transition-colors">System Flow</a>
          <a href="#academic" className="hover:text-[#ff5b26] transition-colors flex items-center gap-1 text-amber-500 font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Research</span>
          </a>
          <a href="#mobile-app" className="hover:text-[#ff5b26] transition-colors">Mobile App</a>
          <a href="#faq" className="hover:text-[#ff5b26] transition-colors">FAQ</a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={() => navigateToRoute('client')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => navigateToRoute('admin')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff5b26] to-[#e04818] text-white text-xs font-black shadow-md shadow-[#ff5b26]/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
