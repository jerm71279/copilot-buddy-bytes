import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ChevronDown, ChevronUp, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { DocumentationItem, formatMarkdown } from "@/lib/developersConfig";

interface DocumentationCardProps {
  doc: DocumentationItem;
  isExpanded: boolean;
  isLoading: boolean;
  content: string | undefined;
  onToggle: () => void;
}

export function DocumentationCard({ doc, isExpanded, isLoading, content, onToggle }: DocumentationCardProps) {
  const Icon = doc.icon;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Icon className="h-8 w-8 text-primary" />
          <Badge variant="secondary">{doc.category}</Badge>
        </div>
        <CardTitle className="text-lg">{doc.title}</CardTitle>
        <CardDescription>{doc.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                {isExpanded ? "Hide" : "View"} Documentation
                {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : content ? (
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                  />
                </ScrollArea>
              ) : null}
            </CollapsibleContent>
          </Collapsible>
          {doc.diagram && (
            <Link to="/architecture-diagram">
              <Button variant="secondary" className="w-full">
                <Network className="mr-2 h-4 w-4" />
                View Full Diagram
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
