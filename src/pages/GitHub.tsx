import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Github, GitBranch, GitCommit, GitPullRequest, ExternalLink, Search, FileText, Folder } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useIntegrationFunctions } from "@/hooks/useIntegrationFunctions";

const GitHub = () => {
  const [isConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const { githubSearch } = useIntegrationFunctions();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const result = await githubSearch.invoke({ query: searchQuery });
    if (result) {
      setSearchResults(result);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <DashboardLayout>
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
                  placeholder="Search code on GitHub (e.g., 'function user:owner/repo')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={githubSearch.isLoading || !searchQuery.trim()}>
                {githubSearch.isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults && searchResults.items && searchResults.items.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">
                  Found {searchResults.total_count} result{searchResults.total_count !== 1 ? 's' : ''} ({searchResults.items.length} shown)
                </p>
                <div className="space-y-2">
                  {searchResults.items.map((result: any) => (
                    <div key={result.sha} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={result.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline"
                            >
                              {result.name}
                            </a>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Folder className="h-3 w-3" />
                              <span>{result.repository.full_name}</span>
                            </div>
                            <span className="truncate max-w-xs">{result.path}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {searchQuery && searchResults && searchResults.items && searchResults.items.length === 0 && !githubSearch.isLoading && (
              <p className="text-sm text-muted-foreground mt-4">
                No files found on GitHub for "{searchQuery}".
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
    </DashboardLayout>
  );
};

export default GitHub;
