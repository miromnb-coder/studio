export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { runAgent } from '@/agent/agent';
import { z } from 'zod';

/**
 * @fileOverview Inbound Email Webhook Handler.
 * Integrates directly with the AI Agent v3 Pipeline.
 */

const MAX_RAW_BODY_BYTES = 1_000_000; // 1 MB
const MAX_SUBJECT_LENGTH = 300;
const MAX_TEXT_LENGTH = 100_000;
const MAX_HTML_LENGTH = 200_000;
const MAX_ADDRESS_LENGTH = 320;
const WEBHOOK_MAX_AGE_SECONDS = 5 * 60;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inboundEmailSchema = z
  .object({
    to: z.string().min(1),
    from: z.string().min(1),
    subject: z.string().min(1),
    text: z.string().optional(),
    html: z.string().optional(),
    messageId: z.string().min(1),
    timestamp: z.union([z.string(), z.number()]),
    envelopeRecipients: z.array(z.string()).default([]),
    provider: z.string().min(1).default('unknown'),
  })
  .superRefine((value, ctx) => {
    if (!value.text && !value.html) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either text or html body is required',
        path: ['text'],
      });
    }
  });

function safeCompareHex(actualHex: string, expectedHex: string): boolean {
  const actual = Buffer.from(actualHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');

  if (actual.length === 0 || expected.length === 0 || actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

function createHmacHex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function normalizeTimestampToSeconds(value: string | number): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 10_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  if (typeof value !== 'string') return null;

  if (/^\d+$/.test(value.trim())) {
    const numeric = Number(value.trim());
    if (Number.isNaN(numeric)) return null;
    return numeric > 10_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
}

function parseEmailAddress(raw: string): string {
  const candidate = raw.trim();
  const bracketMatch = candidate.match(/<([^>]+)>/);
  const address = (bracketMatch?.[1] || candidate).trim().toLowerCase();

  if (!address || address.length > MAX_ADDRESS_LENGTH || !emailRegex.test(address)) {
    throw new Error('Invalid email address');
  }

  return address;
}

function parseAddressList(raw: string): string[] {
  return raw
    .split(/[;,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(parseEmailAddress);
}

function stripHtmlTags(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalHeadersHash(headers: Headers): string {
  const entries = Array.from(headers.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('\n');

  return crypto.createHash('sha256').update(entries).digest('hex');
}

function inferProvider(req: NextRequest): string {
  const explicit = req.headers.get('x-webhook-provider')?.toLowerCase();
  if (explicit) return explicit;

  if (req.headers.get('x-postmark-signature')) return 'postmark';
  if (req.headers.get('x-mailgun-signature') || req.headers.get('x-mailgun-timestamp')) return 'mailgun';
  if (req.headers.get('x-inbound-signature') || req.headers.get('x-inbound-timestamp')) return 'generic';

  return 'unknown';
}

function verifyTimestampFresh(timestampSeconds: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - timestampSeconds) <= WEBHOOK_MAX_AGE_SECONDS;
}

function verifyProviderSignature(req: NextRequest, rawBody: string, provider: string, payload: Record<string, unknown>): void {
  if (provider === 'postmark') {
    const secret = process.env.POSTMARK_WEBHOOK_SECRET;
    const signature = req.headers.get('x-postmark-signature');
    const timestamp = req.headers.get('x-postmark-timestamp') || payload.Timestamp?.toString();

    if (!secret || !signature || !timestamp) {
      throw new Error('Postmark signature headers or secret missing');
    }

    const timestampSeconds = normalizeTimestampToSeconds(timestamp);
    if (!timestampSeconds || !verifyTimestampFresh(timestampSeconds)) {
      throw new Error('Postmark webhook timestamp out of range');
    }

    const expected = createHmacHex(secret, `${timestamp}.${rawBody}`);
    if (!safeCompareHex(signature, expected)) {
      throw new Error('Invalid Postmark signature');
    }

    return;
  }

  if (provider === 'mailgun') {
    const secret = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    const signature =
      req.headers.get('x-mailgun-signature') ||
      payload.signature?.toString() ||
      payload.Signature?.toString();
    const timestamp =
      req.headers.get('x-mailgun-timestamp') ||
      payload.timestamp?.toString() ||
      payload.Timestamp?.toString();
    const token = req.headers.get('x-mailgun-token') || payload.token?.toString() || payload.Token?.toString();

    if (!secret || !signature || !timestamp || !token) {
      throw new Error('Mailgun signature headers/fields or secret missing');
    }

    const timestampSeconds = normalizeTimestampToSeconds(timestamp);
    if (!timestampSeconds || !verifyTimestampFresh(timestampSeconds)) {
      throw new Error('Mailgun webhook timestamp out of range');
    }

    const expected = createHmacHex(secret, `${timestamp}${token}`);
    if (!safeCompareHex(signature, expected)) {
      throw new Error('Invalid Mailgun signature');
    }

    return;
  }

  if (provider === 'generic') {
    const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
    const signature = req.headers.get('x-inbound-signature');
    const timestamp = req.headers.get('x-inbound-timestamp');

    if (!secret || !signature || !timestamp) {
      throw new Error('Generic signature headers or secret missing');
    }

    const timestampSeconds = normalizeTimestampToSeconds(timestamp);
    if (!timestampSeconds || !verifyTimestampFresh(timestampSeconds)) {
      throw new Error('Inbound webhook timestamp out of range');
    }

    const expected = createHmacHex(secret, `${timestamp}.${rawBody}`);
    if (!safeCompareHex(signature, expected)) {
      throw new Error('Invalid inbound signature');
    }

    return;
  }

  throw new Error('Unsupported webhook provider for signature verification');
}

function extractString(payload: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value;
  }

  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!rawBody || Buffer.byteLength(rawBody, 'utf8') > MAX_RAW_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body missing or too large' }, { status: 413 });
    }

    let payload: Record<string, unknown> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = new URLSearchParams(rawBody);
      payload = Object.fromEntries(form.entries());
    } else {
      return NextResponse.json({ error: 'Unsupported content-type' }, { status: 415 });
    }

    const provider = inferProvider(req);
    verifyProviderSignature(req, rawBody, provider, payload);

    const normalized = {
      to: extractString(payload, ['To', 'to', 'recipient', 'envelope_to']),
      from: extractString(payload, ['From', 'from', 'sender']),
      subject: extractString(payload, ['Subject', 'subject'], 'No Subject'),
      text: extractString(payload, ['TextBody', 'text', 'body', 'stripped-text']) || undefined,
      html: extractString(payload, ['HtmlBody', 'html', 'stripped-html']) || undefined,
      messageId: extractString(payload, ['MessageID', 'messageId', 'message-id', 'Message-Id', 'MessageId']),
      timestamp: extractString(payload, ['Date', 'timestamp', 'Timestamp', 'receivedAt', 'received_at']),
      envelopeRecipients: parseAddressList(extractString(payload, ['ToFull', 'envelopeRecipients', 'envelope_recipients'], '')),
      provider,
    };

    const validated = inboundEmailSchema.safeParse(normalized);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: validated.error.issues }, { status: 422 });
    }

    let toAddress: string;
    let fromAddress: string;

    try {
      toAddress = parseEmailAddress(validated.data.to);
      fromAddress = parseEmailAddress(validated.data.from);
    } catch {
      return NextResponse.json({ error: 'Malformed email addresses' }, { status: 422 });
    }

    const subject = validated.data.subject.trim().slice(0, MAX_SUBJECT_LENGTH);

    if ((validated.data.text?.length || 0) > MAX_TEXT_LENGTH || (validated.data.html?.length || 0) > MAX_HTML_LENGTH) {
      return NextResponse.json({ error: 'Email body too large' }, { status: 413 });
    }

    const body = (validated.data.text || stripHtmlTags(validated.data.html || '')).trim();

    if (!body) {
      return NextResponse.json({ error: 'Email content empty after sanitization' }, { status: 422 });
    }

    const timestampSeconds = normalizeTimestampToSeconds(validated.data.timestamp);
    if (!timestampSeconds) {
      return NextResponse.json({ error: 'Invalid message timestamp' }, { status: 422 });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore not initialized.');

    // Find UserProfile by magic forwarding address
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('inboundEmailAddress', '==', toAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userId = querySnapshot.docs[0].id;

    const ingestionRecord = {
      userId,
      subject,
      body,
      from: fromAddress,
      to: toAddress,
      receivedAt: new Date(timestampSeconds * 1000).toISOString(),
      createdAt: serverTimestamp(),
      provider,
      providerMessageId: validated.data.messageId,
      envelopeRecipients: validated.data.envelopeRecipients,
      rawHeadersHash: canonicalHeadersHash(req.headers),
      dedupeKey: `${provider}:${validated.data.messageId}`,
    };

    // Log the ingestion
    await addDoc(collection(firestore, 'users', userId, 'inbox'), ingestionRecord);

    // Execute Agent v3 Pipeline
    console.log(`WEBHOOK_INGEST: Processing email from ${fromAddress}...`);
    const agentResult = await runAgent(`Email Audit Request: Subject: ${subject}\n\nContent: ${body}`);

    // Store the analysis
    await addDoc(collection(firestore, 'users', userId, 'analyses'), {
      userId,
      source: 'email',
      title: agentResult.data?.title || subject,
      summary: agentResult.content,
      estimatedMonthlySavings: agentResult.data?.data?.savingsEstimate || 0,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: body,
      providerMetadata: {
        provider,
        providerMessageId: validated.data.messageId,
        envelopeRecipients: validated.data.envelopeRecipients,
        rawHeadersHash: ingestionRecord.rawHeadersHash,
        dedupeKey: ingestionRecord.dedupeKey,
      },
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      intent: agentResult.intent,
      mode: agentResult.mode,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message.includes('signature') ||
      message.includes('timestamp') ||
      message.includes('Unsupported webhook provider')
        ? 401
        : message.includes('JSON')
          ? 400
          : 500;

    console.error('WEBHOOK_ERROR:', message);
    return NextResponse.json({ error: message }, { status });
  }
}
