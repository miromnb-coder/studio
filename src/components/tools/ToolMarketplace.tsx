"use client";

import { useState, useEffect, useMemo } from 'react';
import { ToolDefinition } from './types';
import { ToolRegistryManager } from './ToolRegistryManager';
import { ToolCard } from './ToolCard';
import { ToolFilterBar } from './ToolFilterBar';
import { ToolDetailPanel } from './ToolDetailPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, ShieldCheck, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export function ToolMarketplace() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);

  const loadTools = () => setTools(ToolRegistryManager.getTools());

  useEffect(() => {
    loadTools();
    window.addEventListener('tool_registry_updated', loadTools);
    return () => window.removeEventListener('tool_registry_updated', loadTools);
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchCat = activeCategory === 'All' || t.category === activeCategory;
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [tools, activeCategory, search]);

  const activeTools = useMemo(() => tools.filter(t => t.status === 'active'), [tools]);

  return (
    <div className="space-y-16 pb-32">
      {/* Header Section */}
      <header className="space-y-6">
        <div className="flex items-center gap-3 text-primary">
          <Cpu className="w-6 h-6" />
          <span className="text-[12px] font-bold uppercase tracking-[0.4em]">Autonomous Registry</span>
        </div>
        <h1 className="text-7xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-[0.85]">Marketplace.</h1>
        <p className="text-xl text-slate-500 font-medium max-w-xl">Enable new intelligence protocols and audit agent capabilities.</p>
      </header>

      {/* Intelligence Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="!p-8 bg-primary/5 border-primary/10 flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-[9px] font-bold text-primary uppercase tracking-widest">System Health</div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{activeTools.length} Active</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Protocols</p>
          </div>
        </GlassCard>

        <GlassCard className="!p-8 hover:bg-white transition-all h-48 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center text-success">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-[9px] font-bold text-success uppercase tracking-widest">Yield Optimization</div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">+$1,240</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tool Reclaim</p>
          </div>
        </GlassCard>

        <GlassCard className="!p-8 border-dashed border-slate-200 bg-transparent flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer transition-all h-48">
          <div className="w-10 h-10 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Request Custom Tool</p>
        </GlassCard>
      </section>

      {/* Filters & Search */}
      <ToolFilterBar 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Tool Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onOpen={setSelectedTool} />
          ))}
        </AnimatePresence>
      </section>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="py-32 text-center space-y-4 opacity-40">
          <Cpu className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic">No tools matched your criteria.</p>
        </div>
      )}

      {/* Detail Panel */}
      <ToolDetailPanel tool={selectedTool} onClose={() => setSelectedTool(null)} />
    </div>
  );
}
