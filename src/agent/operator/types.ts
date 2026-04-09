import type { AIProviderClient, ChatMessage } from '@/lib/ai/types';
import type { AgentName } from '@/app/store/app-store';

export type IntentRoute = {
  needsResearch: boolean;
  needsAnalysis: boolean;
  needsMemory: boolean;
  complexity: 'low' | 'medium' | 'high';
};

export type StoredMemory = {
  key: string;
  value: string;
  score: number;
  source: 'preference' | 'decision' | 'pattern';
  updatedAt: string;
};

export type OperatorContext = {
  provider: AIProviderClient;
  messages: ChatMessage[];
  latestUserInput: string;
  route: IntentRoute;
  emitStep: (payload: { label: string; status: 'running' | 'completed'; agent?: AgentName }) => void;
};

export type OperatorResult = {
  final: string;
  route: IntentRoute;
  memoryUsed: StoredMemory[];
  memoryStored: StoredMemory[];
};
