import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRiskData() {
  const { data: risks, isLoading: risksLoading, refetch: refetchRisks } = useQuery({
    queryKey: ["risk-assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select("*")
        .order("inherent_score", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: controls, isLoading: controlsLoading } = useQuery({
    queryKey: ["risk-controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_controls")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: treatments, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["risk-treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_treatments")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    totalRisks: risks?.length || 0,
    criticalRisks: risks?.filter(r => r.inherent_score >= 15).length || 0,
    highRisks: risks?.filter(r => r.inherent_score >= 10 && r.inherent_score < 15).length || 0,
    mediumRisks: risks?.filter(r => r.inherent_score >= 6 && r.inherent_score < 10).length || 0,
    lowRisks: risks?.filter(r => r.inherent_score < 6).length || 0,
    treatedRisks: risks?.filter(r => r.status === 'treated' || r.status === 'monitored').length || 0,
    activeControls: controls?.filter(c => c.implementation_status === 'implemented' || c.implementation_status === 'verified').length || 0,
    pendingTreatments: treatments?.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0,
  };

  return {
    risks,
    controls,
    treatments,
    stats,
    isLoading: risksLoading || controlsLoading || treatmentsLoading,
    refetchRisks,
  };
}
