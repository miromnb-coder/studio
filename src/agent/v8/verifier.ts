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

function hasEnglishLeakForNonEnglish(text: string, lang: string): boolean {
  if (lang === 'en') return false;
  const commonEnglish = /\b(observation|interpretation|recommendation|next step|confidence|assumptions|action steps|i recommend|you should|the|and|your|this means|fastest|risk to watch)\b/i;
  const tokens = text.toLowerCase().split(/[^a-zåäö]+/).filter((t) => t.length > 2);
  const englishStop = new Set(['the', 'and', 'your', 'with', 'from', 'this', 'that', 'next', 'step', 'confidence', 'assumptions', 'recommendation']);
  const stopCount = tokens.filter((t) => englishStop.has(t)).length;
  return commonEnglish.test(text) || stopCount >= 6;
}

function applyLanguageGuard(reply: string, lang: string): string {
  if (lang === 'en') return reply;
  if (!hasEnglishLeakForNonEnglish(reply, lang)) return reply;
  if (lang === 'fi') {
    return reply
      .replace(/Observation:/gi, 'Ymmärrys:')
      .replace(/Interpretation:/gi, 'Tulkinta:')
      .replace(/Recommendation:/gi, 'Suositus:')
      .replace(/Action steps:/gi, 'Seuraavat askeleet:')
      .replace(/Next Step:/gi, 'Seuraava askel:')
      .replace(/Confidence:/gi, 'Varmuustaso:')
      .replace(/Assumptions:/gi, 'Oletukset:');
  }
  if (lang === 'sv') {
    return reply
      .replace(/Observation:/gi, 'Förståelse:')
      .replace(/Interpretation:/gi, 'Tolkning:')
      .replace(/Recommendation:/gi, 'Rekommendation:')
      .replace(/Action steps:/gi, 'Nästa steg:')
      .replace(/Next Step:/gi, 'Nästa steg:')
      .replace(/Confidence:/gi, 'Säkerhet:')
      .replace(/Assumptions:/gi, 'Antaganden:');
  }
  return reply;
}

function buildSectionLabels(lang: string) {
  if (lang === 'fi') {
    return {
      now: 'Mikä on tärkeintä nyt',
      recommendation: 'Paras suositus',
      why: 'Miksi tämä toimii',
      nextMove: 'Selkeä seuraava siirto',
      deeper: 'Lisätieto (valinnainen)',
      confidence: 'Varmuustaso',
      assumptions: 'Oletukset',
    };
  }
  if (lang === 'sv') {
    return {
      now: 'Vad som betyder mest nu',
      recommendation: 'Bästa rekommendationen',
      why: 'Varför detta fungerar',
      nextMove: 'Tydligt nästa steg',
      deeper: 'Fördjupning (valfritt)',
      confidence: 'Säkerhet',
      assumptions: 'Antaganden',
    };
  }
  return {
    now: 'What matters most now',
    recommendation: 'Best recommendation',
    why: 'Why this matters',
    nextMove: 'Clear next move',
    deeper: 'Optional deeper detail',
    confidence: 'Confidence',
    assumptions: 'Assumptions',
  };
}

function firstSentence(text: string, fallback: string): string {
  const part = text.split(/(?<=[.!?])\s+/).map((item) => item.trim()).find(Boolean);
  return part || fallback;
}

