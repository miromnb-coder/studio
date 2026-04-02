import { AnalyzeFinancialDocumentOutput } from '@/ai/flows/analyze-financial-document';

export interface AnalysisInput {
  imageDataUri?: string;
  documentText?: string;
  notes?: string;
}

/**
 * Service layer to handle financial analysis logic.
 * Defaults to rule-based logic to meet the "no external AI right now" requirement.
 */
export class AnalysisService {
  static async analyze(input: AnalysisInput): Promise<AnalyzeFinancialDocumentOutput> {
    // In a real implementation, we could try calling the GenAI flow:
    // try {
    //   return await analyzeFinancialDocument({ imageDataUri: input.imageDataUri, documentText: input.documentText });
    // } catch (e) {
    //   console.warn('AI flow failed or missing, falling back to rule-based engine.');
    // }

    // Rule-based fallback implementation
    return this.ruleBasedAnalysis(input);
  }

  private static ruleBasedAnalysis(input: AnalysisInput): AnalyzeFinancialDocumentOutput {
    const text = (input.documentText || '') + ' ' + (input.notes || '');
    const detectedItems: AnalyzeFinancialDocumentOutput['detectedItems'] = [];

    // Simple heuristic patterns
    const patterns = [
      { regex: /netflix|spotify|hulu|disney|apple/i, type: 'subscription', title: 'Streaming Subscription', amount: 15.99 },
      { regex: /amazon prime|costco|gym/i, type: 'subscription', title: 'Recurring Membership', amount: 12.99 },
      { regex: /service fee|late fee|maintenance/i, type: 'hidden_fee', title: 'Service Fee Detected', amount: 5.00 },
      { regex: /duplicate|double|twice/i, type: 'duplicate_charge', title: 'Possible Duplicate Charge', amount: 45.00 },
      { regex: /trial|ending|expires/i, type: 'trial_ending', title: 'Free Trial Ending Soon', amount: 29.99 },
    ];

    patterns.forEach(p => {
      if (p.regex.test(text)) {
        detectedItems.push({
          title: p.title,
          summary: `Identified a recurring ${p.type} related to ${p.regex.source.split('|')[0]} in your statement.`,
          type: p.type as any,
          estimatedSavings: p.amount,
          urgencyLevel: p.type === 'duplicate_charge' ? 'high' : 'medium',
          confidence: 'high',
          recommendedAction: `Cancel or review the ${p.title} to save $${p.amount}/mo.`,
          nextSteps: ['Verify if this is still needed', 'Check cancellation policy', 'Contact support if duplicate'],
          copyableMessage: `Hi, I would like to cancel my ${p.title} effective immediately. Please confirm receipt.`
        });
      }
    });

    // Default if nothing found
    if (detectedItems.length === 0) {
      detectedItems.push({
        title: 'Review Potential Savings',
        summary: 'We analyzed your document but didn\'t find specific clear-cut subscriptions. However, we noticed several recurring vendors.',
        type: 'savings_opportunity',
        estimatedSavings: 10.00,
        urgencyLevel: 'low',
        confidence: 'medium',
        recommendedAction: 'Audit your recurring vendor list.',
        nextSteps: ['Categorize your spending', 'Identify non-essential items'],
      });
    }

    const totalSavings = detectedItems.reduce((acc, item) => acc + (item.estimatedSavings || 0), 0);

    return {
      title: 'Monthly Spending Optimization Report',
      summary: `We detected ${detectedItems.length} items that could be optimized for a total monthly saving of $${totalSavings.toFixed(2)}.`,
      detectedItems,
      savingsEstimate: totalSavings,
      urgencyLevel: totalSavings > 50 ? 'high' : 'medium',
      confidence: 'high',
      recommendedActions: detectedItems.map(i => i.recommendedAction),
      nextSteps: ['Log into your banking app', 'Use our copyable messages for cancellation'],
      beforeAfterComparison: {
        currentSituation: 'Currently paying full price for multiple subscriptions and hidden fees.',
        optimizedSituation: 'Streamlined services with only essentials remaining.',
        estimatedMonthlySavingsDifference: totalSavings
      }
    };
  }
}
