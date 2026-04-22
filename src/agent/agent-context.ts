import type { KivoAgentDefinition, KivoAgentId } from '@/agent/registry';

export type KivoAgentContext = {
  id: KivoAgentId;
  label: string;
  description: string;
  preferredResponseType: KivoAgentDefinition['preferredResponseType'];
  preferredResponseMode: KivoAgentDefinition['preferredResponseMode'];
  allowedTools: KivoAgentDefinition['allowedTools'];
  useResponsesApi: boolean;
};

export function toAgentContext(
  agent: KivoAgentDefinition,
): KivoAgentContext {
  return {
    id: agent.id,
    label: agent.label,
    description: agent.description,
    preferredResponseType: agent.preferredResponseType,
    preferredResponseMode: agent.preferredResponseMode,
    allowedTools: [...agent.allowedTools],
    useResponsesApi: agent.useResponsesApi,
  };
}
