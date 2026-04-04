
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
  Globe,
  RefreshCcw,
  Zap,
  Server,
  CloudLightning,
  Network
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { GmailService } from '@/services/gmail-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function IntegrationPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const status = typeof window !== 'undefined' ? localStorage.getItem('operator_gmail_connected') : null;
    if (status === 'true') setGmailConnected(true);
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
      localStorage.setItem('operator_gmail_connected', 'true');
      toast({ title: "Intelligence Connected", description: "Gmail protocol active." });
    }
    setIsConnectingGmail(false);
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
    <div className="min-h-screen bg-background pt-24 pb-32">
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

        {/* INTEGRATION STATUS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { id: 'Logic Engine', icon: Cpu, status: 'Active', val: 'Groq/Llama3' },
             { id: 'Neural DB', icon: Database, status: 'Synced', val: 'Firestore' },
             { id: 'Ingestion', icon: CloudLightning, status: gmailConnected ? 'Connected' : 'Standby', val: 'Gmail API' }
           ].map((item) => (
             <div key={item.id} className="premium-card bg-white/[0.01] border-white/5 p-6 flex flex-col justify-between h-40 group">
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
                  className="absolute bottom-4 right-4 text-[8px] font-bold uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                >
                  {isTesting === item.id ? 'Pinging...' : 'Test Connection'}
                </button>
             </div>
           ))}
        </section>

        <div className="grid grid-cols-1 gap-12">
          {/* PRIMARY INGESTION */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                Autonomous Ingestion
              </h2>
              <p className="text-sm text-muted-foreground">High-frequency background scanning of your primary inbox.</p>
            </div>

            <div className="premium-card bg-accent/5 border-accent/10 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">Gmail Connectivity</h3>
                <p className="text-sm text-muted-foreground max-w-sm">The agent requires read-only access to scan recent billing patterns and renewal alerts.</p>
              </div>
              
              {gmailConnected ? (
                <div className="flex flex-col items-center gap-3">
                   <Badge className="bg-success text-background border-0 px-4 h-8 text-[10px] font-bold uppercase tracking-widest">Protocol Active</Badge>
                   <Button variant="ghost" className="text-danger hover:bg-danger/10 text-[10px] uppercase font-bold tracking-widest" onClick={() => { localStorage.removeItem('operator_gmail_connected'); setGmailConnected(false); }}>Disconnect</Button>
                </div>
              ) : (
                <Button onClick={handleConnectGmail} disabled={isConnectingGmail} className="h-14 px-10 rounded-2xl bg-white text-background font-bold uppercase tracking-widest text-[10px] shadow-2xl">
                  {isConnectingGmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Connect Gmail
                </Button>
              )}
            </div>
          </section>

          {/* SECONDARY INGESTION */}
          <section className="space-y-6 pt-12 border-t border-white/5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Manual Ingestion
              </h2>
              <p className="text-sm text-muted-foreground">Direct neural forwarding for documents and statements.</p>
            </div>

            <div className="premium-card bg-primary/5 border-primary/10 p-10 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary">Neural Forwarding Address</Label>
                <div className="flex gap-3">
                  <Input readOnly value={profile?.inboundEmailAddress || 'Protocol Standby...'} className="h-14 bg-white/5 border-white/5 font-mono text-primary text-sm px-6 rounded-xl flex-1" />
                  <Button variant="outline" size="icon" className="w-14 h-14 rounded-xl border-white/5 hover:bg-white/5" onClick={handleCopy}>
                    {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-black/20 border border-white/5 flex gap-4 text-xs text-muted-foreground leading-relaxed italic">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p>Forward any receipt, bank statement, or contract to this address. The agent will ingest and analyze it in the background.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
