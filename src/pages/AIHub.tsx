import { Badge } from "@/components/ui/badge";
import { AILevelCard } from "@/components/ai/AILevelCard";
import { AIIntegrationInfo } from "@/components/ai/AIIntegrationInfo";
import { VisionAnalysisCard } from "@/components/ai/VisionAnalysisCard";
import { CacheMetricsCard } from "@/components/ai/CacheMetricsCard";
import { aiLevels } from "@/config/aiHubConfig";
import { PageContainer } from "@/components/shared/PageContainer";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

const AIHub = () => {
  return (
    <PageContainer>
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

        {/* New Capabilities Section */}
        <div className="mt-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Advanced AI Capabilities</h2>
            <p className="text-muted-foreground">
              Enhanced with Vision Analysis and Intelligent Prompt Caching
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisionAnalysisCard />
            <CacheMetricsCard />
          </div>
        </div>
    </PageContainer>
  );
};

export default AIHub;
