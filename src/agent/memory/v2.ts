import type { KernelRequest } from '../kernel/types';
import type { KernelToolContext } from '../kernel/tool-registry';
export type MemoryV2Item={id:string;type:'project'|'goal'|'preference'|'workflow'|'fact'|'task';text:string;score:number;reason:string;source:'static_profile'|'request'|'metadata'};
export type MemoryV2SearchResult={query:string;items:MemoryV2Item[];summary:string};
export type MemoryV2WriteCandidate={type:MemoryV2Item['type'];text:string;confidence:number;reason:string};
const STATIC_PROFILE:Array<Omit<MemoryV2Item,'score'|'reason'>>=[
{id:'kivo-product',type:'project',text:'Kivo is the user’s personal AI Agent focused on helping one person.',source:'static_profile'},
{id:'kivo-current-agent',type:'workflow',text:'Current active agent path is src/agent/kernel using runKernel and runKernelStream.',source:'static_profile'},
{id:'kivo-tool-layer',type:'workflow',text:'Kivo uses a Tool Layer through src/agent/tools and kernel tool execution.',source:'static_profile'},
{id:'kivo-priority',type:'goal',text:'Important direction: make Memory, Gmail, Calendar, and Tasks genuinely useful for the user.',source:'static_profile'},
{id:'kivo-ui',type:'preference',text:'The user prefers premium, mobile-first, Apple-like UI with smooth animations and minimal clutter.',source:'static_profile'},
{id:'kivo-role',type:'goal',text:'Kivo should remember what matters, plan next steps, and help the user act.',source:'static_profile'}];
const normalize=(t:string)=>t.toLowerCase().replace(/[^a-z0-9åäö\s]/gi,' ').replace(/\s+/g,' ').trim();
const words=(t:string)=>new Set(normalize(t).split(' ').filter(w=>w.length>2));
const score=(q:string,t:string)=>{const a=words(q),b=words(t);let h=0;for(const w of a)if(b.has(w))h++;return a.size?h/Math.max(1,Math.min(a.size,8)):0};
function inferReason(item:any,query:string){if(item.type==='project')return 'Relevant personal agent context.';if(item.type==='workflow')return 'Relevant implementation context.';if(item.type==='goal')return 'Relevant user/product goal.';if(item.type==='preference')return 'Relevant user preference.';return `Matched query: ${query.slice(0,80)}`}
export function searchMemoryV2(request:KernelRequest,context:KernelToolContext):MemoryV2SearchResult{const query=request.message||String(request.metadata?.query||'');const items=STATIC_PROFILE.map(item=>({...item,score:Math.min(1,score(query,item.text)+( /kivo|agent|memory|gmail|calendar|task|user|project/i.test(query)?0.25:0)),reason:inferReason(item,query)})).filter(i=>i.score>0.12).sort((a,b)=>b.score-a.score).slice(0,6);return{query,items,summary:items.length?`Found ${items.length} relevant memory item${items.length===1?'':'s'} for this request.`:'No strong Memory v2 match found.'}}
export function extractMemoryV2WriteCandidates(request:KernelRequest):MemoryV2WriteCandidate[]{const text=request.message.trim();const out:MemoryV2WriteCandidate[]=[];const patterns=[[/(:?remember this|muista tämä)[:\s]+(.+)/i,'fact','Explicit remember request.'],[/(:?my goal is|tavoitteeni on)[:\s]+(.+)/i,'goal','User stated a goal.'],[/(:?i prefer|haluan mieluummin)[:\s]+(.+)/i,'preference','User stated a preference.'] ] as any[];for(const [p,type,reason] of patterns){const m=text.match(p);if(m?.[2])out.push({type,text:m[2].trim().slice(0,500),confidence:0.9,reason});}return out.slice(0,6)}