import { ToolDefinition } from '../types';

type RegisteredTool = ToolDefinition<any, any>;

const toolRegistry = new Map<string, RegisteredTool>();

export function registerTool(tool: RegisteredTool): void {
  toolRegistry.set(tool.name, tool);
}

export function getTool(name: string): RegisteredTool | undefined {
  return toolRegistry.get(name);
}

export function listTools(): string[] {
  return [...toolRegistry.keys()];
}
