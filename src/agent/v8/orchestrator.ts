import { runFinanceAgent, runMemoryAgent, runResearchAgent } from './agents';
import { buildContextV8 } from './context';
import { executePlanV8 } from './executor';
import { createPlanV8 } from './planner';
import { routeIntentV8 } from './router';
import { synthesizeResponseV8 } from './synthesizer';
import { AgentResponseV8, AgentRunInputV8, SystemStateV8 } from './types';
import { verifyExecutionV8 } from './verifier';

function buildSafeFallbackReply(input: {
  userMessage: string;
  intent: string;
  clarificationQuestion?: string;
  language?: string;
}): string {
  const { intent, clarificationQuestion, language = 'en' } = input;
  const isFi = language.startsWith('fi');
  const isSv = language.startsWith('sv');

  if (intent === 'finance') {
    if (isFi) {
      return [
        'Mikä on tärkeintä nyt: Haluat konkreettisen taloustoimen, mutta todennettu data on vielä osittainen.',
        'Paras suositus: Aloita suurimmasta toistuvasta kulusta ennen laajempia muutoksia.',
        'Miksi tämä toimii: Yksi priorisoitu toimi tuottaa nopeimman vaikutuksen ja vähentää epävarmuutta.',
        `Selkeä seuraava siirto: ${clarificationQuestion || 'Lähetä yksi kuukausikulu, niin teen tarkan priorisoinnin.'}`,
      ].join('\n');
    }
    if (isSv) {
      return [
        'Vad som betyder mest nu: Du vill ha en konkret ekonomisk åtgärd men verifierad data är fortfarande delvis ofullständig.',
        'Bästa rekommendationen: Börja med den största återkommande kostnaden före bredare ändringar.',
        'Varför detta fungerar: En prioriterad åtgärd ger snabbast effekt och minskar osäkerhet.',
        `Tydligt nästa steg: ${clarificationQuestion || 'Skicka en månadskostnad så rangordnar jag nästa steg exakt.'}`,
      ].join('\n');
    }

    return [
      'What matters most now: You want a concrete financial move, but current evidence is still partial.',
      'Best recommendation: Start with the highest recurring pressure item before broader budget changes.',
      'Why this matters: The biggest blocker is missing numeric grounding for prioritization.',
      `Clear next move: ${clarificationQuestion || 'Share one bill, subscription, or monthly target and I will rank actions precisely.'}`,
    ].join('\n');
  }

  if (isFi) {
    return clarificationQuestion
      ? `Mikä on tärkeintä nyt: Tarvitsen yhden täsmennyksen.\nSelkeä seuraava siirto: ${clarificationQuestion}`
      : 'Mikä on tärkeintä nyt: Tarvitsen yhden täsmennyksen, jotta voin vastata tarkasti.';
  }
  if (isSv) {
    return clarificationQuestion
      ? `Vad som betyder mest nu: Jag behöver ett förtydligande.\nTydligt nästa steg: ${clarificationQuestion}`
      : 'Vad som betyder mest nu: Jag behöver ett förtydligande för att svara exakt.';
  }

  return clarificationQuestion
    ? `What matters most now: I need one concrete detail to answer precisely.\nClear next move: ${clarificationQuestion}`
    : 'What matters most now: I need one concrete detail to answer precisely.';
}

