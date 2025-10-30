import { useEdgeFunction } from './useEdgeFunctions';

interface ETLOrchestrationRequest {
  action: string;
  config?: Record<string, unknown>;
}

interface ChangeImpactAnalyzerRequest {
  changeDescription: string;
  affectedSystems?: string[];
}

interface NinjaOneTicketRequest {
  action: string;
  ticketData?: Record<string, unknown>;
}

interface TemplateMaintenanceRequest {
  operation: string;
  templateId?: string;
}

interface DataCatalogRequest {
  action: string;
  catalogData?: Record<string, unknown>;
}

/**
 * Hook for operations and workflow edge function invocations
 */
export function useOperationsFunctions() {
  const etlOrchestration = useEdgeFunction<ETLOrchestrationRequest, any>('etl-orchestration', {
    showSuccessToast: true,
    successMessage: 'ETL pipeline executed',
    showErrorToast: true,
    errorMessage: 'Failed to execute ETL pipeline',
  });

  const changeImpactAnalyzer = useEdgeFunction<ChangeImpactAnalyzerRequest, any>('change-impact-analyzer', {
    showSuccessToast: true,
    successMessage: 'Impact analysis complete',
    showErrorToast: true,
    errorMessage: 'Failed to analyze change impact',
  });

  const ninjaOneTicket = useEdgeFunction<NinjaOneTicketRequest, any>('ninjaone-ticket', {
    showSuccessToast: true,
    successMessage: 'NinjaOne ticket processed',
    showErrorToast: true,
    errorMessage: 'Failed to process NinjaOne ticket',
  });

  const templateMaintenance = useEdgeFunction<TemplateMaintenanceRequest, any>('template-maintenance', {
    showSuccessToast: true,
    successMessage: 'Template maintenance complete',
    showErrorToast: true,
    errorMessage: 'Failed to perform template maintenance',
  });

  const dataCatalog = useEdgeFunction<DataCatalogRequest, any>('data-catalog', {
    showErrorToast: true,
    errorMessage: 'Failed to access data catalog',
  });

  return {
    etlOrchestration,
    changeImpactAnalyzer,
    ninjaOneTicket,
    templateMaintenance,
    dataCatalog,
  };
}
