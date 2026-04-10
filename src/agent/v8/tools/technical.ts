import { AgentContextV8, ToolResultV8 } from '../types';

function extractErrorSignals(text: string): string[] {
  const matches: string[] = [];
  if (/undefined|null/.test(text)) matches.push('Null/undefined state access risk');
  if (/timeout|timed out/.test(text)) matches.push('Timeout boundary exceeded');
  if (/401|403|unauthorized|forbidden/.test(text)) matches.push('Authentication/authorization mismatch');
  if (/500|internal server/.test(text)) matches.push('Unhandled server-side exception');
  if (/type|typescript/.test(text)) matches.push('Type mismatch between runtime and compile-time assumptions');
  return matches;
}

export async function analyzeErrorTool(input: Record<string, unknown>, context: AgentContextV8): Promise<ToolResultV8> {
  const text = String(input.text || context.user.message || '').toLowerCase();
  const signals = extractErrorSignals(text);

  return {
    ok: true,
    tool: 'analyze_error',
    output: {
      probableRootCauses: signals.length ? signals : ['Insufficient context; request stack trace and reproduction steps.'],
      confidence: signals.length ? 0.78 : 0.44,
      requiresLogs: signals.length === 0,
    },
  };
}

export async function suggestFixTool(input: Record<string, unknown>, _context: AgentContextV8): Promise<ToolResultV8> {
  const text = String(input.text || '').toLowerCase();
  const actions = [
    'Add guard clauses for nullable values at service boundaries.',
    'Introduce structured error telemetry with request correlation IDs.',
    'Add regression test for the failing scenario before patching.',
  ];

  if (text.includes('timeout')) {
    actions.unshift('Add retry with exponential backoff and adjust timeout thresholds.');
  }

  return {
    ok: true,
    tool: 'suggest_fix',
    output: {
      actions,
      patchStrategy: 'small-safe-iterative',
      priority: 'high',
    },
  };
}
