import { getCreditSnapshot, grantCredits } from './credits';

export async function getCreditsAccountV2(userId: string) {
  return getCreditSnapshot({ userId });
}

export async function chargeCreditsV2() {
  throw new Error('chargeCreditsV2 is deprecated. Use credit-engine reservations directly.');
}

export async function grantCreditsV2(userId: string, amount: number, title = 'Credits added') {
  return grantCredits({ userId, amount, reason: title });
}
