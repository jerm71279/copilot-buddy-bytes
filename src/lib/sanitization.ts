/**
 * Centralized sanitization utilities
 * Prevents duplicate sanitization logic across the codebase
 */

/**
 * Remove all control characters (including null bytes) from a string
 */
export function removeControlCharacters(input: string): string {
  return input.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Sanitize a user's full name for safe database storage
 * - Removes control characters
 * - Trims whitespace
 * - Limits length to 200 characters
 * - Returns "User" as fallback if empty
 */
export function sanitizeFullName(input: string): string {
  const cleaned = removeControlCharacters(input).trim();
  if (!cleaned) return "User";
  return cleaned.substring(0, 200);
}

/**
 * Sanitize an email username (part before @)
 * - Removes control characters
 * - Removes all whitespace
 * - Converts to lowercase
 */
export function sanitizeEmailUsername(input: string): string {
  return removeControlCharacters(input)
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * Check if a string contains control characters
 */
export function hasControlCharacters(input: string): boolean {
  return /[\x00-\x1F\x7F]/.test(input);
}

/**
 * Sanitize text input with length limit
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  const cleaned = removeControlCharacters(input).trim();
  return cleaned.substring(0, maxLength);
}
