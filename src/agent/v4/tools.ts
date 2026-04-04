import { groq } from '@/ai/groq';
import { AgentStep, ToolResult } from './types';
import { GmailService } from '@/services/gmail-service';

/**
 * @fileOverview Tool Execution Agent v4.3: Real logic with Gmail capabilities.
 */

const tools = {
  analyze: async (input: string, imageUri?: string) => {
    const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    const res = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Extract key structural details, financial markers, and objective insights.' },
        { role: 'user', content: imageUri ? [{ type: 'text', text: input }, { type: 'image_url', image_url: { url: imageUri } }] : input }
      ],
      temperature: 0
    });
    return { insights: res.choices[0]?.message?.content || '' };
  },

  detect_leaks: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Scan for subscriptions, hidden fees, and trial expiration patterns. Return JSON: {"leaks": [], "estimatedMonthlySavings": 0}' },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0
    });
    return JSON.parse(res.choices[0]?.message?.content || '{"leaks": [], "estimatedMonthlySavings": 0}');
  },

  optimize_time: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Identify schedule friction and low-value tasks. Suggest removal, movement, or combination.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });
    return { timeAudit: res.choices[0]?.message?.content || '' };
  },

  generate_strategy: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Develop actionable business or personal growth strategies. Focus on revenue and efficiency.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });
    return { strategy: res.choices[0]?.message?.content || '' };
  },

  technical_debug: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Audit technical logic and suggest precise implementation fixes.' },
        { role: 'user', content: input }
      ],
      temperature: 0
    });
    return { technicalAudit: res.choices[0]?.message?.content || '' };
  },

  send_email: async (input: { to: string; subject: string; body: string }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('operator_gmail_token') : null;
    if (!token) return { error: 'Gmail not connected or token expired.' };

    const success = await GmailService.sendEmail(token, input.to, input.subject, input.body);
    return { success, message: success ? 'Email sent successfully.' : 'Failed to send email.' };
  },

  suggest_actions: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Generate concrete, actionable next steps.' },
        { role: 'user', content: input }
      ],
      temperature: 0.2
    });
    return { actions: res.choices[0]?.message?.content || '' };
  }
};

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log("[TOOLS] Executing tools sequence...");
  const results: ToolResult[] = [];
  for (const step of plan) {
    const tool = tools[step.action as keyof typeof tools];
    if (tool) {
      try {
        // Handle input extraction if the tool expects an object (e.g., send_email)
        let toolInput: any = input;
        if (step.action === 'send_email') {
          // The agent should provide the context in the plan description or we extract it
          // For MVP, we'll use an LLM call to extract email details from context if needed
          // but usually the planner should provide it. Here we assume simplified extraction.
        }

        const result = await tool(toolInput as any, imageUri);
        results.push({ action: step.action, output: result });
      } catch (err) {
        results.push({ action: step.action, output: null, error: "Execution failed." });
      }
    }
  }
  return results;
}
