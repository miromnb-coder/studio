import type { KivoAgentDefinition } from '@/agent/registry';

export const RESEARCH_AGENT_ID = 'research' as const;

export const RESEARCH_AGENT_DEFINITION: KivoAgentDefinition = {
  id: RESEARCH_AGENT_ID,
  label: 'Research Agent',
  description:
    'Finds the best information, synthesizes it clearly, and gives a strong next step.',
  preferredResponseType: 'search',
  preferredResponseMode: 'operator',
  allowedTools: ['web', 'memory', 'files'],
  useResponsesApi: true,
};

export function isResearchAgent(agentId?: string | null): boolean {
  return agentId === RESEARCH_AGENT_ID;
}
