/**
 * Rate Limiting Middleware for Public Edge Functions
 * 
 * SECURITY: Prevents abuse of public endpoints by limiting requests per IP/user
 * 
 * Usage:
 * ```typescript
 * import { checkRateLimit } from "../_shared/rateLimiter.ts";
 * 
 * const rateLimitResult = await checkRateLimit(supabase, {
 *   identifier: ipAddress || userId,
 *   endpoint: 'function-name',
 *   maxRequests: 100,
 *   windowMinutes: 60
 * });
 * 
 * if (!rateLimitResult.allowed) {
 *   return new Response(
 *     JSON.stringify({ 
 *       error: 'Rate limit exceeded',
 *       retryAfter: rateLimitResult.retryAfter 
 *     }),
 *     { status: 429, headers: corsHeaders }
 *   );
 * }
 * ```
 */

export interface RateLimitOptions {
  identifier: string; // IP address or user ID
  endpoint: string;
  maxRequests: number;
  windowMinutes: number;
  customerId?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until limit resets
  requestCount: number;
}

export async function checkRateLimit(
  supabase: any,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { identifier, endpoint, maxRequests, windowMinutes, customerId } = options;
  
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  try {
    // Check current request count in the time window
    const { data: existing, error: selectError } = await supabase
      .from('api_rate_limits')
      .select('request_count, window_start, window_end')
      .eq('endpoint', endpoint)
      .eq('ip_address', identifier)
      .gte('window_end', new Date().toISOString())
      .maybeSingle();

    if (selectError) {
      console.error('[RateLimit] Error checking rate limit:', selectError);
      // Fail open - allow request but log error
      return { allowed: true, remaining: maxRequests, requestCount: 0 };
    }

    // If no active window, create new one
    if (!existing) {
      const { error: insertError } = await supabase
        .from('api_rate_limits')
        .insert({
          ip_address: identifier,
          endpoint,
          customer_id: customerId || '00000000-0000-0000-0000-000000000000',
          request_count: 1,
          window_start: new Date(),
          window_end: new Date(Date.now() + windowMinutes * 60 * 1000),
          was_throttled: false
        });

      if (insertError) {
        console.error('[RateLimit] Error creating rate limit record:', insertError);
      }

      return {
        allowed: true,
        remaining: maxRequests - 1,
        requestCount: 1
      };
    }

    // Check if limit exceeded
    if (existing.request_count >= maxRequests) {
      const retryAfter = Math.ceil(
        (new Date(existing.window_end).getTime() - Date.now()) / 1000
      );

      // Mark as throttled
      await supabase
        .from('api_rate_limits')
        .update({ was_throttled: true })
        .eq('endpoint', endpoint)
        .eq('ip_address', identifier)
        .eq('window_start', existing.window_start);

      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        requestCount: existing.request_count
      };
    }

    // Increment counter
    const { error: updateError } = await supabase
      .from('api_rate_limits')
      .update({ 
        request_count: existing.request_count + 1,
        updated_at: new Date()
      })
      .eq('endpoint', endpoint)
      .eq('ip_address', identifier)
      .eq('window_start', existing.window_start);

    if (updateError) {
      console.error('[RateLimit] Error updating rate limit:', updateError);
    }

    return {
      allowed: true,
      remaining: maxRequests - (existing.request_count + 1),
      requestCount: existing.request_count + 1
    };

  } catch (error) {
    console.error('[RateLimit] Unexpected error:', error);
    // Fail open - allow request but log error
    return { allowed: true, remaining: maxRequests, requestCount: 0 };
  }
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(req: Request): string {
  // Check various headers for real IP (in order of preference)
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip'
  ];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }

  return 'unknown';
}
