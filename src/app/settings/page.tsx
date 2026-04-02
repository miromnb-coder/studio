
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Bell, 
  Shield, 
  Mail,
  Copy,
  Check,
  Zap,
  Info,
  RefreshCw,
  Cpu,
  Loader2
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRef = useMemoFirebase(() => {
    try {
      if (!db || !user) return null;
      return doc(db, 'users', user.uid);
    } catch (e) {
      console.error('Settings User Ref Error:', e);
      return null;
    }
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    if (db && user && profile && !profile.inboundEmailAddress) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = (user.email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const magicEmail = `${username}${randomSuffix}@operator.protocol`;
      
      updateDoc(doc(db, 'users', user.uid), {
        inboundEmailAddress: magicEmail
      });
    }
  }, [db, user, profile]);

  const handleCopy = () => {
    if (profile?.inboundEmailAddress && typeof window !== 'undefined') {
      navigator.clipboard.writeText(profile.inboundEmailAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 space-y-16">
        <header className="space-y-4 pt-8">
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Sync.</h1>
          <p className="text-xl text-muted-foreground font-medium">Protocol configuration and passive intelligence settings.</p>
        </header>

        <div className="grid grid-cols-1 gap-12">
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-headline tracking-tight uppercase tracking-widest text-[12px] flex items-center gap-2 text-white">
                  <Mail className="w-4 h-4 text-primary" />
                  Inbound Protocol
                </h2>
                <p className="text-sm text-muted-foreground font-medium">Magic address for autonomous document ingestion.</p>
              </div>

              <div className="premium-card bg-primary/5 border-primary/10 p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-primary">Magic Forwarding Address</Label>
                  <div className="flex gap-3">
                    <Input 
                      readOnly 
                      value={profile?.inboundEmailAddress || 'Initializing...'} 
                      className="h-14 bg-white/5 border-white/5 font-mono text-primary text-sm px-5 rounded-xl flex-1" 
                    />
                    <Button variant="outline" size="icon" className="w-14 h-14 rounded-xl border-white/5 hover:bg-white/5" onClick={handleCopy}>
                      {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5 text-white" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Automation Protocol</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "Register this address as email target.",
                      "Configure filters for receipts & renewals.",
                      "Enable auto-forwarding.",
                      "Operator will scan in background."
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground font-medium p-4 bg-white/5 rounded-xl">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0 font-bold">{i + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-12 border-t border-white/5">
              <h2 className="text-xl font-bold font-headline tracking-tight uppercase tracking-widest text-[12px] text-white">Operator Intelligence</h2>
              <div className="premium-card p-8 space-y-8 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-lg font-bold text-white">Conversational Ingestion</Label>
                    <p className="text-xs text-muted-foreground font-medium italic">Allow operator to process chat uploads immediately.</p>
                  </div>
                  <Switch checked />
                </div>
                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                  <div className="space-y-1">
                    <Label className="text-lg font-bold text-white">Predictive Scripts</Label>
                    <p className="text-xs text-muted-foreground font-medium italic">Pre-generate negotiation drafts for all detected waste.</p>
                  </div>
                  <Switch checked />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
