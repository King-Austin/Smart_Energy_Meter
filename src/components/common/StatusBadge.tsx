import React from 'react';
import { ShieldCheck, ShieldAlert, Power, Wifi, Battery } from 'lucide-react';

export interface StatusBadgeProps {
  type: 'grid' | 'contactor' | 'tamper' | 'wifi' | 'battery';
  value: boolean | string | number;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  label,
  className = ''
}) => {
  if (type === 'contactor') {
    const isConnected = Boolean(value);
    return (
      <span
        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
          isConnected
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
            : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
        } ${className}`}
      >
        <Power className="w-3 h-3" />
        <span>{label || (isConnected ? 'Contactor ON' : 'Contactor CUT')}</span>
      </span>
    );
  }

  if (type === 'tamper') {
    const isTampered = Boolean(value);
    return (
      <span
        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
          isTampered
            ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
        } ${className}`}
      >
        {isTampered ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
        <span>{label || (isTampered ? 'Tamper Alert' : 'Secure')}</span>
      </span>
    );
  }

  if (type === 'grid') {
    const isOnline = value === 'online' || value === true;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
          isOnline
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
            : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'
        } ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
        <span>{label || (isOnline ? 'Online' : 'Offline')}</span>
      </span>
    );
  }

  if (type === 'wifi') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400 font-mono ${className}`}>
        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
        <span>{String(value)}</span>
      </span>
    );
  }

  if (type === 'battery') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400 font-mono ${className}`}>
        <Battery className="w-3.5 h-3.5 text-emerald-500" />
        <span>{String(value)}%</span>
      </span>
    );
  }

  return null;
};
