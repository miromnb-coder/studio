const REFERRAL_STORAGE_KEY = 'kivo_referral_code';

export function saveReferralCode(code: string) {
  if (typeof window === 'undefined') return;
  if (!code.trim()) return;
  window.localStorage.setItem(REFERRAL_STORAGE_KEY, code.trim());
}

export function getSavedReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFERRAL_STORAGE_KEY);
}

export function clearSavedReferralCode() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
