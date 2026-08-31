import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Share2, ArrowRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const QuickShareCard: React.FC = () => {
  const { activeSession, receivingSession, setActiveTab } = useMeter();

  const isSending = !!activeSession && activeSession.status === 'active';
  const isReceiving = !!receivingSession && receivingSession.status === 'receiving';

  return (
    <div
      onClick={() => setActiveTab('share')}
      className={`glass-card p-4 flex items-center justify-between cursor-pointer transition-all hover:border-emerald-500/40 ${
        isSending
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : isReceiving
          ? 'border-sky-500/40 bg-sky-500/5'
          : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-2xl ${
            isSending
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : isReceiving
              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          {isSending ? (
            <ArrowUpRight className="w-5 h-5 animate-pulse" />
          ) : isReceiving ? (
            <ArrowDownLeft className="w-5 h-5 animate-pulse" />
          ) : (
            <Share2 className="w-5 h-5" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            {isSending
              ? 'Active Energy Export'
              : isReceiving
              ? 'Receiving Energy from Cloud'
              : 'Cloud Energy Sharing'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isSending
              ? `Exporting ${activeSession.current_power_w} W to ${activeSession.destination_meter_name}`
              : isReceiving
              ? `Receiving ${receivingSession.current_power_w} W from ${receivingSession.source_meter_name}`
              : 'Share electricity with neighbours or family meters'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isSending || isReceiving ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Live Stream
          </span>
        ) : (
          <button className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
            <span>Share</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
