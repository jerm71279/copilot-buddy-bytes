import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Settings, 
  Shield, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Portals are the main navigation items (non-dashboard pages) with optional children
interface Portal {
  name: string;
  path: string;
  children?: { name: string; path: string; }[];
}

// Categories organize dashboards by theme
interface Category {
  name: string;
  icon: any;
  dashboards: { name: string; path: string; }[];
}

const portals: Portal[] = [
  {
    name: "CMDB",
    path: "/cmdb",
    children: [
      { name: "Add Item", path: "/cmdb/add" },
      { name: "Edit Item", path: "/cmdb/edit" },
      { name: "Item Detail", path: "/cmdb/item" },
    ],
  },
  {
    name: "Change Management",
    path: "/change-management",
    children: [
      { name: "New Change", path: "/change/new" },
      { name: "Manage Changes", path: "/change/manage" },
    ],
  },
  {
    name: "Incidents",
    path: "/incidents",
  },
  {
    name: "Network Monitoring",
    path: "/network-monitoring",
  },
  {
    name: "SLA Management",
    path: "/sla-management",
  },
  {
    name: "MCP Servers",
    path: "/mcp-servers",
  },
  {
    name: "Admin",
    path: "/admin",
  },
  {
    name: "NinjaOne",
    path: "/ninjaone",
  },
  {
    name: "Compliance Portal",
    path: "/compliance",
    children: [
      { name: "Audit Reports", path: "/compliance/audit-reports" },
      { name: "Frameworks", path: "/compliance/frameworks" },
    ],
  },
  {
    name: "CIPP",
    path: "/cipp",
  },
  {
    name: "RBAC",
    path: "/rbac",
  },
  {
    name: "Privileged Access",
    path: "/audit/privileged-access",
  },
  {
    name: "Remediation Rules",
    path: "/remediation-rules",
  },
  {
    name: "Sales Portal",
    path: "/sales-portal",
  },
  {
    name: "Client Portal",
    path: "/client-portal",
  },
  {
    name: "Customers",
    path: "/customers",
  },
  {
    name: "Leads",
    path: "/leads",
  },
  {
    name: "Opportunities",
    path: "/opportunities",
  },
  {
    name: "Quotes",
    path: "/quotes",
  },
  {
    name: "Contracts",
    path: "/contracts",
  },
  {
    name: "Projects",
    path: "/projects",
  },
  {
    name: "Budgets",
    path: "/budgets",
  },
  {
    name: "Invoices",
    path: "/invoices",
  },
  {
    name: "Expenses",
    path: "/expenses",
  },
  {
    name: "Purchase Orders",
    path: "/purchase-orders",
  },
  {
    name: "Asset Financials",
    path: "/asset-financials",
  },
  {
    name: "Financial Reports",
    path: "/financial-reports",
  },
  {
    name: "Vendors",
    path: "/vendors",
  },
  {
    name: "Inventory",
    path: "/inventory",
  },
  {
    name: "Warehouses",
    path: "/warehouses",
  },
  {
    name: "Employee Portal",
    path: "/portal",
  },
  {
    name: "Employees",
    path: "/employees",
  },
  {
    name: "Departments",
    path: "/departments",
  },
  {
    name: "Leave Requests",
    path: "/leave-management",
  },
  {
    name: "Onboarding",
    path: "/onboarding",
    children: [
      { name: "Onboarding Templates", path: "/onboarding-templates" },
    ],
  },
  {
    name: "Time Tracking",
    path: "/time-tracking",
  },
  {
    name: "Analytics Portal",
    path: "/analytics",
  },
  {
    name: "Data Flows",
    path: "/data-flows",
  },
  {
    name: "Workflow Automation",
    path: "/workflow-automation",
  },
  {
    name: "Workflow Builder",
    path: "/workflow-builder",
  },
  {
    name: "Workflow Orchestration",
    path: "/workflow-orchestration",
  },
  {
    name: "Visual Workflow Builder",
    path: "/workflows/visual-build",
  },
  {
    name: "Intelligent Assistant",
    path: "/intelligent-assistant",
  },
  {
    name: "Predictive Insights",
    path: "/predictive-insights",
  },
  {
    name: "Knowledge Base",
    path: "/knowledge-base",
  },
  {
    name: "Custom Reports",
    path: "/custom-reports",
  },
];

