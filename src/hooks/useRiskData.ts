import { useQuery } from "@tanstack/react-query";
import { RiskService } from "@/services/riskService";

export function useRiskData() {
  const { data: risksResponse, isLoading: risksLoading, refetch: refetchRisks } = useQuery({
    queryKey: ["risk-assessments"],
    queryFn: () => RiskService.getRiskAssessments(),
  });

  const { data: controlsResponse, isLoading: controlsLoading } = useQuery({
    queryKey: ["risk-controls"],
    queryFn: () => RiskService.getRiskControls(),
  });

  const { data: treatmentsResponse, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["risk-treatments"],
    queryFn: () => RiskService.getRiskTreatments(),
  });

  const risks = risksResponse?.data || [];
  const controls = controlsResponse?.data || [];
  const treatments = treatmentsResponse?.data || [];

  const stats = RiskService.calculateRiskStats(risks, controls, treatments);

  return {
    risks,
    controls,
    treatments,
    stats,
    isLoading: risksLoading || controlsLoading || treatmentsLoading,
    refetchRisks,
  };
}
