import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  ChevronRight,
  Zap,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  // Mock data for dashboard
  const activeSubs = [
    { name: 'Adobe CC', amount: 54.99, date: 'Mar 24', status: 'Active' },
    { name: 'Spotify Family', amount: 15.99, date: 'Mar 28', status: 'Renewal' },
    { name: 'Amazon Prime', amount: 12.99, date: 'Apr 02', status: 'Trial Ending' },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground">Your proactive financial overview.</p>
          </div>
          <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/10">
            <Link href="/analyze">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Link>
          </Button>
        </header>

        {/* Hero Savings Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 premium-card p-8 relative overflow-hidden bg-gradient-to-br from-card to-secondary/50">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="w-48 h-48" />
            </div>
            <div className="relative space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Monthly Potential Savings</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold font-headline">$142.50</span>
                <span className="text-success flex items-center text-sm font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                  +12% vs last month
                </span>
              </div>
              <p className="text-muted-foreground max-w-md">We've identified 4 new items that could be optimized to lower your monthly burn rate.</p>
              <Button asChild variant="secondary" className="rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <Link href="/history">View findings</Link>
              </Button>
            </div>
          </div>

          <div className="premium-card p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Urgent Alerts</h3>
              <p className="text-sm text-muted-foreground">2 trials ending within 48 hours. Cancel now to avoid being charged.</p>
            </div>
            <Button variant="link" className="p-0 text-accent h-auto justify-start font-bold group">
              Resolve now
              <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Subscriptions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold font-headline">Active Items Detected</h3>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">View all</Link>
            </div>
            <div className="premium-card overflow-hidden">
              <div className="divide-y divide-white/5">
                {activeSubs.map((sub, i) => (
                  <div key={i} className="p-4 md:p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 font-bold text-xs">
                        {sub.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">Renewing {sub.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="font-bold">${sub.amount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Monthly</p>
                      </div>
                      <Badge variant={sub.status === 'Trial Ending' ? 'destructive' : 'secondary'} className="rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                        {sub.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground group-hover:text-foreground">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-headline">Smart Insights</h3>
            <div className="space-y-4">
              <div className="premium-card p-6 bg-primary/5 border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="w-5 h-5 fill-primary/20" />
                  <span className="text-sm font-bold uppercase tracking-wider">Quick Win</span>
                </div>
                <p className="text-sm leading-relaxed">
                  You have <span className="text-foreground font-bold">2 duplicate streaming charges</span> for Spotify. Cancelling one will save you <span className="text-foreground font-bold">$15.99/mo</span> immediately.
                </p>
                <Button size="sm" className="w-full rounded-full bg-primary text-background font-bold">Generate Message</Button>
              </div>

              <div className="premium-card p-6 border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">On Track</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your monthly subscription burn rate is <span className="text-foreground font-bold">15% lower</span> than typical users in your demographic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
