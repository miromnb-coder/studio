import { AgentCriticInputV8, CriticResultV8 } from './types';

const GENERIC_PATTERNS = [
  /as an ai/i,
  /i can assist with that/i,
  /let me know if you need anything else/i,
  /prepared response/i,
  /i understood your request/i,
  /^sure[,!]?\s*/i,
  /^absolutely[,!]?\s*/i,
  /^great question[.!]?\s*/i,
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function scoreDimension(test: boolean, weight: number): number {
  return test ? weight : 0;
}

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

function enforceStructure(reply: string): string {
  let refined = reply;
  if (!/observation:/i.test(refined)) {
    refined = `Observation: ${refined}`;
  }
  if (!/interpretation:/i.test(refined)) {
    refined = `${refined}\nInterpretation: The main issue is decision quality and prioritization, not a lack of options.`;
  }
  if (!/next focus:/i.test(refined)) {
    refined = `${refined}\nNext focus: Validate one high-impact path and avoid splitting attention too early.`;
  }
  if (!/recommendation:|best next step:/i.test(refined)) {
    refined = `${refined}\nRecommendation: Prioritize the highest-leverage move first, then sequence follow-up actions.`;
  }
  if (!/action steps:|next actions:|ranked actions:/i.test(refined)) {
    refined = `${refined}\n\nAction steps:\n- 1. Execute the top move now.\n- 2. Complete one additional quick win.`;
  }
  if (!/next step:/i.test(refined)) {
    refined = `${refined}\nNext Step: Confirm action 1 and I will convert it into a checklist.`;
  }
  if (!/confidence:/i.test(refined)) {
    refined = `${refined}\nConfidence: Medium (grounded in available data, but precision improves with one concrete number).`;
  }
  if (!/assumptions:/i.test(refined)) {
    refined = `${refined}\nAssumptions: Baseline amounts and billing windows may be incomplete.`;
  }
  return refined;
}

function softenOverconfidence(reply: string, notes: string[]): string {
  if (!/guaranteed|definitely|certainly|100%|always/gi.test(reply)) return reply;
  notes.push('Softened unsupported certainty claims.');
  return reply.replace(/guaranteed|definitely|certainly|100%|always/gi, 'likely');
}

function composeFallback(question?: string): string {
  return [
    'Observation: I reviewed your request and the key gap is missing numeric grounding.',
    'Interpretation: Without one concrete number, any ranking will be broad and lower-confidence.',
    'Next focus: Add one recurring cost or savings target so I can prioritize accurately.',
    'Recommendation: Start with the single highest monthly pressure item before optimizing anything else.',
    'Action steps:',
    '- 1. Share one monthly bill, recurring charge, or savings target.',
    '- 2. If Gmail is connected, run a 90-day receipt scan with invoice/payment/renewal keywords.',
    `Question: ${question || 'Which single expense should we optimize first?'}.`,
    'Confidence: Low (missing numeric anchor).',
    'Assumptions: Current data is partial and may miss key transactions.',
    'Next Step: Send one concrete number and I will build a prioritized plan.',
  ].join('\n');
}

export function verifyExecutionV8(input: AgentCriticInputV8): CriticResultV8 {
  const notes: string[] = [];
  let refinedReply = String(input.reply || '').trim();

  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(refinedReply)) {
      refinedReply = refinedReply.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
      notes.push('Removed generic phrasing.');
    }
  }

  refinedReply = removeRepeatedSentences(refinedReply);
  refinedReply = softenOverconfidence(refinedReply, notes);
  refinedReply = enforceStructure(refinedReply);

  const hasNumbers = /\$?\d+[\d,.]*/.test(refinedReply);
  const hasPersonalization = /goal|you|your|memory|profile|pressure|preference|situation/i.test(refinedReply);
  const hasPrioritization = /recommendation:|best next step:|ranked actions:|top priority:|fastest win:|risk to watch:/i.test(refinedReply);
  const hasActionability = /-\s*1\.|checklist|reply\s+"|execute|cancel|switch|downgrade/i.test(refinedReply);
  const hasHonesty = /confidence:|assumptions:|missing|unknown|estimate/i.test(refinedReply);
  const hasClarity = /observation:|interpretation:|next focus:|recommendation:|next step:/i.test(refinedReply);
  const hasToolGrounding = input.usedTools.length > 0 || Object.keys(input.structuredData || {}).length > 0;
  const hasReasoningFlow = /observation:|interpretation:|next focus:/i.test(refinedReply);
  const hasRiskAndPriority = /top priority:|risk to watch:|fastest win:/i.test(refinedReply);
  const hasConcreteNext = /next step:\s*(reply|share|send|confirm|run|execute)/i.test(refinedReply);
  const conciseEnough = refinedReply.split(/\s+/).length <= 320;
  const noFiller = !/here are some ideas|it depends|you could consider/i.test(refinedReply);
  const relevant = input.intent === 'finance'
    ? /savings|spend|bill|subscription|cash|risk|monthly/i.test(refinedReply)
    : true;

  const score = clamp(
    scoreDimension(relevant, 16)
    + scoreDimension(hasActionability, 14)
    + scoreDimension(hasPrioritization, 14)
    + scoreDimension(hasPersonalization, 10)
    + scoreDimension(hasHonesty, 10)
    + scoreDimension(hasClarity, 10)
    + scoreDimension(hasReasoningFlow, 10)
    + scoreDimension(hasNumbers || !hasToolGrounding, 6)
    + scoreDimension(hasRiskAndPriority, 4)
    + scoreDimension(hasConcreteNext, 10)
    + scoreDimension(conciseEnough, 4)
    + scoreDimension(noFiller, 6),
  );

  const needsRewrite = score < 85;

  if (needsRewrite) {
    notes.push(`Quality threshold miss (${score}/100). Applied strict rewrite fallback.`);
    refinedReply = composeFallback(input.plan.clarificationQuestion);
  } else if (input.plan.clarificationQuestion && !/question:/i.test(refinedReply)) {
    refinedReply = `${refinedReply}\nQuestion: ${input.plan.clarificationQuestion}`;
    notes.push('Added high-value clarification question.');
  }

  if (!refinedReply.trim()) {
    refinedReply = composeFallback(input.plan.clarificationQuestion);
    notes.push('Inserted empty-reply fallback.');
  }

  return {
    criticScore: score,
    passed: !needsRewrite,
    needsRewrite,
    qualityNotes: notes,
    refinedReply,
  };
}
