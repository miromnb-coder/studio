import { ai } from '@/ai/genkit';
import { ToolDefinition } from './types';
import { GmailService } from '@/services/gmail-service';

/**
 * @fileOverview Dynamic Tool Registry for Agent v5.
 * Standardized using Genkit 1.x models.
 */

export const STATIC_TOOLS: Record<string, ToolDefinition> = {
  analyze: {
    id: 'analyze',
    name: 'analyze',
    description: 'Perform deep structural or visual analysis of inputs to extract insights.',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
    impact: { timeSavedMinutes: 15 },
    execute: async ({ input }, { imageUri }) => {
      const model = imageUri ? 'groq/llama-3.2-11b-vision-preview' : 'groq/llama-3.3-70b-versatile';
      
      const promptParts: any[] = [{ text: 'Extract key structural details and objective insights.' }];
      if (imageUri) {
        promptParts.push({ media: { url: imageUri } });
      }
      promptParts.push({ text: input });

      const { output } = await ai.generate({
        model,
        prompt: promptParts,
        config: { temperature: 0 }
      });
      return { insights: output?.text || '' };
    }
  },

  detect_leaks: {
    id: 'detect_leaks',
    name: 'detect_leaks',
    description: 'Scan data for predatory subscriptions, hidden fees, and trial patterns.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
    impact: { moneySaved: 45, timeSavedMinutes: 30 },
    execute: async ({ text }) => {
      const { output } = await ai.generate({
        model: 'groq/llama-3.3-70b-versatile',
        system: 'Scan for subscriptions, hidden fees, and leaks. Return JSON: {"leaks": [], "estimatedMonthlySavings": 0}',
        prompt: text,
        config: {
          responseFormat: 'json',
          temperature: 0
        }
      });
      return JSON.parse(output?.text || '{"leaks": [], "estimatedMonthlySavings": 0}');
    }
  },

  optimize_time: {
    id: 'optimize_time',
    name: 'optimize_time',
    description: 'Identify schedule friction and low-value tasks. Suggest removal or automation.',
    inputSchema: { type: 'object', properties: { context: { type: 'string' } } },
    impact: { timeSavedMinutes: 120 },
    execute: async ({ context }) => {
      const { output } = await ai.generate({
        model: 'groq/llama-3.3-70b-versatile',
        system: 'Audit schedule for time leaks and automation opportunities.',
        prompt: context,
        config: { temperature: 0.1 }
      });
      return { timeAudit: output?.text || '' };
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
