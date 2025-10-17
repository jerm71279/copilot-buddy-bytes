/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize text input by removing control characters and limiting length
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(url, 2000);
  
  if (!sanitized) {
    return { valid: false, sanitized: '', error: 'URL cannot be empty' };
  }

  try {
    new URL(sanitized);
    return { valid: true, sanitized };
  } catch {
    return { valid: false, sanitized, error: 'Invalid URL format' };
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(email, 255).toLowerCase();
  
  if (!sanitized) {
    return { valid: true, sanitized: '' }; // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid email format' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate vendor name
 */
export function validateVendorName(name: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(name, 200);
  
  if (!sanitized) {
    return { valid: false, sanitized: '', error: 'Vendor name is required' };
  }

  if (sanitized.length < 2) {
    return { valid: false, sanitized, error: 'Vendor name must be at least 2 characters' };
  }

  return { valid: true, sanitized };
}
