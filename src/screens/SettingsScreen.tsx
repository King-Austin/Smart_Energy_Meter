import React, { useState, useEffect } from 'react';
import { useMeter } from '../context/MeterContext';
import {
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Check,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Power,
  Lightbulb,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    meterData,
    theme,
    toggleTheme,
    logout,
    setSafetyLimits,
    resetSafetyCutoff,
    toggleMainSupply
  } = useMeter();

  // Safety Cutoff Limits State (Smart Sliders)
  const [maxVoltage, setMaxVoltage] = useState<number>(meterData.max_voltage_limit || 240);
  const [minVoltage, setMinVoltage] = useState<number>(meterData.min_voltage_limit || 180);
  const [billLimit, setBillLimit] = useState<number>(meterData.bill_limit_threshold || 35000);
  const [isSafetySaved, setIsSafetySaved] = useState(false);

  // Sync state if remote DB updates
  useEffect(() => {
    if (meterData.max_voltage_limit) setMaxVoltage(meterData.max_voltage_limit);
    if (meterData.min_voltage_limit) setMinVoltage(meterData.min_voltage_limit);
    if (meterData.bill_limit_threshold) setBillLimit(meterData.bill_limit_threshold);
  }, [meterData.max_voltage_limit, meterData.min_voltage_limit, meterData.bill_limit_threshold]);

  // Notification toggles state
  const [notifGridOutage, setNotifGridOutage] = useState(true);
  const [notifHighUsage, setNotifHighUsage] = useState(true);
  const [notifBatteryLow, setNotifBatteryLow] = useState(true);

  const handleSaveSafety = (e: React.FormEvent) => {
    e.preventDefault();
    setSafetyLimits(maxVoltage, minVoltage, billLimit);
    setIsSafetySaved(true);
    setTimeout(() => setIsSafetySaved(false), 2000);
  };

  const isTripped = meterData.voltage_cutoff_tripped || meterData.bill_cutoff_tripped;

  // Two-way sync comparison
  const cloudState = meterData.main_supply_connected;
  const hardwareAck = meterData.hardware_relay_ack ?? meterData.main_supply_connected;
  const isSyncing = cloudState !== hardwareAck;

  return (
    <div className="space-y-4 pb-12 animate-fade-in text-slate-900 dark:text-neutral-100 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Guardrails
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Hardware contactor relay (GPIO 13), two-way sync, and protective voltage cutoffs
        </p>
      </div>

      {/* 1. HARDWARE MAINS POWER CONTACTOR RELAY (GPIO 13) WITH TWO-WAY SYNC */}
      <div className={`glass-card p-5 transition-all duration-300 border ${
        cloudState 
          ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/15' 
          : 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/15'
      } space-y-4`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl transition-colors ${
              cloudState
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Mains Contactor Relay (GPIO 13)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Active LOW Trigger
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Remote master contactor switch for whole-house mains & test bulb
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`text-[11px] font-black px-3 py-1 rounded-full border transition-colors ${
              cloudState
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
            }`}>
              {cloudState ? '● MAINS ON' : '○ MAINS OFF'}
            </span>

            {/* Hardware ACK Tag */}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              isSyncing
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 animate-pulse'
                : hardwareAck
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {isSyncing ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Syncing with ESP32...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>ESP32 ACK: {hardwareAck ? 'D13 LOW (CLOSED)' : 'D13 HIGH (OPEN)'}</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-neutral-200">
              <Lightbulb className={`w-4 h-4 shrink-0 ${cloudState ? 'text-amber-500 fill-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>
                {cloudState
                  ? 'Contactor is CLOSED. Pin D13 is LOW (0.0V) — bulb and household power are ON.'
                  : 'Contactor is OPEN. Pin D13 is HIGH (3.3V) — bulb and household power are CUT OFF.'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
              Clicking below toggles the contactor via Supabase. The ESP32 receives the command on the 2-second heartbeat and physically flips the relay.
            </p>
          </div>

          <button
            onClick={toggleMainSupply}
            disabled={isTripped}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              isTripped
                ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : cloudState
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {isTripped
                ? 'Locked by Safety Trip'
                : cloudState
                  ? 'Turn Off Mains (Disconnect)'
                  : 'Turn On Mains (Connect)'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. PROTECTIVE SAFETY CUTOFFS (SMART VOLTAGE SLIDERS) */}
      <div className="glass-card p-5 border-[#ff5b26]/35 bg-[#fff9f6] dark:bg-[#1a120e] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl ${isTripped ? 'bg-rose-500 text-white' : 'bg-[#ff5b26]/12 text-[#ff5b26]'}`}>
              {isTripped ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Protective Safety Cutoffs
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Hardware contactor trip triggers for overvoltage, brownout & budget
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 mono-num">
              Live Grid: {meterData.voltage.toFixed(1)}V
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isTripped
                ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30 animate-pulse'
                : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
            }`}>
              {isTripped ? 'TRIPPED' : 'ARMED'}
            </span>
          </div>
        </div>

        {/* Trip Alert & Recovery */}
        {isTripped && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {meterData.voltage_cutoff_tripped
                  ? `Overvoltage safety limit exceeded (${meterData.voltage.toFixed(1)}V > ${meterData.max_voltage_limit}V)`
                  : `Monthly budget cap reached (₦${meterData.estimated_cost_today.toLocaleString()} > ₦${meterData.bill_limit_threshold.toLocaleString()})`}
              </span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-300">
              The internal contactor relay opened to protect household appliances from overvoltage burnout. Increase threshold or normalize grid voltage to reset.
            </p>
            <button
              onClick={resetSafetyCutoff}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Re-arm Contactor</span>
            </button>
          </div>
        )}

        {/* Smart Range Sliders Form */}
        <form onSubmit={handleSaveSafety} className="space-y-4 text-xs">
          
          {/* 1. Max Voltage Slider */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-900 dark:text-white font-bold">
                  Max Voltage Cutoff Threshold
                </label>
                <span className="text-[11px] text-slate-400">
                  Cut off supply immediately if mains voltage exceeds this value
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-[#ff5b26] mono-num px-2.5 py-0.5 rounded-lg bg-[#ff5b26]/10 border border-[#ff5b26]/20">
                  {maxVoltage} V
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <input
                type="range"
                min="190"
                max="260"
                step="1"
                value={maxVoltage}
                onChange={e => setMaxVoltage(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff5b26]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mono-num px-0.5">
                <span>190V (Testing)</span>
                <span className="text-[#ff5b26] font-bold">230V (Trip Test)</span>
                <span>240V (Standard)</span>
                <span>260V (Max)</span>
              </div>
            </div>
          </div>

          {/* 2. Min Voltage Slider */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-900 dark:text-white font-bold">
                  Min Voltage Cutoff (Brownout Protection)
                </label>
                <span className="text-[11px] text-slate-400">
                  Cut off supply if voltage drops below safe appliance operating level
                </span>
              </div>
              <span className="text-base font-black text-slate-800 dark:text-neutral-200 mono-num px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
                {minVoltage} V
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <input
                type="range"
                min="150"
                max="220"
                step="1"
                value={minVoltage}
                onChange={e => setMinVoltage(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff5b26]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mono-num px-0.5">
                <span>150V (Low)</span>
                <span>180V (Standard)</span>
                <span>200V</span>
                <span>220V (High)</span>
              </div>
            </div>
          </div>

          {/* 3. Monthly Spending Cap Slider */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-900 dark:text-white font-bold">
                  Monthly Spend Budget Cap (₦)
                </label>
                <span className="text-[11px] text-slate-400">
                  Automatically trip contactor if monthly spending exceeds this ceiling
                </span>
              </div>
              <span className="text-base font-black text-slate-800 dark:text-neutral-200 mono-num px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
                ₦{billLimit.toLocaleString()}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <input
                type="range"
                min="5000"
                max="200000"
                step="1000"
                value={billLimit}
                onChange={e => setBillLimit(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff5b26]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mono-num px-0.5">
                <span>₦5,000</span>
                <span>₦35,000</span>
                <span>₦100,000</span>
                <span>₦200,000</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-2.5 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isSafetySaved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Safety Limits Saved & Applied to Prototype!</span>
              </>
            ) : (
              <span>Save & Apply Protection Guardrails</span>
            )}
          </button>
        </form>
      </div>

      {/* 3. NOTIFICATION PREFERENCES */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-[#ff5b26]" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Notification Alerts
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                Grid Outages & Restorations
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Immediate alerts when utility power drops
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifGridOutage}
              onChange={e => setNotifGridOutage(e.target.checked)}
              className="w-4 h-4 accent-[#ff5b26] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                High Consumption Spikes
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Notify when draw exceeds 3.5 kW peak
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifHighUsage}
              onChange={e => setNotifHighUsage(e.target.checked)}
              className="w-4 h-4 accent-[#ff5b26] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                Backup Battery Health
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Alert when backup charge drops below 20%
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifBatteryLow}
              onChange={e => setNotifBatteryLow(e.target.checked)}
              className="w-4 h-4 accent-[#ff5b26] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. APPEARANCE THEME */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-neutral-400" />
            ) : (
              <Sun className="w-4 h-4 text-[#ff5b26]" />
            )}
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Appearance
              </h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                {theme} mode active
              </span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="btn-secondary text-xs py-1.5 px-3 cursor-pointer"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* 5. ACCOUNT PROFILE & SIGN OUT */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Austin Okafor
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              austin@meterenergy.io · {meterData.meter_name} ({meterData.meter_id})
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-secondary w-full text-xs py-2.5 text-red-500 border-red-500/20 hover:bg-red-500/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Meter Device</span>
        </button>
      </div>

    </div>
  );
};
