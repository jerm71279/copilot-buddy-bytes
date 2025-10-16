import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const AIIntegrationInfo = () => {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          How These Systems Work Together
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center">
                <span className="text-xs font-bold text-[hsl(var(--success))]">1</span>
              </div>
              <h3 className="font-semibold text-sm">Knowledge Foundation</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              The Knowledge Chat learns from all interactions, building a growing knowledge base that powers the other AI systems
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-sm">Process Intelligence</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Workflow Intelligence analyzes real-time data to provide actionable insights about your operations and compliance
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[hsl(var(--warning))]/20 flex items-center justify-center">
                <span className="text-xs font-bold text-[hsl(var(--warning))]">3</span>
              </div>
              <h3 className="font-semibold text-sm">Contextual Assistance</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Department AI Assistants use insights from levels 1 & 2 to provide targeted help where you work
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>💡 Pro Tip:</strong> Start with Level 1 to build your knowledge base, then use Level 2 for operational insights, 
            and access Level 3 assistants throughout your daily workflow for contextual help.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
