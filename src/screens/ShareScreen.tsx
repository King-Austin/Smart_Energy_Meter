import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { RegisteredRecipient, SharingSession } from '../types/meter';
import {
  Share2,
  Search,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Power,
  User,
  History,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  X
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
  const [energyLimitKwh, setEnergyLimitKwh] = useState<number>(1.0);
  
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
    const result = startSharing(selectedRecipient, energyLimitKwh);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to start sharing.');
    }
  };

  return (
    <div className="space-y-4 pb-10 animate-fade-in text-slate-900 dark:text-neutral-100">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Energy Share
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Cloud-synchronized peer-to-peer energy transfer between meters
        </p>
      </div>

      {/* 1. ACTIVE SENDING SESSION HUD */}
      {activeSession && (
        <div className="glass-card p-5 border-2 border-[#ff5b26]/50 bg-[#fff8f5] dark:bg-[#201511] space-y-4 shadow-md animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5b26] animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-wider text-[#ff5b26]">
                Live Energy Export
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-neutral-400">
              {activeSession.session_id}
            </span>
          </div>

          {/* Large Live Transfer Indicator */}
          <div className="text-center py-2">
            <span className="text-xs text-slate-600 dark:text-neutral-400 font-semibold block mb-0.5">
              Transferring to {activeSession.destination_meter_name}
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl sm:text-5xl font-black text-[#ff5b26] mono-num">
                {activeSession.energy_transferred_kwh.toFixed(2)}
              </span>
              <span className="text-xl font-bold text-slate-500 dark:text-neutral-400">
                / {activeSession.energy_limit_kwh.toFixed(1)} kWh
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, (activeSession.energy_transferred_kwh / activeSession.energy_limit_kwh) * 100)}%`
                }}
                className="h-full bg-[#ff5b26] rounded-full transition-all duration-500"
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
              <span>Remaining: {(Math.max(0, activeSession.energy_limit_kwh - activeSession.energy_transferred_kwh)).toFixed(2)} kWh</span>
              <span className="mono-num font-bold text-emerald-600 dark:text-emerald-400">Cloud Link Active</span>
            </div>
          </div>

          {/* Cloud Guardrail Status */}
          <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#ff5b26]" />
              <span className="text-slate-700 dark:text-neutral-300 font-medium">
                Remote Contactor Sync Active
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#ff5b26] bg-[#ff5b26]/10 px-2 py-0.5 rounded-full">
              Streaming
            </span>
          </div>

          {/* Dedicated Prominent Disconnect Button */}
          <button
            onClick={() => setIsConfirmStopOpen(true)}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Power className="w-4 h-4" />
            <span>Disconnect Share</span>
          </button>
        </div>
      )}

      {/* 2. ACTIVE RECEIVING SESSION HUD */}
      {receivingSession && (
        <div className="glass-card p-5 border-2 border-sky-500/50 bg-sky-50 dark:bg-sky-950/20 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Incoming Energy Stream
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {receivingSession.session_id}
            </span>
          </div>

          <div className="text-center py-2">
            <span className="text-xs text-slate-600 dark:text-neutral-400 block mb-0.5">
              Receiving from {receivingSession.source_meter_name}
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-sky-600 dark:text-sky-400 mono-num">
                {receivingSession.energy_transferred_kwh.toFixed(2)}
              </span>
              <span className="text-xl font-bold text-slate-500">kWh</span>
            </div>
          </div>

          <button
            onClick={stopReceiving}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
          >
            <Power className="w-4 h-4" />
            <span>Disconnect Stream</span>
          </button>
        </div>
      )}

      {/* 3. STREAMLINED SHARING SETUP (When Idle) */}
      {!activeSession && (
        <form onSubmit={handleStartShare} className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26]">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Send Energy to Peer Meter
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400">Cloud Sync</span>
          </div>

          {/* Recipient Search & Inset-Grouped Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Select Recipient Meter
            </label>
            
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Meter ID, Name, or House..."
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ff5b26]"
              />
            </div>

            {/* Recipient Picker List */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {filteredRecipients.map((r: RegisteredRecipient) => {
                const isSelected = selectedRecipient?.meter_id === r.meter_id;
                return (
                  <div
                    key={r.meter_id}
                    onClick={() => r.is_online && setSelectedRecipient(r)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      !r.is_online
                        ? 'opacity-40 bg-slate-50 dark:bg-neutral-900/30 border-slate-200 dark:border-neutral-800 cursor-not-allowed'
                        : isSelected
                        ? 'border-[#ff5b26] bg-[#ff5b26]/10 shadow-xs'
                        : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {r.meter_name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-neutral-400 mono-num">
                          {r.meter_id} · {r.owner_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.is_online ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800">
                          Offline
                        </span>
                      )}
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#ff5b26]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Energy Cap (kWh) Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">Energy Cap:</span>
              <span className="text-xs font-black text-[#ff5b26] mono-num">{energyLimitKwh} kWh</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1.0, 2.0, 5.0].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setEnergyLimitKwh(val)}
                  className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                    energyLimitKwh === val
                      ? 'bg-[#ff5b26] text-white border-[#ff5b26] shadow-xs'
                      : 'bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800 hover:border-slate-300'
                  }`}
                >
                  {val} kWh
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedRecipient}
            className="btn-primary w-full py-3.5 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Start Energy Share ({energyLimitKwh} kWh)</span>
          </button>
        </form>
      )}

      {/* 4. SHARING HISTORY & RECEIPTS */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#ff5b26]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Sharing History
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">{sharingHistory.length} sessions</span>
        </div>

        <div className="space-y-2">
          {sharingHistory.map((session: SharingSession) => {
            const isSending = session.direction === 'sending';
            return (
              <div
                key={session.session_id}
                onClick={() => setSelectedHistorySession(session)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 flex items-center justify-between cursor-pointer hover:border-[#ff5b26]/30 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isSending ? 'bg-[#ff5b26]/12 text-[#ff5b26]' : 'bg-sky-500/12 text-sky-600 dark:text-sky-400'}`}>
                    {isSending ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {isSending ? `Shared to ${session.destination_meter_name}` : `Received from ${session.source_meter_name}`}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                      {session.started_at} · {session.session_id}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 dark:text-white mono-num block">
                    {session.energy_transferred_kwh.toFixed(2)} kWh
                  </span>
                  <span className="text-[10px] font-bold text-[#ff5b26] capitalize">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 mx-auto flex items-center justify-center">
              <Power className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Disconnect Energy Share?</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                The cloud backend will safely close the active power channel and record final transfer units.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmStopOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  stopSharing();
                  setIsConfirmStopOpen(false);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Session Details Inspector Modal */}
      {selectedHistorySession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Transfer Receipt</h3>
              <button
                onClick={() => setSelectedHistorySession(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-slate-500">Session ID:</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{selectedHistorySession.session_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-slate-500">Transferred:</span>
                <span className="font-bold text-[#ff5b26] mono-num">
                  {selectedHistorySession.energy_transferred_kwh.toFixed(2)} kWh
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-slate-500">Duration:</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {Math.round(selectedHistorySession.elapsed_seconds / 60)} minutes
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-slate-500">Sync Pipeline:</span>
                <span className="text-slate-900 dark:text-white font-semibold">Meter A ➔ Cloud ➔ Meter B</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedHistorySession(null)}
              className="btn-primary w-full py-2.5 text-xs font-bold rounded-2xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
