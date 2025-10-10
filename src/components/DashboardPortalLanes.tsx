import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Globe, ArrowLeft } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const dashboards = [
  { name: "Admin", path: "/admin" },
  { name: "CMDB", path: "/cmdb" },
  { name: "CIPP", path: "/cipp" },
  { name: "Compliance", path: "/dashboard/compliance" },
  { name: "Executive", path: "/dashboard/executive" },
  { name: "Finance", path: "/dashboard/finance" },
  { name: "HR", path: "/dashboard/hr" },
  { name: "IT", path: "/dashboard/it" },
  { name: "MCP Server", path: "/mcp-servers" },
  { name: "Onboarding", path: "/onboarding" },
  { name: "Operations", path: "/dashboard/operations" },
  { name: "Sales", path: "/dashboard/sales" },
  { name: "SOC", path: "/dashboard/soc" },
];

const portals = [
  { name: "Employee Portal", path: "/portal" },
  { name: "Analytics Portal", path: "/analytics" },
  { name: "Client Portal", path: "/client-portal" },
  { name: "Compliance Portal", path: "/compliance" },
  { name: "Data Flow Portal", path: "/data-flows" },
  { name: "RBAC Portal", path: "/rbac" },
  { name: "Sales Portal", path: "/sales-portal" },
];

export const DashboardPortalLanes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const lanesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const updateOffset = () => {
      if (lanesRef.current) {
        const height = lanesRef.current.offsetHeight;
        document.documentElement.style.setProperty('--lanes-height', `${height}px`);
      }
    };

    // Initial measure after mount
    const id = window.requestAnimationFrame(updateOffset);

    // Recalculate on resize
    window.addEventListener('resize', updateOffset);

    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', updateOffset);
    };
  }, []);
  // Don't show on landing, auth, or demo pages
  const hideOnRoutes = ['/', '/auth', '/demo', '/integrations', '/developers', '/architecture-diagram'];
  if (!isLoggedIn || hideOnRoutes.includes(currentPath)) {
    return null;
  }

  // Check if current path is a main portal or dashboard page (not a sub-page)
  const isMainPage = [...portals, ...dashboards].some(item => item.path === currentPath);

  return (
    <div ref={lanesRef} className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border shadow-md">
      {/* Portals Lane */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-1.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Portals
            </span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1 pb-2">
              {portals.map((portal) => (
                <Link
                  key={portal.path}
                  to={portal.path}
                  className={cn(
                    "relative inline-flex items-center justify-center px-5 py-2 text-sm font-medium transition-all",
                    "rounded-t-lg border-t-2 border-x-2 border-b-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    currentPath === portal.path
                      ? "bg-background text-foreground border-primary shadow-md z-10 mb-[-2px]"
                      : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:border-border"
                  )}
                >
                  {portal.name}
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Dashboards Lane */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-1.5">
          <div className="flex items-center gap-2 mb-1.5">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dashboards
            </span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1 pb-2">
              {dashboards.map((dashboard) => (
                <Link
                  key={dashboard.path}
                  to={dashboard.path}
                  className={cn(
                    "relative inline-flex items-center justify-center px-5 py-2 text-sm font-medium transition-all",
                    "rounded-t-lg border-t-2 border-x-2 border-b-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    currentPath === dashboard.path
                      ? "bg-background text-foreground border-primary shadow-md z-10 mb-[-2px]"
                      : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:border-border"
                  )}
                >
                  {dashboard.name}
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Back Button - Only show on sub-pages */}
      {!isMainPage && (
        <div>
          <div className="container mx-auto px-4 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
