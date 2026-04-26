import type { KivoToolContext, KivoToolInput, KivoToolName, KivoToolResult } from './types';
import { runKernelTool } from '../kernel/tools';
import type { KernelRequest } from '../kernel/types';

function toRequest(input: KivoToolInput): KernelRequest { return { message: String(input.message || input.query || input.title || ''), metadata: input.metadata }; }

export async function runKivoTool(name: KivoToolName, input: KivoToolInput = {}, context: KivoToolContext = {}): Promise<KivoToolResult> {
 if(name==='gmail.recent') name='gmail.inbox_summary';
 if(name==='tasks.create') return { ok:true, tool:'tasks.create', title:'Task Created', summary:'Created a lightweight task item.', data:{ title:String(input.title||input.message||'New task'), created:true } };
 const result = await runKernelTool(name as any, toRequest(input), context as any);
 return { ok: result.ok, tool: name, title: name, summary: result.summary, data: result.data, error: result.ok ? undefined : result.summary };
}
