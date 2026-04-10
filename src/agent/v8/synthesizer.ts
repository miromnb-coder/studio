import { AgentContextV8, AgentResponseV8, ExecutionPlanV8, ExecutionResultV8, RouteResultV8, SuggestedActionV8 } from './types';

const FINNISH_LANGUAGE_PATTERN = /\b(voitko vastata suomeksi|vastaa suomeksi|suomeksi|kirjoita suomeksi)\b/i;

function prefersFinnish(message: string, history: AgentContextV8['conversation']): boolean {
  const corpus = `${history.slice(-4).map((item) => item.content).join(' ')} ${message}`;
  return FINNISH_LANGUAGE_PATTERN.test(corpus);
}

function isEmailAccessQuestion(message: string): boolean {
  const text = message.toLowerCase();
  if (!text) return false;
  return /\b(email|emails|gmail|inbox|subscription emails|mailbox)\b/.test(text)
    && /\b(can|able|access|analy[sz]e|scan|read|check|look|do you)\b/.test(text);
}

function buildSuggestedActions(route: RouteResultV8, structuredData: Record<string, unknown>): SuggestedActionV8[] {
  const actions: SuggestedActionV8[] = [];

  if (route.intent === 'finance') {
    const leaks = (structuredData.detect_leaks as Record<string, unknown> | undefined) || {};
    const hasSavings = typeof leaks.estimatedMonthlySavings === 'number' && leaks.estimatedMonthlySavings > 0;
    if (hasSavings) {
      actions.push({ id: 'act_plan', label: 'Create savings plan', kind: 'finance', payload: { actionType: 'create_savings_plan' } });
      actions.push({ id: 'act_alt', label: 'Find cheaper alternatives', kind: 'finance', payload: { actionType: 'find_alternatives' } });
    }
    actions.push({ id: 'act_cancel', label: 'Draft cancellation message', kind: 'premium', payload: { actionType: 'draft_cancellation' } });
  } else if (route.intent === 'gmail') {
    actions.push({ id: 'act_gmail_help', label: 'Guide Gmail task', kind: 'gmail' });
  } else if (route.intent === 'productivity') {
    actions.push({ id: 'act_plan', label: 'Create task plan', kind: 'productivity' });
  } else {
    return [];
  }

  if (structuredData.check_gmail_connection && (structuredData.check_gmail_connection as Record<string, unknown>).connected) {
    actions.push({ id: 'act_gmail', label: 'Import Gmail finance data', kind: 'finance', payload: { actionType: 'import_gmail_finance' } });
  }

  return actions.slice(0, 3);
}

function buildReply(route: RouteResultV8, execution: ExecutionResultV8, context: AgentContextV8): string {
  const inFinnish = prefersFinnish(context.user.message, context.conversation);

  if (isEmailAccessQuestion(context.user.message)) {
    if (!context.environment.gmailConnected) {
      return inFinnish
        ? 'Gmailiäsi ei ole vielä yhdistetty. Yhdistä se, niin voin analysoida sähköpostit ja etsiä tilauksia.'
        : 'Your Gmail is not connected yet. Connect it so I can analyze your emails and find subscriptions.';
    }
    return inFinnish
      ? 'Kyllä, voin analysoida sähköpostisi. Haluatko, että skannaan tilaukset ja toistuvat maksut?'
      : 'Yes, I can analyze your emails. Do you want me to scan for subscriptions and recurring payments?';
  }

  if (route.intent === 'finance') {
    const leakData = (execution.structuredData.detect_leaks as Record<string, unknown> | undefined) || {};
    const savings = typeof leakData.estimatedMonthlySavings === 'number' ? leakData.estimatedMonthlySavings : 0;
    const headline = savings > 0
      ? `You can likely recover about $${savings.toFixed(2)}/month.`
      : 'I found a few targeted areas to optimize your recurring spend.';
    const next = savings > 0
      ? 'Next step: run "Create savings plan" and execute the first action today.'
      : 'Next step: review your top subscription and confirm whether it is still needed.';
    return inFinnish ? `${headline} ${next}`.replace('You can likely recover about', 'Voit todennäköisesti säästää noin').replace('I found a few targeted areas to optimize your recurring spend.', 'Löysin muutamia kohteita, joista voit optimoida toistuvia kuluja.').replace('Next step:', 'Seuraava askel:') : `${headline} ${next}`;
  }

  if (route.intent === 'gmail') {
    const gmailState = execution.structuredData.check_gmail_connection as { connected?: boolean } | undefined;
    if (!gmailState?.connected) {
      return inFinnish
        ? 'Voin auttaa Gmail-asioissa heti, kun Gmail-yhteys on päällä. Kerro, haluatko ohjeet yhdistämiseen.'
        : 'I can help with Gmail tasks as soon as Gmail is connected. Tell me if you want quick connection steps.';
    }
    return inFinnish
      ? 'Gmail on yhdistetty. Kerro mitä haluat tehdä: haku, lajittelu, yhteenveto tai tilausviestien tarkistus.'
      : 'Gmail is connected. Tell me what you want to do: search, triage, summarize, or review subscription emails.';
  }

  if (route.intent === 'productivity') {
    return inFinnish
      ? 'Selvä — autan tässä suunnitelmallisesti. Kerro tavoite ja aikaraja, niin teen sinulle selkeän tehtävälistan.'
      : 'Got it — I can help you organize this. Share your goal and deadline, and I will turn it into a clear task plan.';
  }

  return inFinnish
    ? 'Totta kai. Vastaan suoraan kysymykseesi ilman finanssi- tai Gmail-analyysiä, ellei niitä tarvita.'
    : 'Absolutely — I will answer your question directly and only use finance or Gmail tools when they are relevant.';
}

export function synthesizeResponseV8(params: {
  route: RouteResultV8;
  plan: ExecutionPlanV8;
  execution: ExecutionResultV8;
  context: AgentContextV8;
  verificationPassed: boolean;
}): AgentResponseV8 {
  const { route, execution, context, verificationPassed } = params;
  const userFacingPlan = route.intent === 'finance'
    ? 'Reviewed relevant finance context and prepared finance actions.'
    : route.intent === 'gmail'
      ? 'Handled your request in Gmail mode with email-specific context only when needed.'
      : route.intent === 'productivity'
        ? 'Prepared a productivity-focused response with planning context.'
        : 'Answered directly in general assistant mode.';

  return {
    reply: buildReply(route, execution, context),
    metadata: {
      intent: route.intent,
      mode: route.mode,
      plan: userFacingPlan,
      steps: execution.steps,
      structuredData: execution.structuredData,
      suggestedActions: buildSuggestedActions(route, execution.structuredData),
      memoryUsed: context.memory.summary !== 'No prior context available.',
      verificationPassed,
    },
  };
}