const categories: Category[] = [
  {
    name: "Operations & IT",
    icon: Settings,
    dashboards: [
      { name: "Operations", path: "/dashboard/operations" },
      { name: "IT", path: "/dashboard/it" },
    ],
  },
  {
    name: "Compliance & Security",
    icon: Shield,
    dashboards: [
      { name: "Compliance", path: "/dashboard/compliance" },
      { name: "SOC", path: "/dashboard/soc" },
    ],
  },
  {
    name: "Business & Sales",
    icon: TrendingUp,
    dashboards: [
      { name: "Sales", path: "/dashboard/sales" },
    ],
  },
  {
    name: "Finance",
    icon: DollarSign,
    dashboards: [
      { name: "Finance", path: "/dashboard/finance" },
    ],
  },
  {
    name: "HR & People",
    icon: Users,
    dashboards: [
      { name: "HR", path: "/dashboard/hr" },
    ],
  },
  {
    name: "Analytics & Automation",
    icon: BarChart3,
    dashboards: [
      { name: "Executive", path: "/dashboard/executive" },
    ],
  },
];

export default function DashboardPortalLanes() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openPortals, setOpenPortals] = useState<{ [key: string]: boolean }>({});
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({});
  const lanesRef = useRef<HTMLDivElement>(null);

  const hideOnRoutes = ['/', '/auth', '/demo', '/integrations', '/developers', '/architecture-diagram'];
  const shouldHide = !isLoggedIn || hideOnRoutes.includes(currentPath);

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
    if (shouldHide) return;

    const updateOffset = () => {
      if (!lanesRef.current) return;
      const height = lanesRef.current.offsetHeight;
      const safeExtra = 12;
      document.documentElement.style.setProperty('--lanes-height', `${height}px`);
      document.documentElement.style.setProperty('--lanes-bottom', `${height + safeExtra}px`);
    };

    const id = window.requestAnimationFrame(updateOffset);
    window.addEventListener('resize', updateOffset);
    const ro = new ResizeObserver(updateOffset);
    if (lanesRef.current) {
      ro.observe(lanesRef.current);
    }

    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', updateOffset);
      ro.disconnect();
    };
  }, [shouldHide]);

  if (shouldHide) {
    return null;
  }

  const togglePortal = (path: string) => {
    setOpenPortals((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Check if current page is a main portal/dashboard page
  const allPages = [
    ...portals.map((p) => p.path),
    ...portals.flatMap((p) => p.children?.map((c) => c.path) || []),
    ...categories.flatMap((c) => c.dashboards.map((d) => d.path)),
  ];
  const isMainPage = allPages.some((path) => currentPath === path);

  return (
    <div ref={lanesRef} className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border shadow-md">
      {/* Row 1: Portals with dropdowns */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {portals.map((portal) => {
                const isActive = currentPath === portal.path || 
                  (portal.children && portal.children.some((child) => currentPath.startsWith(child.path)));
                const isOpen = openPortals[portal.path];

                return (
                  <div key={portal.path} className="inline-block">
                    {portal.children && portal.children.length > 0 ? (
                      <Collapsible open={isOpen} onOpenChange={() => togglePortal(portal.path)}>
                        <div className="flex items-center gap-1">
                          <Link
                            to={portal.path}
                            className={cn(
                              "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/30 text-foreground hover:bg-muted/50"
                            )}
                          >
                            {portal.name}
                          </Link>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-8 w-8 p-0 transition-transform",
                                isOpen && "rotate-180"
                              )}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="absolute mt-1 z-[9999]">
                          <div className="bg-popover border border-border rounded-md shadow-lg p-1 min-w-[200px]">
                            {portal.children.map((child) => (
                              <Link
                                key={child.path}
                                to={child.path}
                                className={cn(
                                  "block px-3 py-2 text-sm rounded-md transition-colors",
                                  currentPath === child.path
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                )}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Link
                        to={portal.path}
                        className={cn(
                          "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/30 text-foreground hover:bg-muted/50"
                        )}
                      >
                        {portal.name}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Row 2: Categories with Dashboard dropdowns */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                const isActive = category.dashboards.some((d) => currentPath === d.path || currentPath.startsWith(d.path + '/'));
                const isOpen = openCategories[category.name];

                return (
                  <div key={category.name} className="inline-block">
                    <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category.name)}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                          )}
                          onClick={() => toggleCategory(category.name)}
                        >
                          <CategoryIcon className="h-4 w-4" />
                          {category.name}
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                <CollapsibleContent className="absolute mt-1 z-[9999]">
                  <div className="bg-popover border border-border rounded-md shadow-lg p-1 min-w-[200px]">
                          {category.dashboards.map((dashboard) => (
                            <Link
                              key={dashboard.path}
                              to={dashboard.path}
                              className={cn(
                                "block px-3 py-2 text-sm rounded-md transition-colors",
                                currentPath === dashboard.path
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                            >
                              {dashboard.name}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Back Button - Only show on non-main pages */}
      {!isMainPage && (
        <div className="border-t border-border">
          <div className="container mx-auto px-4 py-2">
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
}
