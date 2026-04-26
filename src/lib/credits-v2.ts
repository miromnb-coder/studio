import { createClient } from '@/lib/supabase/server';
import { chargeCredits, estimateCreditCost, grantCredits, readCreditAccount } from './credits';

export async function getCreditsAccountV2() {
 try {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return readCreditAccount();
  const { data } = await supabase.from('kivo_credit_accounts').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return readCreditAccount(userId);
  const { data: ledger } = await supabase.from('kivo_credit_ledger').select('*').eq('user_id', userId).order('created_at',{ascending:false}).limit(40);
  return { userId, plan:data.plan, credits:data.credits, dailyRefreshCredits:data.daily_refresh_credits, monthlyCredits:data.monthly_credits, monthlyUsed:data.monthly_used, lastDailyRefresh:data.last_daily_refresh, history:(ledger||[]).map((x:any)=>({id:x.id,createdAt:x.created_at,title:x.title,action:x.action,amount:x.amount,balanceAfter:x.balance_after})) };
 } catch { return readCreditAccount(); }
}

export async function chargeCreditsV2(message:string, mode:'fast'|'agent') {
 const estimate = estimateCreditCost({message,mode});
 try {
  const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser(); const userId = auth.user?.id;
  if (!userId) return chargeCredits({amount:estimate.cost,action:estimate.action,title:estimate.title});
  const current = await getCreditsAccountV2() as any;
  if (current.credits < estimate.cost) return { ok:false, account:current };
  const next = current.credits - estimate.cost;
  await supabase.from('kivo_credit_accounts').upsert({ user_id:userId, plan:current.plan, credits:next, daily_refresh_credits:current.dailyRefreshCredits, monthly_credits:current.monthlyCredits, monthly_used:(current.monthlyUsed||0)+estimate.cost, last_daily_refresh:current.lastDailyRefresh });
  await supabase.from('kivo_credit_ledger').insert({ id:`lg_${Date.now()}`, user_id:userId, action:estimate.action, title:estimate.title, amount:-estimate.cost, balance_after:next });
  return { ok:true, account:{...current, credits:next}, estimate };
 } catch { return chargeCredits({amount:estimate.cost,action:estimate.action,title:estimate.title}); }
}

export async function grantCreditsV2(amount:number,title='Credits added') { try { const acc:any = await getCreditsAccountV2(); return grantCredits({userId:acc.userId,amount,title}); } catch { return grantCredits({amount,title}); } }
