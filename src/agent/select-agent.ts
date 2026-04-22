import { getKivoAgent, type KivoAgentDefinition } from '@/agent/registry';

type SelectAgentInput = {
  userMessage?: string | null;
  requestedAgentId?: string | null;
};

function normalize(text?: string | null): string {
  return typeof text === 'string' ? text.trim().toLowerCase() : '';
}

function looksLikeResearchRequest(text: string): boolean {
  if (!text) return false;

  const triggers = [
    'research',
    'compare',
    'best option',
    'best way',
    'analyze',
    'analyse',
    'find the best',
    'which is better',
    'pros and cons',
    'deep dive',
    'investigate',
    'summarize sources',
    'compare these',
    'selvitä',
    'vertaa',
    'paras tapa',
    'tutki',
    'analysoi',
    'mikä on paras',
  ];

  return triggers.some((trigger) => text.includes(trigger));
}

export function selectKivoAgent(
  input: SelectAgentInput,
): KivoAgentDefinition {
  const explicit = normalize(input.requestedAgentId);
  const message = normalize(input.userMessage);

  if (explicit) {
    return getKivoAgent(explicit);
  }

  if (looksLikeResearchRequest(message)) {
    return getKivoAgent('research');
  }

  return getKivoAgent('default');
}
