import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

interface DashboardNavigationProps {
  title?: string;
  showTitle?: boolean;
  dashboardPath?: string; // Allow custom dashboard path
}

const DashboardNavigation = ({ title, showTitle = false, dashboardPath = '/portal' }: DashboardNavigationProps) => {
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
    <div className="flex items-center gap-3 mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDashboards}
        className="gap-2"
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboards
      </Button>
      {showTitle && title && (
        <h1 className="text-2xl font-bold ml-4">{title}</h1>
      )}
    </div>
  );
};

export default DashboardNavigation;
