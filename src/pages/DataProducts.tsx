import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, Users, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const DataProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['data-products'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) return [];

      const { data, error } = await supabase.functions.invoke('analytics-engine', {
        body: { action: 'data-products-overview' }
      });

      if (error) throw error;
      return data.products || [];
    }
  });

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      hr: 'bg-secondary',
      it: 'bg-accent',
      finance: 'bg-primary',
      sales: 'bg-primary',
      compliance: 'bg-destructive'
    };
    return colors[domain] || 'bg-muted';
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'realtime': return <TrendingUp className="h-4 w-4" />;
      case 'hourly': return <Clock className="h-4 w-4" />;
      case 'daily': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Data Products</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Domain-specific data assets with clear ownership and governance
        </p>
      </div>

      {/* Create New Product */}
      <Card className="mb-8 bg-primary/5 border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Create New Data Product</h3>
              <p className="text-sm text-muted-foreground">
                Define a new data product with ownership, SLAs, and consumers
              </p>
            </div>
            <Button>Create Product</Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading data products...
          </div>
        )}

        {!isLoading && products && products.length === 0 && (
          <div className="col-span-full text-center py-8">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Products Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first data product to start organizing your data assets
            </p>
            <Button>Create First Product</Button>
          </div>
        )}

        {products && products.map((product: any) => (
          <Card key={product.id} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge className={getDomainColor(product.domain)}>
                  <span className="text-primary-foreground">{product.domain.toUpperCase()}</span>
                </Badge>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardTitle className="text-lg">{product.product_name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {product.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Owner */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Owner: {product.owner_department || 'Not assigned'}
                  </span>
                </div>

                {/* Update Frequency */}
                <div className="flex items-center gap-2">
                  {getFrequencyIcon(product.update_frequency)}
                  <span className="text-sm capitalize">
                    Updates: {product.update_frequency}
                  </span>
                </div>

                {/* Quality SLA */}
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Quality SLA: {product.quality_sla}%
                  </span>
                </div>

                {/* Data Sources */}
                {product.data_sources && product.data_sources.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Data Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.data_sources.slice(0, 3).map((source: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                      {product.data_sources.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.data_sources.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Consumers */}
                {product.consumers && product.consumers.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Consumers:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.consumers.slice(0, 3).map((consumer: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {consumer}
                        </Badge>
                      ))}
                      {product.consumers.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{product.consumers.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Access Policy */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Access Policy</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {product.access_policy}
                    </Badge>
                  </div>
                </div>

                {/* Last Updated */}
                {product.last_updated && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Last updated: {new Date(product.last_updated).toLocaleDateString()}
                  </div>
                )}

                <Button variant="outline" className="w-full mt-4">
                  Manage Product
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DataProducts;