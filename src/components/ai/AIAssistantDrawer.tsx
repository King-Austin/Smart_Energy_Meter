import React, { useState, useEffect } from 'react';
import { useMeter } from '../../context/MeterContext';
import { askEnergyAssistant, getGroqApiKey, setGroqApiKey } from '../../services/aiService';
import { Sparkles, X, Send, Bot, User, Zap, DollarSign, Clock, HelpCircle, Key, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { FormattedAIMessage } from './FormattedAIMessage';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { id: 'p1', icon: Zap, label: 'How much did I use today?', query: 'How much did I use today?' },
  { id: 'p2', icon: DollarSign, label: 'Why is my bill high?', query: 'Why is my bill high?' },
  { id: 'p3', icon: Clock, label: 'When was the last outage?', query: 'When was the last outage?' },
  { id: 'p4', icon: HelpCircle, label: 'Is my consumption unusual?', query: 'Is my consumption unusual?' }
];

export const AIAssistantDrawer: React.FC = () => {
  const { meterData, tamperEvents, outageLogs, isAIAssistantOpen, setIsAIAssistantOpen } = useMeter();
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [isKeyConfigOpen, setIsKeyConfigOpen] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const existing = getGroqApiKey();
    setGroqKeyInput(existing);
    setHasKey(Boolean(existing));
  }, [isAIAssistantOpen]);

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
      text: `Hello! I'm Voltrix AI, your personal energy advisor for **${meterData.meter_name}** (${meterData.meter_id}).\n\nAsk me anything about your power consumption, tariff costs, or grid availability, or tap one of the quick questions below!`,
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isAIAssistantOpen) return null;

  const handleSendMessage = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

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
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Sorry, I encountered an issue processing your query. Please try again.',
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#0d1219] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-neutral-800 animate-slide-left">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-[#ff5b26] text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Voltrix AI Energy Advisor
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Connected to {meterData.meter_name} ({meterData.meter_id})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsKeyConfigOpen(!isKeyConfigOpen)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                  hasKey
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                }`}
                title="Configure Groq API Key"
              >
                <Zap className="w-3 h-3 text-[#ff5b26]" />
                <span>{hasKey ? 'Groq ⚡' : 'Set Groq Key'}</span>
                {isKeyConfigOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                onClick={() => setIsAIAssistantOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expandable Groq Key Config */}
          {isKeyConfigOpen && (
            <form onSubmit={handleSaveGroqKey} className="mt-3 p-3 rounded-2xl bg-white dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700 shadow-xs animate-fade-in space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#ff5b26]" />
                  Groq API Key (Llama 3.3 Ultra-Fast)
                </span>
                {keySavedMessage && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                Provide your Groq API key to unlock sub-second, unlimited conversational energy intelligence.
              </p>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-[#ff5b26]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04f1e] text-white text-xs font-bold transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-white dark:bg-[#0d1219]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#ff5b26]/20 text-[#ff5b26] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-[#ff5b26] text-white rounded-br-xs shadow-xs whitespace-pre-line leading-relaxed'
                    : 'bg-slate-100 dark:bg-neutral-800/90 text-slate-800 dark:text-neutral-200 rounded-bl-xs border border-slate-200 dark:border-neutral-700/60 shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <div>{msg.text}</div>
                ) : (
                  <FormattedAIMessage content={msg.text} />
                )}
                <span
                  className={`text-[9px] block text-right mt-1.5 ${
                    msg.sender === 'user' ? 'text-white/75' : 'text-slate-500 dark:text-neutral-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-slate-500 dark:text-neutral-400 text-xs pl-9">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#ff5b26]" />
              <span>Analyzing meter telemetry...</span>
            </div>
          )}
        </div>

        {/* 4 Quick Prompt Pills */}
        <div className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block">
            Suggested Queries
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.id}
                  onClick={() => handleSendMessage(prompt.query)}
                  className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 hover:border-[#ff5b26] text-left text-[11px] font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors group shadow-2xs"
                >
                  <Icon className="w-3.5 h-3.5 text-[#ff5b26] shrink-0" />
                  <span className="truncate">{prompt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={onSubmit} className="p-3 border-t border-slate-200 dark:border-neutral-800 flex gap-2 bg-white dark:bg-[#0d1219]">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about electricity, bills, outages..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-neutral-700 focus:outline-hidden focus:border-[#ff5b26]"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="p-2.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04f1e] text-white disabled:opacity-40 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
