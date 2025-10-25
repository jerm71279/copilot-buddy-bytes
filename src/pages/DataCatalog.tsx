import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Search, Filter, Tag, Clock, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DataCatalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: catalogEntries, isLoading, refetch } = useQuery({
    queryKey: ['data-catalog', searchQuery, domainFilter, typeFilter],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('data-catalog', {
        body: {
          action: 'search',
          query: searchQuery || undefined,
          domain: domainFilter !== 'all' ? domainFilter : undefined,
          tags: typeFilter !== 'all' ? [typeFilter] : undefined
        }
      });

      if (error) throw error;
      return data.results || [];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['catalog-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('data-catalog', {
        body: { action: 'stats' }
      });

      if (error) throw error;
      return data.summary;
    }
  });

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'bg-green-500';
      case 'internal': return 'bg-blue-500';
      case 'confidential': return 'bg-orange-500';
      case 'restricted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Data Catalog</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Discover and explore data assets across all domains
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEntries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contains PII</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.containsPii}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Domains</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.byDomain || {}).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asset Types</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.byType || {}).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search data assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="metric">Metric</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => refetch()}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Loading catalog...
            </div>
          )}

          {!isLoading && catalogEntries && catalogEntries.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No data assets found. Try adjusting your search or filters.
            </div>
          )}

          {catalogEntries && catalogEntries.map((entry: any) => (
            <Card key={entry.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{entry.display_name || entry.name}</CardTitle>
                    <CardDescription className="mt-1">{entry.name}</CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {entry.catalog_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {entry.description || 'No description available'}
                </p>

                <div className="space-y-2">
                  {entry.domain && (
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="capitalize">{entry.domain}</Badge>
                    </div>
                  )}

                  {entry.data_classification && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge className={`${getClassificationColor(entry.data_classification)} text-white`}>
                        {entry.data_classification}
                      </Badge>
                      {entry.contains_pii && (
                        <Badge variant="destructive" className="ml-1">PII</Badge>
                      )}
                    </div>
                  )}

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {entry.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{entry.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {entry.last_accessed && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last accessed: {new Date(entry.last_accessed).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4">View Details</Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default DataCatalog;