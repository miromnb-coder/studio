"use client";

import { useState, useEffect, useMemo } from 'react';
import { ToolDefinition } from './types';
import { ToolRegistryManager } from './ToolRegistryManager';
import { ToolCard } from './ToolCard';
import { ToolFilterBar } from './ToolFilterBar';
import { ToolDetailPanel } from './ToolDetailPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, ShieldCheck, Plus, TrendingUp, History, LayoutGrid, Compass, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ToolMarketplace() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [activeTab, setActiveTab] = useState<'installed' | 'explore'>('installed');
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadTools = () => setTools(ToolRegistryManager.getTools());

  useEffect(() => {
    loadTools();
    window.addEventListener('tool_registry_updated', loadTools);
    return () => window.removeEventListener('tool_registry_updated', loadTools);
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchTab = activeTab === 'installed' ? t.status === 'active' : t.status !== 'active';
      const matchCat = activeCategory === 'All' || t.category === activeCategory;
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchCat && matchSearch;
    });
  }, [tools, activeTab, activeCategory, search]);

  const recommendedTools = useMemo(() => tools.slice(0, 2), [tools]);

  return (
    <div className="space-y-16 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Cpu className="w-6 h-6" />
            <span className="text-[12px] font-bold uppercase tracking-[0.4em]">Autonomous Registry</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-[0.85]">Marketplace.</h1>
          <p className="text-xl text-slate-500 font-medium max-w-xl">Manage your agent's neural capabilities and audit verified protocols.</p>
        </div>
        
        <Button 
          onClick={() => setIsCreating(true)}
          className="h-16 px-8 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 mr-3" />
          Create Tool
        </Button>
      </header>

      {/* Proof of Intelligence Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="!p-8 bg-primary/5 border-primary/10 flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-[9px] font-bold text-primary uppercase tracking-widest">Active Intelligence</div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">{tools.filter(t => t.status === 'active').length} Protocols</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currently In Reasoner Loop</p>
          </div>
        </GlassCard>

        <GlassCard className="!p-8 hover:bg-white transition-all h-48 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center text-success">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-[9px] font-bold text-success uppercase tracking-widest">Total Savings</div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900">+$1,450.00</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reclaimed via Tool Ops</p>
          </div>
        </GlassCard>

        <GlassCard className="!p-8 bg-slate-50 border-white h-48 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Execution</div>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-slate-900">Leak Detector</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">24 minutes ago</p>
          </div>
        </GlassCard>
      </section>

      {/* Unified Control Bar */}
      <div className="space-y-8 sticky top-24 z-40">
        <div className="flex flex-col md:flex-row gap-6 p-4 rounded-[2.5rem] glass-panel border-white/80 shadow-lg">
          <div className="flex p-1 bg-slate-100/50 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('installed')}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'installed' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Installed
            </button>
            <button 
              onClick={() => setActiveTab('explore')}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'explore' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              Explore
            </button>
          </div>
          <div className="flex-1">
            <ToolFilterBar 
              activeCategory={activeCategory} 
              onCategoryChange={setActiveCategory}
              search={search}
              onSearchChange={setSearch}
            />
          </div>
        </div>
      </div>

      {/* Recommendations - Only in Explore */}
      {activeTab === 'explore' && !search && (
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">AI Personal Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recommendedTools.map(t => <ToolCard key={t.id} tool={t} onOpen={setSelectedTool} isRecommended />)}
          </div>
        </section>
      )}

      {/* Main Grid */}
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
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic">
            {activeTab === 'installed' ? 'Protocol stack empty. Visit Explore to add logic.' : 'No matching signals in registry.'}
          </p>
        </div>
      )}

      {/* Tool Proposal Overlay */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] border border-white/80 shadow-2xl overflow-hidden"
            >
              <div className="p-12 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tighter text-slate-900">Neural Request</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Describe a new capability</p>
                  </div>
                </div>
                <textarea 
                  placeholder="e.g. 'Build a tool that tracks my study hours and compares them to my deep work goals...'"
                  className="w-full h-48 p-8 rounded-3xl bg-slate-50 border-0 focus:ring-2 focus:ring-primary/20 text-lg font-medium resize-none placeholder:text-slate-300"
                />
                <div className="flex gap-4">
                  <Button 
                    className="flex-1 h-16 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest text-[11px]"
                    onClick={() => { setIsCreating(false); }}
                  >
                    Propose Protocol
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-16 px-8 rounded-2xl text-[11px] font-bold uppercase tracking-widest"
                    onClick={() => setIsCreating(false)}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToolDetailPanel tool={selectedTool} onClose={() => setSelectedTool(null)} />
    </div>
  );
}
