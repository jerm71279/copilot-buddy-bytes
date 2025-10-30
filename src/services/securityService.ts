/**
 * Security Service
 * Centralized security operations
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export interface SecurityMetrics {
  totalIncidents: number;
  criticalAlerts: number;
  activeThreats: number;
  resolvedIncidents: number;
  complianceScore: number;
  systemsMonitored: number;
  avgResponseTime: string;
  threatsPrevented: number;
  failedLogins24h: number;
  activeLockouts: number;
  lateralMovement24h: number;
  exfiltrationAttempts24h: number;
  activeThreatsCount: number;
  activeAttackChains: number;
  honeypotTriggers24h: number;
  criticalDeviations: number;
}

export interface SecurityIncident {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  description: string;
  timestamp: string;
  status: "new" | "investigating" | "resolved";
  affectedSystems: string[];
}

export class SecurityService extends BaseService {
  /**
   * Fetch security data
   */
  static async getSecurityData(): Promise<ServiceResponse<{
    metrics: SecurityMetrics;
    incidents: SecurityIncident[];
    anomalies: any[];
  }>> {
    return this.executeQuery(async () => {
      // Fetch anomaly detections
      const { data: anomalyData, error: anomalyError } = await supabase
        .from("anomaly_detections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (anomalyError) return { data: null, error: anomalyError };

      // Fetch compliance reports
      const { data: complianceData } = await supabase
        .from("compliance_reports")
        .select("*");

      // Fetch integrations count
      const { data: integrationsData } = await supabase
        .from("integrations")
        .select("*");

      // Calculate metrics
      const criticalAnomalies = anomalyData?.filter(a => a.severity === "critical").length || 0;
      const unresolvedAnomalies = anomalyData?.filter(a => !a.resolved_at).length || 0;
      const resolvedAnomalies = anomalyData?.filter(a => a.resolved_at).length || 0;
      
      // Calculate average compliance score
      let avgComplianceScore = 85;
      if (complianceData && complianceData.length > 0) {
        const scores = complianceData.map(r => {
          const findings = r.findings as any;
          if (findings?.compliance_score) return findings.compliance_score;
          return 85;
        });
        avgComplianceScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      // Fetch security overview
      const { data: securityOverview } = await supabase
        .from('soc_security_overview')
        .select('*')
        .maybeSingle();

      const metrics: SecurityMetrics = {
        totalIncidents: anomalyData?.length || 0,
        criticalAlerts: criticalAnomalies,
        activeThreats: unresolvedAnomalies,
        resolvedIncidents: resolvedAnomalies,
        complianceScore: Math.round(avgComplianceScore),
        systemsMonitored: integrationsData?.length || 0,
        avgResponseTime: "12m",
        threatsPrevented: resolvedAnomalies * 3,
        failedLogins24h: securityOverview?.failed_logins_24h || 0,
        activeLockouts: securityOverview?.active_lockouts || 0,
        lateralMovement24h: securityOverview?.lateral_movement_24h || 0,
        exfiltrationAttempts24h: securityOverview?.exfiltration_attempts_24h || 0,
        activeThreatsCount: securityOverview?.active_threats || 0,
        activeAttackChains: securityOverview?.active_attack_chains || 0,
        honeypotTriggers24h: securityOverview?.honeypot_triggers_24h || 0,
        criticalDeviations: securityOverview?.critical_deviations || 0,
      };

      // Transform anomalies to incidents
      const incidents: SecurityIncident[] = (anomalyData || []).map(anomaly => ({
        id: anomaly.id,
        severity: (anomaly.severity || "medium") as any,
        type: anomaly.anomaly_type,
        description: anomaly.description,
        timestamp: anomaly.created_at,
        status: anomaly.resolved_at ? "resolved" : "new",
        affectedSystems: [anomaly.system_name]
      }));

      return {
        data: {
          metrics,
          incidents,
          anomalies: anomalyData || []
        },
        error: null
      };
    });
  }
}
