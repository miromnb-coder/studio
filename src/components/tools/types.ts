/**
 * @fileOverview Core types for the Tool Marketplace and Registry.
 */

export type ToolCategory = 
  | 'Productivity' 
  | 'Finance' 
  | 'Email' 
  | 'Search' 
  | 'Analysis' 
  | 'Automation' 
  | 'Communication'
  | 'Strategy';

export type ToolStatus = 'available' | 'installed' | 'active' | 'disabled' | 'error';

export interface ToolMetrics {
  usageCount: number;
  timeSavedMinutes: number;
  moneySavedAmount: number;
  lastUsed?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: ToolCategory;
  version: string;
  author: string;
  icon: string;
  status: ToolStatus;
  isPremium?: boolean;
  permissions: string[];
  inputSchema?: any;
  outputSchema?: any;
  metrics: ToolMetrics;
}
