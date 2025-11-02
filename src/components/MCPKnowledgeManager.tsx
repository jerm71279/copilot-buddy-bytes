import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink, FileText } from "lucide-react";
import { useMCPKnowledge, useDeleteKnowledge } from "@/hooks/useMCPKnowledge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MCPKnowledgeManagerProps {
  serverId?: string;
}

export function MCPKnowledgeManager({ serverId }: MCPKnowledgeManagerProps) {
  const { data: knowledgeEntries, isLoading } = useMCPKnowledge(serverId);
  const deleteKnowledge = useDeleteKnowledge();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!knowledgeEntries || knowledgeEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No knowledge entries yet</p>
        <p className="text-sm mt-1">Upload documentation to get started</p>
      </div>
    );
  }

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'api_doc':
        return 'default';
      case 'faq':
        return 'secondary';
      case 'guide':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-3">
      {knowledgeEntries.map((entry) => (
        <Card key={entry.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold">{entry.title}</h4>
                  <Badge variant={getContentTypeColor(entry.content_type)} className="text-xs">
                    {entry.content_type.replace('_', ' ')}
                  </Badge>
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.content}
                </p>
                {entry.source_url && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => window.open(entry.source_url!, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Source
                  </Button>
                )}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Knowledge Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{entry.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteKnowledge.mutate(entry.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
