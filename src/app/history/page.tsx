"use client";

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { 
  History as HistoryIcon, 
  Calendar, 
  ChevronRight, 
  Search,
  Filter,
  FileText,
  TrendingUp,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useState } from 'react';

export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const analysesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'analyses'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: analyses, isLoading: isAnalysesLoading } = useCollection(analysesQuery);

  const filteredAnalyses = analyses?.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUserLoading || isAnalysesLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline">History</h1>
            <p className="text-muted-foreground">A timeline of your financial optimizations.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search past analyses..." 
              className="pl-10 bg-white/5 border-white/5 rounded-full h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-full h-11 border-white/5 bg-white/5 gap-2 px-6">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        <div className="space-y-4">
          {filteredAnalyses && filteredAnalyses.map((item, i) => (
            <Link 
              key={item.id} 
              href={`/results/${item.id}`}
              className="premium-card block p-6 hover:bg-white/[0.03] transition-all group border-l-4 border-l-transparent hover:border-l-primary"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.analysisDate).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{item.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-white/5">
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Potential Savings</p>
                    <p className="text-xl font-bold text-success">+${item.estimatedMonthlySavings.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-white/5 text-[10px] uppercase font-bold tracking-tight">
                      {item.inputMethod}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {(!filteredAnalyses || filteredAnalyses.length === 0) && (
            <div className="p-12 text-center border rounded-xl border-dashed">
              <p className="text-muted-foreground">No analyses found match your search.</p>
            </div>
          )}
        </div>

        <div className="pt-8 text-center">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            No more activity
          </Button>
        </div>
      </main>
    </div>
  );
}
