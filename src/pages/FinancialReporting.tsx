import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useFinancialReports } from "@/hooks/useFinancialReports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, DollarSign, TrendingUp, TrendingDown, FileText, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useStandardToast } from "@/hooks/useStandardToast";

export default function FinancialReporting() {
  const toast = useStandardToast();
  const { customerId } = useUserProfile();
  
  // Using useFinancialReports hook for all data
  const { metrics, isLoading } = useFinancialReports(customerId);
  
  const [reportPeriod, setReportPeriod] = useState("current_month");
  
  const handleExport = () => {
    toast.success("Report export functionality coming soon");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Financial Reporting</h1>
            <p className="text-muted-foreground">Comprehensive financial analytics and insights</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Current Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="current_quarter">Current Quarter</SelectItem>
                <SelectItem value="last_quarter">Last Quarter</SelectItem>
                <SelectItem value="current_year">Current Year</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.totalRevenue.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.totalExpenses.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Approved expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.profitMargin.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">Revenue minus expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.totalPOs.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total PO value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices Issued</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalRevenue || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total count</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.budgetUtilization.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">Of allocated budget</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Key financial metrics and performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Net Income</span>
                <span className="text-2xl font-bold">
                  ${((metrics?.totalRevenue || 0) - (metrics?.totalExpenses || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Expense Ratio</span>
                <span className="text-lg font-semibold">
                  {metrics && metrics.totalRevenue > 0 
                    ? ((metrics.totalExpenses / metrics.totalRevenue) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Invoice Value</span>
                <span className="text-lg font-semibold">
                  ${metrics?.totalRevenue.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
