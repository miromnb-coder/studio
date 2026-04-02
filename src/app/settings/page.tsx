"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  Cpu
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  // Generate inbound email if missing
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
    if (profile?.inboundEmailAddress) {
      navigator.clipboard.writeText(profile.inboundEmailAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 space-y-16">
        <header className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter leading-[0.9]">Sync.</h1>
          <p className="text-xl text-muted-foreground font-medium">Configure protocol integration and intelligence preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <nav className="flex flex-col gap-2">
            <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl bg-white/5 text-primary">
              <Cpu className="w-4 h-4" />
              Protocol Sync
            </Button>
            <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl text-muted-foreground hover:bg-white/5">
              <User className="w-4 h-4" />
              Identity
            </Button>
            <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl text-muted-foreground hover:bg-white/5">
              <Bell className="w-4 h-4" />
              Alerts
            </Button>
          </nav>

          <div className="md:col-span-3 space-y-12">
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-headline tracking-tight uppercase tracking-widest text-[12px] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Inbound Protocol
                </h2>
                <p className="text-sm text-muted-foreground font-medium">Unique magic address for autonomous ingestion.</p>
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
                      {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Automation Guide</p>
                  <div className="grid gap-3">
                    {[
                      "Navigate to Email Settings > Forwarding.",
                      "Register Magic Address as protocol target.",
                      "Configure filters for: 'Receipt', 'Renewal', 'Price'.",
                      "Activate auto-forwarding protocol."
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground font-medium">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0 font-bold">{i + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-12 border-t border-white/5">
              <h2 className="text-xl font-bold font-headline tracking-tight uppercase tracking-widest text-[12px]">Intelligence Settings</h2>
              <div className="premium-card p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-lg font-bold">Autonomous Alerts</Label>
                    <p className="text-xs text-muted-foreground font-medium italic">Notify 72 hours prior to trial expiration.</p>
                  </div>
                  <Switch checked />
                </div>
                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                  <div className="space-y-1">
                    <Label className="text-lg font-bold">Script Generation</Label>
                    <p className="text-xs text-muted-foreground font-medium italic">Auto-prepare negotiation drafts for detected hikes.</p>
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
