import React, { useState, useEffect } from 'react';
import { useMeter } from '../../context/MeterContext';
import { generateAIInsights } from '../../services/aiService';
import { AIInsightReport } from '../../types/meter';
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Lightbulb, MessageSquare } from 'lucide-react';

export const AIInsightsCard: React.FC = () => {
  const { meterData, setIsAIAssistantOpen } = useMeter();
  const [insights, setInsights] = useState<AIInsightReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await generateAIInsights(meterData);
      if (isMounted) {
        setInsights(data);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [meterData.meter_id, meterData.active_power, meterData.energy_today, meterData.tariff_rate]);

  if (loading || !insights) {
    return (
      <div className="glass-card p-4 flex items-center justify-center gap-2 text-neutral-500 text-xs">
        <Sparkles className="w-4 h-4 animate-spin text-[#ff5b26]" />
        <span>Synthesizing AI energy intelligence...</span>
      </div>
    );
  }

  const getAnomalyBadge = () => {
    if (insights.anomalyStatus === 'abnormal') {
      return (
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Anomaly Flagged
        </span>
      );
    }
    if (insights.anomalyStatus === 'caution') {
      return (
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> High Load Caution
        </span>
      );
    }
    return (
      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" /> Pattern Normal
      </span>
    );
  };

  return (
    <div className="glass-card p-4 space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#ff5b26]/15 text-[#ff5b26]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              AI Energy Intelligence
            </h3>
          </div>
        </div>

        {getAnomalyBadge()}
      </div>

      {/* Predictions Bar */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase">
            <TrendingUp className="w-3 h-3 text-cyan-500" />
            <span>AI Bill Forecast</span>
          </div>
          <span className="text-base font-black text-neutral-900 dark:text-white mono-num block mt-0.5">
            ₦{insights.predictedMonthCostNaira.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500">
            ~{insights.predictedMonthKwh} kWh by month-end
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[10px] font-bold text-neutral-500 uppercase block">
            Peak Demand Period
          </span>
          <span className="text-xs font-bold text-neutral-900 dark:text-white block mt-1 leading-snug">
            {insights.peakUsagePeriod}
          </span>
        </div>
      </div>

      {/* Energy Saving Tips */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Tailored Energy-Saving Recommendations</span>
        </div>

        <div className="space-y-1">
          {insights.energySavingTips.map((tip, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed flex items-start gap-2"
            >
              <span className="text-[#ff5b26] font-bold mt-0.5">•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ask AI Assistant Trigger */}
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="w-full py-2 px-3 rounded-xl bg-[#ff5b26]/15 hover:bg-[#ff5b26]/25 border border-[#ff5b26]/30 text-[#ff5b26] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Ask AI Assistant (“Why is my bill high?”, etc.)</span>
      </button>
    </div>
  );
};
