import { AgentContextV8, ToolResultV8 } from '../types';

export async function checkGmailConnectionTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  return {
    ok: true,
    tool: 'check_gmail_connection',
    output: {
      connected: context.environment.gmailConnected,
      importAvailable: context.environment.gmailConnected,
    },
  };
}

export async function importGmailFinanceTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  if (!context.environment.gmailConnected) {
    return {
      ok: false,
      tool: 'import_gmail_finance',
      output: { imported: 0 },
      error: 'Gmail is not connected.',
    };
  }

  return {
    ok: true,
    tool: 'import_gmail_finance',
    output: {
      imported: 0,
      status: 'Future-ready hook. Import handled by dedicated integration route.',
    },
  };
}
