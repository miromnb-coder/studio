export type AgentDecision = {
  thought: string;
  action: string;
  input?: any;
  final?: string;
};

export type AgentStep = {
  type: "think" | "action" | "observation" | "final";
  content?: string;
  tool?: string;
  input?: any;
  result?: any;
};

export type AgentState = {
  input: string;
  steps: AgentStep[];
  memory: any[];
  plan: string[];
  toolsUsed: string[];
  done: boolean;
};

export type Tool = {
  name: string;
  description: string;
  execute: (input: any) => Promise<any>;
};
