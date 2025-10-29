import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "./useAuth";
import { ComplianceService } from "@/services/complianceService";

export interface Framework {
  id: string;
  framework_name: string;
  framework_code: string;
  description: string | null;
  industry: string;
}

export interface EvidenceFile {
  id: string;
  file_name: string;
  framework_id: string | null;
  control_id: string | null;
  uploaded_at: string;
}

export interface ComplianceReport {
  id: string;
  report_name: string;
  framework: string;
  status: string;
  generated_at: string;
  evidence_count: number;
}

export interface ComplianceStats {
  frameworks: number;
  evidenceFiles: number;
  reports: number;
  complianceScore: number;
}

export function useComplianceData() {
  const { checkSessionAndLoad } = useRequireAuth();
  const { toast } = useToast();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ComplianceStats>({
    frameworks: 0,
    evidenceFiles: 0,
    reports: 0,
    complianceScore: 0
  });

  const loadComplianceData = async () => {
    try {
      const [frameworksData, evidenceData, reportsData] = await Promise.all([
        ComplianceService.getActiveFrameworks(),
        ComplianceService.getAllEvidenceFiles(),
        ComplianceService.getRecentReports(10)
      ]);

      setFrameworks(frameworksData);
      setEvidenceFiles(evidenceData);
      setReports(reportsData);

      setStats({
        frameworks: frameworksData.length,
        evidenceFiles: evidenceData.length,
        reports: reportsData.length,
        complianceScore: 85 // Calculate based on controls/evidence
      });
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSessionAndLoad(loadComplianceData);
  }, []);

  return {
    frameworks,
    evidenceFiles,
    reports,
    isLoading,
    stats,
    loadComplianceData
  };
}
