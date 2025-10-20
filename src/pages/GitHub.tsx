import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Github, GitBranch, GitCommit, GitPullRequest, ExternalLink, Search, FileText, Folder } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";

const GitHub = () => {
  const [isConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Get user profile for customer_id
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  // Search files from database
  const { data: searchResults, refetch: performSearch } = useQuery({
    queryKey: ['fileSearch', searchQuery, userProfile?.customer_id],
    enabled: false, // Only run on manual trigger
    queryFn: async () => {
      if (!searchQuery.trim() || !userProfile?.customer_id) return [];

      const { data, error } = await supabase
        .from('file_metadata')
        .select('id, file_name, file_path, file_type, description, tags, created_at, repository_id, file_repositories(repository_name)')
        .eq('customer_id', userProfile.customer_id)
        .eq('is_deleted', false)
        .or(`file_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        toast.error('Failed to search files');
        throw error;
      }

      return data || [];
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    try {
      await performSearch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 pt-28">{/* Increased padding-top from pt-24 to pt-28 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Github className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">GitHub Integration</h1>
          </div>
          <p className="text-muted-foreground">
            Connect your GitHub repositories to OberaConnect for seamless code management and deployment
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search repositories, pull requests, commits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">
                  Found {searchResults.length} file{searchResults.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {searchResults.map((result: any) => {
                    const repo = result.file_repositories;
                    return (
                      <div key={result.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{result.file_name}</span>
                            </div>
                            {result.description && (
                              <p className="text-sm text-muted-foreground">{result.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              {repo && (
                                <div className="flex items-center gap-1">
                                  <Folder className="h-3 w-3" />
                                  <span>{repo.repository_name}</span>
                                </div>
                              )}
                              {result.file_path && (
                                <span className="truncate max-w-xs">{result.file_path}</span>
                              )}
                              <span>{new Date(result.created_at).toLocaleDateString()}</span>
                            </div>
                            {result.tags && result.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {result.tags.map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {searchQuery && searchResults && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground mt-4">
                No files found for "{searchQuery}". Try searching from the <a href="/files" className="text-primary underline">File Collaboration</a> page.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Repository Management
              </CardTitle>
              <CardDescription>
                Connect and manage your GitHub repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Link your GitHub account to automatically sync repositories and track changes across your organization.
              </p>
              {isConnected ? (
                <Badge variant="outline" className="border-primary/60">
                  <span className="text-primary">Connected</span>
                </Badge>
              ) : (
                <Button variant="outline" className="w-full">
                  <Github className="mr-2 h-4 w-4" />
                  Connect GitHub
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCommit className="h-5 w-5" />
                Commit Tracking
              </CardTitle>
              <CardDescription>
                Monitor commits and code changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track all commits across your repositories with detailed change logs and contributor insights.
              </p>
              <Button variant="outline" className="w-full" disabled={!isConnected}>
                View Commits
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5" />
                Pull Requests
              </CardTitle>
              <CardDescription>
                Review and manage pull requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Streamline your code review process with integrated pull request management and approval workflows.
              </p>
              <Button variant="outline" className="w-full" disabled={!isConnected}>
                View PRs
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to integrate GitHub with OberaConnect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
              <li>Click "Connect GitHub" to authorize OberaConnect</li>
              <li>Select the repositories you want to sync</li>
              <li>Configure webhook notifications for real-time updates</li>
              <li>Set up automated workflows and deployment pipelines</li>
            </ol>
            <div className="mt-6 flex gap-4">
              <Button variant="default">
                <Github className="mr-2 h-4 w-4" />
                Connect GitHub
              </Button>
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GitHub;
