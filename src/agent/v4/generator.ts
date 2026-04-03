import { AgentContext, MonetizationReport, TimeOptimizationReport } from './types';

/**
 * @fileOverview Streaming Response Generator Agent v4.2.
 * Strictly produces the final answer based on context and tools.
 */

export async function generateStreamResponse(context: AgentContext) {
  const content = buildFinalResponse(context);
  return singleChunkStream(content);
}

function buildFinalResponse(context: AgentContext): string {
  if (context.intent === 'time_optimizer') {
    const report = getToolOutput<TimeOptimizationReport>(context, 'optimize_time');
    if (!report) return 'Time-optimointiraporttia ei voitu muodostaa: työkalutulokset puuttuvat.';

    return [
      'Time Optimization Report',
      '',
      'Remove:',
      ...formatList(report.remove),
      '',
      'Optimize:',
      ...formatList(report.optimize),
      '',
      'Automate:',
      ...formatList(report.automate),
      '',
      `Estimated Time Savings: ${report.estimatedTimeSavings || 'N/A'}`
    ].join('\n');
  }

  if (context.intent === 'monetization') {
    const report = getToolOutput<MonetizationReport>(context, 'generate_strategy');
    if (!report) return 'Monetization-raporttia ei voitu muodostaa: työkalutulokset puuttuvat.';

    return [
      'Monetization Report',
      '',
      'Revenue Opportunities:',
      ...formatList(report.revenueOpportunities),
      '',
      'Inefficiencies:',
      ...formatList(report.inefficiencies),
      '',
      'Action Plan:',
      ...formatList(report.actionPlan),
      '',
      `Expected Impact: ${report.expectedImpact || 'N/A'}`
    ].join('\n');
  }

  const firstToolOutput = context.toolResults.find((result) => !result.error)?.output;
  if (!firstToolOutput) {
    return 'Tietoa ei voitu muodostaa: työkalutulokset puuttuvat tai epäonnistuivat.';
  }
  return typeof firstToolOutput === 'string' ? firstToolOutput : JSON.stringify(firstToolOutput, null, 2);
}

function getToolOutput<T>(context: AgentContext, action: string): T | null {
  const result = context.toolResults.find((item) => item.action === action && !item.error);
  if (!result?.output) return null;
  return result.output as T;
}

function formatList(items: string[] | undefined): string[] {
  if (!items?.length) return ['- None identified'];
  return items.map((item) => `- ${item}`);
}

async function* singleChunkStream(content: string) {
  yield {
    choices: [
      {
        delta: {
          content
        }
      }
    ]
  };
}
