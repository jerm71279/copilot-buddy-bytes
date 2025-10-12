/**
 * Comprehensive Input Validation and Sanitization Library
 * Protects against SQL Injection, XSS, Path Traversal, and other attacks
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

export interface ArrayValidationResult {
  isValid: boolean;
  sanitized: string[];
  errors: string[];
}

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string, maxLength: number = 1000): ValidationResult {
  const errors: string[] = [];
  let sanitized = input;

  // Check length
  if (input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    sanitized = input.substring(0, maxLength);
  }

  // Remove null bytes
  if (sanitized.includes('\0') || sanitized.includes('\x00')) {
    errors.push('Null bytes detected and removed');
    sanitized = sanitized.replace(/\0/g, '').replace(/\x00/g, '');
  }

  // Detect and block SQL injection patterns
  const sqlPatterns = [
    /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b).*\b(TABLE|FROM|INTO)\b/i,
    /UNION.*SELECT/i,
    /'.*--/,
    /'.*OR.*'.*'.*=/,
    /\bEXEC\b|\bEXECUTE\b/i
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        sanitized: '',
        errors: ['Potential SQL injection detected']
      };
    }
  }

  // Detect and escape XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick, onerror
    /<img[^>]*onerror[^>]*>/gi,
    /<svg[^>]*onload[^>]*>/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        sanitized: '',
        errors: ['XSS pattern detected']
      };
    }
  }

  // Detect path traversal attempts
  if (sanitized.includes('../') || sanitized.includes('..\\')) {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Path traversal detected']
    };
  }

  // Detect format string attacks
  if (/%[nsx]/i.test(sanitized)) {
    errors.push('Format string pattern detected');
    sanitized = sanitized.replace(/%[nsx]/gi, '');
  }

  // Detect template injection
  if (/\{\{.*\}\}|\$\{.*\}/.test(sanitized)) {
    errors.push('Template injection pattern detected');
    sanitized = sanitized.replace(/\{\{/g, '').replace(/\}\}/g, '').replace(/\$\{/g, '').replace(/\}/g, '');
  }

  return {
    isValid: errors.length === 0,
    sanitized: sanitized.trim(),
    errors
  };
}

/**
 * Validate and sanitize email addresses
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const sanitized = email.trim().toLowerCase();
  
  // Check for XSS patterns in email
  if (/<script|<iframe|javascript:|on\w+=/i.test(sanitized)) {
    return {
      isValid: false,
      sanitized: '',
      errors: ['XSS pattern detected in email']
    };
  }
  
  if (!emailRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Invalid email format']
    };
  }

  if (sanitized.length > 255) {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Email exceeds maximum length']
    };
  }

  return {
    isValid: true,
    sanitized,
    errors: []
  };
}

/**
 * Validate and sanitize URLs
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  let sanitized = url.trim();

  try {
    const urlObj = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        sanitized: '',
        errors: ['Only HTTP and HTTPS protocols are allowed']
      };
    }

    // Check for javascript: protocol in any form
    if (sanitized.toLowerCase().includes('javascript:')) {
      return {
        isValid: false,
        sanitized: '',
        errors: ['JavaScript protocol not allowed']
      };
    }

    return {
      isValid: true,
      sanitized: urlObj.toString(),
      errors: []
    };
  } catch {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Invalid URL format']
    };
  }
}

/**
 * Validate and sanitize array inputs
 */
export function sanitizeArray(input: string[], maxLength: number = 100, maxItemLength: number = 255): ArrayValidationResult {
  const errors: string[] = [];
  
  if (input.length > maxLength) {
    return {
      isValid: false,
      sanitized: [],
      errors: [`Array exceeds maximum length of ${maxLength} items`]
    };
  }

  const sanitized: string[] = [];
  
  for (const item of input) {
    const result = sanitizeString(item, maxItemLength);
    if (!result.isValid) {
      return {
        isValid: false,
        sanitized: [],
        errors: [`Invalid item in array: ${result.errors.join(', ')}`]
      };
    }
    if (result.sanitized.length > 0) {
      sanitized.push(result.sanitized);
    }
  }

  return {
    isValid: true,
    sanitized,
    errors: []
  };
}

/**
 * Validate numeric input
 */
export function validateNumber(input: any, min?: number, max?: number): { isValid: boolean; value: number | null; errors: string[] } {
  const errors: string[] = [];
  const num = Number(input);

  if (isNaN(num)) {
    return {
      isValid: false,
      value: null,
      errors: ['Input is not a valid number']
    };
  }

  if (!isFinite(num)) {
    return {
      isValid: false,
      value: null,
      errors: ['Number must be finite']
    };
  }

  if (min !== undefined && num < min) {
    errors.push(`Number must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    errors.push(`Number must not exceed ${max}`);
  }

  return {
    isValid: errors.length === 0,
    value: num,
    errors
  };
}

/**
 * Validate JSON input
 */
export function validateJson(input: string): { isValid: boolean; parsed: any; errors: string[] } {
  try {
    const parsed = JSON.parse(input);
    return {
      isValid: true,
      parsed,
      errors: []
    };
  } catch (error) {
    return {
      isValid: false,
      parsed: null,
      errors: ['Invalid JSON format']
    };
  }
}

/**
 * Validate file names
 */
export function validateFileName(fileName: string): ValidationResult {
  const errors: string[] = [];
  let sanitized = fileName.trim();

  // Block path traversal
  if (sanitized.includes('../') || sanitized.includes('..\\')) {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Path traversal not allowed in file names']
    };
  }

  // Block absolute paths
  if (sanitized.startsWith('/') || /^[a-zA-Z]:/.test(sanitized)) {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Absolute paths not allowed']
    };
  }

  // Remove special characters but keep basic ones
  const cleanFileName = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  if (cleanFileName !== sanitized) {
    errors.push('Special characters replaced with underscores');
    sanitized = cleanFileName;
  }

  if (sanitized.length > 255) {
    errors.push('File name truncated to 255 characters');
    sanitized = sanitized.substring(0, 255);
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Batch validate multiple fields
 */
export function validateFields(fields: Record<string, { value: string; type: 'string' | 'email' | 'url' | 'fileName'; maxLength?: number }>): {
  isValid: boolean;
  sanitized: Record<string, string>;
  errors: Record<string, string[]>;
} {
  const sanitized: Record<string, string> = {};
  const errors: Record<string, string[]> = {};
  let allValid = true;

  for (const [fieldName, config] of Object.entries(fields)) {
    let result: ValidationResult;

    switch (config.type) {
      case 'email':
        result = validateEmail(config.value);
        break;
      case 'url':
        result = validateUrl(config.value);
        break;
      case 'fileName':
        result = validateFileName(config.value);
        break;
      default:
        result = sanitizeString(config.value, config.maxLength);
    }

    sanitized[fieldName] = result.sanitized;
    
    if (!result.isValid || result.errors.length > 0) {
      errors[fieldName] = result.errors;
      if (!result.isValid) {
        allValid = false;
      }
    }
  }

  return {
    isValid: allValid,
    sanitized,
    errors
  };
}
