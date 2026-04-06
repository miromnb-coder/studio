import { groq } from '@/ai/groq';
import { ToolDefinition } from './types';
import { GmailService } from '@/services/gmail-service';

/**
 * @fileOverview Dynamic Tool Registry for Agent v5.
 * Supports built-in tools and tools forged at runtime.
 */

export const STATIC_TOOLS: Record<string, ToolDefinition> = {
  analyze: {
    id: 'analyze',
    name: 'analyze',
    description: 'Perform deep structural or visual analysis of inputs to extract insights.',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
    impact: { timeSavedMinutes: 15 },
    execute: async ({ input }, { imageUri }) => {
      const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
      const res = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Extract key structural details and objective insights.' },
          { role: 'user', content: imageUri ? [{ type: 'text', text: input }, { type: 'image_url', image_url: { url: imageUri } }] : input }
        ],
        temperature: 0
      });
      return { insights: res.choices[0]?.message?.content || '' };
    }
  },

  detect_leaks: {
    id: 'detect_leaks',
    name: 'detect_leaks',
    description: 'Scan data for predatory subscriptions, hidden fees, and trial patterns.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
    impact: { moneySaved: 45, timeSavedMinutes: 30 },
    execute: async ({ text }) => {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Scan for subscriptions, hidden fees, and leaks. Return JSON: {"leaks": [], "estimatedMonthlySavings": 0}' },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });
      return JSON.parse(res.choices[0]?.message?.content || '{"leaks": [], "estimatedMonthlySavings": 0}');
    }
  },

  optimize_time: {
    id: 'optimize_time',
    name: 'optimize_time',
    description: 'Identify schedule friction and low-value tasks. Suggest removal or automation.',
    inputSchema: { type: 'object', properties: { context: { type: 'string' } } },
    impact: { timeSavedMinutes: 120 },
    execute: async ({ context }) => {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Audit schedule for time leaks and automation opportunities.' },
          { role: 'user', content: context }
        ],
        temperature: 0.1
      });
      return { timeAudit: res.choices[0]?.message?.content || '' };
    }
  },

  send_email: {
    id: 'send_email',
    name: 'send_email',
    description: 'Send a professional email via Gmail. Requires recipient, subject, and body.',
    inputSchema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } } },
    impact: { timeSavedMinutes: 10 },
    execute: async ({ to, subject, body }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('operator_gmail_token') : null;
      if (!token) return { error: 'Gmail connection missing.' };
      const success = await GmailService.sendEmail(token, to, subject, body);
      return { success, message: success ? 'Protocol deployed.' : 'Transmission failed.' };
    }
  }
};

/**
 * Dynamic registry that combines static tools with dynamically forged ones.
 */
export class ToolRegistry {
  private dynamicTools: Record<string, ToolDefinition> = {};

  register(tool: ToolDefinition) {
    this.dynamicTools[tool.id] = tool;
  }

  getTool(id: string): ToolDefinition | undefined {
    return STATIC_TOOLS[id] || this.dynamicTools[id];
  }

  getAvailableTools(): ToolDefinition[] {
    return [...Object.values(STATIC_TOOLS), ...Object.values(this.dynamicTools)];
  }
}

export const activeRegistry = new ToolRegistry();
