import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "./useAuth";

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
      const [frameworksRes, evidenceRes, reportsRes] = await Promise.all([
        supabase.from('compliance_frameworks').select('*').eq('is_active', true),
        supabase.from('evidence_files').select('*'),
        supabase.from('compliance_reports').select('*').order('generated_at', { ascending: false }).limit(10)
      ]);

      if (frameworksRes.error) throw frameworksRes.error;
      if (evidenceRes.error) throw evidenceRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setFrameworks(frameworksRes.data || []);
      setEvidenceFiles(evidenceRes.data || []);
      setReports(reportsRes.data || []);

      setStats({
        frameworks: frameworksRes.data?.length || 0,
        evidenceFiles: evidenceRes.data?.length || 0,
        reports: reportsRes.data?.length || 0,
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
