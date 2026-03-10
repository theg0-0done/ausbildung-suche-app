/**
 * Shared platform detection utilities.
 * Used by both api.ts and userApi.ts to avoid duplicate Capacitor checks.
 */

/** Returns true if running inside a Capacitor native shell (Android/iOS). */
export function isNativePlatform(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as unknown as Record<string, unknown>).Capacitor &&
    ((
      window as unknown as Record<string, { isNativePlatform?: () => boolean }>
    ).Capacitor?.isNativePlatform?.() ??
      false)
  );
}
