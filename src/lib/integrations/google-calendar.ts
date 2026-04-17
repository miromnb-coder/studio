import crypto from 'node:crypto';

export const GOOGLE_CALENDAR_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export interface GoogleTokenBundle {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
}

export interface GoogleCalendarIntegrationState {
  status?: 'connected' | 'disconnected' | 'error' | 'syncing';
  scope?: string;
  token_type?: string;
  access_token_encrypted?: string | null;
  refresh_token_encrypted?: string | null;
  expires_at?: string | null;
  connected_at?: string | null;
  disconnected_at?: string | null;
  verified_email?: string | null;
  calendars_found?: number;
  last_sync_at?: string | null;
  last_error?: string | null;
}

export interface GoogleAccountProfile {
  id: string;
  email: string;
  verifiedEmail: boolean;
  name?: string;
  picture?: string;
}

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary: boolean;
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  status?: string;
  isAllDay: boolean;
  startAt: string;
  endAt: string;
  calendarId: string;
  organizerEmail?: string;
}

function parseKeyMaterial(key: string): Buffer {
  const trimmed = key.trim();
  if (!trimmed) throw new Error('Missing token encryption key.');

  try {
    const base64 = Buffer.from(trimmed, 'base64');
    if (base64.byteLength >= 32) return crypto.createHash('sha256').update(base64).digest();
  } catch {
    // fallback to utf8 hashing
  }

  return crypto.createHash('sha256').update(trimmed, 'utf8').digest();
}

function getEncryptionKey(): Buffer {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('Missing GOOGLE_TOKEN_ENCRYPTION_KEY (or GMAIL_TOKEN_ENCRYPTION_KEY fallback).');
  }
  return parseKeyMaterial(raw);
}

