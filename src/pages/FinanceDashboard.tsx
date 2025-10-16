import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Receipt } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useFinanceData } from "@/hooks/useFinanceData";
import { getFinanceMetricCards, getAdditionalMetrics, getStatusBadgeVariant, getPlanBadgeVariant } from "@/lib/financeConfig";


import { useRevioData } from "@/hooks/useRevioData";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { isLoading, customers, stats, isPreviewMode } = useFinanceData();
  const { data: revioData, loading: revioLoading } = useRevioData();
  
  const metricCards = getFinanceMetricCards(stats);
  const additionalMetrics = getAdditionalMetrics(stats);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 space-y-6" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Finance Dashboard</h1>
          <DashboardSettingsMenu dashboardName="Finance" />
        </div>
        
        
        <TooltipProvider>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => (
              <Card 
                key={card.title}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(card.clickPath)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    {card.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <pre className="text-xs whitespace-pre-wrap font-mono">{card.tooltip}</pre>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${card.valueColor || ''}`}>{card.value}</div>
                  {card.badges && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {card.badges.map((badge, i) => (
                        <Badge key={i} variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {card.description && (
                    <p className={`text-xs mt-1 ${card.descriptionColor || 'text-muted-foreground'}`}>
                      {card.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {additionalMetrics.map((metric, idx) => (
              <Card key={idx}>
                <CardHeader className={metric.breakdown ? '' : 'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  {metric.breakdown ? (
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        {metric.tooltip && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <pre className="text-xs whitespace-pre-wrap font-mono">{metric.tooltip}</pre>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {metric.icon && <metric.icon className={`h-4 w-4 ${metric.color}`} />}
                    </>
                  )}
                </CardHeader>
                <CardContent className={metric.breakdown ? 'space-y-2' : ''}>
                  {metric.breakdown ? (
                    metric.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}:</span>
                        <span className="font-medium">${item.value.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      {metric.description && (
                        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Annual Projections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ARR:</span>
                  <span className="font-medium">${(stats.mrr * 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projected Growth:</span>
                  <span className="font-medium">${(stats.mrr * 12 * (stats.growth / 100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year-End Target:</span>
                  <span className="font-medium">${(stats.mrr * 12 * (1 + stats.growth / 100)).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipProvider>

        <Card>
          <CardHeader>
            <CardTitle>Recent Customers</CardTitle>
            <CardDescription>Latest customer subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.company_name}</TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(customer.plan_type)}>
                        {customer.plan_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(customer.status)}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Revio Invoices
            </CardTitle>
            <CardDescription>
              {revioLoading ? "Loading invoice data..." : "Recent invoices from Revio billing system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revioLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading invoices...
              </div>
            ) : revioData?.invoices && revioData.invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revioData.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            invoice.status === 'paid' ? 'default' : 
                            invoice.status === 'overdue' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No invoices available
              </div>
            )}
          </CardContent>
        </Card>

        <DepartmentAIAssistant 
          department="finance" 
          departmentLabel="Finance" 
        />
      </main>
    </div>
  );
};

export default FinanceDashboard;
