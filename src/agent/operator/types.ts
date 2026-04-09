import type { AIProviderClient, ChatMessage } from '@/lib/ai/types';

export type ResponseMode = 'direct' | 'deep_explanation' | 'analysis' | 'operator';

export type IntentRoute = {
  mode: ResponseMode;
  needsResearch: boolean;
  needsAnalysis: boolean;
  needsMemory: boolean;
  needsPlanning: boolean;
  complexity: 'low' | 'medium' | 'high';
  intent: 'quick_answer' | 'explanation' | 'comparison' | 'planning' | 'troubleshooting' | 'recommendation' | 'open_ended';
  outputShape: 'short' | 'sections' | 'steps' | 'decision';
  rationale: string[];
};

export type StoredMemory = {
  key: string;
  value: string;
  score: number;
  source: 'preference' | 'decision' | 'pattern' | 'project';
  updatedAt: string;
};

export type OperatorContext = {
  provider: AIProviderClient;
  messages: ChatMessage[];
  latestUserInput: string;
  route: IntentRoute;
  emitStep: (payload: { label: string; status: 'running' | 'completed' }) => void;
};

export type OperatorResult = {
  final: string;
  route: IntentRoute;
  memoryUsed: StoredMemory[];
  memoryStored: StoredMemory[];
};
