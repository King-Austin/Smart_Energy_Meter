import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { RegisteredRecipient } from '../types/meter';
import {
  DollarSign,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  ChevronRight,
  Check,
  Zap,
  Bookmark,
  Sliders,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Power,
  Lightbulb
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    meterData,
    setTariff,
    theme,
    toggleTheme,
    recipients,
    saveRecipient,
    logout,
    setActiveTab,
    setIsSimPanelOpen,
    apiEndpointUrl,
    setApiEndpointUrl,
    isLiveEndpointActive,
    setIsLiveEndpointActive,
    pingBackend,
    setSafetyLimits,
    resetSafetyCutoff,
    toggleMainSupply
  } = useMeter();

  const [tariffRate, setTariffRate] = useState<number>(meterData.tariff_rate);
  const [currencySymbol, setCurrencySymbol] = useState<string>(meterData.currency_symbol);
  const [currencyCode, setCurrencyCode] = useState<string>(meterData.currency_code);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Safety Cutoff Limits State
  const [maxVoltage, setMaxVoltage] = useState<number>(meterData.max_voltage_limit || 250);
  const [minVoltage, setMinVoltage] = useState<number>(meterData.min_voltage_limit || 180);
  const [billLimit, setBillLimit] = useState<number>(meterData.bill_limit_threshold || 35000);
  const [isSafetySaved, setIsSafetySaved] = useState(false);

  // Backend Endpoint State
  const [endpointInput, setEndpointInput] = useState<string>(apiEndpointUrl);
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs: number; error?: string } | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Notification toggles state
  const [notifGridOutage, setNotifGridOutage] = useState(true);
  const [notifHighUsage, setNotifHighUsage] = useState(true);
  const [notifSharing, setNotifSharing] = useState(true);
  const [notifBatteryLow, setNotifBatteryLow] = useState(true);

  const handleSaveSafety = (e: React.FormEvent) => {
    e.preventDefault();
    setSafetyLimits(maxVoltage, minVoltage, billLimit);
    setIsSafetySaved(true);
    setTimeout(() => setIsSafetySaved(false), 2000);
  };

  const isTripped = meterData.voltage_cutoff_tripped || meterData.bill_cutoff_tripped;

  const handleSaveElectricity = (e: React.FormEvent) => {
    e.preventDefault();
    setTariff(tariffRate, currencyCode, currencySymbol);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };

  const handlePingEndpoint = async () => {
    setIsPinging(true);
    setPingResult(null);
    setApiEndpointUrl(endpointInput);
    const res = await pingBackend(endpointInput);
    setPingResult(res);
    setIsPinging(false);
  };

  const samplePayload = JSON.stringify(
    {
      voltage: 231.4,
      current: 10.7,
      active_power: 2.46,
      power_factor: 0.96,
      frequency: 50.0,
      grid_status: 'online',
      battery_percentage: 82,
      battery_status: 'charging'
    },
    null,
    2
  );

  const copyCurl = () => {
    const curl = `curl -X POST ${endpointInput}/meters/${meterData.meter_id}/telemetry \\\n  -H "Content-Type: application/json" \\\n  -d '${samplePayload}'`;
    navigator.clipboard.writeText(curl);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-4 pb-10 animate-fade-in text-slate-900 dark:text-neutral-100">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Guardrails
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Protective cutoffs, Paystack tariff, and cloud telemetry endpoints
        </p>
      </div>

      {/* 0. HARDWARE MAINS POWER CONTACTOR RELAY (PIN D27) */}
      <div className={`glass-card p-5 transition-all duration-300 border ${
        meterData.main_supply_connected 
          ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/15' 
          : 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/15'
      } space-y-4`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl transition-colors ${
              meterData.main_supply_connected
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Mains Power Supply (Relay D27)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Low-Level Trigger
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Remote master contactor switch for whole-house mains and test bulb
              </p>
            </div>
          </div>

          <span className={`text-[11px] font-black px-3 py-1 rounded-full border transition-colors ${
            meterData.main_supply_connected
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
          }`}>
            {meterData.main_supply_connected ? '● MAINS ON (D27 LOW)' : '○ MAINS OFF (D27 HIGH)'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-neutral-200">
              <Lightbulb className={`w-4 h-4 ${meterData.main_supply_connected ? 'text-amber-500 fill-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>
                {meterData.main_supply_connected
                  ? 'Contactor is CLOSED. Pin D27 is LOW — bulb and connected appliances are ON.'
                  : 'Contactor is OPEN. Pin D27 is HIGH — bulb and household power are cut off.'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
              Clicking the switch below updates Supabase instantly; the ESP32 receives the command on the next heartbeat and flips the relay.
            </p>
          </div>

          <button
            onClick={toggleMainSupply}
            disabled={isTripped}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              isTripped
                ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : meterData.main_supply_connected
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {isTripped
                ? 'Locked by Safety Trip'
                : meterData.main_supply_connected
                  ? 'Turn Off Mains (Disconnect)'
                  : 'Turn On Mains (Connect)'}
            </span>
          </button>
        </div>
      </div>

      {/* 1. PROTECTIVE SAFETY CUTOFFS CARD (REAL PHYSICAL METERS) */}
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
                Hardware contactor trip triggers for appliances & budget
              </p>
            </div>
          </div>

          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isTripped
              ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30 animate-pulse'
              : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isTripped ? 'TRIPPED' : 'ARMED'}
          </span>
        </div>

        {/* Trip Alert & Recovery */}
        {isTripped && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                {meterData.voltage_cutoff_tripped
                  ? `Overvoltage safety limit exceeded (${meterData.voltage.toFixed(1)}V > ${meterData.max_voltage_limit}V)`
                  : `Monthly budget cap reached (₦${meterData.estimated_cost_today.toLocaleString()} > ₦${meterData.bill_limit_threshold.toLocaleString()})`}
              </span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-300">
              The internal relay opened to prevent electrical fire or overspending. Ensure grid voltage has normalized before re-closing the contactor.
            </p>
            <button
              onClick={resetSafetyCutoff}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Re-arm Relay</span>
            </button>
          </div>
        )}

        {/* Threshold Configuration Form */}
        <form onSubmit={handleSaveSafety} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Overvoltage Limit */}
            <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
              <label className="block text-slate-700 dark:text-neutral-300 font-bold mb-1">
                Max Voltage Limit (V)
              </label>
              <span className="text-[10px] text-slate-400 block mb-2">Cut off supply above</span>
              <input
                type="number"
                min="230"
                max="300"
                step="5"
                value={maxVoltage}
                onChange={e => setMaxVoltage(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white font-black text-sm mono-num focus:outline-none focus:border-[#ff5b26]"
              />
            </div>

            {/* Brownout Undervoltage Limit */}
            <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
              <label className="block text-slate-700 dark:text-neutral-300 font-bold mb-1">
                Min Voltage Limit (V)
              </label>
              <span className="text-[10px] text-slate-400 block mb-2">Cut off supply below</span>
              <input
                type="number"
                min="140"
                max="210"
                step="5"
                value={minVoltage}
                onChange={e => setMinVoltage(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white font-black text-sm mono-num focus:outline-none focus:border-[#ff5b26]"
              />
            </div>

            {/* Monthly Spending Cap */}
            <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
              <label className="block text-slate-700 dark:text-neutral-300 font-bold mb-1">
                Monthly Budget Cap (₦)
              </label>
              <span className="text-[10px] text-slate-400 block mb-2">Shut off if bill exceeds</span>
              <input
                type="number"
                min="5000"
                max="250000"
                step="1000"
                value={billLimit}
                onChange={e => setBillLimit(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white font-black text-sm mono-num focus:outline-none focus:border-[#ff5b26]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-2.5 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            {isSafetySaved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Safety Limits Saved & Synced to DB!</span>
              </>
            ) : (
              <span>Save & Apply Protection Guardrails</span>
            )}
          </button>
        </form>
      </div>

      {/* 1. Hardware / Cloud Backend API Connection Card */}
      <div className="glass-card p-4 border-[#ff5b26]/30 bg-[#ff5b26]/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#ff5b26]/15 text-[#ff5b26]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Cloud Backend & Hardware Endpoint
              </h3>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                REST & WebSocket ingestion endpoint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLiveEndpointActive ? 'bg-[#ff5b26] animate-pulse' : 'bg-neutral-400 dark:bg-neutral-600'}`}></span>
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {isLiveEndpointActive ? 'Live Ingestion' : 'Simulated'}
            </span>
          </div>
        </div>

        {/* Mode Switch Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 mb-3 text-xs">
          <div>
            <span className="font-semibold text-neutral-900 dark:text-white block">
              Live Hardware Ingestion Mode
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Poll and receive telemetry from live endpoint instead of mock ticks
            </span>
          </div>
          <input
            type="checkbox"
            checked={isLiveEndpointActive}
            onChange={e => setIsLiveEndpointActive(e.target.checked)}
            className="w-5 h-5 accent-[#ff5b26] rounded cursor-pointer"
          />
        </div>

        {/* Endpoint URL Input & Ping */}
        <div className="space-y-2 text-xs">
          <label className="block text-neutral-600 dark:text-neutral-400 font-medium">
            Base Endpoint URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={endpointInput}
              onChange={e => setEndpointInput(e.target.value)}
              placeholder="e.g. http://localhost:5173/api or https://your-server.io/api"
              className="flex-1 p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#ff5b26]"
            />
            <button
              onClick={handlePingEndpoint}
              disabled={isPinging}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isPinging ? 'Pinging...' : 'Ping Test'}</span>
            </button>
          </div>

          {/* Ping Test Feedback */}
          {pingResult && (
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
                pingResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {pingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span>
                  {pingResult.success
                    ? `Connected successfully (${pingResult.latencyMs}ms latency)`
                    : `Connection failed: ${pingResult.error}`}
                </span>
              </div>
              {pingResult.success && (
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                  HTTP 200 OK
                </span>
              )}
            </div>
          )}
        </div>

        {/* ESP32 / Hardware Ingestion API Docs */}
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-neutral-600 dark:text-neutral-400 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#ff5b26]" />
              ESP32 / Gateway Ingestion POST Endpoint
            </span>
            <button
              onClick={copyCurl}
              className="text-[11px] text-[#ff5b26] hover:underline flex items-center gap-1 font-semibold"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedPayload ? 'Copied curl!' : 'Copy curl'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-950 font-mono text-[11px] text-neutral-800 dark:text-neutral-300 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
            <span className="text-[#ff5b26] font-bold">POST</span> {endpointInput}/meters/{meterData.meter_id}/telemetry
          </div>
        </div>
      </div>

      {/* 2. My Meter Quick Link */}
      <div
        onClick={() => setActiveTab('device')}
        className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-[#ff5b26]/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#ff5b26]/10 text-[#ff5b26]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {meterData.meter_name}
            </h3>
            <span className="text-xs font-mono text-neutral-500">
              {meterData.meter_id} · Firmware {meterData.firmware_version}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
            {meterData.device_status}
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </div>
      </div>

      {/* 3. Electricity Tariff & Currency Settings */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-[#ff5b26]" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Electricity Tariff & Currency
          </h3>
        </div>

        <form onSubmit={handleSaveElectricity} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                Currency Unit
              </label>
              <select
                value={currencyCode}
                onChange={e => {
                  const code = e.target.value;
                  setCurrencyCode(code);
                  if (code === 'NGN') setCurrencySymbol('₦');
                  if (code === 'USD') setCurrencySymbol('$');
                  if (code === 'EUR') setCurrencySymbol('€');
                  if (code === 'GBP') setCurrencySymbol('£');
                }}
                className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-semibold focus:outline-none focus:border-[#ff5b26]"
              >
                <option value="NGN">₦ (Nigerian Naira)</option>
                <option value="USD">$ (US Dollar)</option>
                <option value="EUR">€ (Euro)</option>
                <option value="GBP">£ (British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                Rate per kWh ({currencySymbol})
              </label>
              <input
                type="number"
                value={tariffRate}
                onChange={e => setTariffRate(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-semibold focus:outline-none focus:border-[#ff5b26] mono-num"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-secondary w-full py-2.5 font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            {isSavedAlert ? (
              <>
                <Check className="w-4 h-4 text-[#ff5b26]" />
                <span className="text-[#ff5b26] font-bold">Tariff Saved!</span>
              </>
            ) : (
              <span>Save Tariff & Currency</span>
            )}
          </button>
        </form>
      </div>

      {/* 4. Appearance Mode */}
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
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* 5. Notification Preferences */}
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
                Energy Sharing Lifecycle
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                Start, completion, and sync interruption notices
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifSharing}
              onChange={e => setNotifSharing(e.target.checked)}
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

      {/* 6. Saved Cloud Recipients */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="w-4 h-4 text-[#ff5b26]" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Saved Cloud Recipients
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          {recipients.map((r: RegisteredRecipient) => (
            <div
              key={r.meter_id}
              className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white block">
                  {r.meter_name}
                </span>
                <span className="text-neutral-500 mono-num text-[11px]">
                  {r.meter_id} ({r.owner_name})
                </span>
              </div>
              <button
                onClick={() => saveRecipient(r.meter_id)}
                className={`text-xs px-2.5 py-1 rounded-xl border font-medium ${
                  r.is_saved
                    ? 'border-[#ff5b26]/30 text-[#ff5b26] bg-[#ff5b26]/10 font-bold'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {r.is_saved ? 'Saved' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Demo Simulator Floating Trigger */}
      <div className="glass-card p-4 border-[#ff5b26]/30 bg-[#ff5b26]/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#ff5b26]" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Demo & Failure Mode Simulator
              </h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Test outages, offline modes, and battery drops
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSimPanelOpen(true)}
            className="btn-primary text-xs py-2 px-3"
          >
            Open Simulator
          </button>
        </div>
      </div>

      {/* 8. Account Profile & Logout */}
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
              austin@meterenergy.io · +234 803 123 4567
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-secondary w-full text-xs py-2.5 text-red-500 border-red-500/20 hover:bg-red-500/10 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Meter Device</span>
        </button>
      </div>

    </div>
  );
};
