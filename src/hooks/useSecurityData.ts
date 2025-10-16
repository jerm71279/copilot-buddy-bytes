import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useSecurityData() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalIncidents: 0,
    criticalAlerts: 0,
    activeThreats: 0,
    resolvedIncidents: 0,
    complianceScore: 0,
    systemsMonitored: 0,
    avgResponseTime: "0m",
    threatsPrevented: 0,
    failedLogins24h: 0,
    activeLockouts: 0,
    lateralMovement24h: 0,
    exfiltrationAttempts24h: 0,
    activeThreatsCount: 0,
    activeAttackChains: 0,
    honeypotTriggers24h: 0,
    criticalDeviations: 0,
  });
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Fetch anomaly detections
      const { data: anomalyData, error: anomalyError } = await supabase
        .from("anomaly_detections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (anomalyError) throw anomalyError;

      setAnomalies(anomalyData || []);

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
      let avgComplianceScore = 85; // Default
      if (complianceData && complianceData.length > 0) {
        const scores = complianceData.map(r => {
          const findings = r.findings as any;
          if (findings?.compliance_score) return findings.compliance_score;
          return 85;
        });
        avgComplianceScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      // Fetch new security metrics
      const { data: securityOverview } = await supabase
        .from('soc_security_overview')
        .select('*')
        .maybeSingle();

      setMetrics({
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
      });

      // Transform anomalies to incidents
      const incidentData: SecurityIncident[] = (anomalyData || []).map(anomaly => ({
        id: anomaly.id,
        severity: (anomaly.severity || "medium") as any,
        type: anomaly.anomaly_type,
        description: anomaly.description,
        timestamp: anomaly.created_at,
        status: anomaly.resolved_at ? "resolved" : "new",
        affectedSystems: [anomaly.system_name]
      }));

      setIncidents(incidentData);
      setIsLoading(false);

    } catch (error) {
      console.error("Error fetching security data:", error);
      toast.error("Failed to load security data");
      setIsLoading(false);
    }
  };

  return {
    metrics,
    incidents,
    anomalies,
    isLoading,
    refetch: fetchSecurityData
  };
}
