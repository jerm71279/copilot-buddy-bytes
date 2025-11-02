import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Loader2, Plus, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MCPKnowledgeUploadProps {
  serverId?: string;
  onUploadSuccess?: () => void;
}

export function MCPKnowledgeUpload({ serverId, onUploadSuccess }: MCPKnowledgeUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    contentType: "document",
    sourceUrl: "",
    tags: "",
    enableChunking: true,
  });

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsLoading(true);

    try {
      const tags = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { data, error } = await supabase.functions.invoke('mcp-knowledge-upload', {
        body: {
          title: formData.title.trim(),
          content: formData.content.trim(),
          contentType: formData.contentType,
          serverId,
          sourceUrl: formData.sourceUrl.trim() || null,
          tags,
          enableChunking: formData.enableChunking,
        },
      });

      if (error) throw error;

      if (data.success) {
        const message = data.chunksCreated 
          ? `Knowledge entry created with ${data.chunksCreated} chunks`
          : "Knowledge entry created successfully";
        toast.success(message);
        setFormData({
          title: "",
          content: "",
          contentType: "document",
          sourceUrl: "",
          tags: "",
          enableChunking: true,
        });
        setIsOpen(false);
        onUploadSuccess?.();
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload knowledge");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Knowledge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Knowledge Entry</DialogTitle>
          <DialogDescription>
            Upload documentation, guides, or reference materials to the knowledge base
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type</Label>
            <Select
              value={formData.contentType}
              onValueChange={(value) => setFormData({ ...formData, contentType: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="api_doc">API Documentation</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter the content, documentation, or information"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
            <Input
              id="sourceUrl"
              placeholder="https://example.com/docs"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="api, configuration, troubleshooting"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                <Label htmlFor="enableChunking">Enable Chunking</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Split large documents for better retrieval
              </p>
            </div>
            <Switch
              id="enableChunking"
              checked={formData.enableChunking}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableChunking: checked })
              }
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Knowledge
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
