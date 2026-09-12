import React, { useState, useEffect, useRef } from 'react';
import { useMeter } from '../context/MeterContext';
import { askEnergyAssistant, getGroqApiKey, setGroqApiKey } from '../services/aiService';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  DollarSign,
  Clock,
  Key,
  Check,
  Activity
} from 'lucide-react';
import { FormattedAIMessage } from '../components/ai/FormattedAIMessage';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { id: 'p1', icon: Zap, label: 'Today’s Usage', query: 'How much energy did I consume today and what does it cost?' },
  { id: 'p2', icon: DollarSign, label: 'Bill Optimization', query: 'How can I reduce my monthly electricity cost by 20%?' },
  { id: 'p3', icon: Activity, label: 'Voltage & Grid Health', query: 'Is my line voltage healthy or should I be concerned about brownouts?' },
  { id: 'p4', icon: Clock, label: 'Runway Forecast', query: 'How many days will my current prepaid balance last at this rate?' }
];

export const AIScreen: React.FC = () => {
  const { meterData, tamperEvents, outageLogs } = useMeter();
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [isKeyConfigOpen, setIsKeyConfigOpen] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = getGroqApiKey();
    setGroqKeyInput(existing);
    setHasKey(Boolean(existing));
  }, []);

  const handleSaveGroqKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGroqApiKey(groqKeyInput);
    setHasKey(Boolean(groqKeyInput.trim()));
    setKeySavedMessage(true);
    setTimeout(() => {
      setKeySavedMessage(false);
      setIsKeyConfigOpen(false);
    }, 1500);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I'm **Voltrix AI**, your intelligent energy advisor for **${meterData.meter_name}** (${meterData.meter_id}).\n\nI monitor your live telemetry, grid stability, safety cutoffs, and prepaid depreciation in real time. Ask me anything or tap one of the quick questions below!`,
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const reply = await askEnergyAssistant(text, meterData, tamperEvents, outageLogs);
      const assistantMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an issue analyzing live meter telemetry. Please verify your connection or try again.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputQuery);
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in text-slate-900 dark:text-neutral-100 max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      
      {/* Top Header Card */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5b26] to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Voltrix AI Energy Advisor
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff5b26]/12 text-[#ff5b26] border border-[#ff5b26]/20">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {meterData.meter_name} • {meterData.meter_id}
              </p>
            </div>
          </div>

          {/* API Key Config Toggle Button */}
          <button
            onClick={() => setIsKeyConfigOpen(!isKeyConfigOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Configure Groq AI Key"
          >
            <Key className={`w-4 h-4 ${hasKey ? 'text-emerald-500' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Live Telemetry Snapshot Bar */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Line Voltage</span>
            <span className="font-bold text-slate-900 dark:text-white mono-num">{meterData.voltage.toFixed(1)}V</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Power Draw</span>
            <span className="font-bold text-slate-900 dark:text-white mono-num">{(meterData.active_power * 1000).toFixed(0)}W</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Prepaid Units</span>
            <span className="font-bold text-[#ff5b26] mono-num">{Number(meterData.prepaid_units_kwh || 0).toFixed(2)} kWh</span>
          </div>
        </div>

        {/* Collapsible Key Configuration */}
        {isKeyConfigOpen && (
          <form onSubmit={handleSaveGroqKey} className="mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800 text-xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-neutral-300">
                Optional Custom Groq API Key
              </span>
              {keySavedMessage && (
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
                placeholder="gsk_... (Leave blank to use built-in advisor engine)"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff5b26]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[#ff5b26] text-white font-bold hover:bg-[#e04512] transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_PROMPTS.map(p => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => handleSendMessage(p.query)}
              className="px-3 py-2 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:border-[#ff5b26]/50 hover:text-[#ff5b26] transition-all shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Icon className="w-3.5 h-3.5 text-[#ff5b26]" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Stream History */}
      <div className="flex-1 space-y-3 p-1">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#ff5b26]/15 text-[#ff5b26] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-[#ff5b26] text-white rounded-br-xs font-medium whitespace-pre-wrap'
                    : 'glass-card text-slate-800 dark:text-neutral-200 rounded-bl-xs'
                }`}
              >
                {isUser ? (
                  <div>{msg.text}</div>
                ) : (
                  <FormattedAIMessage content={msg.text} />
                )}
                <span
                  className={`text-[9px] block mt-1.5 text-right ${
                    isUser ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5 items-center text-xs text-slate-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-[#ff5b26]/15 text-[#ff5b26] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card px-4 py-2.5 rounded-2xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b26] animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b26] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b26] animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[11px] font-medium ml-1">Voltrix AI is analyzing telemetry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Sticky Query Input Bar */}
      <form onSubmit={onSubmit} className="sticky bottom-20 z-20 pt-2">
        <div className="glass-card p-1.5 flex items-center gap-2 border border-slate-200/90 dark:border-neutral-700/80 shadow-lg rounded-2xl">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Voltrix AI about energy, bill forecast, or voltage..."
            className="flex-1 px-3.5 py-2 text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="p-2.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04512] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Send Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
};

export default AIScreen;
