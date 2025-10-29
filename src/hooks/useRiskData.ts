import { useQuery } from "@tanstack/react-query";
import { RiskService } from "@/services/riskService";

export function useRiskData() {
  const { data: risks, isLoading: risksLoading, refetch: refetchRisks } = useQuery({
    queryKey: ["risk-assessments"],
    queryFn: () => RiskService.getRiskAssessments(),
  });

  const { data: controls, isLoading: controlsLoading } = useQuery({
    queryKey: ["risk-controls"],
    queryFn: () => RiskService.getRiskControls(),
  });

  const { data: treatments, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["risk-treatments"],
    queryFn: () => RiskService.getRiskTreatments(),
  });

  const stats = RiskService.calculateRiskStats(risks || [], controls || [], treatments || []);

  return {
    risks,
    controls,
    treatments,
    stats,
    isLoading: risksLoading || controlsLoading || treatmentsLoading,
    refetchRisks,
  };
}
