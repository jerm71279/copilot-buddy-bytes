import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import IntegrationsPage from "./pages/IntegrationsPage";
import Auth from "./pages/Auth";
import DemoSelector from "./pages/DemoSelector";
import Portal from "./pages/Portal";
import AnalyticsPortal from "./pages/AnalyticsPortal";
import WorkflowDetail from "./pages/WorkflowDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import KnowledgeArticle from "./pages/KnowledgeArticle";
import KnowledgeUpload from "./pages/KnowledgeUpload";
import AdminDashboard from "./pages/AdminDashboard";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import ITDashboard from "./pages/ITDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import HRDashboard from "./pages/HRDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import SOCDashboard from "./pages/SOCDashboard";
import SharePointSync from "./pages/SharePointSync";
import IntelligentAssistant from "./pages/IntelligentAssistant";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ApplicationsAdmin from "./pages/ApplicationsAdmin";
import OnboardingDashboard from "./pages/OnboardingDashboard";
import OnboardingTemplates from "./pages/OnboardingTemplates";
import CompliancePortal from "./pages/CompliancePortal";
import ComplianceFrameworkDetail from "./pages/ComplianceFrameworkDetail";
import ComplianceFrameworkRecords from "./pages/ComplianceFrameworkRecords";
import ComplianceControlDetail from "./pages/ComplianceControlDetail";
import ComplianceAuditReports from "./pages/ComplianceAuditReports";
import ComplianceEvidenceUpload from "./pages/ComplianceEvidenceUpload";
import ComplianceReportDetail from "./pages/ComplianceReportDetail";
import WorkflowAutomation from "./pages/WorkflowAutomation";
import WorkflowExecutionDetail from "./pages/WorkflowExecutionDetail";
import NinjaOneIntegration from "./pages/NinjaOneIntegration";
import PrivilegedAccessAudit from "./pages/PrivilegedAccessAudit";
import CMDBDashboard from "./pages/CMDBDashboard";
import CMDBItemDetail from "./pages/CMDBItemDetail";
import CMDBAddItem from "./pages/CMDBAddItem";
import CMDBEditItem from "./pages/CMDBEditItem";
import ChangeManagement from "./pages/ChangeManagement";
import ChangeManagementNew from "./pages/ChangeManagementNew";
import ChangeManagementDetail from "./pages/ChangeManagementDetail";
import TestWorkflowEvidence from "./pages/TestWorkflowEvidence";
import ComprehensiveTestDashboard from "./pages/ComprehensiveTestDashboard";

import SystemValidationDashboard from "./pages/SystemValidationDashboard";

