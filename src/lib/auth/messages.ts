const friendlyByCode: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed: 'Please check your email and confirm your account before signing in.',
  user_already_exists: 'This account already exists. Try signing in instead.',
  signup_disabled: 'Sign-up is currently disabled. Please contact support.',
};

export function toFriendlyAuthMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const maybeCode = 'code' in error && typeof error.code === 'string' ? error.code : '';

  if (maybeCode && friendlyByCode[maybeCode]) return friendlyByCode[maybeCode];
  if (maybeMessage.includes('invalid login credentials')) return 'Invalid email or password.';
  if (maybeMessage.includes('email not confirmed')) return 'Please check your email to confirm your account.';
  if (maybeMessage.includes('already registered')) return 'This account already exists. Try logging in.';
  if (maybeMessage.includes('password')) return 'Please use a stronger password.';

  return fallback;
}
