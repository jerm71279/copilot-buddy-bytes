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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  name: string;
  path: string;
}

interface Category {
  name: string;
  icon: any;
  items: NavItem[];
}

const categories: Category[] = [
  {
    name: "Operations & IT",
    icon: Settings,
    items: [
      { name: "Operations", path: "/dashboard/operations" },
      { name: "IT Dashboard", path: "/dashboard/it" },
      { name: "CMDB", path: "/cmdb" },
      { name: "Change Management", path: "/change-management" },
      { name: "Incidents", path: "/incidents" },
      { name: "Network Monitoring", path: "/network-monitoring" },
      { name: "SLA Management", path: "/sla-management" },
      { name: "MCP Server", path: "/mcp-servers" },
      { name: "Admin", path: "/admin" },
      { name: "NinjaOne", path: "/ninjaone" },
    ],
  },
  {
    name: "Compliance & Security",
    icon: Shield,
    items: [
      { name: "Compliance Portal", path: "/compliance" },
      { name: "Compliance Dashboard", path: "/dashboard/compliance" },
      { name: "SOC Dashboard", path: "/dashboard/soc" },
      { name: "CIPP", path: "/cipp" },
      { name: "RBAC Portal", path: "/rbac" },
      { name: "Audit Reports", path: "/compliance/audit-reports" },
      { name: "Frameworks", path: "/compliance/frameworks" },
      { name: "Privileged Access", path: "/audit/privileged-access" },
      { name: "Remediation Rules", path: "/remediation-rules" },
    ],
  },
  {
    name: "Business & Sales",
    icon: TrendingUp,
    items: [
      { name: "Sales Dashboard", path: "/dashboard/sales" },
      { name: "Sales Portal", path: "/sales-portal" },
      { name: "Client Portal", path: "/client-portal" },
      { name: "Customers", path: "/customers" },
      { name: "Leads", path: "/leads" },
      { name: "Opportunities", path: "/opportunities" },
      { name: "Quotes", path: "/quotes" },
      { name: "Contracts", path: "/contracts" },
      { name: "Projects", path: "/projects" },
    ],
  },
  {
    name: "Finance",
    icon: DollarSign,
    items: [
      { name: "Finance Dashboard", path: "/dashboard/finance" },
      { name: "Budgets", path: "/budgets" },
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
    name: "HR & People",
    icon: Users,
    items: [
      { name: "HR Dashboard", path: "/dashboard/hr" },
      { name: "Employee Portal", path: "/portal" },
      { name: "Employees", path: "/employees" },
      { name: "Departments", path: "/departments" },
      { name: "Leave Requests", path: "/leave-management" },
      { name: "Onboarding", path: "/onboarding" },
      { name: "Onboarding Templates", path: "/onboarding-templates" },
      { name: "Time Tracking", path: "/time-tracking" },
    ],
  },
  {
    name: "Analytics & Automation",
    icon: BarChart3,
    items: [
      { name: "Executive Dashboard", path: "/dashboard/executive" },
      { name: "Analytics Portal", path: "/analytics" },
      { name: "Data Flow Portal", path: "/data-flows" },
      { name: "Workflow Automation", path: "/workflow-automation" },
      { name: "Workflow Builder", path: "/workflow-builder" },
      { name: "Workflow Orchestration", path: "/workflow-orchestration" },
      { name: "Visual Builder", path: "/workflows/visual-builder" },
      { name: "Workflow Intelligence", path: "/workflow-intelligence" },
      { name: "Intelligent Assistant", path: "/intelligent-assistant" },
      { name: "Predictive Insights", path: "/predictive-insights" },
      { name: "Knowledge Base", path: "/knowledge-base" },
      { name: "Custom Reports", path: "/custom-reports" },
    ],
  },
];

export const DashboardPortalLanes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
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
      if (!lanesRef.current) return;
      const height = lanesRef.current.offsetHeight;
      const safeExtra = 12;
      document.documentElement.style.setProperty('--lanes-height', `${height}px`);
      document.documentElement.style.setProperty('--lanes-bottom', `${height + safeExtra}px`);
    };

    const id = window.requestAnimationFrame(updateOffset);
    window.addEventListener('resize', updateOffset);
    const ro = new ResizeObserver(() => updateOffset());
    if (lanesRef.current) ro.observe(lanesRef.current);

    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', updateOffset);
      ro.disconnect();
    };
  }, []);

  // Don't show on landing, auth, or demo pages
  const hideOnRoutes = ['/', '/auth', '/demo', '/integrations', '/developers', '/architecture-diagram'];
  if (!isLoggedIn || hideOnRoutes.includes(currentPath)) {
    return null;
  }

  // Determine which category should be active based on current path
  useEffect(() => {
    const categoryIndex = categories.findIndex(cat =>
      cat.items.some(item => currentPath === item.path || currentPath.startsWith(item.path + '/'))
    );
    if (categoryIndex !== -1) {
      setActiveCategory(categoryIndex);
    }
  }, [currentPath]);

  const toggleItem = (itemPath: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemPath]: !prev[itemPath]
    }));
  };

  // Check if current path is a main page
  const allItems = categories.flatMap(cat => cat.items);
  const isMainPage = allItems.some(item => item.path === currentPath);

  return (
    <div ref={lanesRef} className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border shadow-md">
      {/* Row 1: Category Folder Tabs */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {categories.map((category, index) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    key={category.name}
                    onClick={() => setActiveCategory(index)}
                    className={cn(
                      "relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all",
                      "rounded-t-lg border-b-2",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      activeCategory === index
                        ? "bg-primary/10 text-primary border-primary shadow-sm"
                        : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <CategoryIcon className="h-4 w-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Row 2: Portal Items with Hierarchical Dropdowns */}
      <div className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 py-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1 pb-2">
              {categories[activeCategory].items.map((item) => {
                const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
                const isOpen = openItems[item.path];
                
                return (
                  <Collapsible
                    key={item.path}
                    open={isOpen}
                    onOpenChange={() => toggleItem(item.path)}
                  >
                    <div className="inline-flex flex-col">
                      <div className="flex items-center gap-1">
                        <Link
                          to={item.path}
                          className={cn(
                            "relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all",
                            "rounded-md",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-background text-foreground hover:bg-muted/80"
                          )}
                        >
                          {item.name}
                        </Link>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-9 w-8 p-0 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="absolute top-full mt-1 z-10">
                        <div className="bg-popover border border-border rounded-md shadow-lg p-1 min-w-[200px]">
                          <div className="text-xs text-muted-foreground p-2">
                            Sub-items for {item.name}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Back Button - Only show on sub-pages */}
      {!isMainPage && (
        <div className="border-t border-border bg-muted/30">
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
