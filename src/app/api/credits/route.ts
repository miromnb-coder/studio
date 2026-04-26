import { NextRequest } from 'next/server';
import { getCreditSnapshot, grantCredits } from '@/lib/credits';
export const dynamic='force-dynamic';
export async function GET(){return Response.json(getCreditSnapshot());}
export async function POST(req:NextRequest){const body=await req.json().catch(()=>({}));const amount=Number(body?.amount||0);if(!amount)return Response.json({error:'invalid_amount'},{status:400});return Response.json(grantCredits({amount,title:body?.title||'Credits added',action:body?.action,metadata:body?.metadata}));}
