import { groq } from '@/ai/groq';
import { ToolDefinition } from './types';
import { GmailService } from '@/services/gmail-service';

/**
 * @fileOverview Dynamic Tool Registry.
 * Exclusively uses Groq models for all tool-level intelligence.
 */

export const STATIC_TOOLS: Record<string, ToolDefinition> = {
  analyze: {
    id: 'analyze',
    name: 'analyze',
    description: 'Perform deep structural or visual analysis using Groq Vision.',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
    impact: { timeSavedMinutes: 15 },
    execute: async ({ input }, { imageUri }) => {
      // Use Llama 3.2 Vision for images, 3.3 for text
      const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
      
      console.log(`CALLING GROQ (Tool: analyze, Model: ${model})...`);
      const res = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Extract key structural details and objective insights.' },
          { 
            role: 'user', 
            content: imageUri 
              ? [
                  { type: 'text', text: input || 'Analyze this source.' }, 
                  { type: 'image_url', image_url: { url: imageUri } }
                ] 
              : (input || 'Analyze this source.')
          }
        ],
        temperature: 0
      });
      console.log("GROQ RESPONSE RECEIVED");
      return { insights: res.choices[0]?.message?.content || '' };
    }
  },

  detect_leaks: {
    id: 'detect_leaks',
    name: 'detect_leaks',
    description: 'Scan data for leaks and waste using Groq Reasoning.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
    impact: { moneySaved: 45, timeSavedMinutes: 30 },
    execute: async ({ text }) => {
      console.log("CALLING GROQ (Tool: detect_leaks)...");
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Scan for subscriptions, hidden fees, and leaks. Return JSON: {"leaks": [], "estimatedMonthlySavings": 0}' },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });
      console.log("GROQ RESPONSE RECEIVED");
      return JSON.parse(res.choices[0]?.message?.content || '{"leaks": [], "estimatedMonthlySavings": 0}');
    }
  },

  optimize_time: {
    id: 'optimize_time',
    name: 'optimize_time',
    description: 'Audit schedule for temporal leaks using Groq.',
    inputSchema: { type: 'object', properties: { context: { type: 'string' } } },
    impact: { timeSavedMinutes: 120 },
    execute: async ({ context }) => {
      console.log("CALLING GROQ (Tool: optimize_time)...");
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Audit schedule for time leaks and automation opportunities.' },
          { role: 'user', content: context }
        ],
        temperature: 0.1
      });
      console.log("GROQ RESPONSE RECEIVED");
      return { timeAudit: res.choices[0]?.message?.content || '' };
    }
  },

  send_email: {
    id: 'send_email',
    name: 'send_email',
    description: 'Send a professional email via Gmail Transmitter.',
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
