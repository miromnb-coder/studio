/**
 * @fileOverview Core types for the Floating AI Core system.
 */

export type AICoreStatus = 'idle' | 'thinking' | 'reasoning' | 'executing' | 'success' | 'error';

export interface AICoreStep {
  label: string;
  timestamp: Date;
  status: 'complete' | 'active' | 'pending';
}

export interface AICoreState {
  status: AICoreStatus;
  intent?: string;
  lastAction?: string;
  currentTool?: string;
  steps: AICoreStep[];
  progress?: number;
}

export interface AICoreContextType {
  state: AICoreState;
  setStatus: (status: AICoreStatus) => void;
  updateState: (updates: Partial<AICoreState>) => void;
  reset: () => void;
}
