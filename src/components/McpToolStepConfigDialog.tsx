import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface McpTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface McpToolStepConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
  initialConfig: Record<string, any>;
}

export default function McpToolStepConfigDialog({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}: McpToolStepConfigDialogProps) {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [config, setConfig] = useState(initialConfig);

  useEffect(() => {
    const fetchTools = async () => {
      const { data, error } = await supabase.from("mcp_tools").select("*");
      if (error) {
        console.error("Error fetching MCP tools:", error);
      } else {
        setTools(data as McpTool[]);
        if (initialConfig.tool_name) {
          const tool = data.find(t => t.name === initialConfig.tool_name);
          if (tool) setSelectedTool(tool);
        }
      }
    };
    fetchTools();
  }, []);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleToolSelect = (toolName: string) => {
    const tool = tools.find(t => t.name === toolName);
    if (tool) {
      setSelectedTool(tool);
      setConfig({ tool_name: tool.name, input_data: {} });
    }
  };

  const handleInputChange = (paramName: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      input_data: {
        ...prev.input_data,
        [paramName]: value,
      },
    }));
  };

  const renderParameterInputs = () => {
    if (!selectedTool) return null;

    return Object.entries(selectedTool.parameters).map(([paramName, paramDef]) => (
      <div key={paramName} className="space-y-2">
        <Label htmlFor={paramName}>{paramDef.description}</Label>
        {paramDef.type === 'textarea' ? (
          <Textarea
            id={paramName}
            value={config.input_data?.[paramName] || ""}
            onChange={(e) => handleInputChange(paramName, e.target.value)}
          />
        ) : (
          <Input
            id={paramName}
            type={paramDef.type === 'number' ? 'number' : 'text'}
            value={config.input_data?.[paramName] || ""}
            onChange={(e) => handleInputChange(paramName, e.target.value)}
          />
        )}
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure MCP Tool Step</DialogTitle>
          <DialogDescription>
            Select an AI-driven tool and configure its input parameters.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tool-select">MCP Tool</Label>
            <Select onValueChange={handleToolSelect} value={selectedTool?.name}>
              <SelectTrigger id="tool-select">
                <SelectValue placeholder="Select a tool" />
              </SelectTrigger>
              <SelectContent>
                {tools.map(tool => (
                  <SelectItem key={tool.id} value={tool.name}>
                    {tool.name} - {tool.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTool && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Tool Parameters</h3>
              {renderParameterInputs()}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
