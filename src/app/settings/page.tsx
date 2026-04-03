
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Mail,
  Copy,
  Check,
  Info,
  Cpu,
  Loader2,
  Lock,
  MailCheck,
  Server,
  Activity,
  Database,
  Globe,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { GmailService } from '@/services/gmail-service';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const status = typeof window !== 'undefined' ? localStorage.getItem('operator_gmail_connected') : null;
    if (status === 'true') setGmailConnected(true);
  }, []);

  const userRef = useMemoFirebase(() => {
    try {
      if (!db || !user?.uid) return null;
      return doc(db, 'users', user.uid);
    } catch (e) {
      console.error('Settings: userRef error', e);
      return null;
    }
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // Initialize magic forwarding email if missing
  useEffect(() => {
    if (mounted && db && user?.uid && profile && !profile.inboundEmailAddress) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = (user.email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const magicEmail = `${username}${randomSuffix}@operator.protocol`;
      
      const docRef = doc(db, 'users', user.uid);
      updateDoc(docRef, {
        inboundEmailAddress: magicEmail,
        updatedAt: new Date().toISOString()
      }).catch(err => console.error("Failed to initialize magic email", err));
    }
  }, [mounted, db, user?.uid, profile]);

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    const token = await GmailService.connect();
    if (token) {
      setGmailConnected(true);
      localStorage.setItem('operator_gmail_connected', 'true');
      toast({
        title: "Intelligence Connected",
        description: "Gmail protocol is now active and scanning for billing patterns.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Connection Protocol Refused",
        description: "Failed to authorize Gmail read-only access.",
      });
    }
    setIsConnectingGmail(false);
  };

  const handleDisconnectGmail = () => {
    setGmailConnected(false);
    localStorage.removeItem('operator_gmail_connected');
    toast({
      title: "Protocol Severed",
      description: "Gmail intelligence has been disconnected.",
    });
  };

  const handleCopy = () => {
    if (profile?.inboundEmailAddress && typeof window !== 'undefined') {
      navigator.clipboard.writeText(profile.inboundEmailAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted || isUserLoading) {
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
          <div className="flex items-center gap-3 text-primary mb-4">
            <Server className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">System Configuration</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Core Integration.</h1>
          <p className="text-xl text-muted-foreground font-medium">Manage neural pathways, external ingestions, and system health.</p>
        </header>

        {/* System Health Dashboard */}
        <section className="premium-card bg-white/[0.02] border-white/5 p-8 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                Live System Health
              </h3>
              <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">V3_AGENT_OPERATIONAL</Badge>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Cpu className="w-12 h-12" />
                 </div>
                 <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Logic Engine</p>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Groq Llama-3</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-success">READY</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    </div>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Database className="w-12 h-12" />
                 </div>
                 <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Neural Database</p>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Firestore</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-success">SYNCED</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    </div>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Globe className="w-12 h-12" />
                 </div>
                 <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Gmail Protocol</p>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{gmailConnected ? 'Enabled' : 'Standby'}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[8px] font-bold", gmailConnected ? "text-success" : "text-warning")}>
                        {gmailConnected ? 'ACTIVE' : 'OFFLINE'}
                      </span>
                      <span className={cn("w-1.5 h-1.5 rounded-full", gmailConnected ? "bg-success" : "bg-warning")} />
                    </div>
                 </div>
              </div>
           </div>
        </section>

        <div className="grid grid-cols-1 gap-12">
          <div className="space-y-12">
            
            {/* Gmail Ingestion */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-headline tracking-tight uppercase tracking-widest text-[12px] flex items-center gap-2 text-white">
                  <MailCheck className="w-4 h-4 text-accent" />
                  Primary Ingestion
                </h2>
                <p className="text-sm text-muted-foreground font-medium">Connect your primary inbox for autonomous pattern scanning.</p>
              </div>

              <div className="premium-card bg-accent/5 border-accent/10 p-8 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Gmail Connectivity</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      The Operator scans recent receipts and billing alerts using read-only access.
                    </p>
                  </div>
                  
                  {gmailConnected ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20 text-success text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        Protocol Active
                      </div>
                      <Button variant="ghost" onClick={handleDisconnectGmail} className="text-danger hover:text-danger hover:bg-danger/10 text-[10px] font-bold uppercase tracking-widest">
                        Sever Protocol
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleConnectGmail} 
                      disabled={isConnectingGmail}
                      className="h-14 px-8 rounded-2xl bg-white text-background hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] gap-3"
                    >
                      {isConnectingGmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Initialize Gmail
                    </Button>
                  )}
                </div>
                
                <div className="pt-6 border-t border-white/5 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  <Shield className="w-3 h-3" />
                  No full message bodies are stored permanently in Neural Memory.
                </div>
              </div>
            </section>

            {/* Manual Ingestion */}
            <section className="space-y-6 pt-12 border-t border-white/5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-headline tracking-tight uppercase tracking-widest text-[12px] flex items-center gap-2 text-white">
                  <Mail className="w-4 h-4 text-primary" />
                  Manual Ingestion
                </h2>
                <p className="text-sm text-muted-foreground font-medium">Neural forwarding address for individual document ingestion.</p>
              </div>

              <div className="premium-card bg-primary/5 border-primary/10 p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-primary">Neural Forwarding Address</Label>
                  <div className="flex gap-3">
                    <Input 
                      readOnly 
                      value={profile?.inboundEmailAddress || 'Initializing neural path...'} 
                      className="h-14 bg-white/5 border-white/5 font-mono text-primary text-sm px-5 rounded-xl flex-1" 
                    />
                    <Button variant="outline" size="icon" className="w-14 h-14 rounded-xl border-white/5 hover:bg-white/5" onClick={handleCopy}>
                      {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5 text-white" />}
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4 text-xs text-muted-foreground leading-relaxed">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <p>Forward any receipt to this address. The Operator will process patterns in background mode.</p>
                </div>
              </div>
            </section>

            {/* Identity Profile */}
            <section className="space-y-6 pt-12 border-t border-white/5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-headline tracking-tight uppercase tracking-widest text-[12px] flex items-center gap-2 text-white">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Identity Profile
                </h2>
              </div>

              <div className="premium-card p-8 space-y-6 bg-white/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Identity Handle</Label>
                    <Input value={profile?.displayName || user?.displayName || 'Unknown'} readOnly className="h-12 bg-white/5 border-white/5 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Contact Channel</Label>
                    <Input value={profile?.email || user?.email || ''} readOnly className="h-12 bg-white/5 border-white/5 rounded-xl" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
