import { useToast } from "@/hooks/use-toast";
import { AuditService, type AuditLogEntry } from "@/services/auditService";

export type { AuditLogEntry };

export const useAuditLog = () => {
  const { toast } = useToast();

  const logAction = async (entry: AuditLogEntry) => {
    await AuditService.logAction(entry);
  };

  const logPrivilegedAccess = async (
    system: string,
    action: string,
    details: Record<string, any>
  ) => {
    await AuditService.logPrivilegedAccess(system, action, details);
  };

  return { logAction, logPrivilegedAccess };
};
