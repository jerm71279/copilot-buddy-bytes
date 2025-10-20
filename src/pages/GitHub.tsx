import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, GitBranch, GitCommit, GitPullRequest, ExternalLink } from "lucide-react";
import Navigation from "@/components/Navigation";

const GitHub = () => {
  const [isConnected] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 pt-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Github className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">GitHub Integration</h1>
          </div>
          <p className="text-muted-foreground">
            Connect your GitHub repositories to OberaConnect for seamless code management and deployment
          </p>
        </div>

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
