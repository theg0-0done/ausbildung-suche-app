/**
 * Shared validation utilities.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns true if the given string looks like a valid email address. */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
