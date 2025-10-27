import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Video, FileText, Sparkles } from "lucide-react";
import { useKnowledgeData } from "@/hooks/useKnowledgeData";
import { knowledgeDashboardLinks } from "@/lib/knowledgeConfig";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    articles, 
    isLoading,
    filterArticles
  } = useKnowledgeData();

  const filteredArticles = filterArticles(searchQuery);

  // Extract source link from metadata
  const getSourceLink = (article: any) => {
    if (article.source_metadata?.video_url) {
      return article.source_metadata.video_url;
    }
    if (article.source_metadata?.url) {
      return article.source_metadata.url;
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Knowledge Insights</h1>
          <p className="text-muted-foreground mb-6">
            Searchable insights from training videos and uploaded content
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link to="/knowledge/analyze-training">
                <Video className="h-4 w-4 mr-2" />
                AI Video Analysis
              </Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/knowledge/upload-checklist">
                <FileText className="h-4 w-4 mr-2" />
                Upload Network Checklist
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">Loading insights...</CardContent>
            </Card>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {searchQuery ? 'No insights found matching your search.' : 'No insights yet. Upload a video to get started!'}
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => {
              const sourceLink = getSourceLink(article);
              
              return (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{article.title}</CardTitle>
                        <CardDescription className="text-base">
                          {article.content.substring(0, 200)}...
                        </CardDescription>
                      </div>
                      {sourceLink && (
                        <Link
                          to={sourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {article.source_type === 'video' ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                          <span className="text-sm">View Source</span>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {article.tags?.slice(0, 4).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
    </DashboardLayout>
  );
}