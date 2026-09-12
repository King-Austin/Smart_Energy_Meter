import React from 'react';
import { Search } from 'lucide-react';

export interface FleetSearchToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: 'all' | 'online' | 'tampered' | 'relay-off';
  setFilterType: (f: 'all' | 'online' | 'tampered' | 'relay-off') => void;
  counts: {
    all: number;
    online: number;
    tampered: number;
    relayOff: number;
  };
}

export const FleetSearchToolbar: React.FC<FleetSearchToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  counts
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search submeters by tenant, apartment, or Meter ID (e.g. MTR-8A24)..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#ff5b26]"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#ff5b26] text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('online')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'online'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          Online ({counts.online})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('tampered')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'tampered'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          Tampered ({counts.tampered})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('relay-off')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'relay-off'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          Relay Cutoff ({counts.relayOff})
        </button>
      </div>
    </div>
  );
};
