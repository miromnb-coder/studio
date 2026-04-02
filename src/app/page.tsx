import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  TrendingDown, 
  Layers, 
  FileText, 
  Camera 
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-4 md:pt-32 md:pb-32 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full -z-10 blur-[120px] opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent rounded-full" />
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary-foreground/80 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Proactive Financial Intelligence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-headline leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Find hidden spending before it <span className="gradient-text">drains your money.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              AI Life Operator scans receipts, screenshots, and notes to uncover subscriptions, duplicate charges, hidden fees, and easy savings.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg shadow-2xl shadow-primary/20 group">
                <Link href="/analyze">
                  Analyze now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-white/10 hover:bg-white/5 transition-all">
                <Link href="/dashboard">
                  View dashboard
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground/60 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-400">
              Works with screenshots, pasted text, and manual notes.
            </p>
          </div>
        </section>

        {/* Feature Preview Section */}
        <section className="px-4 py-24 bg-card/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="premium-card p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Smart Detection</h3>
              <p className="text-muted-foreground">Automatically identifies recurring charges, hidden fees, and trial periods from any visual source.</p>
            </div>
            
            <div className="premium-card p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Savings Estimates</h3>
              <p className="text-muted-foreground">See exactly how much you can reclaim each month. We calculate the impact of every optimization.</p>
            </div>
            
            <div className="premium-card p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Direct Action</h3>
              <p className="text-muted-foreground">Get pre-written cancellation scripts and step-by-step instructions to fix findings immediately.</p>
            </div>
          </div>
        </section>

        {/* Highlight Section */}
        <section className="px-4 py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-4xl font-bold font-headline leading-tight">Your financial operator, <br/>always on guard.</h2>
            <p className="text-lg text-muted-foreground">
              Stop manual auditing. Upload a statement screenshot once a week, and let your operator do the heavy lifting. We find what you miss.
            </p>
            <ul className="space-y-3">
              {[
                "Duplicate streaming charges",
                "Forgotten free trial endings",
                "Sneaky service price hikes",
                "Unnecessary maintenance fees"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground/80 font-medium">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-success text-[10px]">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 w-full">
            <div className="premium-card p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 bg-primary/20 text-primary text-xs font-bold rounded-bl-xl uppercase tracking-widest">
                High Impact
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Recent Analysis</h4>
                  <p className="text-xs text-muted-foreground">Uploaded 2 hours ago</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Adobe Creative Cloud</p>
                    <p className="text-xs text-muted-foreground">Subscription detected</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">-$54.99</p>
                    <p className="text-[10px] text-danger/60">Monthly</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Chase Service Fee</p>
                    <p className="text-xs text-muted-foreground">Possible hidden fee</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">-$12.00</p>
                    <p className="text-[10px] text-danger/60">Recurring</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Estimated Monthly Savings</span>
                  <span className="text-xl font-bold text-success">+$66.99</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-background font-bold text-xs">
              O
            </div>
            <span className="font-headline font-bold">AI Life Operator</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Contact</Link>
          </div>
          <p className="text-xs text-muted-foreground/40">© 2024 AI Life Operator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
