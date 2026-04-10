import crypto from 'node:crypto';
import { groq } from '@/ai/groq';

export const GMAIL_FINANCE_QUERY =
  '("receipt" OR "invoice" OR "subscription" OR "payment" OR "trial" OR "renewal" OR "billed" OR "charge" OR "statement") newer_than:365d -category:social -category:promotions';

export type ConnectStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

export interface GmailTokenBundle {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
}

export interface GmailIntegrationState {
  status?: ConnectStatus;
  scope?: string;
  token_type?: string;
  access_token_encrypted?: string | null;
  refresh_token_encrypted?: string | null;
  expires_at?: string | null;
  connected_at?: string | null;
  last_synced_at?: string | null;
  last_sync_emails_analyzed?: number;
  last_sync_subscriptions_found?: number;
  last_error?: string | null;
}

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export function hasGmailReadonlyScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  return scope.split(/\s+/).includes(GMAIL_READONLY_SCOPE);
}

export async function verifyGmailAccessToken(accessToken: string): Promise<{ emailAddress: string | null; messagesTotal: number | null }> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Gmail profile request failed (${response.status}).`);
  }

  const payload = (await response.json()) as { emailAddress?: string; messagesTotal?: number };

  return {
    emailAddress: payload.emailAddress || null,
    messagesTotal: typeof payload.messagesTotal === 'number' ? payload.messagesTotal : null,
  };
}

export interface ParsedFinancialEmail {
  sender: string;
  subject: string;
  snippet: string;
  date: string | null;
}

export interface FinancialSubscriptionSignal {
  merchant: string;
  amount: number | null;
  currency: string;
  period: 'monthly' | 'yearly' | 'unknown';
  category: 'subscription' | 'recurring_payment';
  confidence: number;
}

export interface GmailFinanceAnalysis {
  subscriptions: FinancialSubscriptionSignal[];
  recurringPayments: FinancialSubscriptionSignal[];
  merchants: string[];
  trialRisks: string[];
  savingsOpportunities: string[];
  summary: string;
}

interface GmailHeader {
  name?: string;
  value?: string;
}

interface GmailMessagePayload {
  headers?: GmailHeader[];
}

interface GmailMessage {
  id?: string;
  snippet?: string;
  payload?: GmailMessagePayload;
}

const DEFAULT_ANALYSIS: GmailFinanceAnalysis = {
  subscriptions: [],
  recurringPayments: [],
  merchants: [],
  trialRisks: [],
  savingsOpportunities: [],
  summary: '',
};

function parseKeyMaterial(key: string): Buffer {
  const trimmed = key.trim();
  if (!trimmed) throw new Error('Missing GMAIL_TOKEN_ENCRYPTION_KEY.');

  try {
    const base64 = Buffer.from(trimmed, 'base64');
    if (base64.byteLength >= 32) return crypto.createHash('sha256').update(base64).digest();
  } catch {
    // fallback to utf8 hashing
  }

  return crypto.createHash('sha256').update(trimmed, 'utf8').digest();
}

function getEncryptionKey(): Buffer {
  const rawKey = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('Missing GMAIL_TOKEN_ENCRYPTION_KEY for secure Gmail token storage.');
  }
  return parseKeyMaterial(rawKey);
}

export function encryptToken(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptToken(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(':');
  if (!ivPart || !tagPart || !dataPart) throw new Error('Invalid encrypted token payload.');

  const iv = Buffer.from(ivPart, 'base64');
  const tag = Buffer.from(tagPart, 'base64');
  const encrypted = Buffer.from(dataPart, 'base64');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function parseIntegrationState(value: unknown): GmailIntegrationState {
  if (!value || typeof value !== 'object') return {};
  return value as GmailIntegrationState;
}

function resolveTokenExpiry(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export async function getUsableAccessTokenFromIntegration(input: GmailIntegrationState): Promise<{
  accessToken: string;
  refreshApplied: boolean;
  nextIntegration: GmailIntegrationState;
}> {
  const encryptedAccessToken = String(input.access_token_encrypted || '');
  if (!encryptedAccessToken) {
    throw new Error('GMAIL_TOKEN_MISSING');
  }

  let accessToken = decryptToken(encryptedAccessToken);
  const refreshEncrypted = String(input.refresh_token_encrypted || '');
  const expiresAtEpoch = resolveTokenExpiry(input.expires_at);
  const needsRefresh = Boolean(refreshEncrypted) && Boolean(expiresAtEpoch && expiresAtEpoch < Date.now() + 60_000);

  if (!needsRefresh) {
    return {
      accessToken,
      refreshApplied: false,
      nextIntegration: { ...input },
    };
  }

  const refreshToken = decryptToken(refreshEncrypted);
  const refreshed = await refreshAccessToken(refreshToken);

  accessToken = refreshed.accessToken;
  return {
    accessToken,
    refreshApplied: true,
    nextIntegration: {
      ...input,
      access_token_encrypted: encryptToken(refreshed.accessToken),
      refresh_token_encrypted: input.refresh_token_encrypted || null,
      expires_at: refreshed.expiryDate ? new Date(refreshed.expiryDate).toISOString() : input.expires_at || null,
      scope: refreshed.scope || input.scope || GMAIL_READONLY_SCOPE,
      token_type: refreshed.tokenType || input.token_type || 'Bearer',
      status: 'connected',
      last_error: null,
    },
  };
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<GmailTokenBundle> {
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
    scope: payload.scope || GMAIL_READONLY_SCOPE,
    tokenType: payload.token_type,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GmailTokenBundle> {
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
    scope: payload.scope || GMAIL_READONLY_SCOPE,
    tokenType: payload.token_type,
  };
}

function extractHeader(payload: GmailMessagePayload | undefined, name: string): string {
  const headers = payload?.headers || [];
  const match = headers.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return String(match?.value || '').trim();
}

export function parseFinancialEmails(messages: GmailMessage[]): ParsedFinancialEmail[] {
  return messages
    .map((message) => {
      const sender = extractHeader(message.payload, 'From');
      const subject = extractHeader(message.payload, 'Subject');
      const snippet = String(message.snippet || '').trim();
      const date = extractHeader(message.payload, 'Date') || null;
      return { sender, subject, snippet, date };
    })
    .filter((email) => email.sender || email.subject || email.snippet)
    .slice(0, 100);
}

export async function fetchFinancialEmails(accessToken: string, maxResults = 100): Promise<ParsedFinancialEmail[]> {
  const cappedMax = Math.max(10, Math.min(maxResults, 100));
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${cappedMax}&q=${encodeURIComponent(GMAIL_FINANCE_QUERY)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  );

  if (!listResponse.ok) {
    throw new Error(`Gmail list request failed (${listResponse.status}).`);
  }

  const listPayload = (await listResponse.json()) as { messages?: Array<{ id?: string }> };
  const ids = (listPayload.messages || []).map((message) => message.id).filter((id): id is string => Boolean(id));

  if (!ids.length) return [];

  const details = await Promise.all(
    ids.map(async (id) => {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
      );

      if (!response.ok) return null;
      return (await response.json()) as GmailMessage;
    }),
  );

  return parseFinancialEmails(details.filter((item): item is GmailMessage => Boolean(item)));
}

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.6;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 100) / 100;
}

function normalizeSignal(raw: Record<string, unknown>, fallbackCategory: 'subscription' | 'recurring_payment'): FinancialSubscriptionSignal | null {
  const merchant = String(raw.merchant || raw.name || '').trim();
  if (!merchant) return null;

  const amountRaw = raw.amount;
  const amount = typeof amountRaw === 'number' && Number.isFinite(amountRaw) ? Math.round(amountRaw * 100) / 100 : null;
  const currency = String(raw.currency || 'USD').toUpperCase();
  const period = String(raw.period || 'unknown').toLowerCase();
  const normalizedPeriod: 'monthly' | 'yearly' | 'unknown' =
    period.includes('month') ? 'monthly' : period.includes('year') || period.includes('annual') ? 'yearly' : 'unknown';

  const categoryValue = String(raw.category || fallbackCategory).toLowerCase();
  const category: 'subscription' | 'recurring_payment' = categoryValue === 'recurring_payment' ? 'recurring_payment' : 'subscription';

  return {
    merchant,
    amount,
    currency,
    period: normalizedPeriod,
    category,
    confidence: clampConfidence(raw.confidence),
  };
}

export async function analyzeFinancialEmailsWithAI(emails: ParsedFinancialEmail[]): Promise<GmailFinanceAnalysis> {
  if (!emails.length) return DEFAULT_ANALYSIS;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a finance extraction system. Extract subscriptions, recurring payments, probable merchants, trial/renewal risks, and savings opportunities from sender, subject, snippet, and date only. Never infer from hidden email body. Return strict JSON with keys: subscriptions, recurringPayments, merchants, trialRisks, savingsOpportunities, summary. Each item in subscriptions/recurringPayments should contain merchant, amount, currency, period, category, confidence.',
        },
        {
          role: 'user',
          content: JSON.stringify({ emails }),
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}') as {
      subscriptions?: Array<Record<string, unknown>>;
      recurringPayments?: Array<Record<string, unknown>>;
      merchants?: unknown;
      trialRisks?: unknown;
      savingsOpportunities?: unknown;
      summary?: unknown;
    };

    const subscriptions = (parsed.subscriptions || [])
      .map((item) => normalizeSignal(item, 'subscription'))
      .filter((item): item is FinancialSubscriptionSignal => Boolean(item));

    const recurringPayments = (parsed.recurringPayments || [])
      .map((item) => normalizeSignal(item, 'recurring_payment'))
      .filter((item): item is FinancialSubscriptionSignal => Boolean(item));

    const merchants = Array.from(
      new Set(
        [
          ...subscriptions.map((item) => item.merchant),
          ...recurringPayments.map((item) => item.merchant),
          ...(Array.isArray(parsed.merchants) ? parsed.merchants : []),
        ]
          .map((item) => String(item || '').trim())
          .filter(Boolean),
      ),
    );

    const trialRisks = Array.isArray(parsed.trialRisks)
      ? parsed.trialRisks.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
      : [];

    const savingsOpportunities = Array.isArray(parsed.savingsOpportunities)
      ? parsed.savingsOpportunities.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
      : [];

    return {
      subscriptions,
      recurringPayments,
      merchants,
      trialRisks,
      savingsOpportunities,
      summary: String(parsed.summary || '').trim(),
    };
  } catch {
    return DEFAULT_ANALYSIS;
  }
}

function merchantKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function mergeSubscriptionSignals(existing: Array<Record<string, unknown>>, nextSignals: FinancialSubscriptionSignal[]): Array<Record<string, unknown>> {
  const byKey = new Map<string, Record<string, unknown>>();

  existing.forEach((item, index) => {
    const merchant = String(item.merchant || item.name || `existing-${index}`);
    byKey.set(merchantKey(merchant), { ...item });
  });

  nextSignals.forEach((signal, index) => {
    const key = merchantKey(signal.merchant || `new-${index}`);
    const previous = byKey.get(key) || {};
    const monthlyAmount =
      signal.amount == null
        ? typeof previous.monthly_amount === 'number'
          ? previous.monthly_amount
          : 0
        : signal.period === 'yearly'
          ? Math.round((signal.amount / 12) * 100) / 100
          : signal.amount;

    byKey.set(key, {
      ...previous,
      merchant: signal.merchant,
      name: signal.merchant,
      amount: signal.amount,
      monthly_amount: monthlyAmount,
      period: signal.period,
      category: signal.category,
      confidence: signal.confidence,
      status: 'active',
      source: 'gmail',
      last_seen_at: new Date().toISOString(),
    });
  });

  return Array.from(byKey.values());
}

export function computeMonthlyTotal(subscriptions: Array<Record<string, unknown>>): number {
  return (
    Math.round(
      subscriptions.reduce((sum, subscription) => {
        const monthly =
          typeof subscription.monthly_amount === 'number'
            ? subscription.monthly_amount
            : typeof subscription.amount === 'number'
              ? subscription.amount
              : 0;
        return sum + monthly;
      }, 0) * 100,
    ) / 100
  );
}
