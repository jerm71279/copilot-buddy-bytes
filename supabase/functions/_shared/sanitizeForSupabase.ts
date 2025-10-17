// deno-lint-ignore-file no-explicit-any
type SanitizeOptions = {
  // Policy for U+0000: "remove" (default) or "replace" with a substitute.
  nulPolicy?: 'remove' | 'replace';
  nulReplacement?: string; // default ' '
  // Optional: remove other C0 control chars (U+0001..U+001F)
  stripOtherControls?: boolean;
  // UUID fields to validate strictly (canonical 36-char with hyphens)
  uuidFields?: string[];  // e.g., ['customer_id','vendor_id','created_by']
  // Enforce allowed values for known enums
  enums?: Record<string, readonly string[]>; // e.g., { source_type: ['internal','external','vendor_documentation'] }
};

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function sanitizeForSupabase<T extends Record<string, any>>(
  payload: T,
  opts: SanitizeOptions = {}
): T {
  const {
    nulPolicy = 'remove',
    nulReplacement = ' ',
    stripOtherControls = false,
    uuidFields = [],
    enums = {},
  } = opts;

  const seen = new WeakSet();

  const cleanse = (v: any, path: string): any => {
    if (v == null) return v;
    if (typeof v === 'string') {
      // scrub NUL and optionally other C0 controls
      let s = v.replace(/\u0000/g, nulPolicy === 'remove' ? '' : nulReplacement);
      if (stripOtherControls) s = s.replace(/[\u0001-\u001F]/g, ' ');
      return s;
    }
    if (Array.isArray(v)) return v.map((x, i) => cleanse(x, `${path}[${i}]`));
    if (typeof v === 'object') {
      if (seen.has(v)) return v;
      seen.add(v);
      const out: Record<string, any> = {};
      for (const [k, val] of Object.entries(v)) {
        out[k] = cleanse(val, `${path}.${k}`);
      }
      return out;
    }
    return v;
  };

  const cleaned = cleanse(payload, '$') as T;

  // UUID normalization & enum enforcement at top-level fields
  for (const f of uuidFields) {
    const v = cleaned[f];
    if (v == null || v === '') continue; // allow nullables
    if (typeof v !== 'string' || !UUID_RE.test(v)) {
      throw new Error(`Field ${f} must be a canonical 36-char UUID string`);
    }
  }
  for (const [field, allowed] of Object.entries(enums)) {
    const v = (cleaned as any)[field];
    if (v == null) continue;
    if (!allowed.includes(v)) {
      throw new Error(
        `Field ${field}="${v}" is not allowed. Allowed: ${allowed.join(', ')}`
      );
    }
  }

  // Final sanity: ensure JSON payload itself doesn't still contain \u0000 escapes
  const wire = JSON.stringify(cleaned);
  if (wire.includes('\\u0000')) {
    throw new Error('Sanitization failed: payload still contains \\u0000');
  }

  return cleaned;
}
