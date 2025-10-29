import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const NavigationScaffold = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    devops: true,
    employee: true,
    operations: true,
  });

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Platform Navigation Scaffold</h1>
        
        <div className="bg-card border rounded-lg p-6 font-mono text-sm">
          <div className="space-y-1">
            <div className="text-primary font-bold">🏢 OberaConnect Platform</div>
            
            <div className="ml-4">├─ 📋 Deployment Planner</div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('devops')} className="flex items-center gap-1 hover:text-primary">
                {expanded.devops ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ ⚙️ DevOps Portal
              </button>
              {expanded.devops && (
                <div className="ml-8 space-y-1">
                  <div>├─ Documentation</div>
                  <div>├─ Link Validation</div>
                  <div>├─ Input Validation</div>
                  <div>├─ System Validation</div>
                  <div>├─ Comprehensive Tests</div>
                  <div>├─ Workflow Evidence</div>
                  <div>├─ Network Monitoring</div>
                  <div>├─ Architecture Canvas</div>
                  <div>├─ Data Flow Portal</div>
                  <div>└─ MCP Servers</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('employee')} className="flex items-center gap-1 hover:text-primary">
                {expanded.employee ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 👥 Employee Portal
              </button>
              {expanded.employee && (
                <div className="ml-8 space-y-1">
                  <div>├─ Employees</div>
                  <div>├─ Departments</div>
                  <div>├─ Leave Requests</div>
                  <div>└─ Time Tracking</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">├─ 🤝 Client Portal</div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('operations')} className="flex items-center gap-1 hover:text-primary">
                {expanded.operations ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 🔧 Operations Portal
              </button>
              {expanded.operations && (
                <div className="ml-8 space-y-1">
                  <div>├─ CMDB</div>
                  <div>├─ Add CMDB Item</div>
                  <div>├─ Edit CMDB Item</div>
                  <div>├─ CMDB Item Detail</div>
                  <div>├─ Change Management</div>
                  <div>├─ New Change</div>
                  <div>├─ Change Details</div>
                  <div>├─ Incidents</div>
                  <div>├─ Network Monitoring</div>
                  <div>├─ New Network Device</div>
                  <div>├─ SLA Management</div>
                  <div>├─ Client Onboarding</div>
                  <div>├─ New Client</div>
                  <div>└─ Onboarding Templates</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('admin')} className="flex items-center gap-1 hover:text-primary">
                {expanded.admin ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 🔐 Admin Portal
              </button>
              {expanded.admin && (
                <div className="ml-8 space-y-1">
                  <div>├─ Applications</div>
                  <div>├─ Products</div>
                  <div>├─ MCP Servers</div>
                  <div>├─ RBAC</div>
                  <div>├─ Privileged Access</div>
                  <div>├─ Customers</div>
                  <div>├─ Security Training</div>
                  <div>├─ Employee Feedback</div>
                  <div>└─ Internal Operations</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('integrations')} className="flex items-center gap-1 hover:text-primary">
                {expanded.integrations ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 🔌 Integrations Portal
              </button>
              {expanded.integrations && (
                <div className="ml-8 space-y-1">
                  <div>├─ NinjaOne</div>
                  <div>└─ CIPP</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('compliance')} className="flex items-center gap-1 hover:text-primary">
                {expanded.compliance ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ ✅ Compliance Portal
              </button>
              {expanded.compliance && (
                <div className="ml-8 space-y-1">
                  <div>├─ Audit Reports</div>
                  <div>├─ Frameworks</div>
                  <div>├─ Evidence Upload</div>
                  <div>└─ Remediation Rules</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">├─ ⚠️ Risk Assessment</div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('sales')} className="flex items-center gap-1 hover:text-primary">
                {expanded.sales ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 💼 Sales Portal
              </button>
              {expanded.sales && (
                <div className="ml-8 space-y-1">
                  <div>├─ Leads</div>
                  <div>├─ Opportunities</div>
                  <div>├─ Quotes</div>
                  <div>├─ Contracts</div>
                  <div>└─ Projects</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('finance')} className="flex items-center gap-1 hover:text-primary">
                {expanded.finance ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 💰 Finance Portal
              </button>
              {expanded.finance && (
                <div className="ml-8 space-y-1">
                  <div>├─ Invoices</div>
                  <div>├─ Expenses</div>
                  <div>├─ Purchase Orders</div>
                  <div>├─ Asset Financials</div>
                  <div>├─ Financial Reports</div>
                  <div>├─ Vendors</div>
                  <div>├─ Inventory</div>
                  <div>└─ Warehouses</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('analytics')} className="flex items-center gap-1 hover:text-primary">
                {expanded.analytics ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 📊 Analytics Portal
              </button>
              {expanded.analytics && (
                <div className="ml-8 space-y-1">
                  <div>├─ Data Flows</div>
                  <div>├─ Predictive Insights</div>
                  <div>└─ Custom Reports</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('automation')} className="flex items-center gap-1 hover:text-primary">
                {expanded.automation ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 🤖 Automation Portal
              </button>
              {expanded.automation && (
                <div className="ml-8 space-y-1">
                  <div>├─ Workflow Builder</div>
                  <div>├─ Workflow Orchestration</div>
                  <div>├─ Visual Builder</div>
                  <div>├─ Workflow Intelligence</div>
                  <div>└─ Intelligent Assistant</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('knowledge')} className="flex items-center gap-1 hover:text-primary">
                {expanded.knowledge ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                ├─ 📚 Knowledge Portal
              </button>
              {expanded.knowledge && (
                <div className="ml-8 space-y-1">
                  <div>├─ Articles</div>
                  <div>└─ Upload</div>
                </div>
              )}
            </div>
            
            <div className="ml-4">
              <button onClick={() => toggleExpand('dashboards')} className="flex items-center gap-1 hover:text-primary">
                {expanded.dashboards ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                └─ 📈 Department Dashboards
              </button>
              {expanded.dashboards && (
                <div className="ml-8 space-y-1">
                  <div>├─ Executive Dashboard</div>
                  <div>├─ IT Dashboard</div>
                  <div>├─ Sales Dashboard</div>
                  <div>├─ HR Dashboard</div>
                  <div>├─ Finance Dashboard</div>
                  <div>├─ Operations Dashboard</div>
                  <div>├─ SOC Dashboard</div>
                  <div>├─ Admin Dashboard</div>
                  <div>├─ Compliance Dashboard</div>
                  <div>├─ Global Insights</div>
                  <div>└─ Department Insights</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NavigationScaffold;
