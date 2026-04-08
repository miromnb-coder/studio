export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatStreamEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'meta'; model: string; provider: string }
  | { type: 'error'; message: string };

export type ChatGenerationRequest = {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
};

export type AIProviderClient = {
  name: 'openai' | 'groq';
  streamChat: (
    request: ChatGenerationRequest,
    onEvent: (event: ChatStreamEvent) => void,
  ) => Promise<void>;
};
