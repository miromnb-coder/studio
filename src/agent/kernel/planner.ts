import type { KernelRequest } from './types';
import type { KernelToolName } from './tool-registry';
export type KernelExecutionPlan = { mode:'fast'|'agent'; tools: KernelToolName[]; reasoning:'light'|'structured'; useBuiltInWebSearch:boolean;};
const includesAny=(t:string,n:string[])=>n.some(x=>t.includes(x));
const needsFreshWebInfo=(t:string)=>includesAny(t,['latest','today news','current','news','recent','2025','2026','price','best ','compare','vs ','weather','near me']);
const needsCalendarTool=(t:string)=>includesAny(t,['calendar','meeting','event','schedule','today','tomorrow','free time','availability','appointment']);
export function buildExecutionPlan(request: KernelRequest): KernelExecutionPlan {
 const text=request.message.toLowerCase(); const mode=request.mode==='agent'?'agent':'fast'; const tools:KernelToolName[]=[];
 if(mode==='agent') tools.push('tasks.plan','productivity.next_action');
 if(includesAny(text,['remember','previous','before','last time','project','context','prefer','goal'])) tools.push('memory.search');
 if(includesAny(text,['remember this','save this','note that','for future'])) tools.push('memory.write');
 if(includesAny(text,['gmail','email','inbox','mail','urgent email','messages'])) tools.push('gmail.status','gmail.inbox_summary');
 if(includesAny(text,['subscription','renewal','receipt','invoice','charge','billed'])) tools.push('gmail.finance_scan');
 if(includesAny(text,['compare','vs','difference','better'])) tools.push('compare.smart');
 if(includesAny(text,['money','budget','save','subscription','finance','cost','price'])) tools.push('finance.analyze');
 if(needsCalendarTool(text)){ tools.push('calendar.status'); if(text.includes('today')) tools.push('calendar.today','calendar.plan_day'); else tools.push('calendar.search'); }
 return { mode, tools:Array.from(new Set(tools)), reasoning: mode==='agent'?'structured':'light', useBuiltInWebSearch: needsFreshWebInfo(text)};
}
