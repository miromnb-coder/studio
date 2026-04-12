import { AgentContextV8, ExecutionResultV8, RouteResultV8 } from '../types';
import { groq } from '@/ai/groq';
import { resolveAIModel } from '@/lib/ai/config';

export type ResearchAgentInput = {
  route: RouteResultV8;
  context: AgentContextV8;
  execution: ExecutionResultV8;
};

export type ResearchAgentOutput = {
  keyPoints: string[];
  answerDraft: string;
};

function stripTemplateLanguage(text: string): string {
  return text
    .replace(/\b(here('| i)s|this is)\s+(a\s+)?(direct|grounded)\s+answer[^.]*\.?/gi, '')
    .replace(/\b(i understood your request|as an ai|operator mode)\b[^.]*\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function resolveResponseLanguage(input: ResearchAgentInput): string {
  return input.route.responseLanguage || input.context.intelligence.userProfile?.preferred_language || 'en';
}

function resolveVerbosity(context: AgentContextV8): 'short' | 'medium' | 'detailed' {
  const message = context.user.message.toLowerCase();
  if (/\b(short|brief|concise|quick|tldr)\b/.test(message)) return 'short';
  if (/\b(detailed|deep|thorough|step-by-step|comprehensive)\b/.test(message)) return 'detailed';
  return context.intelligence.userProfile?.verbosity_preference || 'medium';
}

function verbosityInstruction(level: 'short' | 'medium' | 'detailed'): string {
  if (level === 'short') return 'Keep the answer short (2-4 sentences) unless the user asks for more.';
  if (level === 'detailed') return 'Provide a detailed answer with structure and concrete steps.';
  return 'Keep the answer concise but complete.';
}

function goalStructureInstruction(intent: RouteResultV8['intent']): string {
  if (intent === 'research' || intent === 'coding') {
    return 'Use this response rhythm: Observation -> Interpretation -> Next focus -> Recommendation -> 1-3 action steps.';
  }
  return 'Use this response rhythm: Observation -> Interpretation -> Next focus -> Recommendation -> 1-3 action steps.';
}

export async function runResearchAgent(input: ResearchAgentInput): Promise<ResearchAgentOutput> {
  const responseLanguage = resolveResponseLanguage(input);
  const message = input.context.user.message;
  const relevantMemories = input.context.memory.relevantMemories.slice(0, 2).map((item) => item.content);
  const conversationTail = input.context.conversation.slice(-4).map((item) => ({
    role: item.role,
    content: item.content,
  }));
  const toolData = input.execution.structuredData || {};
  const toolResultKeys = Object.keys(toolData);
  const gmailData =
    toolData.gmail_fetch && typeof toolData.gmail_fetch === 'object'
      ? (toolData.gmail_fetch as Record<string, unknown>)
      : null;
  const environmentSummary = `gmailConnected=${input.context.environment.gmailConnected}, plan=${input.context.environment.productState.plan}`;
  const topRecommendation = input.context.intelligence.recommendations[0];

  const modeHint =
    input.route.responseMode === 'operator'
      ? 'Focus on concrete actions, checklists, and executable next steps.'
      : input.route.responseMode === 'coach'
        ? 'Use calm, supportive, low-friction language and reduce option overload.'
        : input.route.intent === 'coding'
      ? 'Focus on concrete debugging/coding guidance and specific next steps.'
      : input.route.intent === 'productivity'
        ? 'Focus on practical planning, prioritization, and action sequencing.'
        : input.route.intent === 'memory'
          ? 'Focus on memory/retrieval requests without unrelated details.'
          : 'Focus on directly answering the user question with clear reasoning.';

  const replyLength = resolveVerbosity(input.context);

  let answerDraft = responseLanguage === 'fi'
    ? 'Tarvitsen yhden täsmällisen lisätiedon, jotta voin vastata oikein.'
    : 'I need one specific detail to answer this correctly.';
  const groundingEvidence = [
    relevantMemories.length ? `memory(${relevantMemories.length})` : '',
    toolResultKeys.length ? `tools(${toolResultKeys.join(',')})` : '',
    topRecommendation ? 'recommendation(1)' : '',
    `env(${environmentSummary})`,
  ].filter(Boolean);
  const gmailGroundingBlock = gmailData
    ? JSON.stringify({
        connected: Boolean(gmailData.connected),
        query: gmailData.query || '',
        emailsAnalyzed: Number(gmailData.emailsAnalyzed || 0),
        subscriptionsFound: Number(gmailData.subscriptionsFound || 0),
        recurringPaymentsFound: Number(gmailData.recurringPaymentsFound || 0),
        summary: String(gmailData.summary || ''),
        trialRisks: Array.isArray(gmailData.trialRisks) ? gmailData.trialRisks.slice(0, 3) : [],
        savingsOpportunities: Array.isArray(gmailData.savingsOpportunities) ? gmailData.savingsOpportunities.slice(0, 3) : [],
      })
    : 'none';

  try {
    const completion = await groq.chat.completions.create({
      model: resolveAIModel(),
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are a smart general AI assistant.
Use an active analytical tone that feels like a capable operator working through the problem.
Show visible progress in short stages: Observation, Interpretation, Next focus, Recommendation.
Each stage should be concise and useful (no chain-of-thought, no hidden internal details).
Answer the user request directly and decisively.
Use natural language, not robotic templates.
Do not mention tools, plans, hidden steps, intent labels, or internal routing unless the user asks.
For simple questions, keep the stages compact (1 short line each).
${modeHint}
Prioritize decisive recommendations over brainstorming.
Choose one best path first unless the user explicitly requests many options.
If there are options, compare briefly using impact, effort, risk, and certainty.
${goalStructureInstruction(input.route.intent)}
${verbosityInstruction(replyLength)}
If gmail_fetch output exists, cite only those fields and never invent values.
Hard rule: NO DATA = NO CLAIMS (no fabricated invoices, amounts, due dates, obligations, or merchants).
Respond in ${responseLanguage}.
Never mix languages in the same answer. If input is Finnish, output only Finnish. If input is English, output only English. If input is Swedish, output only Swedish.`,
        },
        ...conversationTail,
        {
          role: 'user',
          content: `User request: ${message}
Relevant memory: ${relevantMemories.length ? relevantMemories.join(' | ') : 'none'}
Tool outputs present: ${input.execution.steps.length > 0 ? 'yes' : 'no'}
Tool output keys: ${toolResultKeys.length ? toolResultKeys.join(', ') : 'none'}
gmail_fetch structured output: ${gmailGroundingBlock}
Top recommendation: ${topRecommendation ? `${topRecommendation.title} (${topRecommendation.priority})` : 'none'}
Environment: ${environmentSummary}
Grounding evidence available: ${groundingEvidence.join(', ')}
Goal understanding: inferred_goal=${input.route.goal.inferredGoal}; urgency=${input.route.goal.urgency}; category=${input.route.goal.category}; tone=${input.route.goal.emotionalTone}
You must ground your answer in at least one of: memory, tool outputs, recommendation, or environment.
Use these exact section labels when possible: "Observation:", "Interpretation:", "Next focus:", "Recommendation:", "Action steps:".
If the request is ambiguous, ask one short clarifying question. Otherwise give a direct final answer.`,
        },
      ],
    });

    const modelReply = completion.choices[0]?.message?.content?.trim();
    if (modelReply) answerDraft = stripTemplateLanguage(modelReply);
  } catch {
    // keep fallback draft
  }

  const memoryUsed = relevantMemories.length > 0;
  const toolResultUsed = toolResultKeys.length > 0;
  const intelligenceUsed = Boolean(topRecommendation);

  const keyPoints = [
    `Intent: ${input.route.intent}`,
    relevantMemories.length
      ? `Relevant memories used: ${relevantMemories.length}`
      : 'No strongly relevant long-term memory found.',
    `Tool steps executed: ${input.execution.steps.length}`,
    `Language: ${responseLanguage}`,
    `Verbosity preference: ${replyLength}`,
  ];

  return { keyPoints, answerDraft };
}
