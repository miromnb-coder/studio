"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Mail,
  Copy,
  Check,
  Cpu,
  Loader2,
  Database,
  RefreshCcw,
  Zap,
  Network,
  MailCheck,
  Globe,
  Lock
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { GmailService } from '@/services/gmail-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function IntegrationPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setGmailConnected(localStorage.getItem('operator_gmail_connected') === 'true');
    setLastSync(localStorage.getItem('operator_gmail_last_sync'));
  }, []);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    const token = await GmailService.connect();
    if (token) {
      setGmailConnected(true);
      toast({ title: "Signal Connected", description: "Gmail intelligence protocol active." });
    }
    setIsConnecting(false);
  };

  const handleSync = async () => {
    if (!db || !user) return;
    setIsSyncing(true);
    try {
      const count = await GmailService.syncToFirestore(db, user.uid);
      setLastSync(new Date().toISOString());
      toast({ title: "Sync Complete", description: `Ingested ${count} new financial signals.` });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-20">
      <header className="space-y-6">
        <div className="flex items-center gap-3 text-primary">
          <Network className="w-6 h-6" />
          <span className="text-[12px] font-bold uppercase tracking-[0.4em]">Infrastructure Control</span>
        </div>
        <h1 className="text-7xl md:text-8xl font-bold font-headline tracking-tighter text-slate-900 leading-[0.85]">Integrations.</h1>
        <p className="text-xl text-muted-foreground font-medium max-w-xl">Configure neural ingestion points and secure data protocols.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { id: 'Logic Core', icon: Cpu, status: 'Active', val: 'Llama 3.3', color: 'text-primary' },
           { id: 'Neural DB', icon: Database, status: 'Synced', val: 'Firestore', color: 'text-success' },
           { id: 'Web Ingestion', icon: Globe, status: 'Active', val: 'Search API', color: 'text-accent' }
         ].map((item) => (
           <div key={item.id} className="premium-card flex flex-col justify-between h-48 hover:bg-white border-white shadow-sm transition-all">
              <div className="flex justify-between items-start">
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <item.icon className="w-6 h-6" />
                 </div>
                 <Badge variant="outline" className={cn("text-[9px] uppercase tracking-widest border-slate-100", item.color)}>
                   {item.status}
                 </Badge>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">{item.id}</p>
                 <p className="text-xl font-bold text-slate-900 tracking-tight">{item.val}</p>
              </div>
           </div>
         ))}
      </section>

      <div className="grid grid-cols-1 gap-12">
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Zap className="w-6 h-6 text-accent" />
                Gmail Ingestion Protocol
              </h2>
              <p className="text-sm text-muted-foreground">Autonomous high-frequency scanning for financial markers.</p>
            </div>
          </div>

          <Card className={cn(
            "premium-card p-12 flex flex-col md:flex-row items-center justify-between gap-12 transition-all duration-700 border-white shadow-sm",
            gmailConnected ? "bg-accent/5 border-accent/20" : "bg-white/[0.02]"
          )}>
            <div className="space-y-6 text-center md:text-left flex-1">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className={cn("p-4 rounded-3xl", gmailConnected ? "bg-accent/20 text-accent" : "bg-slate-50 text-slate-400")}>
                  <MailCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Email Intelligence</h3>
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/40">Read/Send Execution Scopes</p>
                </div>
              </div>
              <p className="text-base text-muted-foreground/80 leading-relaxed max-w-md font-medium">
                Enable the Operator to ingest bank statements, receipts, and renewal notices directly from your inbox.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="outline" className="text-[8px] border-slate-100 font-bold tracking-widest uppercase">GMAIL.READ</Badge>
                <Badge variant="outline" className="text-[8px] border-slate-100 font-bold tracking-widest uppercase">GMAIL.SEND</Badge>
                {lastSync && <Badge className="bg-success/10 text-success border-0 text-[8px] font-bold tracking-widest uppercase">Last Sync: {new Date(lastSync).toLocaleTimeString()}</Badge>}
              </div>
            </div>
            
            <div className="flex flex-col gap-4 min-w-[240px]">
              {!gmailConnected ? (
                <Button 
                  onClick={handleConnectGmail} 
                  disabled={isConnecting} 
                  className="h-16 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5 mr-3" />}
                  Connect Protocol
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleSync} 
                    disabled={isSyncing} 
                    className="h-16 rounded-2xl bg-accent text-white font-bold uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition-all"
                  >
                    {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5 mr-3" />}
                    Sync Intelligence
                  </Button>
                  <Button variant="ghost" className="text-danger text-[9px] uppercase font-bold tracking-[0.2em] hover:bg-danger/10" onClick={() => { localStorage.removeItem('operator_gmail_connected'); setGmailConnected(false); }}>
                    Reset Connection
                  </Button>
                </>
              )}
            </div>
          </Card>
        </section>

        <section className="space-y-8 pt-12 border-t border-slate-100">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              Neural Forwarding
            </h2>
            <p className="text-sm text-muted-foreground">Direct ingestion for sensitive documents and bank logs.</p>
          </div>

          <Card className="premium-card bg-primary/5 border-primary/20 p-12 space-y-10 shadow-none">
            <div className="space-y-4">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-primary px-1">Magic Forwarding Address</Label>
              <div className="flex gap-4">
                <div className="h-16 bg-white border border-primary/10 font-mono text-primary text-sm px-8 rounded-2xl flex-1 flex items-center justify-between shadow-sm">
                  <span>{profile?.inboundEmailAddress || 'Standby...'}</span>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[8px] animate-pulse uppercase tracking-widest font-bold">Ready</Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-16 h-16 rounded-2xl border-white bg-white shadow-sm hover:bg-slate-50 transition-all" 
                  onClick={() => { navigator.clipboard.writeText(profile?.inboundEmailAddress || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                >
                  {copied ? <Check className="w-6 h-6 text-success" /> : <Copy className="w-6 h-6 text-slate-400" />}
                </Button>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/40 border border-white/60 flex gap-4 text-xs text-muted-foreground leading-relaxed italic font-medium">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <p>Forward receipts or statements here. The Operator will automatically extract patterns and update your optimization ledger.</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