export async function runAgentV8(input: AgentRunInputV8): Promise<AgentResponseV8> {
  let state: SystemStateV8 = 'idle';

  state = 'understanding';
  const route = routeIntentV8(input.input, (input.history || []) as any);

  const context = await buildContextV8({
    supabase: input.supabase,
    userId: input.userId,
    message: input.input,
    history: input.history,
    memory: input.memory,
    route,
    productState: input.productState,
    operatorAlerts: input.operatorAlerts,
    outcomes: input.outcomes,
    userProfileIntelligence: input.userProfileIntelligence || null,
  });

  state = 'planning';
  const plan = createPlanV8(route, input.input, context);

  state = 'executing';
  const execution = await executePlanV8(plan, context).catch((error) => {
    console.error('PLAN_EXECUTION_FAILURE', {
      intent: route.intent,
      subtype: route.subtype,
      error: error instanceof Error ? error.message : 'Unknown execution failure',
    });
    return { steps: [], structuredData: {}, partialSuccess: false, confidence: 0, earlyStopped: false, replans: 0, decisionLog: [] };
  });

  let draftReply = '';

  try {
    if (route.intent === 'finance') {
      const financeOutput = await runFinanceAgent({ route, context, plan, execution });
      draftReply = financeOutput.answerDraft;
    } else {
      const researchOutput = await runResearchAgent({ route, context, execution });
      draftReply = researchOutput.answerDraft;
    }
  } catch (error) {
    console.error('AGENT_SPECIALIST_FAILURE', {
      intent: route.intent,
      subtype: route.subtype,
      error: error instanceof Error ? error.message : 'Unknown specialist failure',
    });

    draftReply = buildSafeFallbackReply({
      userMessage: input.input,
      intent: route.intent,
      clarificationQuestion: plan.clarificationQuestion,
      language: route.responseLanguage,
    });
  }

  const critic = verifyExecutionV8({
    userMessage: input.input,
    intent: route.intent,
    reply: draftReply,
    usedTools: execution.steps.filter((s) => s.status === 'completed').map((s) => s.tool),
    plan,
    structuredData: execution.structuredData,
    responseLanguage: route.responseLanguage,
    responseMode: route.responseMode,
    goal: route.goal,
  });

  const finalReply =
    critic.refinedReply && critic.refinedReply.trim().length > 0
      ? critic.refinedReply.trim()
      : buildSafeFallbackReply({
          userMessage: input.input,
          intent: route.intent,
          clarificationQuestion: plan.clarificationQuestion,
          language: route.responseLanguage,
        });

  const safeReply =
    route.intent === 'finance' && finalReply.split(/\s+/).length < 18
      ? buildSafeFallbackReply({
          userMessage: input.input,
          intent: route.intent,
          clarificationQuestion: plan.clarificationQuestion,
          language: route.responseLanguage,
        })
      : finalReply;

  await runMemoryAgent({
    supabase: input.supabase,
    userId: input.userId,
    userMessage: input.input,
    assistantReply: safeReply,
    context,
    intent: route.intent,
  }).catch((error) => {
    console.error('MEMORY_AGENT_FAILURE', {
      userId: input.userId,
      intent: route.intent,
      error: error instanceof Error ? error.message : 'Unknown memory failure',
    });
    return { stored: [] };
  });

  state = 'responding';
  const response = synthesizeResponseV8({
    route,
    plan,
    execution,
    context,
    verificationPassed: critic.passed,
    refinedReply: safeReply,
    critic,
  });

  return {
    ...response,
    metadata: {
      ...response.metadata,
      state,
      structuredData: {
        ...response.metadata.structuredData,
        executionMeta: {
          confidence: execution.confidence,
          earlyStopped: execution.earlyStopped,
          replans: execution.replans,
          decisions: execution.decisionLog,
        },
        thinkingLabels: route.responseLanguage === 'fi'
          ? ['Ymmärretään pyyntöä', 'Tarkistetaan kontekstia', 'Tarkistetaan dataa', 'Arvioidaan vaihtoehtoja', 'Rakennetaan vastausta', 'Viimeistellään vastaus']
          : route.responseLanguage === 'sv'
            ? ['Förstår förfrågan', 'Granskar kontext', 'Kontrollerar data', 'Rangordnar alternativ', 'Bygger svar', 'Slutför svar']
            : ['Understanding request', 'Reviewing context', 'Checking data', 'Ranking options', 'Building answer', 'Finalizing response'],
      },
    },
  };
}
