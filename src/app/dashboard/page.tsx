"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  ChevronRight,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Search,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisService } from '@/services/analysis-service';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [command, setCommand] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'analyses'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [db, user]);

  const { data: analyses, isLoading: isAnalysesLoading } = useCollection(analysesQuery);
  const totalSavings = analyses?.reduce((acc, a) => acc + (a.estimatedMonthlySavings || 0), 0) || 0;
  const isLoading = isUserLoading || isAnalysesLoading;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.toLowerCase().includes('save me money') || !user || !db) return;
    
    setIsOptimizing(true);
    const result = await AnalysisService.analyze({ documentText: 'Command: Save me money' });
    
    const analysesRef = collection(db, 'users', user.uid, 'analyses');
    const docRef = await addDocumentNonBlocking(analysesRef, {
      userId: user.uid,
      title: result.title,
      summary: result.summary,
      estimatedMonthlySavings: result.savingsEstimate,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'command',
      inputContent: command,
      beforeComparison: JSON.stringify(result.beforeAfterComparison),
      createdAt: serverTimestamp(),
      source: 'command'
    });

    if (docRef) {
      const itemsRef = collection(db, 'users', user.uid, 'analyses', docRef.id, 'detected_items');
      for (const item of result.detectedItems) {
        addDocumentNonBlocking(itemsRef, {
          ...item,
          userId: user.uid,
          analysisId: docRef.id,
        });
      }
    }
    
    setCommand('');
    setIsOptimizing(false);
  };

  const upcomingRenewals = [
    { name: 'Netflix', date: 'In 18 hours', amount: 19.99, urgency: 'urgent' },
    { name: 'Adobe CC', date: 'In 3 days', amount: 54.99, urgency: 'high' },
    { name: 'Spotify', date: 'In 12 days', amount: 10.99, urgency: 'low' },
  ];

  return (
    <div className="min-h-screen bg-background pb-32 md:pt-32">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 space-y-24">
        {/* Command Center */}
        <section className="relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <form onSubmit={handleCommand} className="relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full group-focus-within:bg-primary/20 transition-all" />
              <div className="relative flex items-center bg-card border border-white/5 rounded-[32px] p-2 shadow-2xl">
                <Search className="ml-6 w-6 h-6 text-muted-foreground/50" />
                <Input 
                  placeholder="What should I optimize? (e.g., 'Save me money')" 
                  className="h-20 border-0 bg-transparent text-2xl focus-visible:ring-0 placeholder:text-muted-foreground/30 font-medium px-6"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
                <Button 
                  type="submit" 
                  disabled={!command || isOptimizing}
                  className="rounded-[24px] h-16 px-12 text-lg font-bold shadow-xl shadow-primary/20"
                >
                  {isOptimizing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Optimize'}
                </Button>
              </div>
            </form>
          </motion.div>
        </section>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9] tracking-tight">Operator</h1>
            <p className="text-muted-foreground text-xl max-w-md font-medium">Passive optimization active.</p>
          </div>
          <div className="premium-card !p-12 bg-success/[0.02] border-success/10 text-center min-w-[320px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 mb-2">Total Monthly Reclaimed</p>
            {isLoading ? (
              <Skeleton className="h-16 w-32 mx-auto bg-white/5" />
            ) : (
              <h2 className="text-8xl font-bold font-headline text-success glow-success tracking-tighter">
                €{totalSavings.toFixed(0)}
              </h2>
            )}
          </div>
        </header>

        {/* Proactive Intelligence Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Action Engine */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-4">
              <Zap className="w-8 h-8 text-primary" />
              Active Actions
            </h3>
            
            <div className="grid gap-6">
              {!isLoading && analyses?.[0]?.source === 'command' ? (
                analyses[0].id && <ActionCard analysisId={analyses[0].id} />
              ) : (
                <div className="premium-card bg-white/[0.01] border-dashed border-white/5 py-24 text-center space-y-4">
                  <ShieldCheck className="w-12 h-12 text-primary/20 mx-auto" />
                  <p className="text-xl font-medium text-muted-foreground">No critical leaks identified.</p>
                </div>
              )}
            </div>
          </div>

          {/* Renewals Widget */}
          <div className="space-y-8">
            <h3 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-4">
              <Clock className="w-8 h-8 text-warning" />
              Upcoming
            </h3>
            <div className="premium-card space-y-8">
              {upcomingRenewals.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <div className="space-y-1">
                    <p className="font-bold text-xl">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.urgency === 'urgent' ? 'bg-danger animate-pulse' : 
                        item.urgency === 'high' ? 'bg-warning' : 'bg-primary'
                      )} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">€{item.amount}</p>
                    <Link href="/analyze" className="text-[8px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">Intervene</Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Optimizer Mockup */}
            <h3 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-4 pt-12">
              <Calendar className="w-8 h-8 text-accent" />
              Time Brain
            </h3>
            <div className="premium-card bg-accent/5 border-accent/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-4">Calendar Scan Result</p>
              <div className="space-y-4">
                <p className="text-lg font-bold leading-tight">Recurring "Status Sync" takes 2.5h this week.</p>
                <p className="text-sm text-muted-foreground font-medium italic">"This task is low priority. Delete or delegate?"</p>
                <div className="flex gap-4 pt-2">
                  <Button variant="outline" size="sm" className="rounded-full px-6 text-[10px] uppercase font-bold tracking-widest border-accent/20 hover:bg-accent/10">Delegate</Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-6 text-[10px] uppercase font-bold tracking-widest text-danger hover:bg-danger/10">Delete</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <h3 className="text-3xl font-bold font-headline tracking-tight">Timeline</h3>
            <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              Full History
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid gap-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-3xl" />)
            ) : analyses?.map((analysis, i) => (
              <Link key={analysis.id} href={`/results/${analysis.id}`} className="premium-card !p-8 flex items-center justify-between group hover:bg-white/[0.02]">
                <div className="flex items-center gap-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                    {analysis.inputMethod === 'command' ? <Zap className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold font-headline tracking-tight">{analysis.title}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {new Date(analysis.analysisDate).toLocaleDateString()} • {analysis.source}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-success tracking-tight">+€{analysis.estimatedMonthlySavings.toFixed(0)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ActionCard({ analysisId }: { analysisId: string }) {
  const { user } = useUser();
  const db = useFirestore();

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user || !analysisId) return null;
    return collection(db, 'users', user.uid, 'analyses', analysisId, 'detected_items');
  }, [db, user, analysisId]);

  const { data: items } = useCollection(itemsQuery);

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-6">
      {items.map((item, idx) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="premium-card bg-primary/[0.02] border-primary/10 hover:border-primary/20 transition-all p-12 space-y-8"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <Badge variant={item.urgencyLevel === 'urgent' ? 'destructive' : 'secondary'} className="rounded-full px-4 py-1 text-[8px] font-bold uppercase tracking-widest">
                {item.urgencyLevel} Priority
              </Badge>
              <h4 className="text-4xl font-bold font-headline">{item.title}</h4>
              <div className="flex items-center gap-3 text-success">
                <TrendingUp className="w-5 h-5" />
                <p className="text-lg font-bold font-headline">🟢 INSIGHT: {item.summary}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly reclaimed</p>
              <p className="text-5xl font-bold text-success glow-success tracking-tight">€{item.estimatedSavings}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Protocol</p>
              <p className="text-xl font-bold">Cancellation script prepared.</p>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="rounded-full h-14 px-8 text-[10px] uppercase font-bold tracking-[0.2em] border-white/10 hover:bg-white/5"
                onClick={() => navigator.clipboard.writeText(item.copyableMessage || '')}
              >
                Copy Script
              </Button>
              <Button 
                asChild
                className="rounded-full h-14 px-10 text-[10px] uppercase font-bold tracking-[0.2em] bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <a href={`mailto:support@${item.title.split(' ')[0].toLowerCase()}.com?subject=Inquiry Regarding ${item.title}&body=${encodeURIComponent(item.copyableMessage || '')}`}>
                  <Send className="w-4 h-4 mr-2" />
                  Execute Change
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
