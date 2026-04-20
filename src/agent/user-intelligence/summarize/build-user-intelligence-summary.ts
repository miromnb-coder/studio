import type {
  DomainSignal,
  PreferenceSignal,
  TimeWindowSignal,
  UserIntelligenceProfile,
} from '../types';

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function confidenceRank(value: string): number {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  return 1;
}

function byStrength<T extends { confidence: string; evidenceCount: number; lastSeenAt: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const confidenceDelta = confidenceRank(b.confidence) - confidenceRank(a.confidence);
    if (confidenceDelta !== 0) return confidenceDelta;

    const evidenceDelta = b.evidenceCount - a.evidenceCount;
    if (evidenceDelta !== 0) return evidenceDelta;

    return b.lastSeenAt.localeCompare(a.lastSeenAt);
  });
}

function topItem<T extends { confidence: string; evidenceCount: number; lastSeenAt: string }>(
  items: T[],
): T | null {
  return byStrength(items)[0] ?? null;
}

function describePreference(signal: PreferenceSignal | null, keyLabel: string): string | null {
  if (!signal) return null;

  const value = normalizeText(signal.value.value);
  if (!value) return null;

  return `${keyLabel}: ${value}.`;
}

function describeTimeWindow(
  signal: TimeWindowSignal | null,
  labelPrefix: string,
): string | null {
  if (!signal) return null;

  const { label, day, startHour, endHour } = signal.value;
  const normalizedLabel = normalizeText(label);
  const parts: string[] = [];

  if (normalizeText(day)) parts.push(day as string);

  if (
    typeof startHour === 'number' &&
    Number.isFinite(startHour) &&
    typeof endHour === 'number' &&
    Number.isFinite(endHour)
  ) {
    parts.push(`${startHour}:00–${endHour}:00`);
  } else if (normalizedLabel) {
    parts.push(normalizedLabel);
  }

  const description = parts.join(', ');
  if (!description) return null;

  return `${labelPrefix}: ${description}.`;
}

function describeDomainSignal(signal: DomainSignal | null, prefix: string): string | null {
  if (!signal) return null;

  const value =
    normalizeText(signal.value.value) || normalizeText(signal.value.key);
  if (!value) return null;

  return `${prefix}: ${value}.`;
}

function uniqueSentences(lines: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const line of lines) {
    const normalized = normalizeText(line);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

export function buildUserIntelligenceSummary(
  profile: UserIntelligenceProfile | null,
): string {
  if (!profile) return '';

  const topLanguage = topItem(profile.preferences.responseLanguage);
  const topLength = topItem(profile.preferences.responseLength);
  const topStyle = topItem(profile.preferences.responseStyle);

  const focusWindow = topItem(profile.schedule.likelyFocusWindows);
  const overloadedDay = topItem(profile.schedule.overloadedDays);

  const topIntent = topItem(profile.usage.topIntents);
  const activeHour = topItem(profile.usage.activeHours);
  const preferredFlow = topItem(profile.usage.preferredFlows);

  const priceSensitivity = topItem(profile.decisions.priceSensitivity);
  const detailPreference = topItem(profile.decisions.detailPreference);

  const importantPerson = topItem(profile.communication.importantPeople);
  const recurringVendor = topItem(profile.finance.recurringVendors);

  const lines = uniqueSentences([
    describePreference(topLanguage, 'Preferred response language'),
    describePreference(topLength, 'Preferred response length'),
    describePreference(topStyle, 'Preferred response style'),
    describeTimeWindow(focusWindow, 'Likely focus window'),
    describeTimeWindow(overloadedDay, 'Often overloaded'),
    describeDomainSignal(topIntent, 'Frequently requested area'),
    describeTimeWindow(activeHour, 'Common app usage window'),
    preferredFlow
      ? `Preferred flow: ${normalizeText(preferredFlow.value.flow)}.`
      : null,
    describePreference(priceSensitivity, 'Price sensitivity'),
    describePreference(detailPreference, 'Detail preference'),
    importantPerson
      ? `Important contact: ${normalizeText(
          importantPerson.value.nameOrEmail,
        )}.`
      : null,
    recurringVendor
      ? `Recurring finance signal: ${normalizeText(
          recurringVendor.value.value,
        )}.`
      : null,
  ]);

  return lines.slice(0, 8).join(' ');
}
