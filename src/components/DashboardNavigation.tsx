import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface DashboardNavigationProps {
  title?: string;
  showTitle?: boolean;
}

const DashboardNavigation = ({ title, showTitle = false }: DashboardNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine home path based on current location
  const getHomePath = () => {
    if (location.pathname.startsWith('/admin')) {
      return '/admin';
    } else if (location.pathname.startsWith('/analytics')) {
      return '/analytics';
    } else if (location.pathname.startsWith('/dashboard')) {
      return '/portal';
    }
    return '/portal';
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate(getHomePath());
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
        onClick={handleHome}
        className="gap-2"
      >
        <Home className="h-4 w-4" />
        Home
      </Button>
      {showTitle && title && (
        <h1 className="text-2xl font-bold ml-4">{title}</h1>
      )}
    </div>
  );
};

export default DashboardNavigation;
