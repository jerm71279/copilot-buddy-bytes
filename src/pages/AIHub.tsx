import { Badge } from "@/components/ui/badge";
import { AILevelCard } from "@/components/ai/AILevelCard";
import { AIIntegrationInfo } from "@/components/ai/AIIntegrationInfo";
import { aiLevels } from "@/config/aiHubConfig";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

const AIHub = () => {

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>

        {/* Header */}
        <div className="mb-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">AI Hub</h1>
            <Sparkles className="h-8 w-8 text-[hsl(var(--warning))]" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Access three powerful levels of AI assistance - from knowledge management to workflow intelligence to contextual department helpers
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Lightbulb className="h-3 w-3" />
              Powered by Lovable AI
            </Badge>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Self-Learning Systems
            </Badge>
          </div>
        </div>

        {/* AI Levels Grid */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
          {aiLevels.map((level) => (
            <AILevelCard key={level.level} level={level} />
          ))}
        </div>

        {/* Integration Info */}
        <AIIntegrationInfo />
      </div>
    </div>
  );
};

export default AIHub;
