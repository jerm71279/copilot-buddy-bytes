import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book, ExternalLink, FileText, Database } from "lucide-react";

interface KnowledgeResource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'api' | 'database' | 'external';
  url?: string;
  metadata?: Record<string, any>;
}

interface MCPKnowledgeListProps {
  resources: KnowledgeResource[];
}

export function MCPKnowledgeList({ resources }: MCPKnowledgeListProps) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Book className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No knowledge resources available</p>
      </div>
    );
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'api':
        return <ExternalLink className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'default';
      case 'api':
        return 'secondary';
      case 'database':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {resources.map((resource) => (
        <Card key={resource.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-accent/10 mt-1">
                {getResourceIcon(resource.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold truncate">{resource.title}</h4>
                  <Badge variant={getTypeBadgeColor(resource.type)} className="text-xs flex-shrink-0">
                    {resource.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {resource.description}
                </p>
              </div>
            </div>
            {resource.url && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => window.open(resource.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
