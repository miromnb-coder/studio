'use client';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { getToolDisplayName, ToolServiceIcon } from './toolIcons';

type Step = { title: string; tool?: string; status: 'pending'|'active'|'completed'|'failed' };

function StepRow({step}:{step:Step}) {
 const active = step.status==='active'; const done=step.status==='completed';
 return <div className={`relative overflow-hidden rounded-2xl border px-3 py-2.5 ${active?'border-[#cfe0ff] bg-[#eef4ff]':'border-black/[0.06] bg-white/78'}`}>
   {active ? <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[kivoShimmer_1.8s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.78),transparent)]" />:null}
   <div className="relative flex items-center gap-3">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm"><ToolServiceIcon tool={step.tool} /></span>
    <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium text-[#1f2937]">{step.title}</div><div className="text-[11px] text-[#8a94a6]">{getToolDisplayName(step.tool)}</div></div>
    {done ? <CheckCircle2 className="h-4 w-4 text-[#22c55e]"/> : active ? <Loader2 className="h-4 w-4 animate-spin text-[#4f7cff]"/> : <Circle className="h-4 w-4 text-[#c3cad7]"/>}
   </div></div>
}

export function KivoExecutionTimeline({toolResults,isStreaming}:{toolResults?:Array<Record<string,unknown>>;isStreaming?:boolean}) {
 const raw = Array.isArray(toolResults)?toolResults:[];
 const steps: Step[] = raw.map((item,idx)=>({title:String(item.summary||item.tool||`Step ${idx+1}`),tool:String(item.tool||''),status:String(item.ok)==='false'?'failed':'completed'}));
 if(isStreaming){steps.push({title:'Working on next step',tool:'response_generator',status:'active'});}
 if(!steps.length) return null;
 return <div className="mb-3.5 rounded-[24px] border border-black/[0.05] bg-white/72 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl"><style jsx>{`@keyframes kivoShimmer{100%{transform:translateX(120%);}}`}</style><div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a94a6]">Execution</div><div className="space-y-2">{steps.map((step,i)=><StepRow key={i} step={step}/> )}</div></div>;
}
