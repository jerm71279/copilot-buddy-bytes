import { Settings, Bell, Palette, Lock, Database, Download, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardSettingsMenuProps {
  dashboardName: string;
}

export const DashboardSettingsMenu = ({ dashboardName }: DashboardSettingsMenuProps) => {
  const handleExportData = () => {
    toast.success("Data export started for " + dashboardName);
  };

  const handleImportData = () => {
    toast.info("Import feature coming soon");
  };

  const handleNotificationSettings = () => {
    toast.info("Notification settings coming soon");
  };

  const handleThemeSettings = () => {
    toast.info("Theme customization coming soon");
  };

  const handlePrivacySettings = () => {
    toast.info("Privacy settings coming soon");
  };

  const handleDataSettings = () => {
    toast.info("Data management settings coming soon");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Dashboard Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background z-[60]">
        <DropdownMenuLabel>{dashboardName} Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleNotificationSettings}>
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleThemeSettings}>
          <Palette className="h-4 w-4 mr-2" />
          Appearance
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Database className="h-4 w-4 mr-2" />
            Data Management
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-background">
            <DropdownMenuItem onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportData}>
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDataSettings}>
              <Database className="h-4 w-4 mr-2" />
              Data Preferences
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handlePrivacySettings}>
          <Lock className="h-4 w-4 mr-2" />
          Privacy & Security
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
