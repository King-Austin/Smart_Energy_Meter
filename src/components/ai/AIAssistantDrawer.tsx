import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import { askEnergyAssistant } from '../../services/aiService';
import { Sparkles, X, Send, Bot, User, Zap, DollarSign, Clock, HelpCircle } from 'lucide-react';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I'm Voltrix AI, your personal energy assistant for **${meterData.meter_name}** (${meterData.meter_id}).\n\nAsk me anything about your power consumption, tariff costs, or grid availability, or tap one of the quick questions below!`,
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col border-l border-neutral-200 dark:border-neutral-800 animate-slide-left">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ff5b26] text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
                Voltrix AI Energy Assistant
              </h3>
              <p className="text-[11px] text-neutral-500">
                Connected to {meterData.meter_name} ({meterData.meter_id})
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIAssistantOpen(false)}
            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
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
                className={`max-w-[85%] p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-[#ff5b26] text-white rounded-br-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 rounded-bl-xs border border-neutral-200 dark:border-neutral-700/60'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>
                <span
                  className={`text-[9px] block text-right mt-1.5 ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-neutral-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-neutral-500 text-xs pl-9">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#ff5b26]" />
              <span>Analyzing meter telemetry...</span>
            </div>
          )}
        </div>

        {/* 4 Quick Prompt Pills */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
            Suggested Queries
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.id}
                  onClick={() => handleSendMessage(prompt.query)}
                  className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 hover:border-[#ff5b26] text-left text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors group"
                >
                  <Icon className="w-3.5 h-3.5 text-[#ff5b26] shrink-0" />
                  <span className="truncate">{prompt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={onSubmit} className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about electricity, bills, outages..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 focus:outline-hidden focus:border-[#ff5b26]"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="p-2.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04f1e] text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
