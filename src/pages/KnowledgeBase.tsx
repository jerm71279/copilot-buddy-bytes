import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Lightbulb, FileText } from "lucide-react";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { useKnowledgeData } from "@/hooks/useKnowledgeData";
import { 
  getArticleIcon, 
  getArticleTypeColor, 
  formatArticleType,
  knowledgeActionButtons,
  knowledgeDashboardLinks 
} from "@/lib/knowledgeConfig";

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    articles, 
    insights, 
    categories, 
    isLoading,
    filterArticles,
    getArticlesByType 
  } = useKnowledgeData();

  const filteredArticles = filterArticles(searchQuery);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-56 pb-8">
        <DashboardNavigation 
          title="Knowledge Base"
          dashboards={knowledgeDashboardLinks}
        />
        
        <div className="mb-8">
          <p className="text-muted-foreground">
            Search SOPs, guides, and AI-generated insights from your workflows
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {knowledgeActionButtons.map((action) => (
            action.path.startsWith('/knowledge/') ? (
              <Button 
                key={action.path}
                variant={action.variant}
                size={action.size}
                onClick={() => navigate(action.path)}
              >
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </Button>
            ) : (
              <Link key={action.path} to={action.path}>
                <Button variant={action.variant} size={action.size}>
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Button>
              </Link>
            )
          ))}
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="articles">All Articles ({filteredArticles.length})</TabsTrigger>
            <TabsTrigger value="sops">SOPs</TabsTrigger>
            <TabsTrigger value="insights">AI Insights ({insights.length})</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">Loading articles...</CardContent>
              </Card>
            ) : filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No articles found. Create your first knowledge article!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/knowledge/${article.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getArticleIcon(article.knowledge_type || article.article_type)}
                          <Badge className={getArticleTypeColor(article.knowledge_type || article.article_type)}>
                            {formatArticleType(article.knowledge_type || article.article_type)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">v{article.version || '1.0'}</span>
                      </div>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {article.content.substring(0, 150)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {article.tags?.slice(0, 3).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(article.updated_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sops">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getArticlesByType('sop').map((article) => (
                  <Card
                    key={article.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/knowledge/${article.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        <Badge>SOP v{article.version}</Badge>
                      </div>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {article.content.substring(0, 150)}...
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-warning" />
                      <CardTitle>{insight.title}</CardTitle>
                    </div>
                    <Badge variant="outline">{insight.insight_type}</Badge>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Confidence: {(insight.confidence_score * 100).toFixed(0)}%</span>
                    <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}