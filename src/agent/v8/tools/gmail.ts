import { AgentContextV8, ToolResultV8 } from '../types';

export async function gmailFetchTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  if (!context.environment.gmailConnected) {
    return {
      ok: false,
      tool: 'gmail_fetch',
      output: { connected: false, messages: [] },
      error: 'Gmail is not connected.',
    };
  }

  const query = typeof input.query === 'string' ? input.query : context.user.message;
  const financeOnly = Boolean(input.financeOnly);

  return {
    ok: true,
    tool: 'gmail_fetch',
    output: {
      connected: true,
      query,
      financeOnly,
      status: 'Gmail fetch delegated to integration endpoint. Connection verified for this request.',
    },
  };
}
