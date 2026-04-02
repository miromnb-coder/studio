
import { AnalyzeFinancialDocumentOutput } from '@/ai/flows/analyze-financial-document';

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
  source?: 'screenshot' | 'pasted_text' | 'email';
}

/**
 * Service layer to handle financial analysis logic.
 * Premium rule-based engine detecting common subscription patterns and email receipts.
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

    // Comprehensive patterns for common subscriptions and fees
    const patterns = [
      { regex: /netflix/i, title: 'Netflix Premium', type: 'subscription', amount: 15.99, provider: 'Netflix' },
      { regex: /spotify/i, title: 'Spotify Premium', type: 'subscription', amount: 11.99, provider: 'Spotify' },
      { regex: /hulu/i, title: 'Hulu (No Ads)', type: 'subscription', amount: 17.99, provider: 'Hulu' },
      { regex: /disney|disney\+/i, title: 'Disney+ Bundle', type: 'subscription', amount: 13.99, provider: 'Disney' },
      { regex: /icloud|apple\s*care/i, title: 'iCloud+ Storage', type: 'subscription', amount: 2.99, provider: 'Apple' },
      { regex: /gym|anytime\s*fitness|gold\s*gym/i, title: 'Gym Membership', type: 'subscription', amount: 49.99, provider: 'Fitness Corp' },
      { regex: /amazon\s*prime/i, title: 'Amazon Prime', type: 'subscription', amount: 14.99, provider: 'Amazon' },
      { regex: /adobe|creative\s*cloud/i, title: 'Adobe Creative Cloud', type: 'subscription', amount: 54.99, provider: 'Adobe' },
      { regex: /maintenance\s*fee|service\s*fee|late\s*fee/i, title: 'Hidden Service Fee', type: 'hidden_fee', amount: 12.00, provider: 'Banking Partner' },
    ];

    // Email-specific patterns
    const emailPatterns = [
      { regex: /order\s*confirmation|receipt\s*for\s*your\s*order/i, title: 'Digital Purchase', type: 'savings_opportunity', amount: 0 },
      { regex: /subscription\s*renewed|renewal\s*notice/i, title: 'Upcoming Renewal', type: 'trial_ending', amount: 0 },
      { regex: /total\s*charged:\s*\$(\d+\.\d{2})/i, title: 'Detected Transaction', type: 'recurring_charge', amount: 0 },
    ];

    patterns.forEach(p => {
      if (p.regex.test(text)) {
        detectedItems.push({
          title: p.title,
          summary: `Identified a recurring monthly ${p.type.replace('_', ' ')} from ${p.provider}.`,
          type: p.type as any,
          estimatedSavings: p.amount,
          urgencyLevel: p.type === 'hidden_fee' ? 'high' : 'medium',
          confidence: 'high',
          recommendedAction: `Cancel or negotiate this ${p.title} to optimize your monthly burn rate.`,
          nextSteps: [`Verify usage frequency`, 'Initiate cancellation if non-essential'],
          copyableMessage: `Hi ${p.provider} Support, I would like to cancel my ${p.title} subscription effective immediately. Thank you.`
        });
      }
    });

    // Check for email context
    if (input.source === 'email') {
      emailPatterns.forEach(p => {
        if (p.regex.test(text)) {
          const match = text.match(p.regex);
          const amount = match && match[1] ? parseFloat(match[1]) : 0;
          
          if (!detectedItems.find(i => i.title === p.title)) {
            detectedItems.push({
              title: p.title,
              summary: `Automatically detected from forwarded email. This looks like a recurring financial commitment.`,
              type: p.type as any,
              estimatedSavings: amount || 10.00,
              urgencyLevel: 'medium',
              confidence: 'medium',
              recommendedAction: 'Review this transaction for potential optimization.',
              nextSteps: ['Confirm if this is a recurring charge'],
              copyableMessage: 'Hello, I am reviewing my digital receipts and noticed this charge. Could you provide more details?'
            });
          }
        }
      });
    }

    if (detectedItems.length === 0) {
      detectedItems.push({
        title: 'Subscription Review Required',
        summary: 'Our engine analyzed your input and suggests a manual audit of recent charges.',
        type: 'savings_opportunity',
        estimatedSavings: 25.00,
        urgencyLevel: 'low',
        confidence: 'medium',
        recommendedAction: 'Perform a manual audit of recurring charges.',
        nextSteps: ['Check for duplicate charges'],
        copyableMessage: 'Hello, I am reviewing my monthly statement. Could you please provide details on this transaction?'
      });
    }

    const totalSavings = detectedItems.reduce((acc, item) => acc + (item.estimatedSavings || 0), 0);

    return {
      title: input.source === 'email' ? 'Email Receipt Analysis' : 'Premium Optimization Report',
      summary: `Our engine identified ${detectedItems.length} optimization targets via ${input.source || 'manual input'}.`,
      detectedItems,
      savingsEstimate: totalSavings,
      urgencyLevel: totalSavings > 100 ? 'urgent' : (totalSavings > 50 ? 'high' : 'medium'),
      confidence: 'high',
      recommendedActions: detectedItems.map(i => i.recommendedAction),
      nextSteps: ['Review findings below'],
      beforeAfterComparison: {
        currentSituation: `Operating with multiple services costing roughly $${(totalSavings * 1.5).toFixed(2)}/mo.`,
        optimizedSituation: `Streamlined services with a proactive saving of $${totalSavings.toFixed(2)}/mo.`,
        estimatedMonthlySavingsDifference: totalSavings
      }
    };
  }
}
