import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  AlertTriangle, 
  TrendingDown, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage({ params }: { params: { id: string } }) {
  // Mock analysis result
  const analysis = {
    title: "October Spending Audit",
    summary: "Analysis complete. We found 4 potential optimizations including a significant duplicate charge and a trial ending within 48 hours.",
    savingsEstimate: 142.50,
    urgency: "high",
    findings: [
      {
        title: "Duplicate Spotify Charge",
        type: "Duplicate charge",
        summary: "You are being billed twice for Spotify Premium Family ($15.99 each). One is via Apple Subscriptions and one is direct.",
        savings: 15.99,
        urgency: "urgent",
        action: "Cancel the duplicate Apple Subscription immediately.",
        message: "Hi, I've noticed a duplicate charge for Spotify. I would like to cancel my subscription billed through Apple (ID: 987654321) as I'm already paying Spotify directly. Please process a refund for the most recent charge if possible."
      },
      {
        title: "Adobe Creative Cloud",
        type: "Subscription detected",
        summary: "Your student discount has expired and you're now paying the full price of $54.99/mo.",
        savings: 35.00,
        urgency: "medium",
        action: "Call support to renegotiate student pricing or switch to Photography plan.",
        message: "Hello, I was previously on a student plan for Creative Cloud. The price has jumped and I'm considering cancelling. Is there any loyalty discount or plan adjustment available to keep my monthly cost closer to the student rate?"
      }
    ],
    beforeAfter: {
      before: "Monthly burn: $285.40",
      after: "Optimized burn: $142.90",
      difference: 142.50
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-16 space-y-12 animate-in fade-in duration-700">
        <header className="space-y-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge className="bg-danger/20 text-danger rounded-full px-3 py-1 text-xs font-bold uppercase mb-2">
                High Impact Analysis
              </Badge>
              <h1 className="text-4xl font-bold font-headline">{analysis.title}</h1>
              <p className="text-xl text-muted-foreground max-w-2xl">{analysis.summary}</p>
            </div>
            
            <div className="premium-card bg-primary p-6 md:p-8 flex flex-col justify-center items-center text-background text-center min-w-[200px]">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Monthly Savings</p>
              <p className="text-4xl font-bold font-headline">${analysis.savingsEstimate.toFixed(2)}</p>
            </div>
          </div>
        </header>

        {/* Before After Comparison */}
        <section className="premium-card overflow-hidden bg-gradient-to-r from-secondary to-card border-white/10">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="flex-1 p-8 space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Current Situation</p>
              <p className="text-2xl font-bold text-muted-foreground line-through opacity-50">{analysis.beforeAfter.before}</p>
            </div>
            <div className="flex-1 p-8 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-16 h-16 text-success" />
              </div>
              <p className="text-sm font-medium text-success uppercase tracking-widest">Optimized Situation</p>
              <p className="text-2xl font-bold text-foreground">{analysis.beforeAfter.after}</p>
              <p className="text-xs text-success font-bold">You keep ${analysis.beforeAfter.difference} more every month</p>
            </div>
          </div>
        </section>

        {/* Findings List */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary fill-primary/20" />
            Detected Findings
          </h2>
          
          <div className="grid gap-6">
            {analysis.findings.map((finding, i) => (
              <div key={i} className="premium-card p-6 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <Badge variant={finding.urgency === 'urgent' ? 'destructive' : 'secondary'} className="rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                        {finding.urgency}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{finding.type}</span>
                    </div>
                    <h3 className="text-2xl font-bold font-headline">{finding.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{finding.summary}</p>
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Recommended Action</p>
                      <p className="font-medium">{finding.action}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Impact</p>
                    <p className="text-3xl font-bold text-success">Save ${finding.savings}</p>
                    <p className="text-xs text-muted-foreground">Every month</p>
                  </div>
                </div>

                {finding.message && (
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Cancellation / Negotiation Script
                      </p>
                      <Button variant="ghost" size="sm" className="text-xs gap-2 hover:bg-white/5 rounded-full">
                        <Copy className="w-3.5 h-3.5" />
                        Copy Script
                      </Button>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-muted-foreground leading-relaxed italic text-sm">
                      "{finding.message}"
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="pt-8 border-t border-white/5 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold font-headline">Ready to take action?</h3>
            <p className="text-muted-foreground">Use the copyable messages above to resolve these findings immediately.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 rounded-full shadow-xl shadow-primary/20 w-full sm:w-auto">
              Mark all as resolved
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-white/10 w-full sm:w-auto">
              Export Analysis PDF
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
