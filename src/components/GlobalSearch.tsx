import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Workflow, Shield, Database, GitBranch, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  type: string;
  title: string;
  url: string;
  data: any;
}

interface SearchResponse {
  results: SearchResult[];
  aiSummary?: string;
  topMatch?: string;
  devMode?: boolean;
  userRoles?: string[];
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  workflow: Workflow,
  "workflow-template": Workflow,
  "workflow-node": Workflow,
  compliance: Shield,
  "compliance-control": Shield,
  evidence: FileText,
  cmdb: Database,
  knowledge: FileText,
  change: GitBranch,
  "change-schedule": GitBranch,
  project: GitBranch,
  vendor: FileText,
  budget: FileText,
  incident: Shield,
  "service-request": FileText,
  lead: FileText,
  opportunity: FileText,
  quote: FileText,
  "purchase-order": FileText,
  invoice: FileText,
  expense: FileText,
  "employee-onboarding": FileText,
  contract: FileText,
  "config-item": Database,
  "cipp-policy": Shield,
  product: FileText,
  "customer-account": FileText,
  page: Sparkles,
  anomaly: Shield,
  audit: Shield,
  user: FileText,
  application: FileText,
  tenant: Database,
  onboarding: FileText,
  framework: Shield,
  "ai-chat": Sparkles,
  risk: Shield,
  remediation: Shield,
  sla: FileText,
  department: FileText,
  employee: FileText,
  "time-entry": FileText,
  "leave-request": FileText,
  warehouse: Database,
  inventory: Database,
  "network-device": Database,
  "mcp-server": Database,
  "prompt-template": Sparkles,
  role: Shield,
  "asset-financial": FileText,
  "automation-suggestion": Sparkles,
};

const typeLabels = {
  workflow: "Workflow",
  "workflow-template": "Workflow Template",
  "workflow-node": "Workflow Node",
  compliance: "Compliance",
  "compliance-control": "Compliance Control",
  evidence: "Evidence",
  cmdb: "CMDB",
  knowledge: "Knowledge",
  change: "Change Request",
  "change-schedule": "Maintenance Schedule",
  project: "Project",
  vendor: "Vendor",
  budget: "Budget",
  incident: "Incident",
  "service-request": "Service Request",
  lead: "Lead",
  opportunity: "Opportunity",
  quote: "Quote",
  "purchase-order": "Purchase Order",
  invoice: "Invoice",
  expense: "Expense",
  "employee-onboarding": "Employee Onboarding",
  contract: "Contract",
  "config-item": "Configuration Item",
  "cipp-policy": "CIPP Policy",
  product: "Product",
  "customer-account": "Customer Account",
  page: "Page",
  anomaly: "Anomaly",
  audit: "Audit Log",
  user: "User",
  application: "Application",
  tenant: "Tenant",
  onboarding: "Client Onboarding",
  framework: "Framework",
  "ai-chat": "AI Chat",
  risk: "Risk Assessment",
  remediation: "Remediation Rule",
  sla: "SLA",
  department: "Department",
  employee: "Employee",
  "time-entry": "Time Entry",
  "leave-request": "Leave Request",
  warehouse: "Warehouse",
  inventory: "Inventory",
  "network-device": "Network Device",
  "mcp-server": "MCP Server",
  "prompt-template": "Prompt Template",
  role: "Role",
  "asset-financial": "Asset Financial",
  "automation-suggestion": "Automation",
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const navigate = useNavigate();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAiSummary("");
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("global-search", {
        body: { query: searchQuery },
        headers: session?.session ? {
          Authorization: `Bearer ${session.session.access_token}`
        } : {}
      });

      if (error) throw error;

      const response = data as SearchResponse;
      setResults(response.results || []);
      setAiSummary(response.aiSummary || "");
      setDevMode(response.devMode || false);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything - workflows, projects, vendors, incidents, pages..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>

        {aiSummary && (
          <div className="px-4 py-3 bg-muted/50 border-b flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
            <p className="text-sm text-muted-foreground">{aiSummary}</p>
          </div>
        )}

        {devMode && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
              🔓 Development Mode: Showing all results without RBAC filtering
            </p>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Searching...</div>
          ) : results.length === 0 && query ? (
            <div className="p-8 text-center text-muted-foreground">No results found</div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type as keyof typeof typeIcons] || FileText;
                const label = typeLabels[result.type as keyof typeof typeLabels] || result.type;
                
                return (
                  <button
                    key={`${result.type}-${result.url}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left hover:bg-accent transition-colors ${
                      index === selectedIndex ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      {result.data.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {result.data.description}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI-powered
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
