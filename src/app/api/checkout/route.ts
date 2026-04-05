import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, UserPlan } from '@/services/subscription-service';

/**
 * @fileOverview Stripe Checkout Proxy.
 * Handles payment session creation or simulation.
 */

export async function POST(req: Request) {
  try {
    const { userId, planId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // In a real production environment with STRIPE_SECRET_KEY:
    // const session = await stripe.checkout.sessions.create({ ... });
    // return NextResponse.json({ url: session.url });

    // For this prototype, we simulate a successful checkout transition
    // while keeping the logic structure ready for Stripe.
    console.log(`[CHECKOUT] Initializing session for User ${userId}, Plan ${planId}`);

    // Simulation delay
    await new Promise(r => setTimeout(r, 1000));

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error("Database link failed");

    // We directly update the plan for the prototype to ensure functional continuity.
    // In production, this happens via Webhook.
    const success = await SubscriptionService.updatePlan(firestore, userId, planId.toUpperCase() as UserPlan);

    if (!success) throw new Error("Subscription sync failed");

    return NextResponse.json({ 
      success: true, 
      redirectUrl: '/dashboard?upgrade=success' 
    });

  } catch (error: any) {
    console.error('[CHECKOUT_ERROR]:', error.message);
    return NextResponse.json({ error: 'Payment protocol failure' }, { status: 500 });
  }
}
