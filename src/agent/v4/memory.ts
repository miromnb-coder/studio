import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { AgentContext, SessionMemoryRecord } from './types';

/**
 * @fileOverview Memory Agent: Safe long-term context management.
 */

function tokenize(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function scoreRecord(record: any, inputTokens: string[]): number {
  if (!inputTokens.length) return 0;

  const keywordTokens = tokenize((record.keywords || []).join(' '));
  const tagTokens = tokenize((record.tags || []).join(' '));
  const topicTokens = tokenize(record.topic);
  const decisionTokens = tokenize(record.decision);

  const overlap = (source: string[]) => source.filter((token) => inputTokens.includes(token)).length;

  let score = 0;
  score += overlap(keywordTokens) * 4;
  score += overlap(tagTokens) * 3;
  score += overlap(topicTokens) * 2;
  score += overlap(decisionTokens) * 2;

  const ts = typeof record.timestamp === 'number' ? record.timestamp : 0;
  if (ts > 0) {
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 2 - ageDays / 10);
  }

  return score;
}

export async function fetchMemory(userId: string, input?: string, maxRecords = 8) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId) return { profile: null, records: [] };
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    const recordsRef = collection(firestore, 'users', userId, 'memory_records');
    const recordsQuery = query(recordsRef, orderBy('timestamp', 'desc'), limit(50));
    const [profileSnap, recordsSnap] = await Promise.all([getDoc(memoryRef), getDocs(recordsQuery)]);

    const profile = profileSnap.exists() ? profileSnap.data() : null;
    const inputTokens = tokenize(input);

    const rankedRecords: any[] = recordsSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .map((record) => ({
        ...record,
        _score: scoreRecord(record, inputTokens),
      }))
      .sort((a: any, b: any) => {
        if (b._score === a._score) return (b.timestamp || 0) - (a.timestamp || 0);
        return b._score - a._score;
      })
      .slice(0, maxRecords)
      .map(({ _score, ...record }) => record);

    return {
      profile,
      records: rankedRecords,
    };
  } catch (e) {
    return { profile: null, records: [] };
  }
}

export function extractMemoryUpdates(context: AgentContext): { profileUpdates: any; records: SessionMemoryRecord[] } {
  const input = context.input || '';
  const inputTokens = tokenize(input);
  const topic = context.intent || 'general';

  const preferenceMatches = input.match(/\b(i\s+prefer|prefer|i\s+like|usually|always)\b[^.?!]*/gi) || [];
  const decisionMatches = [
    ...(input.match(/\b(i\s+will|we\s+will|let'?s|decide(?:d)?\s+to)\b[^.?!]*/gi) || []),
    ...context.plan.slice(0, 2).map((step) => step.action),
  ];
  const toolOutcome = context.toolResults
    .slice(0, 3)
    .map((result) => `${result.action}:${result.error ? 'error' : 'ok'}`)
    .join(', ');

  const outcomeSummary = `Intent ${context.intent}; tools ${context.toolResults.length}; critic ${context.criticFeedback?.score ?? 'n/a'}; ${toolOutcome || 'no tools'}.`;
  const confidence = Math.max(0, Math.min(1, (context.criticFeedback?.score ?? 7) / 10));

  const profileUpdates = {
    preferredTopics: dedupe([...(context.memory?.profile?.preferredTopics || []), topic]),
    preferences: dedupe([...(context.memory?.profile?.preferences || []), ...preferenceMatches.map((p) => p.trim())]),
    decisions: dedupe([...(context.memory?.profile?.decisions || []), ...decisionMatches.map((d) => d.trim())]),
    lastOutcomeSummary: outcomeSummary,
  };

  const records: SessionMemoryRecord[] = [
    {
      scope: 'session',
      topic,
      decision: decisionMatches[0]?.trim() || context.plan[0]?.action || 'continue',
      confidence,
      outcomeSummary,
      keywords: dedupe([topic, ...inputTokens.slice(0, 8)]),
      tags: dedupe([context.intent, context.language, context.fastPathUsed ? 'fast-path' : 'pipeline']),
      timestamp: Date.now(),
    },
  ];

  return { profileUpdates, records };
}

export async function updateMemory(userId: string, updates: { profileUpdates?: any; records?: SessionMemoryRecord[] }) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId) return;
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    const recordsRef = collection(firestore, 'users', userId, 'memory_records');

    await setDoc(memoryRef, {
      ...(updates.profileUpdates || {}),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    const writes = (updates.records || []).map((record) =>
      addDoc(recordsRef, {
        ...record,
        createdAt: serverTimestamp(),
      })
    );
    if (writes.length) await Promise.all(writes);
  } catch (e) {
    console.error("[MEMORY] Update failed:", e);
  }
}
