import { useEdgeFunction, EdgeFunctionOptions } from './useEdgeFunctions';

// Time Tracking Types
export interface Project {
  id: string;
  project_name: string;
  status: string;
}

export interface TimeEntry {
  id?: string;
  user_id?: string;
  project_id: string;
  description: string;
  hours: number;
  activity_type: string;
  is_billable: boolean;
  billing_rate?: number;
  entry_date: string;
  status?: string;
}

export interface TimeStats {
  totalHours: number;
  billableHours: number;
  revenue: number;
  entries: number;
}

export interface GetTimeEntriesRequest {
  startDate?: string;
  endDate?: string;
}

export interface GetTimeStatsRequest {
  startDate: string;
  endDate?: string;
}

/**
 * Hook for time tracking operations
 * Centralizes all time tracking edge function calls
 */
export function useTimeTracking() {
  const getProjects = useEdgeFunction<void, Project[]>(
    'get-projects',
    { showErrorToast: true, errorMessage: 'Failed to load projects' }
  );

  const getTodayEntries = useEdgeFunction<GetTimeEntriesRequest, TimeEntry[]>(
    'get-time-entries',
    { showErrorToast: true, errorMessage: 'Failed to load time entries' }
  );

  const getWeeklyStats = useEdgeFunction<GetTimeStatsRequest, TimeStats>(
    'get-time-stats',
    { showErrorToast: true, errorMessage: 'Failed to load statistics' }
  );

  const submitTimeEntry = useEdgeFunction<TimeEntry, TimeEntry>(
    'submit-time-entry',
    { 
      showSuccessToast: true, 
      successMessage: 'Time entry saved successfully',
      showErrorToast: true,
      errorMessage: 'Failed to save time entry'
    }
  );

  return {
    getProjects,
    getTodayEntries,
    getWeeklyStats,
    submitTimeEntry,
  };
}
