import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Risk {
  id: string;
  risk_title: string;
  probability: string;
  impact: string;
  risk_score: number;
  status: string;
  risk_category: string;
}

interface RiskMatrixProps {
  risks: Risk[];
}

export function RiskMatrix({ risks }: RiskMatrixProps) {
  const probabilityLevels = ["very_high", "high", "medium", "low", "very_low"];
  const impactLevels = ["very_low", "low", "medium", "high", "very_high"];

  const getRisksInCell = (probability: string, impact: string) => {
    return risks.filter(r => r.probability === probability && r.impact === impact);
  };

  const getCellColor = (probability: string, impact: string) => {
    const probValue = probabilityLevels.indexOf(probability) + 1;
    const impactValue = impactLevels.indexOf(impact) + 1;
    const score = probValue * impactValue;

    if (score >= 20) return "bg-red-100 border-red-500";
    if (score >= 12) return "bg-orange-100 border-orange-500";
    if (score >= 6) return "bg-yellow-100 border-yellow-500";
    return "bg-green-100 border-green-500";
  };

  const formatLabel = (level: string | undefined) => {
    if (!level) return "—";
    return level.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: "bg-secondary",
      resource: "bg-accent",
      schedule: "bg-warning",
      scope: "bg-secondary",
      external: "bg-accent",
      quality: "bg-primary",
      security: "bg-destructive",
    };
    return colors[category] || "bg-muted";
  };

  if (risks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No risks identified yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-destructive/10">
          <div className="text-2xl font-bold text-destructive">
            {risks.filter(r => r.risk_score >= 20).length}
          </div>
          <div className="text-sm text-muted-foreground">Critical Risks</div>
        </Card>
        <Card className="p-4 bg-warning/10">
          <div className="text-2xl font-bold text-warning">
            {risks.filter(r => r.risk_score >= 12 && r.risk_score < 20).length}
          </div>
          <div className="text-sm text-muted-foreground">High Risks</div>
        </Card>
        <Card className="p-4 bg-warning/5">
          <div className="text-2xl font-bold text-warning">
            {risks.filter(r => r.risk_score >= 6 && r.risk_score < 12).length}
          </div>
          <div className="text-sm text-muted-foreground">Medium Risks</div>
        </Card>
        <Card className="p-4 bg-primary/10">
          <div className="text-2xl font-bold text-primary">
            {risks.filter(r => r.risk_score < 6).length}
          </div>
          <div className="text-sm text-muted-foreground">Low Risks</div>
        </Card>
      </div>

      {/* Risk Matrix */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Matrix Header */}
            <div className="flex items-center mb-2">
              <div className="w-32 text-sm font-semibold text-center">
                Probability →<br/>Impact ↓
              </div>
              {impactLevels.map((level) => (
                <div key={level} className="flex-1 text-center text-sm font-semibold p-2">
                  {formatLabel(level)}
                </div>
              ))}
            </div>

            {/* Matrix Grid */}
            {probabilityLevels.map((probability) => (
              <div key={probability} className="flex items-stretch">
                <div className="w-32 flex items-center justify-center text-sm font-semibold p-2 border">
                  {formatLabel(probability)}
                </div>
                {impactLevels.map((impact) => {
                  const cellRisks = getRisksInCell(probability, impact);
                  return (
                    <div
                      key={`${probability}-${impact}`}
                      className={`flex-1 p-2 border-2 ${getCellColor(probability, impact)} min-h-[80px]`}
                    >
                      {cellRisks.length > 0 && (
                        <div className="space-y-1">
                          {cellRisks.map((risk) => (
                            <div
                              key={risk.id}
                              className="text-xs p-2 bg-background rounded border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              title={risk.risk_title}
                            >
                              <div className="font-medium truncate">{risk.risk_title}</div>
                              <div className="flex gap-1 mt-1">
                                <Badge
                                  className={`text-xs ${getCategoryColor(risk.risk_category)}`}
                                >
                                  {risk.risk_category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Score: {risk.risk_score}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Risk List */}
      <Card className="p-6">
        <div className="text-lg font-semibold mb-4">Top Risks by Score</div>
        <div className="space-y-2">
          {risks
            .sort((a, b) => b.risk_score - a.risk_score)
            .slice(0, 10)
            .map((risk) => (
              <div
                key={risk.id}
                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="font-medium">{risk.risk_title}</div>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getCategoryColor(risk.risk_category)}>
                      {risk.risk_category}
                    </Badge>
                    <Badge variant="outline">{risk.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm text-muted-foreground">
                    <div>P: {formatLabel(risk.probability)}</div>
                    <div>I: {formatLabel(risk.impact)}</div>
                  </div>
                  <div
                    className={`text-2xl font-bold px-4 py-2 rounded ${
                      risk.risk_score >= 20
                        ? "text-destructive"
                        : risk.risk_score >= 12
                        ? "text-warning"
                        : risk.risk_score >= 6
                        ? "text-warning"
                        : "text-primary"
                    }`}
                  >
                    {risk.risk_score}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}