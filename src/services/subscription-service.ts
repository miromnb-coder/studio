export async function getUserSubscription() {
  return {
    plan: 'free',
    active: false,
    status: 'inactive',
  };
}

export async function hasProAccess() {
  return false;
}

export async function createCheckoutSession() {
  return {
    ok: false,
    skipped: true,
    reason: 'subscription-service not configured',
    url: null,
  };
}

export async function handleStripeWebhook() {
  return {
    ok: false,
    skipped: true,
    reason: 'subscription-service not configured',
  };
}
