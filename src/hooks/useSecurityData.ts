import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SecurityService } from "@/services/securityService";

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
      const result = await SecurityService.getSecurityData();
      setMetrics(result.metrics);
      setIncidents(result.incidents);
      setAnomalies(result.anomalies);
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
