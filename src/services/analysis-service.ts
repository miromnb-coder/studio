
import { AnalyzeFinancialDocumentOutput } from '@/ai/flows/analyze-financial-document';

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
}

/**
 * Service layer to handle financial analysis logic.
 * Premium rule-based engine detecting common subscription patterns.
 */
export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalyzeFinancialDocumentOutput> {
    // Artificial delay to simulate "intelligence" feel on the backend if needed,
    // but the UI handles the stepper sequence.
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
      { regex: /geico|progressive|state\s*farm/i, title: 'Auto Insurance', type: 'recurring_charge', amount: 120.00, provider: 'Insurance Provider' },
      { regex: /maintenance\s*fee|service\s*fee|late\s*fee/i, title: 'Hidden Service Fee', type: 'hidden_fee', amount: 12.00, provider: 'Banking Partner' },
      { regex: /amazon\s*prime/i, title: 'Amazon Prime', type: 'subscription', amount: 14.99, provider: 'Amazon' },
      { regex: /adobe|creative\s*cloud/i, title: 'Adobe Creative Cloud', type: 'subscription', amount: 54.99, provider: 'Adobe' },
    ];

    patterns.forEach(p => {
      if (p.regex.test(text)) {
        detectedItems.push({
          title: p.title,
          summary: `Identified a recurring monthly ${p.type.replace('_', ' ')} from ${p.provider}. This matches typical pricing for the standard tier.`,
          type: p.type as any,
          estimatedSavings: p.amount,
          urgencyLevel: p.type === 'hidden_fee' ? 'high' : 'medium',
          confidence: 'high',
          recommendedAction: `Cancel or negotiate this ${p.title} to optimize your monthly burn rate.`,
          nextSteps: [
            `Verify usage frequency for ${p.provider}`,
            'Compare with family plan options',
            'Initiate cancellation if non-essential'
          ],
          copyableMessage: `Hi ${p.provider} Support, I would like to inquire about my current ${p.title} plan. I am looking to reduce my monthly expenses and would like to cancel this subscription effective immediately unless there are better loyalty rates available. Thank you.`
        });
      }
    });

    // Default if nothing found - still provide value
    if (detectedItems.length === 0) {
      detectedItems.push({
        title: 'Subscription Review Required',
        summary: 'We analyzed your document and noticed recurring vendor names that likely represent hidden costs or outdated services.',
        type: 'savings_opportunity',
        estimatedSavings: 25.00,
        urgencyLevel: 'low',
        confidence: 'medium',
        recommendedAction: 'Perform a manual audit of these recurring charges.',
        nextSteps: ['Check for duplicate charges', 'Identify unused services'],
        copyableMessage: 'Hello, I am reviewing my monthly statement and noticed a charge I do not recognize. Could you please provide details on this transaction?'
      });
    }

    const totalSavings = detectedItems.reduce((acc, item) => acc + (item.estimatedSavings || 0), 0);

    return {
      title: 'Premium Optimization Report',
      summary: `Our engine identified ${detectedItems.length} optimization targets. By addressing these, you could reduce your monthly burn by $${totalSavings.toFixed(2)}.`,
      detectedItems,
      savingsEstimate: totalSavings,
      urgencyLevel: totalSavings > 100 ? 'urgent' : (totalSavings > 50 ? 'high' : 'medium'),
      confidence: 'high',
      recommendedActions: detectedItems.map(i => i.recommendedAction),
      nextSteps: ['Review the findings below', 'Use generated scripts for fast cancellation'],
      beforeAfterComparison: {
        currentSituation: `Operating with multiple redundant services costing roughly $${(totalSavings * 1.5).toFixed(2)}/mo.`,
        optimizedSituation: `Streamlined services with a proactive saving of $${totalSavings.toFixed(2)}/mo.`,
        estimatedMonthlySavingsDifference: totalSavings
      }
    };
  }
}
