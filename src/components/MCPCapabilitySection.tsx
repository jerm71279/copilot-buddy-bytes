import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lightbulb, Wrench } from "lucide-react";
import { ReactNode } from "react";

interface MCPCapabilitySectionProps {
  type: 'instruction' | 'knowledge' | 'tools';
  title: string;
  description: string;
  count: number;
  icon: ReactNode;
  children: ReactNode;
}

export function MCPCapabilitySection({
  type,
  title,
  description,
  count,
  icon,
  children,
}: MCPCapabilitySectionProps) {
  const colorScheme = {
    instruction: 'border-primary/20 bg-primary/5',
    knowledge: 'border-accent/20 bg-accent/5',
    tools: 'border-secondary/20 bg-secondary/5',
  };

  return (
    <Card className={colorScheme[type]}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="ml-auto">
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export function getCapabilityIcon(type: 'instruction' | 'knowledge' | 'tools') {
  switch (type) {
    case 'instruction':
      return <Lightbulb className="h-5 w-5 text-primary" />;
    case 'knowledge':
      return <BookOpen className="h-5 w-5 text-accent" />;
    case 'tools':
      return <Wrench className="h-5 w-5 text-secondary" />;
  }
}
