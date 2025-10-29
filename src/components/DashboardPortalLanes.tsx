import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  ChevronDown,
  Search,
  Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { GlobalSearch } from "@/components/GlobalSearch";
import { usePortalPermissions } from "@/hooks/useNavigationPermissions";
import { useAuth } from "@/hooks/useAuth";
import { portals, categories, portalSlugMap, categorySlugMap, Portal, Category } from "@/config/portals";
import { PortalsBar } from "./PortalsBar";
import { PortalDropdown } from "./PortalDropdown";
import { AuthService } from "@/services/authService";
import { ProfileService } from "@/services/profileService";

export default function DashboardPortalLanes() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { isAuthenticated, isLoading } = useAuth();
  const [enabledPortals, setEnabledPortals] = useState<string[]>([]);
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  const [openPortals, setOpenPortals] = useState<{ [key: string]: boolean }>(() => 
    portals.reduce((acc, p) => ({ ...acc, [p.path]: false }), {})
  );
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>(() =>
    categories.reduce((acc, c) => ({ ...acc, [c.name]: false }), {})
  );
  const lanesRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const hideOnRoutes = ['/auth', '/demo', '/integrations', '/developers', '/architecture-diagram'];
  const shouldHide = isLoading || !isAuthenticated || hideOnRoutes.includes(currentPath);

  useEffect(() => {
    const loadSettings = async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      const profile = await AuthService.getUserProfile(user.id);
      if (!profile?.customer_id) return;

      const customization = await ProfileService.getCustomerCustomizations(profile.customer_id);
      if (customization) {
        setEnabledPortals(customization.enabled_portals);
        setEnabledModules(customization.enabled_modules);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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

  // Filter portals based on customer settings (organization-level)
  // MUST be computed before any early returns to avoid hook ordering violations
  const orgFilteredPortals = useMemo(() => (
    enabledPortals.length > 0 
      ? portals.filter(portal => {
          const slug = portalSlugMap[portal.path];
          return !slug || enabledPortals.includes(slug);
        })
      : portals
  ), [enabledPortals]);

  const orgFilteredCategories = useMemo(() => (
    Object.keys(enabledModules).length > 0
      ? categories.filter(category => {
          const slug = categorySlugMap[category.name];
          return !slug || enabledModules[slug] !== false;
        })
      : categories
  ), [enabledModules]);

  // Filter portals based on RBAC permissions (user-level)
  // MUST be called before any early returns to avoid hook ordering violations
  const { items: permissionFilteredPortals, isLoading: permissionsLoading } = usePortalPermissions(orgFilteredPortals);
  
  // Use permission-filtered portals if RBAC is enabled, otherwise use org-filtered
  const filteredPortals = permissionFilteredPortals;
  const filteredCategories = orgFilteredCategories; // Categories filtered by org settings only for now

  if (shouldHide) {
    return null;
  }

  const togglePortal = (path: string) => {
    const isCurrentlyOpen = openPortals[path];
    // Close all portals and categories
    setOpenPortals(portals.reduce((acc, p) => ({ ...acc, [p.path]: false }), {}));
    setOpenCategories(categories.reduce((acc, c) => ({ ...acc, [c.name]: false }), {}));
    // Open this one if it was closed
    if (!isCurrentlyOpen) {
      setOpenPortals(prev => ({ ...prev, [path]: true }));
    }
  };

  const toggleCategory = (name: string) => {
    const isCurrentlyOpen = openCategories[name];
    // Close all portals and categories
    setOpenPortals(portals.reduce((acc, p) => ({ ...acc, [p.path]: false }), {}));
    setOpenCategories(categories.reduce((acc, c) => ({ ...acc, [c.name]: false }), {}));
    // Open this one if it was closed
    if (!isCurrentlyOpen) {
      setOpenCategories(prev => ({ ...prev, [name]: true }));
    }
  };

  const closeAll = () => {
    setOpenPortals(portals.reduce((acc, p) => ({ ...acc, [p.path]: false }), {}));
    setOpenCategories(categories.reduce((acc, c) => ({ ...acc, [c.name]: false }), {}));
  };

  // Check if current page is a main portal/dashboard page
  const allPages = [
    ...portals.map(p => p.path),
    ...portals.flatMap(p => p.children?.map(c => c.path) || []),
    ...categories.flatMap(c => c.dashboards.map(d => d.path)),
  ];
  const isMainPage = allPages.some((path) => currentPath === path);

  return (
    <div ref={lanesRef} className="fixed top-0 left-0 right-0 z-40 w-full isolate overflow-visible bg-background/95 backdrop-blur-sm border-b border-border shadow-md">
      {/* Row 1: Portals with dropdowns */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <PortalsBar 
            portals={filteredPortals}
            currentPath={currentPath}
            openStates={openPortals}
            onToggle={togglePortal}
            onCloseAll={closeAll}
            lanesBottom="var(--lanes-bottom)"
          />
        </div>
      </div>

      {/* Row 2: Categories with Dashboard dropdowns */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2 pr-8 min-w-max">
              {filteredCategories.map((category) => {
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
                      <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                        {isOpen && (
                          <PortalDropdown
                            items={category.dashboards}
                            currentPath={currentPath}
                            onClose={closeAll}
                            lanesBottom="var(--lanes-bottom)"
                          />
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
              <Link to="/developers">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 px-4 py-2 text-sm font-medium"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="gap-2 px-4 py-2 text-sm font-medium"
              >
                <Search className="h-4 w-4" />
                Search
                <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
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

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
