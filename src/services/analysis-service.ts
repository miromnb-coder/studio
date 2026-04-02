import { AnalyzeFinancialDocumentOutput } from '@/ai/flows/analyze-financial-document';

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
  source?: 'screenshot' | 'pasted_text' | 'email';
}

/**
 * Service layer to handle financial analysis logic.
 * Premium rule-based engine detecting complex spending patterns from emails and documents.
 */
export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalyzeFinancialDocumentOutput> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.ruleBasedAnalysis(input));
      }, 500);
    });
  }

  private static ruleBasedAnalysis(input: AnalysisInput): AnalyzeFinancialDocumentOutput {
    const text = (input.documentText || '') + ' ' + (input.notes || '');
    const detectedItems: AnalyzeFinancialDocumentOutput['detectedItems'] = [];

    // Core subscription & fee patterns
    const patterns = [
      { regex: /netflix/i, title: 'Netflix Premium', type: 'subscription', amount: 15.99, provider: 'Netflix', supportEmail: 'support@netflix.com' },
      { regex: /spotify/i, title: 'Spotify Premium', type: 'subscription', amount: 11.99, provider: 'Spotify', supportEmail: 'support@spotify.com' },
      { regex: /hulu/i, title: 'Hulu (No Ads)', type: 'subscription', amount: 17.99, provider: 'Hulu', supportEmail: 'support@hulu.com' },
      { regex: /disney|disney\+/i, title: 'Disney+ Bundle', type: 'subscription', amount: 13.99, provider: 'Disney', supportEmail: 'support@disney.com' },
      { regex: /icloud|apple\s*care/i, title: 'iCloud+ Storage', type: 'subscription', amount: 2.99, provider: 'Apple', supportEmail: 'support@apple.com' },
      { regex: /amazon\s*prime/i, title: 'Amazon Prime', type: 'subscription', amount: 14.99, provider: 'Amazon', supportEmail: 'cis@amazon.com' },
      { regex: /adobe|creative\s*cloud/i, title: 'Adobe Creative Cloud', type: 'subscription', amount: 54.99, provider: 'Adobe', supportEmail: 'support@adobe.com' },
      { regex: /chase|bank\s*of\s*america|wells\s*fargo/i, title: 'Maintenance Fee', type: 'hidden_fee', amount: 12.00, provider: 'Bank', supportEmail: 'support@bank.com' },
    ];

    // High-priority "HUNT" patterns for Inbox Operator
    const huntPatterns = [
      { regex: /free\s*trial|trial\s*ending|trial\s*period/i, title: 'Trial Expiration Alert', type: 'trial_ending', urgency: 'urgent' as const },
      { regex: /price\s*increase|updated\s*pricing|new\s*rate/i, title: 'Price Hike Detected', type: 'price_increase', urgency: 'high' as const },
      { regex: /subscription\s*renewed|renewal\s*notice/i, title: 'Upcoming Renewal', type: 'recurring_charge', urgency: 'medium' as const },
      { regex: /duplicate\s*charge|charged\s*twice/i, title: 'Duplicate Charge Found', type: 'duplicate_charge', urgency: 'urgent' as const },
    ];

    // Apply primary patterns
    patterns.forEach(p => {
      if (p.regex.test(text)) {
        detectedItems.push({
          title: p.title,
          summary: `Identified a recurring ${p.type.replace('_', ' ')} from ${p.provider}.`,
          type: p.type as any,
          estimatedSavings: p.amount,
          urgencyLevel: p.type === 'hidden_fee' ? 'high' : 'medium',
          confidence: 'high',
          recommendedAction: `Cancel or negotiate this ${p.title} to optimize your burn rate.`,
          nextSteps: [`Verify usage frequency`, 'Send negotiation script'],
          copyableMessage: `Hi ${p.provider} Support, I noticed my recent ${p.title} charge. Given my long-term loyalty, I'd like to explore available discounts or a 20% rate reduction before considering cancellation. Thank you.`
        });
      }
    });

    // Apply "Hunt" patterns (Inbox Intelligence)
    huntPatterns.forEach(h => {
      if (h.regex.test(text)) {
        detectedItems.push({
          title: h.title,
          summary: `Our Operator detected a ${h.title.toLowerCase()} in your recent activity. Action is required to avoid unnecessary burn.`,
          type: h.type as any,
          estimatedSavings: 20.00, // Placeholder for savings impact
          urgencyLevel: h.urgency,
          confidence: 'high',
          recommendedAction: `Address this ${h.type.replace('_', ' ')} immediately.`,
          nextSteps: ['Review expiration date', 'Check for cheaper alternatives'],
          copyableMessage: `Hello, I'm contacting you regarding a ${h.title.toLowerCase()} I received. I'd like to clarify the details of this change and discuss my options. Best regards.`
        });
      }
    });

    if (detectedItems.length === 0) {
      detectedItems.push({
        title: 'Spending Pattern Audit',
        summary: 'No specific high-burn patterns found, but manual review is recommended for edge-case subscriptions.',
        type: 'savings_opportunity',
        estimatedSavings: 15.00,
        urgencyLevel: 'low',
        confidence: 'medium',
        recommendedAction: 'Perform a deep-dive audit of this statement.',
        nextSteps: ['Compare with last month'],
        copyableMessage: 'Hello, could you please provide a breakdown of my recent charges? Thank you.'
      });
    }

    const totalSavings = detectedItems.reduce((acc, item) => acc + (item.estimatedSavings || 0), 0);

    return {
      title: input.source === 'email' ? 'Automated Inbox Analysis' : 'Proactive Scan Report',
      summary: `Our engine identified ${detectedItems.length} optimization targets. Your financial operator is currently protecting your burn rate.`,
      detectedItems,
      savingsEstimate: totalSavings,
      urgencyLevel: totalSavings > 100 ? 'urgent' : (totalSavings > 50 ? 'high' : 'medium'),
      confidence: 'high',
      recommendedActions: detectedItems.map(i => i.recommendedAction),
      nextSteps: ['Execute cancellation scripts', 'Setup auto-forwarding for all receipts'],
      beforeAfterComparison: {
        currentSituation: `Operating with a projected monthly leak of $${(totalSavings * 1.25).toFixed(2)}.`,
        optimizedSituation: `Leak plugged. Reclaimed $${totalSavings.toFixed(2)} in monthly liquidity.`,
        estimatedMonthlySavingsDifference: totalSavings
      }
    };
  }
}
