import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import IntegrationsPage from "./pages/IntegrationsPage";
import Auth from "./pages/Auth";
import DemoSelector from "./pages/DemoSelector";
import AdminDashboard from "./pages/AdminDashboard";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import ITDashboard from "./pages/ITDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import HRDashboard from "./pages/HRDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import NotFound from "./pages/NotFound";

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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/compliance" element={<ComplianceDashboard />} />
          <Route path="/dashboard/it" element={<ITDashboard />} />
          <Route path="/dashboard/operations" element={<OperationsDashboard />} />
          <Route path="/dashboard/hr" element={<HRDashboard />} />
          <Route path="/dashboard/finance" element={<FinanceDashboard />} />
          <Route path="/dashboard/sales" element={<SalesDashboard />} />
          <Route path="/dashboard/executive" element={<ExecutiveDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
