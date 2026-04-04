/**
 * @fileOverview Client-side manager for the Tool Registry state.
 * Handles installation, activation, and persistence of tool preferences.
 */

import { ToolDefinition, ToolStatus } from './types';

const INITIAL_TOOLS: ToolDefinition[] = [
  {
    id: 'analyze',
    name: 'Structural Analyst',
    description: 'Perform deep visual and textual analysis of documents.',
    longDescription: 'Leverages high-parameter vision models to extract structured data from receipts, bank statements, and technical documents. Identifies patterns that human scanning might miss.',
    category: 'Analysis',
    version: '2.1.0',
    author: 'Operator Core',
    icon: 'Search',
    status: 'active',
    permissions: ['Read Documents', 'Vision Access'],
    metrics: { usageCount: 142, timeSavedMinutes: 450, moneySavedAmount: 0, lastUsed: new Date().toISOString() }
  },
  {
    id: 'detect_leaks',
    name: 'Leak Detector',
    description: 'Identify predatory subscriptions and hidden fees.',
    longDescription: 'Scans financial signals for recurring charges, trial expirations, and price increases. Provides automated protocols for cancellation and negotiation.',
    category: 'Finance',
    version: '1.4.2',
    author: 'Operator Core',
    icon: 'Zap',
    status: 'active',
    isPremium: true,
    permissions: ['Financial Access', 'Read Inbox'],
    metrics: { usageCount: 89, timeSavedMinutes: 120, moneySavedAmount: 450, lastUsed: new Date().toISOString() }
  },
  {
    id: 'optimize_time',
    name: 'Temporal Engine',
    description: 'Audit schedules for efficiency and automation.',
    longDescription: 'Analyzes calendars and task lists to identify low-value work. Suggests optimal blocks for focus and identifies tasks that can be delegated to automation.',
    category: 'Productivity',
    version: '3.0.1',
    author: 'Operator Core',
    icon: 'Clock',
    status: 'active',
    permissions: ['Read Calendar', 'Task Management'],
    metrics: { usageCount: 210, timeSavedMinutes: 840, moneySavedAmount: 0, lastUsed: new Date().toISOString() }
  },
  {
    id: 'send_email',
    name: 'Signal Transmitter',
    description: 'Draft and send professional communications.',
    longDescription: 'A hardened communication tool that handles external protocol negotiations. Can draft cancellation requests, refund queries, and professional follow-ups via Gmail.',
    category: 'Communication',
    version: '1.0.5',
    author: 'Operator Core',
    icon: 'Mail',
    status: 'installed',
    permissions: ['Send Email', 'Draft Email'],
    metrics: { usageCount: 45, timeSavedMinutes: 90, moneySavedAmount: 0 }
  },
  {
    id: 'generate_strategy',
    name: 'Strategic Planner',
    description: 'Develop high-impact business growth plans.',
    longDescription: 'Synthesizes market data and user objectives into actionable roadmaps. Focuses on revenue maximization and operational scaling.',
    category: 'Strategy',
    version: '2.0.0',
    author: 'Operator Core',
    icon: 'Target',
    status: 'available',
    permissions: ['Market Data Access', 'Internal Research'],
    metrics: { usageCount: 0, timeSavedMinutes: 0, moneySavedAmount: 0 }
  }
];

export class ToolRegistryManager {
  static getTools(): ToolDefinition[] {
    if (typeof window === 'undefined') return INITIAL_TOOLS;
    const saved = localStorage.getItem('operator_tool_states');
    if (!saved) return INITIAL_TOOLS;
    
    try {
      const states = JSON.parse(saved);
      return INITIAL_TOOLS.map(t => ({
        ...t,
        status: states[t.id] || t.status
      }));
    } catch {
      return INITIAL_TOOLS;
    }
  }

  static updateToolStatus(id: string, status: ToolStatus) {
    const tools = this.getTools();
    const states = tools.reduce((acc, t) => {
      acc[t.id] = t.id === id ? status : t.status;
      return acc;
    }, {} as Record<string, string>);
    
    localStorage.setItem('operator_tool_states', JSON.stringify(states));
    window.dispatchEvent(new Event('tool_registry_updated'));
  }
}
