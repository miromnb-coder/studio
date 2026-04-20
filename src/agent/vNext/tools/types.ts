import type { AgentContext, AgentToolCall, AgentToolName, AgentToolResult } from '../types';
import type { BrowserSearchMode, BrowserSearchResult } from '@/lib/browser-search/search';

export type { AgentContext, AgentToolCall, AgentToolName, AgentToolResult };

export type AgentToolHandler = (
  call: AgentToolCall,
  context: AgentContext,
) => Promise<AgentToolResult>;

export type AgentToolRegistry = Record<AgentToolName, AgentToolHandler>;

export type ToolInput = Record<string, unknown>;

export type ExecutionMetadata = {
  placeholder?: boolean;
  requiresProvider?: boolean;
  requiresAuth?: boolean;
  requiredScopes?: string[];
  nextAction?: string;
  summary?: string;
  confidence?: number;
};

export type CompareScorecard = {
  item: string;
  scores: Record<string, number>;
  total: number;
  reasoning: string[];
};

export type PersistedFinanceProfile = {
  active_subscriptions?: unknown[];
  total_monthly_cost?: number | null;
  estimated_savings?: number | null;
  currency?: string | null;
  memory_summary?: string | null;
  last_analysis?: unknown;
};

export type WebAction = 'status' | 'search' | 'research' | 'shopping' | 'products' | 'fetch';

export type WebSearchItem = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string | null;
};

export type WebProductItem = {
  id: string;
  title: string;
  price: string | null;
  source: string | null;
  imageUrl: string | null;
  url: string;
  description: string | null;
};

export type ProviderRunResult = {
  provider: string;
  mode: BrowserSearchMode;
  results: BrowserSearchResult[];
  fallbackUsed: boolean;
  attemptedProviders: string[];
};
