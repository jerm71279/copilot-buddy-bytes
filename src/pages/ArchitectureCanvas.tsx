import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import mermaid from "mermaid";

const ArchitectureCanvas = () => {
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState("frontend-edge");
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    // Force re-render of Mermaid diagrams when tab or zoom changes
    const timer = setTimeout(() => {
      mermaid.run();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, zoom, renderKey]);

  const frontendToEdgeDiagram = `
graph TB
    subgraph "Frontend Components"
        Portal[Employee Portal]
        AIAssist[Department AI Assistant]
        IntAssist[Intelligent Assistant]
        WorkflowUI[Workflow Builder UI]
        SalesDash[Sales Dashboard]
        ITDash[IT Dashboard]
        IntegUI[Integrations UI]
        KnowledgeUI[Knowledge Base UI]
        MCPGen[MCP Generator UI]
        ExecDash[Executive Dashboard]
        CompDash[Compliance Dashboard]
    end
    
    subgraph "Edge Functions"
        DeptAssist[department-assistant]
        IntellAssist[intelligent-assistant]
        WorkflowExec[workflow-executor]
        WorkflowHook[workflow-webhook]
        RevioData[revio-data]
        GraphAPI[graph-api]
        SharePointSync[sharepoint-sync]
        KnowProc[knowledge-processor]
        AIMCPGen[ai-mcp-generator]
        WorkflowInsights[workflow-insights]
        CIPPSync[cipp-sync]
    end
    
    Portal --> DeptAssist
    AIAssist --> DeptAssist
    IntAssist --> IntellAssist
    WorkflowUI --> WorkflowExec
    WorkflowUI --> WorkflowHook
    SalesDash --> RevioData
    ITDash --> GraphAPI
    IntegUI --> SharePointSync
    KnowledgeUI --> KnowProc
    MCPGen --> AIMCPGen
    ExecDash --> WorkflowInsights
    CompDash --> CIPPSync
    
    style Portal fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style DeptAssist fill:#10b981,stroke:#059669,color:#fff
`;

  const edgeToBackendDiagram = `
graph TB
    subgraph "Edge Functions"
        DeptAssist[department-assistant]
        IntellAssist[intelligent-assistant]
        WorkflowExec[workflow-executor]
        WorkflowHook[workflow-webhook]
        KnowProc[knowledge-processor]
        AIMCPGen[ai-mcp-generator]
        MCPServer[mcp-server]
        WorkflowInsights[workflow-insights]
        CIPPSync[cipp-sync]
    end
    
    subgraph "Backend Tables"
        AIInteract[ai_interactions]
        KnowArticles[knowledge_articles]
        KnowFiles[knowledge_files]
        WorkflowExecs[workflow_executions]
        Workflows[workflows]
        WorkflowTriggers[workflow_triggers]
        MCPServers[mcp_servers]
        MCPTools[mcp_tools]
        MCPLogs[mcp_execution_logs]
        CompFrameworks[compliance_frameworks]
    end
    
    DeptAssist --> AIInteract
    DeptAssist --> KnowArticles
    IntellAssist --> AIInteract
    WorkflowExec --> WorkflowExecs
    WorkflowExec --> Workflows
    WorkflowHook --> WorkflowTriggers
    KnowProc --> KnowArticles
    KnowProc --> KnowFiles
    AIMCPGen --> MCPServers
    AIMCPGen --> MCPTools
    MCPServer --> MCPLogs
    WorkflowInsights --> WorkflowExecs
    CIPPSync --> CompFrameworks
    
    style DeptAssist fill:#10b981,stroke:#059669,color:#fff
    style AIInteract fill:#3b82f6,stroke:#2563eb,color:#fff
`;

  const edgeToExternalDiagram = `
graph TB
    subgraph "Edge Functions"
        GraphAPI[graph-api]
        SharePointSync[sharepoint-sync]
        RevioData[revio-data]
        CIPPSync[cipp-sync]
        WorkflowExec[workflow-executor]
        DeptAssist[department-assistant]
        IntellAssist[intelligent-assistant]
        KnowProc[knowledge-processor]
        AIMCPGen[ai-mcp-generator]
    end
    
    subgraph "External Systems"
        M365[Microsoft 365<br/>Calendar/Email/Teams]
        SharePoint[SharePoint<br/>Documents]
        Revio[Revio Billing<br/>Revenue Data]
        CIPP[CIPP<br/>M365 Tenant Management]
        NinjaOne[NinjaOne<br/>RMM/PSA]
        LovableAI[Lovable AI<br/>Gemini/GPT Models]
    end
    
    GraphAPI --> M365
    SharePointSync --> SharePoint
    RevioData --> Revio
    CIPPSync --> CIPP
    WorkflowExec --> NinjaOne
    DeptAssist --> LovableAI
    IntellAssist --> LovableAI
    KnowProc --> LovableAI
    AIMCPGen --> LovableAI
    
    style GraphAPI fill:#10b981,stroke:#059669,color:#fff
    style M365 fill:#0078d4,stroke:#106ebe,color:#fff
    style Revio fill:#3b82f6,stroke:#2563eb,color:#fff
    style LovableAI fill:#f59e0b,stroke:#d97706,color:#fff
`;

  const backendRelationshipsDiagram = `
graph TB
    subgraph "Core Tables"
        Users[user_profiles]
        Customers[customers]
        Roles[roles + user_roles]
        Apps[applications]
    end
    
    subgraph "Integration Data"
        Integrations[integrations]
        IntegCreds[integration_credentials]
        OnboardData[client_onboardings]
    end
    
    subgraph "Workflow System"
        Workflows[workflows]
        WorkflowSteps[workflow_steps]
        WorkflowExecs[workflow_executions]
        WorkflowTriggers[workflow_triggers]
    end
    
    subgraph "AI & Knowledge"
        AIInteract[ai_interactions]
        KnowArticles[knowledge_articles]
        KnowFiles[knowledge_files]
        MLInsights[ml_insights]
    end
    
    subgraph "MCP System"
        MCPServers[mcp_servers]
        MCPTools[mcp_tools]
        MCPLogs[mcp_execution_logs]
    end
    
    Users --> Customers
    Roles --> Users
    Apps --> Roles
    Integrations --> Customers
    IntegCreds --> Integrations
    OnboardData --> Customers
    Workflows --> Customers
    WorkflowSteps --> Workflows
    MCPServers --> Customers
    MCPTools --> MCPServers
    KnowArticles --> Customers
    
    style Users fill:#3b82f6,stroke:#2563eb,color:#fff
    style Customers fill:#10b981,stroke:#059669,color:#fff
`;

  const authSecurityDiagram = `
graph TB
    subgraph "Frontend"
        Landing[Landing Page]
        Portal[Employee Portal]
    end
    
    Auth[Supabase Auth<br/>Email + OAuth]
    RLS[Row Level Security<br/>Policies]
    
    subgraph "Protected Tables"
        Users[user_profiles]
        Customers[customers]
        Workflows[workflows]
        KnowArticles[knowledge_articles]
        AIInteract[ai_interactions]
        Roles[roles]
    end
    
    Landing --> Auth
    Portal --> Auth
    Auth --> Users
    Auth --> Roles
    RLS --> Auth
    
    RLS -.->|Protects| Users
    RLS -.->|Protects| Customers
    RLS -.->|Protects| Workflows
    RLS -.->|Protects| KnowArticles
    RLS -.->|Protects| AIInteract
    
    style Landing fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style Portal fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style Auth fill:#10b981,stroke:#059669,color:#fff
    style RLS fill:#ef4444,stroke:#dc2626,color:#fff
`;

  const complianceDiagram = `
graph TB
    subgraph "Compliance System"
        CompFrameworks[compliance_frameworks]
        CompControls[compliance_controls]
        CompReports[compliance_reports]
        AuditLogs[audit_logs]
    end
    
    subgraph "Integration Points"
        Customers[customers]
        Users[users]
        Workflows[workflows]
        WorkflowExecs[workflow_executions]
    end
    
    CompFrameworks --> CompControls
    CompReports --> Customers
    AuditLogs --> Users
    CompControls --> Workflows
    CompReports --> AuditLogs
    CompFrameworks --> Customers
    WorkflowExecs --> CompReports
    AuditLogs --> CompControls
    
    style CompFrameworks fill:#ec4899,stroke:#db2777,color:#fff
    style CompControls fill:#ec4899,stroke:#db2777,color:#fff
    style CompReports fill:#ec4899,stroke:#db2777,color:#fff
    style AuditLogs fill:#ef4444,stroke:#dc2626,color:#fff
`;

  const renderCanvas = (diagram: string, tabKey: string) => (
    <div className="border border-border rounded-lg bg-card shadow-lg overflow-auto" style={{ height: 'calc(100vh - 280px)' }}>
      <div 
        className="p-8 transition-transform duration-200"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          minWidth: '1200px'
        }}
      >
        <pre className="mermaid" key={`${tabKey}-${renderKey}`}>
          {diagram}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[98vw] mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OberaConnect System Architecture</h1>
            <p className="text-muted-foreground mt-1">Separate canvases for each system connection</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(1)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="frontend-edge" className="w-full" onValueChange={(value) => {
          setActiveTab(value);
          setRenderKey(prev => prev + 1);
        }}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="frontend-edge">Frontend → Edge</TabsTrigger>
            <TabsTrigger value="edge-backend">Edge → Backend</TabsTrigger>
            <TabsTrigger value="edge-external">Edge → External</TabsTrigger>
            <TabsTrigger value="backend">Backend</TabsTrigger>
            <TabsTrigger value="auth">Auth & Security</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="frontend-edge" className="mt-4">
            {renderCanvas(frontendToEdgeDiagram, 'frontend-edge')}
          </TabsContent>
          
          <TabsContent value="edge-backend" className="mt-4">
            {renderCanvas(edgeToBackendDiagram, 'edge-backend')}
          </TabsContent>
          
          <TabsContent value="edge-external" className="mt-4">
            {renderCanvas(edgeToExternalDiagram, 'edge-external')}
          </TabsContent>
          
          <TabsContent value="backend" className="mt-4">
            {renderCanvas(backendRelationshipsDiagram, 'backend')}
          </TabsContent>
          
          <TabsContent value="auth" className="mt-4">
            {renderCanvas(authSecurityDiagram, 'auth')}
          </TabsContent>
          
          <TabsContent value="compliance" className="mt-4">
            {renderCanvas(complianceDiagram, 'compliance')}
          </TabsContent>
        </Tabs>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-muted-foreground">Frontend Layer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-muted-foreground">Edge Functions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-muted-foreground">Backend Tables</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ec4899' }}></div>
            <span className="text-muted-foreground">Compliance System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureCanvas;
