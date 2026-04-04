"use client";

import { ToolCategory } from './types';
import { cn } from '@/lib/utils';
import { Search, Filter } from 'lucide-react';

const CATEGORIES: (ToolCategory | 'All')[] = [
  'All', 'Finance', 'Productivity', 'Email', 'Analysis', 'Strategy', 'Automation'
];

interface ToolFilterBarProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
}

export function ToolFilterBar({ activeCategory, onCategoryChange, search, onSearchChange }: ToolFilterBarProps) {
  return (
    <div className="space-y-8">
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for intelligence tools..."
          className="w-full h-16 pl-16 pr-8 bg-white/40 border border-white/60 rounded-[2rem] text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-sm outline-none"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 mr-2">
          <Filter className="w-4 h-4" />
        </div>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
              activeCategory === cat 
                ? "bg-primary text-white shadow-lg shadow-primary/20 border border-primary" 
                : "bg-white/40 text-slate-500 hover:bg-white/80 border border-white/60"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
