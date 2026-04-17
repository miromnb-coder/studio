import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  analyzeFinancialEmailsWithAI,
  fetchFinancialEmails,
  fetchInboxMessageById,
  fetchInboxMessages,
  getUsableAccessTokenFromIntegration,
  parseIntegrationState,
} from '@/lib/integrations/gmail';
import { buildWeeklyDigest } from '@/server/email-operator/digest';
import { generateDraftReplySet } from '@/server/email-operator/drafts';
import { buildInboxSummary, scoreInboxMessage } from '@/server/email-operator/summarize';
import { buildSubscriptionScannerResult } from '@/server/email-operator/subscriptions';
import type { EmailOperatorAction, EmailOperatorPreferences } from '@/server/email-operator/types';
import { detectUrgentEmails } from '@/server/email-operator/urgent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function inferPreferences(memories: Array<{ content?: string | null }>): EmailOperatorPreferences {
  const text = memories.map((memory) => String(memory.content || '').toLowerCase()).join(' ');
  return {
    concise: /concise|short|brief/.test(text),
    prioritizeSavings: /save money|saving money|budget|cost/.test(text),
    ignoreNewsletters: /ignore newsletter|archive newsletters|bulk email/.test(text),
    actionOriented: /action list|next step|to-do|checklist/.test(text),
  };
}

async function resolveAuthAndToken() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    return { error: NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 }) };
  }

  const [{ data: financeProfile }, { data: memories }] = await Promise.all([
    supabase.from('finance_profiles').select('last_analysis,active_subscriptions').eq('user_id', userId).maybeSingle(),
    supabase.from('memory').select('content,type').eq('user_id', userId).order('updated_at', { ascending: false }).limit(24),
  ]);

  const integration = parseIntegrationState(asObject(financeProfile?.last_analysis).gmail_integration);

  if (!integration.access_token_encrypted) {
    return { error: NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 400 }) };
  }

  const tokenState = await getUsableAccessTokenFromIntegration(integration);
  const preferences = inferPreferences((memories || []) as Array<{ content?: string | null }>);

  return {
    accessToken: tokenState.accessToken,
    existingSubscriptions: Array.isArray(financeProfile?.active_subscriptions) ? financeProfile.active_subscriptions : [],
    preferences,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: EmailOperatorAction;
      messageId?: string;
      query?: string;
    };

    const action = body.action || 'inbox_summary';
    const auth = await resolveAuthAndToken();
    if ('error' in auth) return auth.error;

    if (action === 'inbox_summary') {
      const inbox = await fetchInboxMessages({ accessToken: auth.accessToken, maxResults: 50, query: body.query || 'newer_than:10d' });
      const scored = inbox.map((message) => scoreInboxMessage(message));
      const summary = buildInboxSummary(scored, auth.preferences);
      return NextResponse.json({ ok: true, action, result: summary });
    }

    if (action === 'urgent') {
      const inbox = await fetchInboxMessages({ accessToken: auth.accessToken, maxResults: 50, query: 'newer_than:14d' });
      const urgent = detectUrgentEmails(inbox, auth.preferences);
      return NextResponse.json({ ok: true, action, result: urgent });
    }

    if (action === 'subscriptions') {
      const emails = await fetchFinancialEmails(auth.accessToken, 100);
      const analysis = await analyzeFinancialEmailsWithAI(emails);
      const scanner = buildSubscriptionScannerResult({
        analysis,
        emails,
        existingSubscriptions: auth.existingSubscriptions,
        preferences: auth.preferences,
      });
      return NextResponse.json({ ok: true, action, result: scanner });
    }

    if (action === 'draft') {
      if (!body.messageId) {
        return NextResponse.json({ error: 'MESSAGE_ID_REQUIRED' }, { status: 400 });
      }

      const message = await fetchInboxMessageById(auth.accessToken, body.messageId);
      if (!message) {
        return NextResponse.json({ error: 'MESSAGE_NOT_FOUND' }, { status: 404 });
      }

      const drafts = await generateDraftReplySet({
        messageId: message.id,
        from: message.from,
        subject: message.subject,
        snippet: message.snippet,
        preferences: auth.preferences,
      });

      return NextResponse.json({ ok: true, action, result: drafts });
    }

    if (action === 'digest') {
      const [inbox, subscriptionEmails] = await Promise.all([
        fetchInboxMessages({ accessToken: auth.accessToken, maxResults: 60, query: 'newer_than:7d' }),
        fetchFinancialEmails(auth.accessToken, 100),
      ]);

      const scored = inbox.map((message) => scoreInboxMessage(message));
      const summary = buildInboxSummary(scored, auth.preferences);
      const urgent = detectUrgentEmails(inbox, auth.preferences);
      const subscriptionAnalysis = await analyzeFinancialEmailsWithAI(subscriptionEmails);
      const subscriptions = buildSubscriptionScannerResult({
        analysis: subscriptionAnalysis,
        emails: subscriptionEmails,
        existingSubscriptions: auth.existingSubscriptions,
        preferences: auth.preferences,
      });

      const digest = buildWeeklyDigest({ inboxSummary: summary, urgent, subscriptions });
      return NextResponse.json({ ok: true, action, result: digest });
    }

    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    console.error('GMAIL_OPERATOR_ERROR', error);
    return NextResponse.json({ error: 'GMAIL_OPERATOR_FAILED' }, { status: 500 });
  }
}
