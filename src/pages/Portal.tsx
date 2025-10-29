import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, Search, ChevronDown, Activity, Zap, BookOpen, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link, useLocation } from "react-router-dom";
import EmployeeToolbar from "@/components/EmployeeToolbar";
import ExternalSystemsBar from "@/components/ExternalSystemsBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microsoft365Integration } from "@/components/Microsoft365Integration";
import { AppLauncher } from "@/components/AppLauncher";
import AutomationSuggestions from "@/components/AutomationSuggestions";
import { RepetitiveTaskTester } from "@/components/RepetitiveTaskTester";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/GlobalSearch";
import { usePortalData } from "@/hooks/usePortalData";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { quickAccessTools, analyticsDashboards, adminTools } from "@/lib/portalConfig";
import { useToolPermissions, useDashboardPermissions } from "@/hooks/useNavigationPermissions";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const Portal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Use modularized data fetching hook
  const { loading, profile, customer, recentArticles, recentWorkflows } = usePortalData();
  const { isAdmin } = useAuth();

  // Filter navigation items based on RBAC permissions
  const { items: filteredQuickAccessTools, isLoading: toolsLoading } = useToolPermissions(quickAccessTools);
  const { items: filteredAnalyticsDashboards, isLoading: dashboardsLoading } = useDashboardPermissions(analyticsDashboards);
  const { items: filteredAdminTools, isLoading: adminToolsLoading } = useToolPermissions(adminTools);
  
  // Use modularized keyboard shortcut hook
  useKeyboardShortcut(
    { key: 'k', ctrl: true, meta: true },
    () => setSearchOpen(true)
  );

  useEffect(() => {
    // Handle scroll to dashboards section
    if (location.state?.scrollToDashboards) {
      setTimeout(() => {
        const dashboardsSection = document.getElementById('dashboards-section');
        dashboardsSection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading || toolsLoading || dashboardsLoading || adminToolsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <DashboardLayout className="space-y-6">
      {/* Header */}
      <header className="border-b bg-card -mx-4 -mt-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  My Workspace
                </h1>
                <p className="text-sm text-muted-foreground">
                  {customer?.company_name || 'OberaConnect'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSearchOpen(true)}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
          </div>
        </div>
      </header>

      {/* Employee System Toolbar */}
      <EmployeeToolbar />

      {/* External Systems Bar */}
      <ExternalSystemsBar />

      <div className="container mx-auto px-4 pb-8 pt-8">
        {/* Tools and Activities Dropdown */}
        <div className="flex items-center gap-3 mb-8">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Tools and Activities <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Zap className="mr-2 h-4 w-4" />
                  Quick Access
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {filteredQuickAccessTools.length > 0 ? (
                    filteredQuickAccessTools.map((tool) => (
                      <DropdownMenuItem key={tool.name} asChild>
                        <Link to={tool.path} className="flex items-center gap-3 cursor-pointer">
                          <tool.icon className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-medium">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      <p className="text-sm text-muted-foreground">No accessible tools</p>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Activity className="mr-2 h-4 w-4" />
                  Recent Activity
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem asChild>
                    <Link to="/knowledge" className="flex items-center gap-2 cursor-pointer">
                      <BookOpen className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="font-medium">Recent Documentation</p>
                        <p className="text-xs text-muted-foreground">View all knowledge articles</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/workflow/automation" className="flex items-center gap-2 cursor-pointer">
                      <Workflow className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="font-medium">Recent Workflows</p>
                        <p className="text-xs text-muted-foreground">View workflow executions</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Admin Tools Section - Only for Super Admins */}
              {isAdmin && filteredAdminTools.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Tools
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {filteredAdminTools.map((tool) => (
                      <DropdownMenuItem key={tool.name} asChild>
                        <Link to={tool.path} className="flex items-center gap-3 cursor-pointer">
                          <tool.icon className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-medium">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apps">Applications</TabsTrigger>
            <TabsTrigger value="microsoft365">Microsoft 365</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
              </h2>
              <p className="text-muted-foreground">
                Access your tools, knowledge, and insights all in one place
              </p>
            </div>

            {/* Task Detection Tester - For Validation */}
            <RepetitiveTaskTester />

            {/* Automation Suggestions */}
            <AutomationSuggestions />

            {/* Analytics & Insights - Dropdown */}
            <section id="dashboards-section">
              <div className="flex items-center gap-4 mb-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      View Dashboards <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80">
                    {filteredAnalyticsDashboards.length > 0 ? (
                      filteredAnalyticsDashboards.map((dashboard) => (
                        <DropdownMenuItem key={dashboard.name} asChild>
                          <Link to={dashboard.path} className="flex items-center gap-3 cursor-pointer">
                            <dashboard.icon className="h-4 w-4" />
                            <div className="flex-1">
                              <p className="font-medium">{dashboard.name}</p>
                              <p className="text-xs text-muted-foreground">{dashboard.description}</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        <p className="text-sm text-muted-foreground">No accessible dashboards</p>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </section>
            </TabsContent>

            <TabsContent value="apps">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">My Applications</h2>
                  <p className="text-muted-foreground mt-1">
                    Access your work applications and services
                  </p>
                </div>
                <AppLauncher userDepartment={profile?.department || null} />
              </div>
            </TabsContent>

            <TabsContent value="microsoft365">
              <Microsoft365Integration />
            </TabsContent>
        </Tabs>
      </div>
      </DashboardLayout>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Portal;
