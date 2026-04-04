
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  BrainCircuit, 
  Trash2, 
  RefreshCcw, 
  Target, 
  Heart, 
  Zap, 
  Clock,
  Plus,
  Loader2,
  Database,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function MemoryPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const memoryRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'memory', 'main');
  }, [db, user]);

  const { data: memory, isLoading } = useDoc(memoryRef);

  const removeMemoryItem = async (category: 'goals' | 'preferences' | 'subscriptions', item: string) => {
    if (!memoryRef || !memory) return;
    const updatedList = memory[category].filter((i: string) => i !== item);
    
    try {
      await updateDoc(memoryRef, {
        [category]: updatedList,
        lastUpdated: serverTimestamp()
      });
      toast({ title: "Memory Updated", description: "Context item purged from neural database." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed", description: "Insufficient clearance to modify memory." });
    }
  };

  const clearMemory = async () => {
    if (!memoryRef) return;
    if (confirm("CRITICAL: Wipe all neural context? This will reset agent personalization.")) {
      try {
        await updateDoc(memoryRef, {
          goals: [],
          preferences: [],
          subscriptions: [],
          behaviorSummary: "Passive intelligence gathering reset.",
          lastUpdated: serverTimestamp()
        });
        toast({ title: "Memory Wiped", description: "Agent context reset to default." });
      } catch (e) {
        toast({ variant: 'destructive', title: "Wipe Failed", description: "Database lock active." });
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Database className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Memory Control Panel</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Neural.</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-md">Manage persistent context and agent personalization.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={clearMemory} className="rounded-xl border-white/5 hover:bg-danger/10 hover:text-danger text-[10px] font-bold uppercase tracking-widest h-12">
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Memory
            </Button>
            <Button variant="outline" className="rounded-xl border-white/5 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest h-12">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="text-[10px] uppercase font-bold tracking-widest">Accessing Neural Database...</p>
          </div>
        ) : !memory ? (
          <div className="premium-card py-24 text-center space-y-4 border-dashed border-white/10">
            <BrainCircuit className="w-12 h-12 text-white/5 mx-auto" />
            <div className="space-y-2">
              <p className="text-xl font-bold text-white">No Stored Context</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Initialize an audit or chat to begin populating neural memory.</p>
            </div>
            <Button asChild className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12">
              <a href="/">Initialize Agent</a>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* BEHAVIOR SUMMARY */}
            <Card className="premium-card bg-primary/5 border-primary/20 p-8 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Autonomous Behavior Profile</h3>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight leading-snug">
                "{memory.behaviorSummary}"
              </p>
              <div className="flex items-center gap-4 pt-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                <span>Last Updated: {new Date(memory.lastUpdated?.toDate?.() || Date.now()).toLocaleString()}</span>
                <span>• Sync Mode: REAL-TIME</span>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* GOALS */}
              <Card className="premium-card bg-white/[0.01] border-white/5 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" />
                    Priority Goals
                  </h3>
                  <Badge variant="outline" className="text-[8px] opacity-30">{memory.goals?.length || 0}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(memory.goals || []).map((goal: string) => (
                    <Badge key={goal} variant="secondary" className="bg-white/5 border-white/5 hover:bg-white/10 text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-2 group cursor-default">
                      {goal}
                      <X className="w-3 h-3 cursor-pointer opacity-20 group-hover:opacity-100 hover:text-danger transition-all" onClick={() => removeMemoryItem('goals', goal)} />
                    </Badge>
                  ))}
                  <Button variant="ghost" className="rounded-xl h-8 px-3 text-[10px] border border-dashed border-white/10 hover:border-primary text-muted-foreground hover:text-primary">
                    <Plus className="w-3 h-3 mr-2" /> Add Goal
                  </Button>
                </div>
              </Card>

              {/* PREFERENCES */}
              <Card className="premium-card bg-white/[0.01] border-white/5 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5" />
                    Style Preferences
                  </h3>
                  <Badge variant="outline" className="text-[8px] opacity-30">{memory.preferences?.length || 0}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(memory.preferences || []).map((pref: string) => (
                    <Badge key={pref} variant="secondary" className="bg-white/5 border-white/5 hover:bg-white/10 text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-2 group cursor-default">
                      {pref}
                      <X className="w-3 h-3 cursor-pointer opacity-20 group-hover:opacity-100 hover:text-danger transition-all" onClick={() => removeMemoryItem('preferences', pref)} />
                    </Badge>
                  ))}
                  <Button variant="ghost" className="rounded-xl h-8 px-3 text-[10px] border border-dashed border-white/10 hover:border-accent text-muted-foreground hover:text-accent">
                    <Plus className="w-3 h-3 mr-2" /> Add Preference
                  </Button>
                </div>
              </Card>

              {/* SUBSCRIPTIONS */}
              <Card className="md:col-span-2 premium-card bg-white/[0.01] border-white/5 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-warning" />
                    Detected Subscriptions
                  </h3>
                  <Badge variant="outline" className="text-[8px] opacity-30">{memory.subscriptions?.length || 0}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {(memory.subscriptions || []).map((sub: string) => (
                     <div key={sub} className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between group">
                        <span className="text-xs font-bold truncate pr-2">{sub}</span>
                        <X className="w-3 h-3 cursor-pointer opacity-0 group-hover:opacity-100 hover:text-danger transition-all" onClick={() => removeMemoryItem('subscriptions', sub)} />
                     </div>
                   ))}
                </div>
                {(!memory.subscriptions || memory.subscriptions.length === 0) && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No subscriptions detected in current memory cycle.</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
