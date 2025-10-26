/**
 * PageHeader Component
 * Reusable page header for consistent layout across the platform
 * Eliminates duplicate header patterns
 */

import { Button } from "@/components/ui/button";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: {
    label?: string;
    onClick: () => void;
  };
  actions?: React.ReactNode;
  dashboardMenu?: {
    dashboardName: string;
  };
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  backButton,
  actions,
  dashboardMenu,
  className = "",
}: PageHeaderProps) => {
  return (
    <div className={`mb-6 flex justify-between items-center ${className}`}>
      <div className="flex-1">
        {backButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={backButton.onClick}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backButton.label || "Back"}
          </Button>
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {dashboardMenu && (
          <DashboardSettingsMenu dashboardName={dashboardMenu.dashboardName} />
        )}
      </div>
    </div>
  );
};