export function encryptCalendarToken(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptCalendarToken(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(':');
  if (!ivPart || !tagPart || !dataPart) throw new Error('Invalid encrypted token payload.');

  const key = getEncryptionKey();
  const iv = Buffer.from(ivPart, 'base64');
  const tag = Buffer.from(tagPart, 'base64');
  const encrypted = Buffer.from(dataPart, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function parseCalendarIntegrationState(value: unknown): GoogleCalendarIntegrationState {
  if (!value || typeof value !== 'object') return {};
  return value as GoogleCalendarIntegrationState;
}

export function hasCalendarReadonlyScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  return scope.split(/\s+/).includes(GOOGLE_CALENDAR_READONLY_SCOPE);
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleTokenBundle> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token exchange failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  if (!payload.access_token) {
    throw new Error('Google OAuth token exchange returned no access token.');
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiryDate: payload.expires_in ? Date.now() + payload.expires_in * 1000 : undefined,
    scope: payload.scope || GOOGLE_CALENDAR_READONLY_SCOPE,
    tokenType: payload.token_type,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenBundle> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token refresh failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  if (!payload.access_token) {
    throw new Error('Google OAuth token refresh returned no access token.');
  }

  return {
    accessToken: payload.access_token,
    expiryDate: payload.expires_in ? Date.now() + payload.expires_in * 1000 : undefined,
    scope: payload.scope || GOOGLE_CALENDAR_READONLY_SCOPE,
    tokenType: payload.token_type,
  };
}

function resolveTokenExpiry(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export async function getUsableAccessTokenFromIntegration(input: GoogleCalendarIntegrationState): Promise<{
  accessToken: string;
  refreshApplied: boolean;
  nextIntegration: GoogleCalendarIntegrationState;
}> {
  const encryptedAccessToken = String(input.access_token_encrypted || '');
  if (!encryptedAccessToken) throw new Error('GOOGLE_CALENDAR_TOKEN_MISSING');

  let accessToken = decryptCalendarToken(encryptedAccessToken);
  const refreshEncrypted = String(input.refresh_token_encrypted || '');
  const expiresAtEpoch = resolveTokenExpiry(input.expires_at);
  const needsRefresh = Boolean(refreshEncrypted) && Boolean(expiresAtEpoch && expiresAtEpoch < Date.now() + 60_000);

  if (!needsRefresh) {
    return { accessToken, refreshApplied: false, nextIntegration: { ...input } };
  }

  const refreshed = await refreshAccessToken(decryptCalendarToken(refreshEncrypted));
  accessToken = refreshed.accessToken;

  return {
    accessToken,
    refreshApplied: true,
    nextIntegration: {
      ...input,
      access_token_encrypted: encryptCalendarToken(refreshed.accessToken),
      expires_at: refreshed.expiryDate ? new Date(refreshed.expiryDate).toISOString() : input.expires_at || null,
      scope: refreshed.scope || input.scope || GOOGLE_CALENDAR_READONLY_SCOPE,
      token_type: refreshed.tokenType || input.token_type || 'Bearer',
      status: 'connected',
      last_error: null,
    },
  };
}

export async function getGoogleAccountProfile(accessToken: string): Promise<GoogleAccountProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Google user profile request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    id?: string;
    email?: string;
    verified_email?: boolean;
    name?: string;
    picture?: string;
  };

  if (!payload.id || !payload.email) {
    throw new Error('Google profile response missing id/email.');
  }

  return {
    id: payload.id,
    email: payload.email,
    verifiedEmail: Boolean(payload.verified_email),
    name: payload.name,
    picture: payload.picture,
  };
}

export async function listCalendars(accessToken: string): Promise<GoogleCalendarListItem[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Calendar list request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    items?: Array<{ id?: string; summary?: string; primary?: boolean; timeZone?: string }>;
  };

  const calendars: GoogleCalendarListItem[] = [];
  for (const item of payload.items || []) {
    const id = String(item.id || '').trim();
    if (!id) continue;
    calendars.push({
      id,
      summary: String(item.summary || 'Untitled calendar'),
      primary: Boolean(item.primary),
      timeZone: item.timeZone,
    });
  }
  return calendars;
}

function toEventDateTime(value: { date?: string; dateTime?: string } | undefined, fallback = new Date()): string {
  if (!value) return fallback.toISOString();
  if (value.dateTime) return value.dateTime;
  if (value.date) return `${value.date}T00:00:00.000Z`;
  return fallback.toISOString();
}

function normalizeEvent(input: {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  organizer?: { email?: string };
}, calendarId: string): GoogleCalendarEvent | null {
  const id = String(input.id || '').trim();
  if (!id) return null;

  const isAllDay = Boolean(input.start?.date && !input.start?.dateTime);

  return {
    id,
    summary: String(input.summary || 'Untitled event'),
    description: input.description,
    location: input.location,
    status: input.status,
    isAllDay,
    startAt: toEventDateTime(input.start),
    endAt: toEventDateTime(input.end),
    calendarId,
    organizerEmail: input.organizer?.email,
  };
}

export async function listEvents(params: {
  accessToken: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<GoogleCalendarEvent[]> {
  const calendarId = encodeURIComponent(params.calendarId || 'primary');
  const query = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(Math.max(10, Math.min(params.maxResults || 60, 250))),
  });

  if (params.timeMin) query.set('timeMin', params.timeMin);
  if (params.timeMax) query.set('timeMax', params.timeMax);

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${query.toString()}`, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Calendar events request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: string;
      summary?: string;
      description?: string;
      location?: string;
      status?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
      organizer?: { email?: string };
    }>;
  };

  return (payload.items || [])
    .map((item) => normalizeEvent(item, params.calendarId || 'primary'))
    .filter((item): item is GoogleCalendarEvent => Boolean(item));
}

export async function fetchTodayEvents(accessToken: string, calendarId = 'primary'): Promise<GoogleCalendarEvent[]> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return listEvents({
    accessToken,
    calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: 100,
  });
}

export async function fetchNext7DaysEvents(accessToken: string, calendarId = 'primary'): Promise<GoogleCalendarEvent[]> {
  const start = new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return listEvents({
    accessToken,
    calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: 250,
  });
}

export interface FreeBlock {
  startAt: string;
  endAt: string;
  durationMinutes: number;
}

function eventDurationMinutes(event: GoogleCalendarEvent): number {
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
}

export function computeFreeTimeBlocks(events: GoogleCalendarEvent[], windowStart: Date, windowEnd: Date): FreeBlock[] {
  const sorted = [...events]
    .map((event) => ({ start: new Date(event.startAt).getTime(), end: new Date(event.endAt).getTime() }))
    .filter((event) => Number.isFinite(event.start) && Number.isFinite(event.end) && event.end > event.start)
    .sort((a, b) => a.start - b.start);

  const blocks: FreeBlock[] = [];
  let cursor = windowStart.getTime();
  const endTime = windowEnd.getTime();

  for (const event of sorted) {
    if (event.end <= cursor) continue;
    const boundedStart = Math.max(event.start, windowStart.getTime());
    const boundedEnd = Math.min(event.end, endTime);
    if (boundedEnd <= windowStart.getTime() || boundedStart >= endTime) continue;

    if (boundedStart > cursor) {
      const durationMinutes = Math.round((boundedStart - cursor) / 60000);
      blocks.push({ startAt: new Date(cursor).toISOString(), endAt: new Date(boundedStart).toISOString(), durationMinutes });
    }

    cursor = Math.max(cursor, boundedEnd);
    if (cursor >= endTime) break;
  }

  if (cursor < endTime) {
    blocks.push({ startAt: new Date(cursor).toISOString(), endAt: new Date(endTime).toISOString(), durationMinutes: Math.round((endTime - cursor) / 60000) });
  }

  return blocks.filter((block) => block.durationMinutes > 0);
}

export function detectBasicOverload(events: GoogleCalendarEvent[]): {
  meetingCount: number;
  totalMeetingMinutes: number;
  tooManyMeetings: boolean;
  noRecoveryGaps: boolean;
} {
  const timedEvents = events.filter((event) => !event.isAllDay);
  const totalMeetingMinutes = timedEvents.reduce((sum, event) => sum + eventDurationMinutes(event), 0);
  const tooManyMeetings = timedEvents.length >= 8 || totalMeetingMinutes >= 360;

  const sorted = [...timedEvents].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  let recoveryGapFound = false;
  for (let i = 1; i < sorted.length; i += 1) {
    const previousEnd = +new Date(sorted[i - 1].endAt);
    const nextStart = +new Date(sorted[i].startAt);
    if (nextStart - previousEnd >= 15 * 60 * 1000) {
      recoveryGapFound = true;
      break;
    }
  }

  return {
    meetingCount: timedEvents.length,
    totalMeetingMinutes,
    tooManyMeetings,
    noRecoveryGaps: timedEvents.length >= 4 && !recoveryGapFound,
  };
}

export async function revokeGoogleToken(token: string): Promise<void> {
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!response.ok) {
    throw new Error(`Token revoke failed (${response.status}).`);
  }
}
