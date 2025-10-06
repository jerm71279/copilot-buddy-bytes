import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Dashboard {
  name: string;
  path: string;
}

interface DashboardNavigationProps {
  title?: string;
  showTitle?: boolean;
  dashboardPath?: string; // Allow custom dashboard path
  dashboards?: Dashboard[]; // Optional list of dashboards for dropdown
}

const DashboardNavigation = ({ title, showTitle = false, dashboardPath = '/portal', dashboards }: DashboardNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(-1);
  };

  const handleDashboards = () => {
    // Special handling for portal with scroll
    if (dashboardPath === '/portal' && location.pathname === '/portal') {
      const dashboardsSection = document.getElementById('dashboards-section');
      dashboardsSection?.scrollIntoView({ behavior: 'smooth' });
    } else if (dashboardPath === '/portal') {
      navigate('/portal', { state: { scrollToDashboards: true } });
    } else {
      // Navigate to specified dashboard path
      navigate(dashboardPath);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {!dashboards && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDashboards}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboards
          </Button>
        )}
        {showTitle && title && (
          <h1 className="text-2xl font-bold ml-4">{title}</h1>
        )}
      </div>
      
      {dashboards && dashboards.length > 0 && (
        <div className="bg-card border-b border-border -mx-4 px-4">
          <div className="flex gap-3 py-3 overflow-x-auto">
            {dashboards.map((dashboard) => (
              <Button
                key={dashboard.path}
                variant={location.pathname === dashboard.path ? "default" : "outline"}
                size="sm"
                onClick={() => navigate(dashboard.path)}
                className="whitespace-nowrap shrink-0"
              >
                {dashboard.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardNavigation;
