import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { AILevel } from "@/config/aiHubConfig";

interface AILevelCardProps {
  level: AILevel;
}

export const AILevelCard = ({ level }: AILevelCardProps) => {
  const navigate = useNavigate();
  const IconComponent = level.icon;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`absolute top-0 right-0 w-32 h-32 ${level.bgColor} rounded-full blur-3xl opacity-20`} />
      
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className={`p-3 rounded-lg ${level.bgColor}`}>
            <IconComponent className={`h-8 w-8 ${level.color}`} />
          </div>
          <Badge variant="secondary">{level.badge}</Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Level {level.level}</span>
          </div>
          <CardTitle className="text-2xl">{level.title}</CardTitle>
          <p className="text-sm font-medium text-primary">{level.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">
          {level.description}
        </CardDescription>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Key Features:</p>
          <ul className="space-y-1">
            {level.features.map((feature, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button 
          onClick={() => navigate(level.path)} 
          className="w-full"
          variant={level.level === 2 ? "default" : "outline"}
        >
          {level.buttonText}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
