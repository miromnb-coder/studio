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

  const score = clamp(
    scoreDimension(hasActionability, 20)
    + scoreDimension(hasPersonalization, 14)
    + scoreDimension(hasHonesty, 12)
    + scoreDimension(hasClarity, 12)
    + scoreDimension(hasConcreteNext, 14)
    + scoreDimension(languageConsistent, 16)
    + scoreDimension(hasToolGrounding || input.intent !== 'finance', 6)
    + scoreDimension(conciseEnough, 4)
    + scoreDimension(noFiller, 2),
  );

  const needsRewrite = score < 82;

  if (needsRewrite || !refinedReply.trim()) {
    notes.push(`Quality threshold miss (${score}/100). Applied localized fallback rewrite.`);
    refinedReply = composeFallback(input.plan.clarificationQuestion, language);
  }

  return {
    criticScore: score,
    passed: !needsRewrite,
    needsRewrite,
    qualityNotes: notes,
    refinedReply,
  };
}
