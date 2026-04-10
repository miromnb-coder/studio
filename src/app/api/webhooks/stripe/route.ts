import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { SubscriptionService, UserPlan } from '@/services/subscription-service';

/**
 * @fileOverview Stripe Webhook Receiver.
 * Listens for checkout.session.completed to update user clearance levels.
 */

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    // Verify signature in production:
    // const event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);

    // Simplified logic for prototype ingestion
    const event = JSON.parse(payload);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const plan = session.metadata?.plan_id as UserPlan;

      if (userId && plan) {
        const supabase = await createSupabaseServerClient();
        await SubscriptionService.updatePlan(supabase, userId, plan);
        console.log(`[WEBHOOK] User ${userId} upgraded to ${plan}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[WEBHOOK_ERROR]:', error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
