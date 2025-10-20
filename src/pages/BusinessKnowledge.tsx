import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ExternalLink, RefreshCw, FileText, Globe, Github, Upload, Calendar, Eye, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_metadata: any;
  created_at: string;
  tags: string[];
}

interface SourceStats {
  source_type: string;
  count: number;
  total_size: number;
  avg_size: number;
}

export default function BusinessKnowledge() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [stats, setStats] = useState<SourceStats[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReingesting, setIsReingesting] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadSource, setUploadSource] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKnowledgeBase();
    loadStats();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery, sourceFilter]);

  const loadKnowledgeBase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .not('source_type', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('source_type, content')
        .not('source_type', 'is', null);

      if (error) throw error;

      const statsMap = new Map<string, { count: number; totalSize: number }>();
      data?.forEach(article => {
        const type = article.source_type || 'unknown';
        const size = article.content?.length || 0;
        const current = statsMap.get(type) || { count: 0, totalSize: 0 };
        statsMap.set(type, {
          count: current.count + 1,
          totalSize: current.totalSize + size
        });
      });

      const statsArray: SourceStats[] = Array.from(statsMap.entries()).map(([type, data]) => ({
        source_type: type,
        count: data.count,
        total_size: data.totalSize,
        avg_size: Math.round(data.totalSize / data.count)
      }));

      setStats(statsArray);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query) ||
        article.source_metadata?.source?.toLowerCase().includes(query) ||
        article.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter(article => article.source_type === sourceFilter);
    }

    setFilteredArticles(filtered);
  };

  const handleUpload = async () => {
    if (!uploadUrl || !uploadSource) {
      toast({
        title: "Missing fields",
        description: "Please provide both URL and source name",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) throw new Error("No customer ID found");

      const { error } = await supabase.functions.invoke('ingest-documentation', {
        body: {
          url: uploadUrl,
          source: uploadSource,
          customerId: profile.customer_id
        }
      });

      if (error) throw error;

      toast({
        title: "Ingestion started",
        description: "The content is being processed in the background",
      });

      setShowUploadDialog(false);
      setUploadUrl("");
      setUploadSource("");

      // Reload after delay
      setTimeout(() => {
        loadKnowledgeBase();
        loadStats();
      }, 3000);
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReingest = async (article: KnowledgeArticle) => {
    if (!article.source_metadata?.url) {
      toast({
        title: "Cannot re-ingest",
        description: "No source URL found for this article",
        variant: "destructive",
      });
      return;
    }

    setIsReingesting(article.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) throw new Error("No customer ID found");

      // Delete old article
      await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', article.id);

      // Re-ingest
      const { error } = await supabase.functions.invoke('ingest-documentation', {
        body: {
          url: article.source_metadata.url,
          source: article.source_metadata.source || 'Unknown',
          customerId: profile.customer_id
        }
      });

      if (error) throw error;

      toast({
        title: "Re-ingestion started",
        description: "The page is being re-processed",
      });

      setTimeout(() => {
        loadKnowledgeBase();
        loadStats();
      }, 2000);
    } catch (error) {
      console.error('Error re-ingesting:', error);
      toast({
        title: "Re-ingestion failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsReingesting(null);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'vendor_documentation':
        return <Globe className="h-4 w-4" />;
      case 'file_import':
        return <Upload className="h-4 w-4" />;
      case 'github':
        return <Github className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getContentQuality = (size: number) => {
    if (size < 100) return { label: "Poor", variant: "destructive" as const, needsReingest: true };
    if (size < 1000) return { label: "Low", variant: "default" as const, needsReingest: true };
    if (size < 5000) return { label: "Good", variant: "default" as const, needsReingest: false };
    return { label: "Excellent", variant: "default" as const, needsReingest: false };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <DashboardNavigation />
      <main className="container mx-auto p-8 space-y-6" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Business Knowledge</h1>
            <p className="text-muted-foreground">View and manage all ingested business content</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { loadKnowledgeBase(); loadStats(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{articles.length}</div>
            </CardContent>
          </Card>
          {stats.map(stat => {
            const quality = getContentQuality(stat.avg_size);
            return (
              <Card key={stat.source_type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getSourceIcon(stat.source_type)}
                    {stat.source_type.replace(/_/g, ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Avg: {formatBytes(stat.avg_size)}
                  </div>
                  <Badge variant={quality.variant} className="mt-2 text-xs">
                    {quality.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search Knowledge</CardTitle>
            <CardDescription>
              {filteredArticles.length} of {articles.length} articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles, sources, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={sourceFilter} onValueChange={setSourceFilter} className="w-fit">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="vendor_documentation">Vendors</TabsTrigger>
                  <TabsTrigger value="file_import">Files</TabsTrigger>
                  <TabsTrigger value="github">GitHub</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading knowledge base...
              </CardContent>
            </Card>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No articles found matching your criteria
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map(article => {
              const quality = getContentQuality(article.content?.length || 0);
              return (
                <Card key={article.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSourceIcon(article.source_type)}
                          <h3 className="font-semibold text-lg">{article.title}</h3>
                          {quality.needsReingest && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Content
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {article.content?.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(article.created_at).toLocaleDateString()}
                          </div>
                          {article.source_metadata?.source && (
                            <Badge variant="outline">{article.source_metadata.source}</Badge>
                          )}
                          <Badge variant={quality.variant}>{formatBytes(article.content?.length || 0)}</Badge>
                          {article.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {article.source_metadata?.url && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(article.source_metadata.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={quality.needsReingest ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleReingest(article)}
                              disabled={isReingesting === article.id}
                            >
                              <RefreshCw className={`h-4 w-4 ${isReingesting === article.id ? 'animate-spin' : ''}`} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Business Content</DialogTitle>
            <DialogDescription>
              Add a webpage or documentation URL to ingest into the knowledge base
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="source">Source Name *</Label>
              <Input
                id="source"
                placeholder="e.g., Microsoft Azure, Cisco Documentation"
                value={uploadSource}
                onChange={(e) => setUploadSource(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="url">Content URL *</Label>
              <Textarea
                id="url"
                placeholder="https://example.com/documentation"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadUrl || !uploadSource}>
              {isUploading ? "Ingesting..." : "Ingest Content"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getSourceIcon(selectedArticle.source_type)}
                <span>{selectedArticle.source_type.replace(/_/g, ' ')}</span>
                {selectedArticle.source_metadata?.source && (
                  <>
                    <span>•</span>
                    <span>{selectedArticle.source_metadata.source}</span>
                  </>
                )}
                {selectedArticle.source_metadata?.url && (
                  <>
                    <span>•</span>
                    <a
                      href={selectedArticle.source_metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      View Source <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                  {selectedArticle.content}
                </pre>
              </div>
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedArticle.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