function buildPremiumRewrite(args: { reply: string; lang: string; question?: string; concise?: boolean }): string {
  const labels = buildSectionLabels(args.lang);
  const cleaned = args.reply.replace(/\n{3,}/g, '\n\n').trim();
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  const bulletCandidates = lines.filter((line) => /^-\s*/.test(line)).slice(0, 2);
  const bestAction = bulletCandidates[0]?.replace(/^-+\s*/, '') || firstSentence(cleaned, args.question || 'Start with one concrete action.');
  const why = firstSentence(
    lines.find((line) => /because|since|risk|impact|help|koska|vaikut|risk|eftersom/i.test(line)) || '',
    args.lang === 'fi'
      ? 'Tämä vähentää epävarmuutta ja nostaa onnistumisen todennäköisyyttä heti.'
      : args.lang === 'sv'
        ? 'Detta minskar osäkerhet och höjer sannolikheten för snabb effekt.'
        : 'This reduces uncertainty and increases the chance of immediate progress.',
  );

  const nextMoveText = args.question
    ? args.lang === 'fi'
      ? `Vastaa tähän: ${args.question}`
      : args.lang === 'sv'
        ? `Svara på detta: ${args.question}`
        : `Reply with this: ${args.question}`
    : args.lang === 'fi'
      ? 'Lähetä yksi numero tai kulu, niin priorisoin toimet tarkasti.'
      : args.lang === 'sv'
        ? 'Skicka en siffra eller kostnad så prioriterar jag nästa steg exakt.'
        : 'Send one concrete number/cost and I will prioritize the exact next actions.';

  const confidence = args.lang === 'fi' ? 'Keskitaso' : args.lang === 'sv' ? 'Medel' : 'Medium';
  const assumptions = args.lang === 'fi'
    ? 'Osa tiedoista on vielä epätäydellinen, joten suositus painottaa nopeaa vaikutusta.'
    : args.lang === 'sv'
      ? 'Viss data saknas fortfarande, så rekommendationen prioriterar snabb effekt.'
      : 'Some data is still partial, so this recommendation prioritizes immediate impact.';

  return [
    `${labels.now}: ${firstSentence(cleaned, bestAction)}`,
    `${labels.recommendation}: ${bestAction}`,
    `${labels.why}: ${why}`,
    `${labels.nextMove}: ${nextMoveText}`,
    args.concise ? '' : `${labels.deeper}: ${bulletCandidates[1]?.replace(/^-+\s*/, '') || ''}`,
    `${labels.confidence}: ${confidence}.`,
    `${labels.assumptions}: ${assumptions}`,
  ].filter(Boolean).join('\n');
}

function composeFallback(question: string | undefined, lang: string): string {
  if (lang === 'fi') {
    return [
      'Ymmärrys: Pyyntösi on selkeä, mutta yksi avainnumero puuttuu priorisoinnista.',
      'Tulkinta: Ilman yhtä konkreettista lukua suositus jää liian yleiseksi.',
      'Suositus: Aloita suurimmasta toistuvasta kuukausikulusta ja optimoi se ensin.',
      'Seuraavat askeleet:',
      '- 1. Lähetä yksi kuukausikulu, lasku tai säästötavoite.',
      '- 2. Jos Gmail on käytössä, tarkista 90 päivän lasku-/maksu-/uusinta-viestit.',
      `Kysymys: ${question || 'Mikä yksittäinen meno optimoidaan ensin?'}`,
      'Varmuustaso: Matala.',
      'Oletukset: Nykyinen data on osittainen.',
      'Seuraava askel: Lähetä yksi numero, niin teen tarkan prioriteettilistan.',
    ].join('\n');
  }
  if (lang === 'sv') {
    return [
      'Förståelse: Din fråga är tydlig men saknar en nyckelsiffra för prioritering.',
      'Tolkning: Utan en konkret siffra blir rekommendationen för generell.',
      'Rekommendation: Börja med den största återkommande månadskostnaden först.',
      'Nästa steg:',
      '- 1. Skicka en månadskostnad, faktura eller ett sparmål.',
      '- 2. Om Gmail är kopplat, skanna 90 dagar av kvitto-/betalningsmail.',
      `Fråga: ${question || 'Vilken enskild kostnad ska optimeras först?'}`,
      'Säkerhet: Låg.',
      'Antaganden: Tillgänglig data är delvis ofullständig.',
      'Nästa steg: Skicka en siffra så bygger jag en exakt prioritering.',
    ].join('\n');
  }

  return [
    'Observation: I reviewed your request and the key gap is missing numeric grounding.',
    'Interpretation: Without one concrete number, any ranking will be broad and lower-confidence.',
    'Recommendation: Start with the single highest monthly pressure item before optimizing anything else.',
    'Action steps:',
    '- 1. Share one monthly bill, recurring charge, or savings target.',
    '- 2. If Gmail is connected, run a 90-day receipt scan with invoice/payment/renewal keywords.',
    `Question: ${question || 'Which single expense should we optimize first?'}.`,
    'Confidence: Low.',
    'Assumptions: Current data is partial and may miss key transactions.',
    'Next Step: Send one concrete number and I will build a prioritized plan.',
  ].join('\n');
}

