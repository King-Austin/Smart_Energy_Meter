import React, { useState, useEffect } from 'react';
import { useMeter } from '../context/MeterContext';
import {
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Power,
  Zap,
  ZapOff,
  Wallet,
  Check,
  Share2,
  ChevronRight,
  Edit3,
  Save,
  X,
  GraduationCap
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const ANAMBRA_LGAS = [
  'Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 
  'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 
  'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 
  'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'
];

export const SettingsScreen: React.FC = () => {
  const {
    meterData,
    theme,
    toggleTheme,
    logout,
    setSafetyLimits,
    resetSafetyCutoff,
    toggleMainSupply,
    setActiveTab,
    updateProfileName,
    updateProfileLocation
  } = useMeter();

  // Safety Cutoff Limits State (Smart Sliders)
  const [maxVoltage, setMaxVoltage] = useState<number>(meterData.max_voltage_limit || 240);
  const [minVoltage, setMinVoltage] = useState<number>(meterData.min_voltage_limit || 180);
  const [billLimit, setBillLimit] = useState<number>(meterData.bill_limit_threshold || 35000);
  const [isSafetySaved, setIsSafetySaved] = useState(false);

  // Profile Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileName, setProfileName] = useState(meterData.meter_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Geo-Location State
  const [profileState, setProfileState] = useState(meterData.state || '');
  const [profileLga, setProfileLga] = useState(meterData.lga || '');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isLocationSaved, setIsLocationSaved] = useState(false);

  // Sync state if remote DB updates
  useEffect(() => {
    if (meterData.max_voltage_limit) setMaxVoltage(meterData.max_voltage_limit);
    if (meterData.min_voltage_limit) setMinVoltage(meterData.min_voltage_limit);
    if (meterData.bill_limit_threshold) setBillLimit(meterData.bill_limit_threshold);
    if (meterData.meter_name) setProfileName(meterData.meter_name);
    if (meterData.state) setProfileState(meterData.state);
    if (meterData.lga) setProfileLga(meterData.lga);
  }, [meterData.max_voltage_limit, meterData.min_voltage_limit, meterData.bill_limit_threshold, meterData.meter_name, meterData.state, meterData.lga]);

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

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profileName.trim()) return;
    setIsSavingName(true);
    await updateProfileName(profileName);
    setIsSavingName(false);
    setIsEditingName(false);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLocation(true);
    await updateProfileLocation(profileState, profileLga);
    setIsSavingLocation(false);
    setIsLocationSaved(true);
    setTimeout(() => setIsLocationSaved(false), 2000);
  };

  const isTripped = meterData.voltage_cutoff_tripped || meterData.bill_cutoff_tripped;
  const isConnected = meterData.main_supply_connected;

  return (
    <div className="space-y-4 pb-12 animate-fade-in text-slate-900 dark:text-neutral-100 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings
        </h2>
        <span className="text-xs text-slate-500 dark:text-neutral-400">
          Preferences & safety guardrails
        </span>
      </div>

      {/* 1. Mains Supply (30A Power Relay Switch Card) */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${
            isConnected
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
          }`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Mains Electricity Supply
            </h3>
            <span className={`text-xs font-semibold ${
              isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {isConnected ? 'Power Connected' : 'Power Disconnected'}
            </span>
          </div>
        </div>

        <button
          onClick={toggleMainSupply}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer ${
            isConnected
              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Safety Trip Banner (if active) */}
      {isTripped && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="text-xs font-bold">
              {meterData.voltage_cutoff_tripped
                ? `High Voltage Trip (${meterData.voltage.toFixed(0)}V > ${meterData.max_voltage_limit}V)`
                : 'Monthly Spending Threshold Reached'}
            </span>
          </div>
          <button
            onClick={resetSafetyCutoff}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* 2. Protection Guardrails (Apple Inset Grouped Section) */}
      <form onSubmit={handleSaveSafety} className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ff5b26]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Protective Guardrails
            </h3>
          </div>
          {isSafetySaved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        {/* Max Voltage Slider - Extended from 180V to allow live cutoff testing */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Overvoltage Cutoff</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800">
              {maxVoltage} V
            </span>
          </div>
          <input
            type="range"
            min="180"
            max="260"
            step="1"
            value={maxVoltage}
            onChange={(e) => setMaxVoltage(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff5b26]"
          />
          <div className="flex justify-between text-[10px] text-slate-500 dark:text-neutral-400 px-0.5">
            <span>180V (Test trip)</span>
            <span>220V (Nominal)</span>
            <span>260V</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-neutral-400">
            Slide below current line voltage to test instant 30A relay isolation.
          </p>
        </div>

        {/* Min Voltage Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400 font-semibold">
              <ZapOff className="w-3.5 h-3.5 text-rose-500" />
              <span>Brownout Cutoff</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800">
              {minVoltage} V
            </span>
          </div>
          <input
            type="range"
            min="150"
            max="210"
            step="1"
            value={minVoltage}
            onChange={(e) => setMinVoltage(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff5b26]"
          />
        </div>

        {/* Monthly Spend Limit Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400 font-semibold">
              <Wallet className="w-3.5 h-3.5 text-cyan-500" />
              <span>Monthly Budget Cap</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800">
              {formatCurrency(billLimit)}
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="100000"
            step="5000"
            value={billLimit}
            onChange={(e) => setBillLimit(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff5b26]"
          />
        </div>

        <button
          type="submit"
          className="w-full btn-primary text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Save Protection Limits</span>
        </button>
      </form>

      {/* 3. Peer-to-Peer Energy Sharing Navigation */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#ff5b26]/12 text-[#ff5b26]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Peer-to-Peer Energy Sharing
            </h3>
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Transfer or receive prepaid units with neighbours
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('share')}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
        >
          <span>Open Sharing</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#ff5b26]" />
        </button>
      </div>

      {/* 4. Notifications (Apple Inset Toggles) */}
      <div className="glass-card overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-[#ff5b26]" />
            <span className="font-semibold text-slate-700 dark:text-neutral-300">Outage Alerts</span>
          </div>
          <input
            type="checkbox"
            checked={notifGridOutage}
            onChange={(e) => setNotifGridOutage(e.target.checked)}
            className="w-4 h-4 rounded text-[#ff5b26] accent-[#ff5b26] cursor-pointer"
          />
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-700 dark:text-neutral-300">High Usage Warning</span>
          </div>
          <input
            type="checkbox"
            checked={notifHighUsage}
            onChange={(e) => setNotifHighUsage(e.target.checked)}
            className="w-4 h-4 rounded text-[#ff5b26] accent-[#ff5b26] cursor-pointer"
          />
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-slate-700 dark:text-neutral-300">Low Balance Reminder</span>
          </div>
          <input
            type="checkbox"
            checked={notifBatteryLow}
            onChange={(e) => setNotifBatteryLow(e.target.checked)}
            className="w-4 h-4 rounded text-[#ff5b26] accent-[#ff5b26] cursor-pointer"
          />
        </div>
      </div>

      {/* 5. Appearance Segmented Picker */}
      <div className="glass-card p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span className="font-semibold text-slate-700 dark:text-neutral-300">Appearance</span>
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => { if (theme === 'dark') toggleTheme(); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => { if (theme === 'light') toggleTheme(); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* 6. Account Profile & Name Edit */}
      <div className="glass-card p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26] flex items-center justify-center font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-neutral-400">
                Account Profile
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {meterData.meter_name || 'My Home'}
              </h4>
              <span className="text-[11px] text-slate-400 block">
                Meter ID: {meterData.meter_id} • {meterData.location || 'Resident Account'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditingName && (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Edit Name"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#ff5b26]" />
                <span>Edit Name</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline Profile Name Editor */}
        {isEditingName && (
          <form onSubmit={handleSaveName} className="pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name / house name"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff5b26]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSavingName}
              className="px-3 py-1.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04512] text-white font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingName ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileName(meterData.meter_name || '');
                setIsEditingName(false);
              }}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* 7. Geo-Location (Timeout Records) */}
      <form onSubmit={handleSaveLocation} className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Geo-Location for Timeout Records
            </h3>
          </div>
          {isLocationSaved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">State</label>
            <div className="relative">
              <select
                value="Anambra"
                onChange={(e) => setProfileState(e.target.value)}
                className="w-full px-3 py-2 pr-8 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff5b26] appearance-none"
              >
                <option value="Anambra">Anambra State</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">Local Government Area (LGA)</label>
            <div className="relative">
              <select
                value={profileLga}
                onChange={(e) => setProfileLga(e.target.value)}
                className="w-full px-3 py-2 pr-8 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff5b26] appearance-none"
              >
                <option value="" disabled>Select your LGA</option>
                {ANAMBRA_LGAS.map((lga) => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-tight">
          This data is used exclusively to map geographic locations for timeout tracking and grid analytics.
        </p>

        <button
          type="submit"
          disabled={isSavingLocation}
          className="w-full btn-primary text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSavingLocation ? 'Saving...' : 'Save Location'}</span>
        </button>
      </form>

      {/* 8. Academic Research & Prototype Attribution Card */}
      <div className="glass-card p-4 space-y-3 text-xs border-amber-500/20 bg-amber-500/[0.04]">
        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400">
          <GraduationCap className="w-4 h-4" />
          <span>Undergraduate Engineering Capstone Thesis</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
            Design and Implementation of an IoT-Enabled Smart Energy Meter with Consumption Analytics
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
            Academic Research Supervision: <strong className="text-slate-800 dark:text-neutral-200">Prof. Mrs. Okezie</strong>
          </p>
        </div>
        <div className="pt-2 border-t border-slate-200/60 dark:border-neutral-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>Architecture: ESP32 + PZEM-004T + 30A Power Relay</span>
          <span className="font-mono font-bold text-[#ff5b26]">Live Hardware Prototype</span>
        </div>
      </div>

    </div>
  );
};
