import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, ExternalLink, Plus } from "lucide-react";

interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  provider: string;
  endpoint_template: string;
  auth_type: string;
  capabilities: string[];
  tools: Array<{
    tool_name: string;
    description: string;
  }>;
  category: string;
  logo_url?: string;
  documentation_url?: string;
}

const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'jira-cloud',
    name: 'Jira Cloud',
    description: 'Connect to Atlassian Jira for issue tracking, project management, and workflow automation',
    provider: 'Atlassian',
    endpoint_template: 'https://{your-domain}.atlassian.net/rest/api/3',
    auth_type: 'api_key',
    capabilities: ['project_management', 'issue_tracking', 'reporting', 'automation'],
    tools: [
      { tool_name: 'create_issue', description: 'Create new Jira issues' },
      { tool_name: 'update_issue', description: 'Update existing issues' },
      { tool_name: 'search_issues', description: 'Search issues using JQL' },
      { tool_name: 'get_project_stats', description: 'Get project statistics' }
    ],
    category: 'Project Management',
    documentation_url: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/'
  },
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Document management and knowledge base integration with Confluence',
    provider: 'Atlassian',
    endpoint_template: 'https://{your-domain}.atlassian.net/wiki/rest/api',
    auth_type: 'api_key',
    capabilities: ['documentation', 'knowledge_base', 'collaboration'],
    tools: [
      { tool_name: 'search_content', description: 'Search Confluence pages' },
      { tool_name: 'get_page', description: 'Retrieve page content' },
      { tool_name: 'create_page', description: 'Create new pages' }
    ],
    category: 'Documentation',
    documentation_url: 'https://developer.atlassian.com/cloud/confluence/rest/v1/intro/'
  },
  {
    id: 'servicenow',
    name: 'ServiceNow',
    description: 'Enterprise service management, ITSM, and workflow automation',
    provider: 'ServiceNow',
    endpoint_template: 'https://{instance}.service-now.com/api/now',
    auth_type: 'bearer',
    capabilities: ['itsm', 'incident_management', 'cmdb', 'workflows'],
    tools: [
      { tool_name: 'create_incident', description: 'Create service incidents' },
      { tool_name: 'update_change', description: 'Update change requests' },
      { tool_name: 'query_cmdb', description: 'Query configuration items' }
    ],
    category: 'ITSM',
    documentation_url: 'https://developer.servicenow.com/dev.do'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Code repository management, CI/CD, and developer collaboration',
    provider: 'GitHub',
    endpoint_template: 'https://api.github.com',
    auth_type: 'bearer',
    capabilities: ['version_control', 'ci_cd', 'code_review', 'automation'],
    tools: [
      { tool_name: 'list_repositories', description: 'List user repositories' },
      { tool_name: 'create_pull_request', description: 'Create pull requests' },
      { tool_name: 'get_workflow_status', description: 'Get GitHub Actions status' }
    ],
    category: 'DevOps',
    documentation_url: 'https://docs.github.com/en/rest'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM integration for sales, marketing, and customer service',
    provider: 'Salesforce',
    endpoint_template: 'https://{instance}.salesforce.com/services/data/v58.0',
    auth_type: 'bearer',
    capabilities: ['crm', 'sales', 'marketing', 'analytics'],
    tools: [
      { tool_name: 'query_accounts', description: 'Query account records' },
      { tool_name: 'create_opportunity', description: 'Create sales opportunities' },
      { tool_name: 'get_reports', description: 'Retrieve sales reports' }
    ],
    category: 'CRM',
    documentation_url: 'https://developer.salesforce.com/docs/apis'
  },
  {
    id: 'microsoft-graph',
    name: 'Microsoft Graph',
    description: 'Access Microsoft 365 data including Teams, SharePoint, and Outlook',
    provider: 'Microsoft',
    endpoint_template: 'https://graph.microsoft.com/v1.0',
    auth_type: 'bearer',
    capabilities: ['collaboration', 'email', 'calendar', 'files'],
    tools: [
      { tool_name: 'list_messages', description: 'List email messages' },
      { tool_name: 'get_calendar_events', description: 'Get calendar events' },
      { tool_name: 'search_files', description: 'Search SharePoint files' }
    ],
    category: 'Productivity',
    documentation_url: 'https://learn.microsoft.com/en-us/graph/api/overview'
  },
];

export function MCPServerMarketplace({ customerId }: { customerId: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(MARKETPLACE_TEMPLATES.map(t => t.category)));

  const filteredTemplates = MARKETPLACE_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const installTemplate = async (template: MarketplaceTemplate) => {
    try {
      const { data: server, error } = await supabase
        .from('mcp_servers')
        .insert({
          customer_id: customerId,
          server_name: template.name,
          description: template.description,
          server_type: 'api',
          endpoint_url: template.endpoint_template,
          capabilities: template.capabilities,
          status: 'inactive',
          config: {
            provider: template.provider,
            auth_type: template.auth_type,
            from_marketplace: true,
            template_id: template.id
          }
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Create tools
      if (server && template.tools.length > 0) {
        const toolsToInsert = template.tools.map(tool => ({
          server_id: server.id,
          tool_name: tool.tool_name,
          description: tool.description,
          input_schema: { type: 'object', properties: {} },
          is_enabled: true
        }));

        await supabase.from('mcp_tools').insert(toolsToInsert);
      }

      toast.success(`${template.name} template installed! Configure endpoint and authentication to activate.`);
    } catch (error: any) {
      console.error('Error installing template:', error);
      toast.error(error.message || 'Failed to install template');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Server Marketplace</CardTitle>
        <CardDescription>
          Pre-configured templates for popular integrations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{template.provider}</p>
                  </div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold">Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.capabilities.slice(0, 4).map(cap => (
                      <Badge key={cap} variant="secondary" className="text-xs">
                        {cap.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold">{template.tools.length} Tools:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {template.tools.slice(0, 3).map(tool => (
                      <li key={tool.tool_name}>• {tool.description}</li>
                    ))}
                    {template.tools.length > 3 && (
                      <li>• And {template.tools.length - 3} more...</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => installTemplate(template)}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Install
                  </Button>
                  {template.documentation_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(template.documentation_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No templates found matching your search.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
