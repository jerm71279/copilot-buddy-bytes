import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  colorClass: string;
}

export function ToolCard({ title, description, icon: Icon, path, colorClass }: ToolCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer group"
      onClick={() => navigate(path)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <Icon className={`h-10 w-10 ${colorClass} mb-2 group-hover:scale-110 transition-transform`} />
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(path);
          }}
        >
          Open Tool
        </Button>
      </CardContent>
    </Card>
  );
}
