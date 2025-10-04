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
import WorkflowAutomation from "./pages/WorkflowAutomation";
import NinjaOneIntegration from "./pages/NinjaOneIntegration";

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
          
          {/* Workflow Detail Pages */}
          <Route path="/workflow/:workflowType" element={<WorkflowDetail />} />
          
          {/* Knowledge Base - Protected */}
          <Route path="/knowledge" element={
            <ProtectedRoute>
              <KnowledgeBase />
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
          
          {/* NinjaOne Integration - Protected */}
          <Route path="/ninjaone" element={
            <ProtectedRoute>
              <NinjaOneIntegration />
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
