import type { KivoToolDefinition } from './types';
export const KIVO_TOOL_REGISTRY: KivoToolDefinition[] = [
{name:'calendar.today',title:'Today Calendar',description:'Fetch today calendar events.',capability:'calendar',tier:'free',requiresConnection:'calendar',inputSchema:{}},
{name:'gmail.recent',title:'Recent Gmail',description:'Summarize recent inbox priorities.',capability:'gmail',tier:'free',requiresConnection:'gmail',inputSchema:{}},
{name:'memory.search',title:'Memory Search',description:'Find relevant stored context.',capability:'memory',tier:'free',inputSchema:{query:'string'}},
{name:'tasks.create',title:'Task Create',description:'Create a lightweight task from request.',capability:'tasks',tier:'free',inputSchema:{title:'string'}}
];