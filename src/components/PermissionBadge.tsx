import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Shield, Ban } from "lucide-react";
import { PermissionLevel } from "@/hooks/usePermissions";

interface PermissionBadgeProps {
  level: PermissionLevel;
  showIcon?: boolean;
  showLabel?: boolean;
}

const permissionConfig = {
  none: {
    label: "No Access",
    icon: Ban,
    variant: "outline" as const,
    className: "text-muted-foreground",
  },
  view: {
    label: "View Only",
    icon: Eye,
    variant: "secondary" as const,
    className: "text-secondary",
  },
  edit: {
    label: "Read/Write",
    icon: Edit,
    variant: "default" as const,
    className: "text-primary",
  },
  admin: {
    label: "Full Access",
    icon: Shield,
    variant: "default" as const,
    className: "text-primary",
  },
};

export function PermissionBadge({
  level,
  showIcon = true,
  showLabel = true,
}: PermissionBadgeProps) {
  const config = permissionConfig[level];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {showLabel && config.label}
    </Badge>
  );
}

export function PermissionLevelIndicator({ level }: { level: PermissionLevel }) {
  const config = permissionConfig[level];

  return (
    <div className="flex items-center gap-2 text-sm">
      <PermissionBadge level={level} />
      <span className="text-muted-foreground">
        {level === "none" && "Denied - Not visible"}
        {level === "view" && "Read-only - No modifications"}
        {level === "edit" && "Can view and modify"}
        {level === "admin" && "Full control including execute actions"}
      </span>
    </div>
  );
}
