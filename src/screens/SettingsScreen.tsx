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
  Terminal
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
    pingBackend
  } = useMeter();

  const [tariffRate, setTariffRate] = useState<number>(meterData.tariff_rate);
  const [currencySymbol, setCurrencySymbol] = useState<string>(meterData.currency_symbol);
  const [currencyCode, setCurrencyCode] = useState<string>(meterData.currency_code);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

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
    <div className="space-y-4 pb-8 animate-fade-in text-neutral-100">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Settings & Integrations
        </h2>
        <p className="text-xs text-neutral-400">
          Hardware telemetry endpoints, preferences, and tariff setup
        </p>
      </div>

      {/* 1. Hardware / Cloud Backend API Connection Card */}
      <div className="glass-card p-4 border-emerald-500/40 bg-emerald-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Cloud Backend & Hardware Endpoint
              </h3>
              <span className="text-[11px] text-neutral-400">
                REST & WebSocket ingestion endpoint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLiveEndpointActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`}></span>
            <span className="text-xs font-semibold text-neutral-300">
              {isLiveEndpointActive ? 'Live Ingestion' : 'Simulated'}
            </span>
          </div>
        </div>

        {/* Mode Switch Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 mb-3 text-xs">
          <div>
            <span className="font-semibold text-white block">
              Live Hardware Ingestion Mode
            </span>
            <span className="text-neutral-400 text-[11px]">
              Poll and receive telemetry from live endpoint instead of mock ticks
            </span>
          </div>
          <input
            type="checkbox"
            checked={isLiveEndpointActive}
            onChange={e => setIsLiveEndpointActive(e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        {/* Endpoint URL Input & Ping */}
        <div className="space-y-2 text-xs">
          <label className="block text-neutral-400 font-medium">
            Base Endpoint URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={endpointInput}
              onChange={e => setEndpointInput(e.target.value)}
              placeholder="e.g. http://localhost:5173/api or https://your-server.io/api"
              className="flex-1 p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
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
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {pingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
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
        <div className="mt-4 pt-3 border-t border-neutral-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              ESP32 / Gateway Ingestion POST Endpoint
            </span>
            <button
              onClick={copyCurl}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedPayload ? 'Copied curl!' : 'Copy curl'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-950 font-mono text-[11px] text-neutral-300 overflow-x-auto border border-neutral-800">
            <span className="text-emerald-400 font-bold">POST</span> {endpointInput}/meters/{meterData.meter_id}/telemetry
          </div>
        </div>
      </div>

      {/* 2. My Meter Quick Link */}
      <div
        onClick={() => setActiveTab('device')}
        className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {meterData.meter_name}
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              {meterData.meter_id} · Firmware {meterData.firmware_version}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
            {meterData.device_status}
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </div>
      </div>

      {/* 3. Electricity Tariff & Currency Settings */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            Electricity Tariff & Currency
          </h3>
        </div>

        <form onSubmit={handleSaveElectricity} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">
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
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="NGN">₦ (Nigerian Naira)</option>
                <option value="USD">$ (US Dollar)</option>
                <option value="EUR">€ (Euro)</option>
                <option value="GBP">£ (British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-medium">
                Rate per kWh ({currencySymbol})
              </label>
              <input
                type="number"
                value={tariffRate}
                onChange={e => setTariffRate(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-semibold focus:outline-none focus:border-emerald-500 mono-num"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-secondary w-full py-2.5 font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            {isSavedAlert ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Tariff Saved!</span>
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
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <div>
              <h3 className="text-sm font-bold text-white">
                Appearance
              </h3>
              <span className="text-xs text-neutral-400 capitalize">
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
          <Bell className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Notification Alerts
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-neutral-200 block">
                Grid Outages & Restorations
              </span>
              <span className="text-neutral-400 text-[11px]">
                Immediate alerts when utility power drops
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifGridOutage}
              onChange={e => setNotifGridOutage(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-neutral-800">
            <div>
              <span className="font-semibold text-neutral-200 block">
                High Consumption Spikes
              </span>
              <span className="text-neutral-400 text-[11px]">
                Notify when draw exceeds 3.5 kW peak
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifHighUsage}
              onChange={e => setNotifHighUsage(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-neutral-800">
            <div>
              <span className="font-semibold text-neutral-200 block">
                Energy Sharing Lifecycle
              </span>
              <span className="text-neutral-400 text-[11px]">
                Start, completion, and sync interruption notices
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifSharing}
              onChange={e => setNotifSharing(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-neutral-800">
            <div>
              <span className="font-semibold text-neutral-200 block">
                Backup Battery Health
              </span>
              <span className="text-neutral-400 text-[11px]">
                Alert when backup charge drops below 20%
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifBatteryLow}
              onChange={e => setNotifBatteryLow(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 6. Saved Cloud Recipients */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Saved Cloud Recipients
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          {recipients.map((r: RegisteredRecipient) => (
            <div
              key={r.meter_id}
              className="p-2.5 rounded-xl bg-neutral-900/60 flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-neutral-200 block">
                  {r.meter_name}
                </span>
                <span className="text-neutral-500 mono-num text-[11px]">
                  {r.meter_id} ({r.owner_name})
                </span>
              </div>
              <button
                onClick={() => saveRecipient(r.meter_id)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                  r.is_saved
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-neutral-700 text-neutral-400'
                }`}
              >
                {r.is_saved ? 'Saved' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Demo Simulator Floating Trigger */}
      <div className="glass-card p-4 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Demo & Failure Mode Simulator
              </h3>
              <span className="text-xs text-neutral-400">
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
          <div className="p-2.5 rounded-xl bg-neutral-800 text-neutral-300">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Austin Okafor
            </h3>
            <span className="text-xs text-neutral-400">
              austin@meterenergy.io · +234 803 123 4567
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-secondary w-full text-xs py-2.5 text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Meter Device</span>
        </button>
      </div>

    </div>
  );
};
