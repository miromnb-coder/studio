'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { KivoUsageSheet } from './KivoUsageSheet';
export default function KivoChatHeader({ hasMessages=false, onSidebarToggle }: any){
const router=useRouter();
const [open,setOpen]=useState(false);
const [account,setAccount]=useState<any>(null);
const load=async()=>{try{const r=await fetch('/api/credits',{cache:'no-store'});if(r.ok)setAccount(await r.json());}catch{}};
useEffect(()=>{load();const id=setInterval(load,15000);return()=>clearInterval(id);},[]);
const credits=account?.credits ?? 77;
return <><header className='relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl' style={{paddingTop:'env(safe-area-inset-top,0px)'}}><div className='mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4'><button onClick={onSidebarToggle ?? (()=>router.push('/home'))} className='inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431]'><svg viewBox='0 0 24 24' className='h-5 w-5'><path d='M4 7h16M4 12h16M4 17h10' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/></svg></button><div className='flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]'>{hasMessages?'Kivo 1.6':'Kivo Lite'}</div><button onClick={()=>setOpen(true)} className='inline-flex h-[56px] min-w-[118px] items-center justify-center gap-2 rounded-full border border-black/[0.10] bg-white px-5 text-[19px] font-medium tracking-[-0.03em] text-[#242424] shadow-[0_2px_10px_rgba(0,0,0,0.06)] active:scale-[0.98]'><Sparkles className='h-5 w-5'/><span>{credits}</span></button></div></header><KivoUsageSheet open={open} onClose={()=>setOpen(false)} onUpgrade={()=>router.push('/upgrade')} credits={credits} account={account} /></>; }