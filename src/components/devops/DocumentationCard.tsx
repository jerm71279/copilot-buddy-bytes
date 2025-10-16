import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DocumentationCardProps {
  title: string;
  description: string;
  docKey: string;
}

export function DocumentationCard({ title, description, docKey }: DocumentationCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
      <div className="flex-1">
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate(`/docs?doc=${docKey}`)}
      >
        View
      </Button>
    </div>
  );
}
