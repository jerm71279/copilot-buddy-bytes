import { Card, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface DocumentationCardProps {
  docKey: string;
  title: string;
  description: string;
}

export function DocumentationCard({ docKey, title, description }: DocumentationCardProps) {
  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </Card>
  );
}
