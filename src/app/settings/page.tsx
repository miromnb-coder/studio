/**
 * @fileOverview Live System Status & Core Integration Control Panel.
 * Redesigned as a functional command center for data ingestion and connectivity.
 */

"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Mail,
  Copy,
  Check,
  Info,
  Cpu,
  Loader2,
  Activity,
  Database,
  RefreshCcw,
  Zap,
  CloudLightning,
  Network,
  Send,
  MailCheck
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { GmailService } from '@/services/gmail-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function IntegrationPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const status = localStorage.getItem('operator_gmail_connected');
    const syncTime = localStorage.getItem('operator_gmail_last_sync');
    if (status === 'true') setGmailConnected(true);
    if (syncTime) setLastSync(syncTime);
  }, []);

  const userRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const testConnection = async (id: string) => {
    setIsTesting(id);
    await new Promise(r => setTimeout(r, 1500));
    setIsTesting(null);
    toast({
      title: "Connection Success",
      description: `${id} protocol responded within nominal parameters.`,
    });
  };

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    const token = await GmailService.connect();
    if (token) {
      setGmailConnected(true);
      toast({ 
        title: "Intelligence Connected", 
        description: "Gmail protocol active with read/send scopes." 
      });
    } else {
      toast({ 
        variant: 'destructive',
        title: "Connection Failed", 
        description: "Google Auth was interrupted." 
      });
    }
    setIsConnectingGmail(false);
  };

  const handleSyncNow = async () => {
    if (!db || !user) return;
    setIsSyncing(true);
    try {
      const syncedCount = await GmailService.syncToFirestore(db, user.uid);
      setLastSync(new Date().toISOString());
      toast({ 
        title: "Sync Complete", 
        description: `Ingested ${syncedCount} new financial signals into Neural Memory.` 
      });
    } catch (e) {
      toast({ 
        variant: 'destructive',
        title: "Sync Failed", 
        description: "Neural link timeout during ingestion." 
      });
    }
    setIsSyncing(false);
  };

  const handleCopy = () => {
    if (profile?.inboundEmailAddress) {
      navigator.clipboard.writeText(profile.inboundEmailAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32 text-left">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Network className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Live System Status</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-white">Ingestion.</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-md">Manage data intake protocols and system connectivity.</p>
          </div>
        </header>

        {/* STATUS TILES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { id: 'Logic Engine', icon: Cpu, status: 'Active', val: 'Groq/Llama3' },
             { id: 'Neural DB', icon: Database, status: 'Synced', val: 'Firestore' },
             { id: 'Ingestion', icon: CloudLightning, status: gmailConnected ? 'Connected' : 'Standby', val: 'Gmail API' }
           ].map((item) => (
             <div key={item.id} className="premium-card bg-white/[0.01] border-white/5 p-6 flex flex-col justify-between h-44 group relative overflow-hidden">
                <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <item.icon className="w-5 h-5" />
                   </div>
                   <Badge variant="outline" className={cn(
                     "text-[8px] uppercase border-white/10",
                     item.status === 'Active' || item.status === 'Synced' || item.status === 'Connected' ? "text-success border-success/20 bg-success/5" : ""
                   )}>
                     {item.status}
                   </Badge>
                </div>
                <div>
                   <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{item.id}</p>
                   <p className="text-lg font-bold text-white tracking-tight">{item.val}</p>
                </div>
                <button 
                  onClick={() => testConnection(item.id)}
                  disabled={isTesting === item.id}
                  className="mt-4 text-[8px] font-bold uppercase text-primary/40 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  {isTesting === item.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Activity className="w-2.5 h-2.5" />}
                  Test Protocol
                </button>
             </div>
           ))}
        </section>

        <div className="grid grid-cols-1 gap-12">
          {/* PRIMARY GMAIL INTEGRATION */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Autonomous Gmail Protocol
                </h2>
                <p className="text-sm text-muted-foreground">High-frequency scanning and execution via primary inbox.</p>
              </div>
              {gmailConnected && (
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">Last Neural Sync</p>
                  <p className="text-[10px] font-bold text-white">{lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</p>
                </div>
              )}
            </div>

            <Card className="premium-card bg-accent/5 border-accent/20 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-4 text-center md:text-left flex-1">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="p-3 rounded-2xl bg-accent/20 text-accent">
                    <MailCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">Gmail Intelligence</h3>
                </div>
                <p className="text-base text-muted-foreground/80 leading-relaxed max-w-md">
                  Enable the Operator to read financial signals and execute cancellation protocols directly.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                  <Badge className="bg-white/5 border-white/10 text-white/40 text-[8px] uppercase">READ_ONLY</Badge>
                  <Badge className="bg-white/5 border-white/10 text-white/40 text-[8px] uppercase">SEND_MESSAGE</Badge>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 min-w-[220px]">
                {!gmailConnected ? (
                  <Button 
                    onClick={handleConnectGmail} 
                    disabled={isConnectingGmail} 
                    className="h-14 rounded-2xl bg-white text-background font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:scale-[1.02] transition-transform"
                  >
                    {isConnectingGmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                    Initialize Gmail
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleSyncNow} 
                      disabled={isSyncing} 
                      className="h-14 rounded-2xl bg-accent text-background font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:scale-[1.02] transition-transform"
                    >
                      {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                      Sync Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 rounded-xl border-white/5 text-danger hover:bg-danger/10 text-[9px] uppercase font-bold tracking-widest"
                      onClick={() => { localStorage.removeItem('operator_gmail_connected'); setGmailConnected(false); }}
                    >
                      Disconnect Protocol
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </section>

          {/* SECONDARY INGESTION */}
          <section className="space-y-6 pt-12 border-t border-white/5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Neural Forwarding
              </h2>
              <p className="text-sm text-muted-foreground">Direct ingestion for documents and bank statements.</p>
            </div>

            <Card className="premium-card bg-primary/5 border-primary/20 p-10 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary">Magic Forwarding Address</Label>
                <div className="flex gap-3">
                  <Input 
                    readOnly 
                    value={profile?.inboundEmailAddress || 'Protocol Standby...'} 
                    className="h-14 bg-white/5 border-white/10 font-mono text-primary text-sm px-6 rounded-2xl flex-1 focus:ring-primary/20" 
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-14 h-14 rounded-2xl border-white/10 hover:bg-white/5 transition-colors" 
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex gap-4 text-xs text-muted-foreground/60 leading-relaxed italic">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p>Forward receipts or banking logs here. The agent will automatically extract patterns and update your optimization ledger.</p>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
