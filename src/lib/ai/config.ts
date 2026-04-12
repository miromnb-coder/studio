const DEFAULT_PROVIDER = 'groq' as const;
const DEFAULT_MODEL = 'openai/gpt-oss-120b' as const;

export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER ?? DEFAULT_PROVIDER).toLowerCase(),
  model: process.env.AI_MODEL ?? process.env.GROQ_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
} as const;

export function resolveAIModel(override?: string): string {
  return override ?? AI_CONFIG.model;
}

export function resolveGenkitModel(override?: string): string {
  const baseModel = resolveAIModel(override);
  return baseModel.startsWith('groq/') ? baseModel : `groq/${baseModel}`;
}
