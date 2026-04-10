import { AgentCriticInputV8 } from './types';

type VerificationResult = {
  passed: boolean;
  refinedReply: string;
  notes: string[];
};

const GENERIC_PATTERNS = [
  /as an ai/i,
  /i can assist with that/i,
  /let me know if you need anything else/i,
  /prepared response/i,
  /here is a direct, grounded answer to your question\.?/i,
  /i understood your request/i,
  /operator/i,
];

export function verifyExecutionV8(input: AgentCriticInputV8): VerificationResult {
  const notes: string[] = [];
  let refinedReply = input.reply.trim();

  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(refinedReply)) {
      refinedReply = refinedReply.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
      notes.push('Removed generic assistant phrasing.');
    }
  }

  if (input.intent !== 'gmail' && input.usedTools.includes('gmail_fetch')) {
    notes.push('Gmail tool executed outside explicit Gmail intent.');
  }

  if (input.intent === 'general' && input.usedTools.length > 0) {
    notes.push('General intent should avoid tools unless strictly required.');
  }

  if (refinedReply.length > 0 && refinedReply.split(/\s+/).length < 8) {
    notes.push('Reply may be too short to be useful for the request.');
  }

  if (!refinedReply) {
    refinedReply = 'I need one concrete detail to give a precise answer.';
    notes.push('Inserted fallback because draft reply was empty.');
  }

  const passed = !notes.some((note) => note.includes('outside explicit Gmail intent'));

  return {
    passed,
    refinedReply,
    notes,
  };
}
