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
    name: "Operations Portal",
    path: "/dashboard/operations",
    children: [
      { name: "CMDB", path: "/cmdb" },
      { name: "Add CMDB Item", path: "/cmdb/add" },
      { name: "Edit CMDB Item", path: "/cmdb/edit" },
      { name: "CMDB Item Detail", path: "/cmdb/item" },
      { name: "Change Management", path: "/change-management" },
      { name: "New Change", path: "/change/new" },
      { name: "Change Details", path: "/change/details" },
      { name: "Incidents", path: "/incidents" },
      { name: "Network Monitoring", path: "/network-monitoring" },
      { name: "New Network Device", path: "/network/device/new" },
      { name: "SLA Management", path: "/sla-management" },
    ],
  },
  {
    name: "Admin Portal",
    path: "/admin",
    children: [
      { name: "Applications", path: "/admin/applications" },
      { name: "Products", path: "/admin/products" },
      { name: "MCP Servers", path: "/mcp-servers" },
      { name: "RBAC", path: "/rbac" },
      { name: "Privileged Access", path: "/audit/privileged-access" },
      { name: "Customers", path: "/customers" },
    ],
  },
  {
    name: "Integrations Portal",
    path: "/integrations",
    children: [
      { name: "NinjaOne", path: "/ninjaone" },
      { name: "CIPP", path: "/cipp" },
    ],
  },
  {
    name: "Compliance Portal",
    path: "/compliance",
    children: [
      { name: "Audit Reports", path: "/compliance/audit-reports" },
      { name: "Frameworks", path: "/compliance/frameworks" },
      { name: "Evidence Upload", path: "/compliance/evidence" },
      { name: "Remediation Rules", path: "/remediation-rules" },
    ],
  },
  {
    name: "Sales Portal",
    path: "/sales-portal",
    children: [
      { name: "Leads", path: "/leads" },
      { name: "Opportunities", path: "/opportunities" },
      { name: "Quotes", path: "/quotes" },
      { name: "Contracts", path: "/contracts" },
      { name: "Projects", path: "/projects" },
      { name: "Client Portal", path: "/client-portal" },
    ],
  },
  {
    name: "Finance Portal",
    path: "/budgets",
    children: [
      { name: "Invoices", path: "/invoices" },
      { name: "Expenses", path: "/expenses" },
      { name: "Purchase Orders", path: "/purchase-orders" },
      { name: "Asset Financials", path: "/asset-financials" },
      { name: "Financial Reports", path: "/financial-reports" },
      { name: "Vendors", path: "/vendors" },
      { name: "Inventory", path: "/inventory" },
      { name: "Warehouses", path: "/warehouses" },
    ],
  },
  {
    name: "HR Portal",
    path: "/portal",
    children: [
      { name: "Employees", path: "/employees" },
      { name: "Departments", path: "/departments" },
      { name: "Leave Requests", path: "/leave-management" },
      { name: "Onboarding", path: "/onboarding" },
      { name: "Onboarding Templates", path: "/onboarding-templates" },
      { name: "Time Tracking", path: "/time-tracking" },
    ],
  },
  {
    name: "Analytics Portal",
    path: "/analytics",
    children: [
      { name: "Data Flows", path: "/data-flows" },
      { name: "Predictive Insights", path: "/predictive-insights" },
      { name: "Custom Reports", path: "/custom-reports" },
    ],
  },
  {
    name: "Automation Portal",
    path: "/workflow-automation",
    children: [
      { name: "Workflow Builder", path: "/workflow-builder" },
      { name: "Workflow Orchestration", path: "/workflow-orchestration" },
      { name: "Visual Builder", path: "/workflows/visual-build" },
      { name: "Workflow Intelligence", path: "/workflow-intelligence" },
      { name: "Intelligent Assistant", path: "/intelligent-assistant" },
    ],
  },
  {
    name: "Knowledge Portal",
    path: "/knowledge-base",
    children: [
      { name: "Articles", path: "/knowledge-base" },
      { name: "Upload", path: "/knowledge-base/upload" },
    ],
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
  const [openPortals, setOpenPortals] = useState<{ [key: string]: boolean }>(() => 
    portals.reduce((acc, p) => ({ ...acc, [p.path]: false }), {})
  );
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>(() =>
    categories.reduce((acc, c) => ({ ...acc, [c.name]: false }), {})
  );
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
    setOpenPortals(prev => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const toggleCategory = (name: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Check if current page is a main portal/dashboard page
  const allPages = [
    ...portals.map(p => p.path),
    ...portals.flatMap(p => p.children?.map(c => c.path) || []),
    ...categories.flatMap(c => c.dashboards.map(d => d.path)),
  ];
  const isMainPage = allPages.some((path) => currentPath === path);

  return (
    <div ref={lanesRef} className="fixed top-0 left-0 right-0 z-[9999] w-full isolate overflow-visible bg-background/95 backdrop-blur-sm border-b border-border shadow-md">
      {/* Row 1: Portals with dropdowns */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="relative overflow-x-auto overflow-y-hidden">
            <div className="flex gap-2 pb-2 min-w-max">
              {portals.map((portal) => {
                const isActive = currentPath === portal.path || 
                  (portal.children && portal.children.some(child => currentPath.startsWith(child.path)));
                const isOpen = openPortals[portal.path];

                return (
                  <div key={portal.path} className="relative inline-block">
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
                        <CollapsibleContent className="absolute left-0 top-full z-[10000] mt-1">
                          <div className="bg-popover border border-border rounded-md shadow-xl p-2 min-w-[300px] max-w-[85vw] max-h-[70vh] overflow-auto">
                            <div className="columns-3 gap-2">
                              {portal.children.map((child) => (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  className={cn(
                                    "mb-1 block break-inside-avoid px-3 py-2 text-sm rounded-md transition-colors",
                                    currentPath === child.path
                                      ? "bg-primary text-primary-foreground"
                                      : "text-foreground hover:bg-muted"
                                  )}
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
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
          </div>
        </div>
      </div>

      {/* Row 2: Categories with Dashboard dropdowns */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="relative overflow-x-auto overflow-y-hidden">
            <div className="flex gap-2 pb-2 min-w-max">
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                const isActive = category.dashboards.some((d) => currentPath === d.path || currentPath.startsWith(d.path + '/'));
                const isOpen = openCategories[category.name];

                return (
                  <div key={category.name} className="relative inline-block">
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
                      <CollapsibleContent className="absolute left-0 top-full mt-1 z-[10000]">
                        <div className="bg-popover border border-border rounded-md shadow-xl p-2 min-w-[300px] max-w-[85vw] max-h-[70vh] overflow-auto">
                          <div className="columns-3 gap-2">
                            {category.dashboards.map((dashboard) => (
                              <Link
                                key={dashboard.path}
                                to={dashboard.path}
                                className={cn(
                                  "mb-1 block break-inside-avoid px-3 py-2 text-sm rounded-md transition-colors",
                                  currentPath === dashboard.path
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground hover:bg-muted"
                                )}
                              >
                                {dashboard.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          </div>
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
