import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MCPServerStatus from "@/components/MCPServerStatus";
import { MCPServerConfig } from "@/components/MCPServerConfig";
import { AIMCPGenerator } from "@/components/AIMCPGenerator";
import MCPExecutionLogs from "@/components/MCPExecutionLogs";
import { AutonomousAgentMonitor } from "@/components/AutonomousAgentMonitor";
import { AIAgentConfiguration } from "@/components/AIAgentConfiguration";
import { toast } from "sonner";

type ActiveViewType = 'mcp-status' | 'mcp-logs' | 'mcp-configure' | 'mcp-ai' | 'ai-agents' | 'ai-config';

interface AdminActiveViewProps {
  activeView: ActiveViewType | null;
  userCustomerId: string;
  onClose: () => void;
  onServersCreated: () => void;
}

const VIEW_TITLES: Record<ActiveViewType, string> = {
  'mcp-status': 'MCP Server Status',
  'mcp-logs': 'Execution Logs',
  'mcp-configure': 'Configure New Server',
  'mcp-ai': 'AI MCP Generator',
  'ai-agents': 'Autonomous AI Agents',
  'ai-config': 'AI Agent Configuration'
};

export function AdminActiveView({ activeView, userCustomerId, onClose, onServersCreated }: AdminActiveViewProps) {
  if (!activeView) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{VIEW_TITLES[activeView]}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeView === 'mcp-status' && <MCPServerStatus customerId={userCustomerId} />}
        {activeView === 'mcp-logs' && <MCPExecutionLogs customerId={userCustomerId} />}
        {activeView === 'mcp-configure' && <MCPServerConfig customerId={userCustomerId} />}
        {activeView === 'mcp-ai' && (
          <AIMCPGenerator 
            customerId={userCustomerId}
            department="admin"
            onServersCreated={() => {
              toast.success("MCP servers created successfully!");
              onServersCreated();
            }}
          />
        )}
        {activeView === 'ai-agents' && <AutonomousAgentMonitor />}
        {activeView === 'ai-config' && <AIAgentConfiguration />}
      </CardContent>
    </Card>
  );
}
