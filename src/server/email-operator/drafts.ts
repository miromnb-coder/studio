import { groq } from '@/ai/groq';
import { resolveAIModel } from '@/lib/ai/config';
import type { DraftReplySet, EmailOperatorPreferences } from './types';

export async function generateDraftReplySet(params: {
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
  preferences: EmailOperatorPreferences;
}): Promise<DraftReplySet> {
  const prompt = {
    messageFrom: params.from,
    subject: params.subject,
    snippet: params.snippet,
    preferences: {
      concise: params.preferences.concise,
      actionOriented: params.preferences.actionOriented,
    },
    requirements: {
      shortReply: 'Very short but clear.',
      professionalReply: 'Polished and executive-friendly.',
      friendlyReply: 'Warm and human tone.',
      politeDecline: 'Respectful decline with clear boundary.',
      askForMoreTime: 'Asks for extension with a specific follow-up date.',
      noAutoSend: true,
    },
  };

  try {
    const response = await groq.chat.completions.create({
      model: resolveAIModel(),
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You generate email draft variants. Return strict JSON with keys shortReply, professionalReply, friendlyReply, politeDecline, askForMoreTime. Keep each <= 120 words. Never mention auto-send.',
        },
        {
          role: 'user',
          content: JSON.stringify(prompt),
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}') as Record<string, unknown>;

    const fallbackLine = `Hi ${params.from.split('<')[0].trim() || 'there'}, thanks for your email. I'll follow up shortly.`;

    return {
      generatedAt: new Date().toISOString(),
      messageId: params.messageId,
      from: params.from,
      subject: params.subject,
      shortReply: String(parsed.shortReply || fallbackLine).trim(),
      professionalReply: String(parsed.professionalReply || fallbackLine).trim(),
      friendlyReply: String(parsed.friendlyReply || fallbackLine).trim(),
      politeDecline: String(parsed.politeDecline || 'Thank you for thinking of me. I need to decline at this time.').trim(),
      askForMoreTime: String(parsed.askForMoreTime || 'Thanks for the note. Could I get until early next week to send a full response?').trim(),
    };
  } catch {
    const base = `Thanks for your message about "${params.subject}".`;
    return {
      generatedAt: new Date().toISOString(),
      messageId: params.messageId,
      from: params.from,
      subject: params.subject,
      shortReply: `${base} I’ll reply in detail soon.`,
      professionalReply: `${base} I appreciate the update and will respond with the requested details shortly.`,
      friendlyReply: `${base} Got it — I’ll get back to you soon.`,
      politeDecline: `${base} I appreciate the opportunity, but I need to decline right now.`,
      askForMoreTime: `${base} Could I have until next week to provide a full response?`,
    };
  }
}