import WorkflowBuilder from "./pages/WorkflowBuilder";
import MCPServerDashboard from "./pages/MCPServerDashboard";
import SalesPortal from "./pages/SalesPortal";
import CIPPDashboard from "./pages/CIPPDashboard";
import DataFlowPortal from "./pages/DataFlowPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/demo" element={<DemoSelector />} />
          
          {/* Portal - Protected but no admin required */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <Portal />
            </ProtectedRoute>
          } />
          
          {/* Analytics Portal - Protected but no admin required */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsPortal />
            </ProtectedRoute>
          } />
          
          {/* Sales Portal - Protected but no admin required */}
          <Route path="/sales-portal" element={
            <ProtectedRoute>
              <SalesPortal />
            </ProtectedRoute>
          } />
          
          {/* Workflow Detail Pages */}
          <Route path="/workflow/:workflowType" element={<WorkflowDetail />} />
          
          {/* Knowledge Base - Protected */}
          <Route path="/knowledge" element={
            <ProtectedRoute>
              <KnowledgeBase />
            </ProtectedRoute>
          } />
          <Route path="/knowledge/upload" element={
            <ProtectedRoute>
              <KnowledgeUpload />
            </ProtectedRoute>
          } />
          <Route path="/knowledge/:id" element={
            <ProtectedRoute>
              <KnowledgeArticle />
            </ProtectedRoute>
          } />
          
          {/* Internal OberaConnect Dashboards - Admin Only */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/compliance" element={
            <ProtectedRoute requireAdmin>
              <ComplianceDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/it" element={
            <ProtectedRoute requireAdmin>
              <ITDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/operations" element={
            <ProtectedRoute requireAdmin>
              <OperationsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hr" element={
            <ProtectedRoute requireAdmin>
              <HRDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/finance" element={
            <ProtectedRoute requireAdmin>
              <FinanceDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/sales" element={
            <ProtectedRoute requireAdmin>
              <SalesDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/executive" element={
            <ProtectedRoute requireAdmin>
              <ExecutiveDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/soc" element={
            <ProtectedRoute requireAdmin>
              <SOCDashboard />
            </ProtectedRoute>
          } />
          
          {/* SharePoint Sync - Protected */}
          <Route path="/sharepoint-sync" element={
            <ProtectedRoute>
              <SharePointSync />
            </ProtectedRoute>
          } />
          
          {/* Intelligent Assistant - Protected */}
          <Route path="/intelligent-assistant" element={
            <ProtectedRoute>
              <IntelligentAssistant />
            </ProtectedRoute>
          } />
          
          {/* Application Management - Admin Only */}
          <Route path="/admin/applications" element={
            <ProtectedRoute requireAdmin>
              <ApplicationsAdmin />
            </ProtectedRoute>
          } />
          
          {/* Onboarding - Protected */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingDashboard />
            </ProtectedRoute>
          } />
          <Route path="/onboarding/templates" element={
            <ProtectedRoute>
              <OnboardingTemplates />
            </ProtectedRoute>
          } />
          
          {/* Compliance - Protected */}
          <Route path="/compliance" element={
            <ProtectedRoute>
              <CompliancePortal />
            </ProtectedRoute>
          } />
          
          {/* Workflow Automation - Protected */}
          <Route path="/workflows" element={
            <ProtectedRoute>
              <WorkflowAutomation />
            </ProtectedRoute>
          } />
          <Route path="/workflows/builder" element={
            <ProtectedRoute>
              <WorkflowBuilder />
            </ProtectedRoute>
          } />
          <Route path="/workflow/execution/:executionId" element={
            <ProtectedRoute>
              <WorkflowExecutionDetail />
            </ProtectedRoute>
          } />
          
          {/* NinjaOne Integration - Protected */}
          <Route path="/ninjaone" element={
            <ProtectedRoute>
              <NinjaOneIntegration />
            </ProtectedRoute>
          } />
          
          {/* CMDB & Change Management - Protected */}
          <Route path="/cmdb" element={
            <ProtectedRoute>
              <CMDBDashboard />
            </ProtectedRoute>
          } />
          <Route path="/cmdb/add" element={
            <ProtectedRoute>
              <CMDBAddItem />
            </ProtectedRoute>
          } />
          <Route path="/cmdb/:id/edit" element={
            <ProtectedRoute>
              <CMDBEditItem />
            </ProtectedRoute>
          } />
          <Route path="/cmdb/:id" element={
            <ProtectedRoute>
              <CMDBItemDetail />
            </ProtectedRoute>
          } />
          <Route path="/change-management" element={
            <ProtectedRoute>
              <ChangeManagement />
            </ProtectedRoute>
          } />
          <Route path="/change-management/new" element={
            <ProtectedRoute>
              <ChangeManagementNew />
            </ProtectedRoute>
          } />
          <Route path="/change-management/:id" element={
            <ProtectedRoute>
              <ChangeManagementDetail />
            </ProtectedRoute>
          } />
          
          {/* Privileged Access Audit - Admin Only */}
          <Route path="/audit/privileged-access" element={
            <ProtectedRoute requireAdmin>
              <PrivilegedAccessAudit />
            </ProtectedRoute>
          } />
          
          {/* Compliance Audit Reports - Protected */}
          <Route path="/compliance/audit-reports" element={
            <ProtectedRoute>
              <ComplianceAuditReports />
            </ProtectedRoute>
          } />
          
          {/* Compliance Framework Records - Protected */}
          <Route path="/compliance/framework/:framework/records" element={
            <ProtectedRoute>
              <ComplianceFrameworkRecords />
            </ProtectedRoute>
          } />
          
          {/* Compliance Framework Detail - Protected */}
          <Route path="/compliance/frameworks/:id" element={
            <ProtectedRoute>
              <ComplianceFrameworkDetail />
            </ProtectedRoute>
          } />
          
          {/* Compliance Control Detail - Protected */}
          <Route path="/compliance/frameworks/:frameworkId/controls/:controlId" element={
            <ProtectedRoute>
              <ComplianceControlDetail />
            </ProtectedRoute>
          } />
          <Route path="/compliance/evidence/upload" element={
            <ProtectedRoute>
              <ComplianceEvidenceUpload />
            </ProtectedRoute>
          } />
          
          {/* Test Workflow Evidence - Admin Only */}
          <Route path="/test/workflow-evidence" element={
            <ProtectedRoute requireAdmin>
              <TestWorkflowEvidence />
            </ProtectedRoute>
          } />
          
          {/* Comprehensive Test Dashboard - Admin Only */}
          <Route path="/test/comprehensive" element={
            <ProtectedRoute requireAdmin>
              <ComprehensiveTestDashboard />
            </ProtectedRoute>
          } />
          
          {/* System Validation Dashboard - Admin Only */}
          <Route path="/test/validation" element={
            <ProtectedRoute requireAdmin>
              <SystemValidationDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/compliance/reports/:id" element={
            <ProtectedRoute>
              <ComplianceReportDetail />
            </ProtectedRoute>
          } />
          
          {/* MCP Server Dashboard - Protected */}
          <Route path="/mcp-servers" element={
            <ProtectedRoute>
              <MCPServerDashboard />
            </ProtectedRoute>
          } />
          
          {/* CIPP Dashboard - Protected */}
          <Route path="/cipp" element={
            <ProtectedRoute>
              <CIPPDashboard />
            </ProtectedRoute>
          } />
          
          {/* Data Flow Portal - Protected */}
          <Route path="/data-flows" element={
            <ProtectedRoute>
              <DataFlowPortal />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
