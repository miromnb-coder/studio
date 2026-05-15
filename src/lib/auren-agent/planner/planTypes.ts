import type { AurenPlan, AurenPlanStep, AurenToolName } from '../core/types';

export type AurenPlannerInput = {
  goal: string;
  intent: string;
  needsTools: boolean;
  toolNames?: AurenToolName[];
};

export type { AurenPlan, AurenPlanStep };
