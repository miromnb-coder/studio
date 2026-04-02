"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Calendar, 
  ChevronRight, 
  Search,
  FileText,
  Mail,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const analysesQuery = useMemoFirebase(() => {
    try {
      if (!db || !user) return null;
      return query(
        collection(db, 'users', user.uid, 'analyses'),
        orderBy('createdAt', 'desc')
      );
    } catch (e) {
      console.error('History Query Error:', e);
      return null;
    }
  }, [db, user]);

  const { data: analyses, isLoading: isAnalysesLoading } = useCollection(analysesQuery);

  const filteredAnalyses = (Array.isArray(analyses) ? analyses : []).filter(a => 
    a && (
      (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.summary || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const isLoading = isAnalysesLoading || !mounted;

  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-6 space-y-16">
        <header className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Ledger.</h1>
          <p className="text-xl text-muted-foreground font-medium">Historical audit records and reclaimed liquidty.</p>
        </header>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
          <Input 
            placeholder="Search audit records..." 
            className="pl-14 bg-white/5 border-white/5 rounded-2xl h-14 text-base font-medium focus:ring-primary/20 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="premium-card flex items-center justify-between opacity-50">
                <Skeleton className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="space-y-2 flex-1 mx-6">
                  <Skeleton className="h-5 w-40 bg-white/5" />
                  <Skeleton className="h-3 w-20 bg-white/5" />
                </div>
                <Skeleton className="h-8 w-16 bg-white/5" />
              </div>
            ))
          ) : Array.isArray(filteredAnalyses) && filteredAnalyses.length > 0 ? (
            filteredAnalyses.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link 
                  href={`/results/${item.id}`}
                  className="premium-card flex items-center justify-between group hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                      {item.source === 'email' ? <Mail className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg font-headline tracking-tight text-white">{item.title || 'Audit Report'}</h3>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {item.analysisDate ? new Date(item.analysisDate).toLocaleDateString() : 'Recent'}
                        </span>
                        <span>• {item.source?.replace('_', ' ') || 'Manual'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <p className="text-xl font-bold text-success font-headline tracking-tight">+${item.estimatedMonthlySavings?.toFixed(0) || 0}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-all group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="premium-card py-24 text-center space-y-4 border-dashed border-white/10">
              <p className="text-muted-foreground font-medium">No matching audit records found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
