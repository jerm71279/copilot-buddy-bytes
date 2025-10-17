import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActionPermissions } from "@/hooks/useResourcePermissions";

interface ActionButtonProps extends ButtonProps {
  resource: string;
  action: "create" | "update" | "delete" | "manage" | "export" | "import" | "archive" | "restore";
  children: React.ReactNode;
  deniedMessage?: string;
}

/**
 * Button that automatically checks permissions and disables if user lacks access
 */
export function ActionButton({
  resource,
  action,
  children,
  deniedMessage,
  disabled,
  ...props
}: ActionButtonProps) {
  const permissions = useActionPermissions(resource);

  const actionPermissionMap = {
    create: permissions.canCreate,
    update: permissions.canUpdate,
    delete: permissions.canDelete,
    manage: permissions.canManage,
    export: permissions.canExport,
    import: permissions.canImport,
    archive: permissions.canArchive,
    restore: permissions.canRestore,
  };

  const hasPermission = actionPermissionMap[action];
  const isDisabled = disabled || !hasPermission || permissions.isLoading;

  const defaultMessages = {
    create: "You don't have permission to create items",
    update: "You don't have permission to edit this item",
    delete: "You don't have permission to delete this item",
    manage: "You don't have permission to manage this resource",
    export: "You don't have permission to export data",
    import: "You don't have permission to import data",
    archive: "You don't have permission to archive items",
    restore: "You don't have permission to restore items",
  };

  const message = deniedMessage || defaultMessages[action];

  if (permissions.isLoading) {
    return (
      <Button disabled {...props}>
        {children}
      </Button>
    );
  }

  if (!hasPermission) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button disabled {...props}>
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Required permission: {permissions.permissionLevel === "view" ? "Edit or Admin" : "Admin"}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button disabled={isDisabled} {...props}>
      {children}
    </Button>
  );
}
