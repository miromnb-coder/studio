
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
  Info
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
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <aside className="space-y-1">
            <nav className="flex flex-col gap-1">
              <Button variant="ghost" className="justify-start gap-3 rounded-xl bg-white/5">
                <User className="w-4 h-4" />
                Profile
              </Button>
              <Button variant="ghost" className="justify-start gap-3 rounded-xl hover:bg-white/5">
                <Mail className="w-4 h-4" />
                Email Integration
              </Button>
              <Button variant="ghost" className="justify-start gap-3 rounded-xl hover:bg-white/5">
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
            </nav>
          </aside>

          <div className="md:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Magic Forwarding Address
              </h2>
              <Card className="premium-card bg-primary/5 border-primary/20">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Your Unique Inbound Email</Label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={profile?.inboundEmailAddress || 'Generating...'} 
                        className="bg-white/5 border-white/10 font-mono text-primary" 
                      />
                      <Button variant="outline" size="icon" className="rounded-xl border-white/10" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                      <Info className="w-3 h-3" />
                      How it works
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Forward any digital receipt, order confirmation, or invoice to this address. 
                      Our operator will process it instantly and notify you of any savings found.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold font-headline">Profile Information</h2>
              <Card className="premium-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Display Name</Label>
                      <Input id="displayName" defaultValue={user?.displayName || 'Jane Doe'} className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue={user?.email || ''} disabled className="bg-white/5 border-white/10 opacity-50" />
                  </div>
                  <Button className="rounded-full">Update profile</Button>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold font-headline">Preferences</h2>
              <Card className="premium-card">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Use the deep dark theme by default.</p>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Proactive Email Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly summaries of your automated findings.</p>
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
