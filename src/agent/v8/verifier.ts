import { AgentCriticInputV8, CriticResultV8 } from './types';

const GENERIC_PATTERNS = [
  /as an ai/i,
  /i can assist with that/i,
  /let me know if you need anything else/i,
  /prepared response/i,
  /i understood your request/i,
  /operator/i,
  /^sure[,!]\s*/i,
  /^absolutely[,!]\s*/i,
  /^great question[.!]?\s*/i,
];

function removeRepeatedSentences(text: string): string {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }
  return unique.join(' ').trim();
}

function scoreDimension(condition: boolean, weight: number): number {
  return condition ? weight : 0;
}

function ensureNextStep(reply: string): string {
  if (/next step:/i.test(reply)) return reply;
  return `${reply}\n\nNext Step: Choose one action above and I can turn it into a concrete checklist.`.trim();
}

function normalizeConfidenceLanguage(reply: string, notes: string[]): string {
  const hasOverclaim = /guaranteed|definitely|certainly|100%|always/i.test(reply);
  if (!hasOverclaim) return reply;
  notes.push('Reduced certainty to keep confidence honest and assumption-aware.');
  return reply.replace(/guaranteed|definitely|certainly|100%|always/gi, 'likely');
}

export function verifyExecutionV8(input: AgentCriticInputV8): CriticResultV8 {
  const notes: string[] = [];
  let refinedReply = input.reply.trim();

  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(refinedReply)) {
      refinedReply = refinedReply.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
      notes.push('Removed generic assistant phrasing.');
    }
  }

  refinedReply = removeRepeatedSentences(refinedReply);
  refinedReply = normalizeConfidenceLanguage(refinedReply, notes);

  const hasToolEvidence = input.usedTools.length > 0 || Object.keys(input.structuredData || {}).length > 0;
  const hasNumbers = /\$?\d+[\d,.]*/.test(refinedReply);
  const hasActions = /top actions:|\n- |should|cancel|review|reduce|switch|next step:/i.test(refinedReply);
  const hasClarityStructure = /summary:|confidence:|next step:/i.test(refinedReply);
  const hasAssumptionsOrConfidence = /confidence:|assumption|estimate|based on/i.test(refinedReply);

  if (!hasActions) {
    refinedReply = `${refinedReply}\n\nTop Actions:\n- Start with the highest-impact recurring cost and reduce it this week.`.trim();
    notes.push('Added explicit actionability block.');
  }

  refinedReply = ensureNextStep(refinedReply);

  if (!refinedReply) {
    refinedReply = 'I need one concrete detail to give a precise answer. Next Step: Share one transaction, one bill, or one target amount.';
    notes.push('Inserted fallback because draft reply was empty.');
  }

  if (input.intent !== 'gmail' && input.usedTools.includes('gmail_fetch')) {
    notes.push('Gmail tool executed outside explicit Gmail intent.');
  }

  const usefulness = scoreDimension(refinedReply.split(/\s+/).length >= 18, 15);
  const actionability = scoreDimension(hasActions, 15);
  const confidenceHonesty = scoreDimension(hasAssumptionsOrConfidence, 14);
  const logicalConsistency = scoreDimension(!/but\s+not\s+enough\s+data/i.test(refinedReply) || hasToolEvidence, 12);
  const numericalConsistency = scoreDimension(!hasToolEvidence || hasNumbers, 12);
  const prioritizationQuality = scoreDimension(/biggest opportunity|top actions|priority/i.test(refinedReply), 12);
  const clarity = scoreDimension(hasClarityStructure, 10);
  const groundedness = scoreDimension(hasToolEvidence || /insufficient grounded/i.test(refinedReply), 10);

  const criticScore = usefulness + actionability + confidenceHonesty + logicalConsistency + numericalConsistency + prioritizationQuality + clarity + groundedness;
  const needsRewrite = criticScore < 70 || notes.some((note) => note.includes('outside explicit Gmail intent'));
  const passed = !needsRewrite;

  if (needsRewrite) {
    notes.push('Reply required tightening due to quality threshold miss (<70).');
  }

  return {
    criticScore,
    passed,
    needsRewrite,
    qualityNotes: notes,
    refinedReply,
  };
}
