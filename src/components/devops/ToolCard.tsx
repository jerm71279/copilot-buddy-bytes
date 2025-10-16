import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface ToolCardProps {
  title: string;
  description: string;
  path: string;
  colorClass: string;
}

export function ToolCard({ title, description, path, colorClass }: ToolCardProps) {
  return (
    <Link to={path}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle className={colorClass}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