export function verifyExecutionV8(input: AgentCriticInputV8): CriticResultV8 {
  const notes: string[] = [];
  const language = input.responseLanguage || 'en';
  const goal = input.goal || {
    emotionalTone: 'neutral',
    speedVsDepth: 'balanced',
  };
  let refinedReply = String(input.reply || '').trim();

  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(refinedReply)) {
      refinedReply = refinedReply.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
      notes.push('Removed generic phrasing.');
    }
  }

  refinedReply = removeRepeatedSentences(refinedReply);
  refinedReply = applyLanguageGuard(refinedReply, language);

  const hasPersonalization = /goal|you|your|memory|profile|pressure|preference|situation|sinun|din/i.test(refinedReply);
  const hasActionability = /-\s*1\.|checklist|execute|cancel|switch|downgrade|seuraava|nästa/i.test(refinedReply);
  const hasHonesty = /confidence|assumptions|missing|unknown|estimate|varmuustaso|oletus|säkerhet|antag/i.test(refinedReply);
  const hasClarity = refinedReply.split(/\n+/).length >= 3;
  const hasToolGrounding = input.usedTools.length > 0 || Object.keys(input.structuredData || {}).length > 0;
  const hasConcreteNext = /next step|seuraava askel|nästa steg/i.test(refinedReply);
  const conciseEnough = refinedReply.split(/\s+/).length <= 360;
  const noFiller = !/here are some ideas|it depends|you could consider/i.test(refinedReply);
  const languageConsistent = !hasEnglishLeakForNonEnglish(refinedReply, language);
  const hasPriorityFirst = /what matters most now|best recommendation|clear next move|mikä on tärkeintä nyt|paras suositus|selkeä seuraava siirto|vad som betyder mest nu|bästa rekommendationen|tydligt nästa steg/i.test(refinedReply);
  const lowLoadWhenStressed = goal.emotionalTone !== 'overwhelmed' || refinedReply.split(/\n/).length <= 10;

  const score = clamp(
    scoreDimension(hasActionability, 20)
    + scoreDimension(hasPersonalization, 14)
    + scoreDimension(hasHonesty, 12)
    + scoreDimension(hasClarity, 12)
    + scoreDimension(hasConcreteNext, 14)
    + scoreDimension(languageConsistent, 16)
    + scoreDimension(hasPriorityFirst, 6)
    + scoreDimension(lowLoadWhenStressed, 4)
    + scoreDimension(hasToolGrounding || input.intent !== 'finance', 6)
    + scoreDimension(conciseEnough, 4)
    + scoreDimension(noFiller, 2),
  );

  const needsRewrite = score < 82;

  if (needsRewrite || !refinedReply.trim()) {
    notes.push(`Quality threshold miss (${score}/100). Applied localized fallback rewrite.`);
    refinedReply = buildPremiumRewrite({
      reply: refinedReply || composeFallback(input.plan.clarificationQuestion, language),
      lang: language,
      question: input.plan.clarificationQuestion,
      concise: goal.emotionalTone === 'overwhelmed' || goal.speedVsDepth === 'speed',
    });
  }

  if (!hasPriorityFirst) {
    refinedReply = buildPremiumRewrite({
      reply: refinedReply,
      lang: language,
      question: input.plan.clarificationQuestion,
      concise: goal.emotionalTone === 'overwhelmed',
    });
    notes.push('Upgraded answer to priority-first premium structure.');
  }

  return {
    criticScore: score,
    passed: !needsRewrite,
    needsRewrite,
    qualityNotes: notes,
    refinedReply,
  };
}
