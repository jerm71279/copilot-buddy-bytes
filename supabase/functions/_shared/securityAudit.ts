/**
 * Security Audit Logging Module
 * Tracks security events for monitoring and incident response
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export type SecurityEventType = 
  | 'prompt_injection_detected'
  | 'prompt_injection_blocked'
  | 'suspicious_unicode_detected'
  | 'tool_call_validation_failed'
  | 'rate_limit_exceeded'
  | 'data_exfiltration_attempt'
  | 'indirect_injection_detected';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  customerId?: string;
  edgeFunction: string;
  threatDetails: {
    injectionType?: string;
    confidence?: number;
    inputSample?: string;
    blockedContent?: string;
    toolName?: string;
    [key: string]: any;
  };
  actionTaken: string;
  timestamp: Date;
}

/**
 * Log a security event to the database
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  event: SecurityEvent
): Promise<void> {
  try {
    const { error } = await supabase
      .from('security_audit_logs')
      .insert({
        event_type: event.eventType,
        severity: event.severity,
        user_id: event.userId,
        customer_id: event.customerId,
        edge_function: event.edgeFunction,
        threat_details: event.threatDetails,
        action_taken: event.actionTaken,
        created_at: event.timestamp.toISOString(),
      });

    if (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failure shouldn't break the app
    }
  } catch (err) {
    console.error('Error in logSecurityEvent:', err);
  }
}

/**
 * Create security audit log entry for prompt injection
 */
export function createPromptInjectionLog(
  edgeFunction: string,
  userId: string | undefined,
  customerId: string | undefined,
  threat: string,
  confidence: number,
  inputSample: string,
  wasBlocked: boolean
): SecurityEvent {
  return {
    eventType: wasBlocked ? 'prompt_injection_blocked' : 'prompt_injection_detected',
    severity: confidence > 0.9 ? 'critical' : confidence > 0.7 ? 'high' : 'medium',
    userId,
    customerId,
    edgeFunction,
    threatDetails: {
      injectionType: threat,
      confidence,
      inputSample: inputSample.substring(0, 500), // Truncate for storage
    },
    actionTaken: wasBlocked ? 'Request blocked' : 'Request logged for review',
    timestamp: new Date(),
  };
}

/**
 * Create security audit log entry for tool call validation failure
 */
export function createToolCallValidationLog(
  edgeFunction: string,
  userId: string,
  customerId: string,
  toolName: string,
  validationError: string,
  parameters: Record<string, any>
): SecurityEvent {
  return {
    eventType: 'tool_call_validation_failed',
    severity: 'high',
    userId,
    customerId,
    edgeFunction,
    threatDetails: {
      toolName,
      validationError,
      parameterKeys: Object.keys(parameters),
    },
    actionTaken: 'Tool call blocked',
    timestamp: new Date(),
  };
}

/**
 * Create security audit log entry for rate limit exceeded
 */
export function createRateLimitLog(
  edgeFunction: string,
  userId: string,
  customerId: string | undefined,
  attemptCount: number
): SecurityEvent {
  return {
    eventType: 'rate_limit_exceeded',
    severity: attemptCount > 10 ? 'critical' : 'high',
    userId,
    customerId,
    edgeFunction,
    threatDetails: {
      attemptCount,
      timeWindow: '1 hour',
    },
    actionTaken: 'User rate limited',
    timestamp: new Date(),
  };
}

/**
 * Get recent security events for monitoring
 */
export async function getRecentSecurityEvents(
  supabase: SupabaseClient,
  customerId?: string,
  severity?: SecuritySeverity,
  limit: number = 100
): Promise<any[]> {
  let query = supabase
    .from('security_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch security events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get security event statistics
 */
export async function getSecurityStatistics(
  supabase: SupabaseClient,
  customerId?: string,
  timeWindowHours: number = 24
): Promise<{
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  blockedAttempts: number;
  topThreats: Array<{ threat: string; count: number }>;
}> {
  const sinceTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('security_audit_logs')
    .select('*')
    .gte('created_at', sinceTime);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      totalEvents: 0,
      criticalEvents: 0,
      highEvents: 0,
      blockedAttempts: 0,
      topThreats: [],
    };
  }

  const criticalEvents = data.filter(e => e.severity === 'critical').length;
  const highEvents = data.filter(e => e.severity === 'high').length;
  const blockedAttempts = data.filter(e => 
    e.event_type === 'prompt_injection_blocked' || 
    e.event_type === 'tool_call_validation_failed'
  ).length;

  // Count threat types
  const threatCounts: Record<string, number> = {};
  for (const event of data) {
    const threat = event.threat_details?.injectionType || event.event_type;
    threatCounts[threat] = (threatCounts[threat] || 0) + 1;
  }

  const topThreats = Object.entries(threatCounts)
    .map(([threat, count]) => ({ threat, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalEvents: data.length,
    criticalEvents,
    highEvents,
    blockedAttempts,
    topThreats,
  };
}
