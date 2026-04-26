create or replace function public.reserve_credits_atomic(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
as $$
declare v_balance integer;
begin
  update public.user_credits
  set credits_balance = credits_balance - p_amount,
      updated_at = now()
  where user_id = p_user_id and credits_balance >= p_amount
  returning credits_balance into v_balance;

  if v_balance is null then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  return v_balance;
end;
$$;

grant execute on function public.reserve_credits_atomic(uuid, integer) to service_role;