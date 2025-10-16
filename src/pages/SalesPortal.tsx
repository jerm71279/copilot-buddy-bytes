import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, TrendingUp } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import MCPServerStatus from "@/components/MCPServerStatus";
import { useSalesData } from "@/hooks/useSalesData";
import { 
  getSalesMetricCards, 
  mockDeals, 
  mockActivities, 
  mockCustomers, 
  salesReportCards 
} from "@/lib/salesConfig";

const SalesPortal = () => {
  const navigate = useNavigate();
  const { isLoading, userProfile, stats, isPreviewMode, handleSignOut } = useSalesData();
  
  const metricCards = getSalesMetricCards(stats);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              Sales Portal
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your pipeline and close more deals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DashboardSettingsMenu dashboardName="Sales Portal" />
            <span className="text-sm text-muted-foreground">{userProfile?.full_name}</span>
            {isPreviewMode && <Badge variant="outline">Preview Mode</Badge>}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Back to Demos" : "Sign Out"}
            </Button>
          </div>
        </div>

        {/* My Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {metricCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.progress !== undefined && (
                  <Progress value={card.progress} className="mt-2" />
                )}
                {card.description && (
                  <p className={`text-xs ${card.descriptionColor || 'text-muted-foreground'}`}>
                    {card.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">My Pipeline</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Active Deals</CardTitle>
                <CardDescription>Opportunities in your sales pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{deal.title}</h4>
                          <Badge variant={deal.badgeVariant}>{deal.stage}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Contact: {deal.contact} • Last activity: {deal.lastActivity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${deal.amount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Close date: {deal.closeDate}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4" variant="outline" onClick={() => navigate('/workflow/deals?department=sales')}>
                  View All Deals
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Your sales activities and follow-ups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full ${activity.iconBg} flex items-center justify-center`}>
                          <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{activity.title}</p>
                          <Badge variant="outline">{activity.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4" variant="outline">
                  View All Activities
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Customers</CardTitle>
                <CardDescription>Active customer accounts you manage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCustomers.map((customer) => (
                    <div 
                      key={customer.id} 
                      className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer" 
                      onClick={() => navigate('/workflow/customers?department=sales')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.industry} • {customer.employees} employees
                          </p>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4" variant="outline" onClick={() => navigate('/workflow/customers?department=sales')}>
                  View All Customers
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {salesReportCards.map((report) => (
                <Card 
                  key={report.title} 
                  className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => navigate(report.path)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <report.icon className="h-5 w-5" />
                      {report.title}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">{report.buttonText}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-4">
            <DepartmentAIAssistant 
              department="sales" 
              departmentLabel="Sales" 
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <MCPServerStatus filterByServerType="sales" />
        </div>
      </main>
    </div>
  );
};

export default SalesPortal;
