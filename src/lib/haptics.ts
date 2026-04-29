export type HapticType = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

type HapticConfig = {
  minimumGapMs: number;
  duplicateGapMs: number;
  enabled: boolean;
};

const DEFAULT_CONFIG: HapticConfig = {
  minimumGapMs: 80,
  duplicateGapMs: 140,
  enabled: true,
};

const PATTERNS: Record<HapticType, number | number[]> = {
  selection: 8,
  light: 10,
  medium: 16,
  heavy: 24,
  success: [10, 30, 14],
  warning: [14, 36, 14],
  error: [20, 44, 20],
};

let runtimeConfig: HapticConfig = { ...DEFAULT_CONFIG };
let lastTriggerAt = 0;
let lastType: HapticType | null = null;
let scheduledTimer: ReturnType<typeof window.setTimeout> | null = null;

function hasWindow() {
  return typeof window !== 'undefined';
}

function isReducedMotionPreferred() {
  if (!hasWindow() || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isDisabledByPreference() {
  if (!hasWindow()) return false;
  const value = window.localStorage.getItem('kivo_haptics_enabled');
  return value === 'false';
}

function canTrigger(type: HapticType) {
  if (!runtimeConfig.enabled) return false;
  if (!hasWindow()) return false;
  if (isReducedMotionPreferred()) return false;
  if (isDisabledByPreference()) return false;

  const now = Date.now();
  const elapsed = now - lastTriggerAt;
  if (elapsed < runtimeConfig.minimumGapMs) return false;
  if (type === lastType && elapsed < runtimeConfig.duplicateGapMs) return false;
  return true;
}

function clearPendingTimer() {
  if (scheduledTimer !== null) {
    window.clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

function performVibration(pattern: number | number[]) {
  if (!hasWindow()) return;
  const nav = navigator as Navigator & { vibrate?: (v: number | number[]) => boolean };

  try {
    nav.vibrate?.(pattern);
  } catch {
    // Haptics are optional and should never throw.
  }
}

function queueTrigger(type: HapticType) {
  if (!canTrigger(type)) return;

  clearPendingTimer();
  scheduledTimer = window.setTimeout(() => {
    scheduledTimer = null;
    performVibration(PATTERNS[type]);
    lastTriggerAt = Date.now();
    lastType = type;
  }, 0);
}

export const haptic = {
  trigger: (type: HapticType) => queueTrigger(type),
  selection: () => queueTrigger('selection'),
  light: () => queueTrigger('light'),
  medium: () => queueTrigger('medium'),
  heavy: () => queueTrigger('heavy'),
  success: () => queueTrigger('success'),
  warning: () => queueTrigger('warning'),
  error: () => queueTrigger('error'),
  setEnabled: (enabled: boolean) => {
    runtimeConfig.enabled = enabled;
  },
  configure: (config: Partial<Pick<HapticConfig, 'minimumGapMs' | 'duplicateGapMs'>>) => {
    runtimeConfig = { ...runtimeConfig, ...config };
  },
};

export function setHapticsEnabled(enabled: boolean) {
  haptic.setEnabled(enabled);
}
