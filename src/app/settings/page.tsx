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
  Lock, 
  Shield, 
  Database,
  Mail,
  Copy,
  Check,
  Zap,
  Info,
  RefreshCw
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
      const magicEmail = `${username}${randomSuffix}@ailifeoperator.app`;
      
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
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-8 py-12 space-y-24 animate-in fade-in duration-700">
        <header className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[0.9] tracking-tight">Sync</h1>
          <p className="text-muted-foreground text-xl max-w-md font-medium">Configure your inbox operator.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <aside className="space-y-4">
            <nav className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start gap-4 h-14 rounded-2xl bg-white/5 text-primary">
                <RefreshCw className="w-5 h-5" />
                Inbox Sync
              </Button>
              <Button variant="ghost" className="justify-start gap-4 h-14 rounded-2xl hover:bg-white/5 text-muted-foreground">
                <User className="w-5 h-5" />
                Profile
              </Button>
              <Button variant="ghost" className="justify-start gap-4 h-14 rounded-2xl hover:bg-white/5 text-muted-foreground">
                <Bell className="w-5 h-5" />
                Alerts
              </Button>
            </nav>
          </aside>

          <div className="md:col-span-2 space-y-16">
            <section className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline flex items-center gap-4">
                  <Zap className="w-8 h-8 text-primary" />
                  Magic Forwarding
                </h2>
                <p className="text-muted-foreground font-medium">Your unique address for receipt ingestion.</p>
              </div>

              <Card className="premium-card bg-primary/5 border-primary/20 !p-12">
                <CardContent className="p-0 space-y-12">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold tracking-[0.3em] text-primary">Magic Forwarding Address</Label>
                    <div className="flex gap-4">
                      <Input 
                        readOnly 
                        value={profile?.inboundEmailAddress || 'Generating...'} 
                        className="h-16 bg-white/5 border-white/10 font-mono text-primary text-lg px-6 rounded-2xl" 
                      />
                      <Button variant="outline" size="icon" className="w-16 h-16 rounded-2xl border-white/10 hover:bg-white/10 transition-all" onClick={handleCopy}>
                        {copied ? <Check className="w-6 h-6 text-success" /> : <Copy className="w-6 h-6" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">How to automate (Gmail/Outlook)</p>
                    <div className="space-y-4">
                      {[
                        "Go to your Email Settings > Forwarding.",
                        "Add your Magic Address as a forwarding target.",
                        "Create a filter for keywords: 'Receipt', 'Invoice', 'Renewal'.",
                        "Set it to auto-forward to your Magic Address."
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-4 text-muted-foreground font-medium">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0">{i + 1}</span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-8 pt-8 border-t border-white/5">
              <h2 className="text-3xl font-bold font-headline">Intelligence Prefs</h2>
              <Card className="premium-card !p-12">
                <CardContent className="p-0 space-y-12">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Label className="text-xl font-bold">Automatic Trial Alerts</Label>
                      <p className="text-sm text-muted-foreground font-medium">Notify me 3 days before any trial expiration.</p>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Label className="text-xl font-bold">Negotiation Drafts</Label>
                      <p className="text-sm text-muted-foreground font-medium">Always prepare negotiation scripts for new receipts.</p>
                    </div>
                    <Switch checked />
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}