"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Calendar, 
  ChevronRight, 
  Search,
  FileText,
  Mail,
  TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

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

  const isLoading = isUserLoading || isAnalysesLoading;

  return (
    <div className="min-h-screen bg-background pb-32 md:pt-32">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-8 space-y-24">
        <header className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9] tracking-tight">Timeline</h1>
          <p className="text-muted-foreground text-xl max-w-md font-medium">Historical record of your financial evolution.</p>
        </header>

        <div className="flex items-center gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
            <Input 
              placeholder="Search history..." 
              className="pl-14 bg-white/5 border-white/5 rounded-2xl h-16 text-lg font-medium focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="premium-card !p-6 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-8">
                  <Skeleton className="w-12 h-12 rounded-2xl bg-white/5" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48 bg-white/5" />
                    <Skeleton className="h-3 w-24 bg-white/5" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 bg-white/5" />
              </div>
            ))
          ) : filteredAnalyses && filteredAnalyses.length > 0 ? (
            filteredAnalyses.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link 
                  href={`/results/${item.id}`}
                  className="premium-card !p-6 flex items-center justify-between group hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                      {item.source === 'email' ? <Mail className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl font-headline tracking-tight">{item.title}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.analysisDate).toLocaleDateString()}
                        </span>
                        {item.source === 'email' && (
                          <span className="text-primary/60">• Email Scan</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12">
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold text-success tracking-tight">+${item.estimatedMonthlySavings.toFixed(0)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-all group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="premium-card py-32 text-center space-y-4 border-dashed border-white/5">
              <p className="text-2xl font-bold font-headline tracking-tight">No records found.</p>
              <p className="text-muted-foreground font-medium">Try adjusting your search or perform a new scan.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}