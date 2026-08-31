import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { RegisteredRecipient, SharingSession } from '../types/meter';
import {
  Share2,
  Search,
  Zap,
  ShieldCheck,
  AlertTriangle,
  StopCircle,
  User,
  History,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export const ShareScreen: React.FC = () => {
  const {
    activeSession,
    receivingSession,
    sharingHistory,
    startSharing,
    stopSharing,
    stopReceiving,
    searchRecipients
  } = useMeter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<RegisteredRecipient | null>(null);
  
  // Sharing limit presets
  const [powerLimitW, setPowerLimitW] = useState<number>(500);
  const [energyLimitKwh, setEnergyLimitKwh] = useState<number>(1.0);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmStopOpen, setIsConfirmStopOpen] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<SharingSession | null>(null);

  const filteredRecipients = searchRecipients(searchQuery);

  const handleStartShare = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!selectedRecipient) {
      setErrorMessage('Please select a recipient meter.');
      return;
    }
    const result = startSharing(selectedRecipient, powerLimitW, energyLimitKwh, durationMinutes);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to start sharing.');
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-fade-in text-neutral-900 dark:text-neutral-100">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-display">
          Energy Sharing
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Cloud-synchronized peer-to-peer electricity sharing between meters
        </p>
      </div>

      {/* 1. ACTIVE SENDING SESSION CARD */}
      {activeSession && (
        <div className="glass-card p-5 border-emerald-500/40 bg-emerald-500/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Active Energy Export
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              {activeSession.session_id}
            </span>
          </div>

          {/* Large Live Transfer Gauge */}
          <div className="text-center py-2">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">
              Live Export Rate to {activeSession.destination_meter_name}
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mono-num">
                {activeSession.current_power_w}
              </span>
              <span className="text-xl font-bold text-neutral-500">W</span>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <span>Transferred Energy:</span>
              <span className="font-bold text-neutral-900 dark:text-white mono-num">
                {activeSession.energy_transferred_kwh.toFixed(2)} / {activeSession.energy_limit_kwh.toFixed(1)} kWh
              </span>
            </div>
            
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, (activeSession.energy_transferred_kwh / activeSession.energy_limit_kwh) * 100)}%`
                }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Time Remaining:</span>
              <span className="mono-num">
                {Math.max(0, Math.floor((activeSession.duration_limit_seconds - activeSession.elapsed_seconds) / 60))}m remaining
              </span>
            </div>
          </div>

          {/* Cloud Guardrail Status */}
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-neutral-700 dark:text-neutral-300">
                Cloud Sync Active · Meter A ➔ Backend ➔ Meter B
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Live</span>
          </div>

          {/* Safety Stop Button */}
          <button
            onClick={() => setIsConfirmStopOpen(true)}
            className="w-full py-2.5 rounded-2xl border border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop Energy Sharing</span>
          </button>
        </div>
      )}

      {/* 2. ACTIVE RECEIVING SESSION CARD */}
      {receivingSession && (
        <div className="glass-card p-5 border-sky-500/40 bg-sky-500/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Incoming Energy Share
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              {receivingSession.session_id}
            </span>
          </div>

          <div className="text-center py-2">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">
              Receiving from {receivingSession.source_meter_name}
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400 mono-num">
                {receivingSession.current_power_w}
              </span>
              <span className="text-xl font-bold text-neutral-500">W</span>
            </div>
          </div>

          <button
            onClick={stopReceiving}
            className="w-full py-2.5 rounded-2xl border border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 font-semibold text-xs flex items-center justify-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop Receiving</span>
          </button>
        </div>
      )}

      {/* 3. NEW SHARING SETUP (When Idle) */}
      {!activeSession && (
        <form onSubmit={handleStartShare} className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Start New Energy Share
              </h3>
            </div>
            <span className="text-[11px] text-neutral-500">Step 1 of 2</span>
          </div>

          {/* Recipient Search & Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Select Recipient Meter
            </label>
            
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Meter ID, Name, or Owner..."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Recipient Picker List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {filteredRecipients.map((r: RegisteredRecipient) => {
                const isSelected = selectedRecipient?.meter_id === r.meter_id;
                return (
                  <div
                    key={r.meter_id}
                    onClick={() => r.is_online && setSelectedRecipient(r)}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      !r.is_online
                        ? 'opacity-40 bg-neutral-100 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800 cursor-not-allowed'
                        : isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          {r.meter_name}
                        </span>
                        <span className="text-[10px] text-neutral-500 mono-num">
                          {r.meter_id} · {r.owner_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {r.is_online ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-500 px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800">
                          Offline
                        </span>
                      )}
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safety Limit Presets */}
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
            
            {/* Power Limit */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Power Limit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-num">{powerLimitW} Watts</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[250, 500, 1000].map(val => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setPowerLimitW(val)}
                    className={`py-1.5 rounded-xl font-bold border transition-all ${
                      powerLimitW === val
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {val} W
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Limit */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Energy Cap:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-num">{energyLimitKwh} kWh</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0.5, 1.0, 2.0].map(val => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setEnergyLimitKwh(val)}
                    className={`py-1.5 rounded-xl font-bold border transition-all ${
                      energyLimitKwh === val
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {val} kWh
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Limit */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Max Duration:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-num">{durationMinutes} Min</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 120].map(val => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setDurationMinutes(val)}
                    className={`py-1.5 rounded-xl font-bold border transition-all ${
                      durationMinutes === val
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {val} min
                  </button>
                ))}
              </div>
            </div>

          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedRecipient}
            className="btn-primary w-full py-3.5 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>Initiate Cloud Energy Share</span>
          </button>
        </form>
      )}

      {/* 4. SHARING HISTORY LOG */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Sharing History & Receipts
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500">{sharingHistory.length} completed</span>
        </div>

        <div className="space-y-2">
          {sharingHistory.map((session: SharingSession) => {
            const isSending = session.direction === 'sending';
            return (
              <div
                key={session.session_id}
                onClick={() => setSelectedHistorySession(session)}
                className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isSending ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'}`}>
                    {isSending ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white block">
                      {isSending ? `Shared to ${session.destination_meter_name}` : `Received from ${session.source_meter_name}`}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {session.started_at} · {session.session_id}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-neutral-900 dark:text-white mono-num block">
                    {session.energy_transferred_kwh.toFixed(2)} kWh
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 capitalize">
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Stop Confirmation Modal */}
      {isConfirmStopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm glass-card p-6 text-center space-y-4 bg-white dark:bg-neutral-900">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 mx-auto flex items-center justify-center">
              <StopCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Stop Energy Transfer?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                The cloud backend will safely close the active power channel.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmStopOpen(false)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  stopSharing();
                  setIsConfirmStopOpen(false);
                }}
                className="btn-primary flex-1 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-500 border-red-400"
              >
                Confirm Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Session Details Inspector Modal */}
      {selectedHistorySession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm glass-card p-6 space-y-4 bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Transfer Receipt</h3>
              <button
                onClick={() => setSelectedHistorySession(null)}
                className="text-neutral-400 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Session ID:</span>
                <span className="font-mono text-neutral-900 dark:text-white">{selectedHistorySession.session_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Transferred:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-num">
                  {selectedHistorySession.energy_transferred_kwh.toFixed(2)} kWh
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Duration:</span>
                <span className="text-neutral-900 dark:text-white">
                  {Math.round(selectedHistorySession.elapsed_seconds / 60)} minutes
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Cloud Sync:</span>
                <span className="text-neutral-900 dark:text-white">Meter A ➔ Cloud ➔ Meter B</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedHistorySession(null)}
              className="btn-primary w-full py-2.5 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
