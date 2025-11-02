import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle } from "lucide-react";

interface Instruction {
  id: string;
  title: string;
  content: string;
  priority?: 'high' | 'medium' | 'low';
}

interface MCPInstructionsListProps {
  instructions: Instruction[];
}

export function MCPInstructionsList({ instructions }: MCPInstructionsListProps) {
  if (instructions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No instructions available</p>
      </div>
    );
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-3">
      {instructions.map((instruction) => (
        <Card key={instruction.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 mt-1">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">{instruction.title}</h4>
                {instruction.priority && (
                  <Badge variant={getPriorityColor(instruction.priority)} className="text-xs">
                    {instruction.priority}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {instruction.content}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
