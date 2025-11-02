import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthFunctions } from '@/hooks/useAuthFunctions';

interface AIMCPGeneratorProps {
  customerId: string;
  department: string;
  onServersCreated?: () => void;
}

interface CreatedServer {
  server: {
    id: string;
    server_name: string;
    description: string;
    status: string;
  };
  tools: Array<{
    tool_name: string;
    description: string;
  }>;
  ai_reasoning: string;
}

export const AIMCPGenerator: React.FC<AIMCPGeneratorProps> = ({ 
  customerId, 
  department,
  onServersCreated 
}) => {
  const { toast } = useToast();
  const { aiMCPGenerator } = useAuthFunctions();
  const [currentProcesses, setCurrentProcesses] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [goals, setGoals] = useState('');
  const [createdServers, setCreatedServers] = useState<CreatedServer[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!currentProcesses.trim() || !painPoints.trim() || !goals.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to help AI understand your needs",
        variant: "destructive",
      });
      return;
    }

    setShowResults(false);

    const result = await aiMCPGenerator.invoke({
      prompt: `Generate MCP servers for ${department} with REAL endpoint suggestions where possible`,
      config: {
        customerId,
        department,
        businessContext: {
          currentProcesses: currentProcesses.split('\n').filter(p => p.trim()),
          painPoints: painPoints.split('\n').filter(p => p.trim()),
          goals: goals.split('\n').filter(g => g.trim()),
        },
        preferRealEndpoints: true, // Signal to AI to suggest real MCP servers
      }
    });

    if (result?.success) {
      setCreatedServers(result.servers);
      setShowResults(true);
      
      toast({
        title: "MCP Servers Created!",
        description: `AI generated ${result.serversCreated} server(s) to optimize your workflows`,
      });

      setCurrentProcesses('');
      setPainPoints('');
      setGoals('');

      if (onServersCreated) {
        onServersCreated();
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI-Powered MCP Generator</CardTitle>
          </div>
          <CardDescription>
            Describe your business processes and challenges. AI will automatically create 
            MCP servers with custom tools to streamline your workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="processes">Current Processes (one per line)</Label>
            <Textarea
              id="processes"
              placeholder="e.g., Manual data entry into spreadsheets&#10;Weekly compliance report generation&#10;Email-based approval workflows"
              value={currentProcesses}
              onChange={(e) => setCurrentProcesses(e.target.value)}
              rows={4}
              disabled={aiMCPGenerator.isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="painpoints">Pain Points & Bottlenecks (one per line)</Label>
            <Textarea
              id="painpoints"
              placeholder="e.g., Reports take 3+ hours to compile manually&#10;Approval delays slow down projects&#10;Difficult to track compliance status"
              value={painPoints}
              onChange={(e) => setPainPoints(e.target.value)}
              rows={4}
              disabled={aiMCPGenerator.isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Automation Goals (one per line)</Label>
            <Textarea
              id="goals"
              placeholder="e.g., Reduce report generation time to under 10 minutes&#10;Automate approval notifications&#10;Real-time compliance dashboards"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
              disabled={aiMCPGenerator.isLoading}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={aiMCPGenerator.isLoading}
            className="w-full"
          >
            {aiMCPGenerator.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is analyzing and creating servers...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate MCP Servers with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {showResults && createdServers.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
              <CardTitle>Successfully Created {createdServers.length} MCP Server(s)</CardTitle>
            </div>
            <CardDescription>
              AI has analyzed your needs and created the following automation servers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {createdServers.map((serverData, index) => (
              <Card key={serverData.server.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{serverData.server.server_name}</span>
                    <Badge variant="secondary">{serverData.server.status}</Badge>
                  </CardTitle>
                  <CardDescription>{serverData.server.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {serverData.ai_reasoning && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        <strong>AI Reasoning:</strong> {serverData.ai_reasoning}
                      </p>
                    </div>
                  )}
                  
                  {serverData.tools.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Available Tools:</h4>
                      <div className="space-y-2">
                        {serverData.tools.map((tool, toolIndex) => (
                          <div key={toolIndex} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{tool.tool_name}</strong>
                              <p className="text-muted-foreground">{tool.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
