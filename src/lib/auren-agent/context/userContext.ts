import type { AurenAgentInput, AurenUserContext } from '../core/types';

export async function getUserContext(input: AurenAgentInput): Promise<AurenUserContext> {
  return {
    userId: input.userId,
    traits: [],
    preferences: [],
  };
}
