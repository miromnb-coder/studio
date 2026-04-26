export function triggerLightHaptic() {
  if (typeof window === 'undefined') return;
  const navigatorWithVibrate = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  try {
    navigatorWithVibrate.vibrate?.(8);
  } catch {
    // Haptics are optional and should never block UI.
  }
}
