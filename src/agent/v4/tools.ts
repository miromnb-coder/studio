import { groq } from '@/ai/groq';
import { ToolResult } from './types';
import { GmailService } from '@/services/gmail-service';

/**
 * @fileOverview Tool Execution Agent v4.3: Real logic with Gmail capabilities.
 */

export const tools = [
  {
    name: 'analyze',
    description: 'Perform deep structural or visual analysis of inputs to extract insights.',
    execute: async (input: { text?: string; imageUri?: string }) => {
      const { text, imageUri } = input;
      const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
      const res = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Extract key structural details, financial markers, and objective insights.' },
          { role: 'user', content: imageUri ? [{ type: 'text', text: text || '' }, { type: 'image_url', image_url: { url: imageUri } }] : (text || '') }
        ],
        temperature: 0
      });
      return { insights: res.choices[0]?.message?.content || '' };
    }
  },
  {
    name: 'detect_leaks',
    description: 'Scan data for predatory subscriptions, hidden fees, and trial patterns.',
    execute: async (input: { text: string }) => {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Scan for subscriptions, hidden fees, and trial expiration patterns. Return JSON: {"leaks": [], "estimatedMonthlySavings": 0}' },
          { role: 'user', content: input.text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });
      return JSON.parse(res.choices[0]?.message?.content || '{"leaks": [], "estimatedMonthlySavings": 0}');
    }
  },
  {
    name: 'optimize_time',
    description: 'Identify schedule friction and low-value tasks. Suggest removal or automation.',
    execute: async (input: { text: string }) => {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Identify schedule friction and low-value tasks. Suggest removal, movement, or combination.' },
          { role: 'user', content: input.text }
        ],
        temperature: 0.1
      });
      return { timeAudit: res.choices[0]?.message?.content || '' };
    }
  },
  {
    name: 'send_email',
    description: 'Send a professional email via Gmail. Requires to, subject, and body.',
    execute: async (input: { to: string; subject: string; body: string }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('operator_gmail_token') : null;
      if (!token) return { error: 'Gmail not connected or token expired.' };
      const success = await GmailService.sendEmail(token, input.to, input.subject, input.body);
      return { success, message: success ? 'Email sent successfully.' : 'Failed to send email.' };
    }
  }
];

export async function executeTools(plan: any[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log("[TOOLS] Executing tools sequence...");
  const results: ToolResult[] = [];
  for (const step of plan) {
    const tool = tools.find(t => t.name === step.action);
    if (tool) {
      try {
        const result = await tool.execute({ text: input, imageUri } as any);
        results.push({ action: step.action, output: result });
      } catch (err) {
        results.push({ action: step.action, output: null, error: "Execution failed." });
      }
    }
  }
  return results;
}
