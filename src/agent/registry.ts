export type KivoAgentId = 'default' | 'research';

export type KivoAgentDefinition = {
  id: KivoAgentId;
  label: string;
  description: string;
  preferredResponseType: 'plain' | 'search' | 'shopping' | 'compare' | 'email' | 'operator';
  preferredResponseMode: 'operator' | 'tool' | 'fast' | 'casual' | 'fallback';
  allowedTools: Array<'web' | 'memory' | 'files' | 'email' | 'calendar' | 'code'>;
  useResponsesApi: boolean;
};

export const KIVO_AGENT_REGISTRY: Record<KivoAgentId, KivoAgentDefinition> = {
  default: {
    id: 'default',
    label: 'Kivo',
    description: 'Default Kivo assistant behavior.',
    preferredResponseType: 'plain',
    preferredResponseMode: 'operator',
    allowedTools: ['web', 'memory', 'files', 'email', 'calendar', 'code'],
    useResponsesApi: true,
  },
  research: {
    id: 'research',
    label: 'Research Agent',
    description:
      'Finds the best information, synthesizes it clearly, and gives a strong next step.',
    preferredResponseType: 'search',
    preferredResponseMode: 'operator',
    allowedTools: ['web', 'memory', 'files'],
    useResponsesApi: true,
  },
};

export function getKivoAgent(agentId?: string | null): KivoAgentDefinition {
  if (!agentId) return KIVO_AGENT_REGISTRY.default;
  return KIVO_AGENT_REGISTRY[agentId as KivoAgentId] ?? KIVO_AGENT_REGISTRY.default;
}
