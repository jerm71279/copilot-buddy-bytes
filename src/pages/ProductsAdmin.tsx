import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProductCatalog } from '@/hooks/useProductCatalog';
import { Package, Plus, Edit, DollarSign, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductsAdmin() {
  const { products, isLoading, createProduct, updateProduct } = useProductCatalog();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      product_code: formData.get('product_code') as string,
      product_name: formData.get('product_name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      service_tier: formData.get('service_tier') as string,
      base_price: parseFloat(formData.get('base_price') as string),
      billing_frequency: formData.get('billing_frequency') as string,
      enabled_features: (formData.get('enabled_features') as string).split(',').map(f => f.trim()),
      enabled_integrations: (formData.get('enabled_integrations') as string).split(',').map(i => i.trim()),
      is_addon: formData.get('is_addon') === 'true'
    };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
    } else {
      await createProduct.mutateAsync(productData);
    }
    
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-blue-500',
      professional: 'bg-purple-500',
      enterprise: 'bg-gold-500',
      custom: 'bg-gray-500'
    };
    return <Badge className={colors[tier] || 'bg-gray-500'}>{tier}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core_platform': return <Package className="h-5 w-5" />;
      case 'compliance_module': return <Shield className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Product & Service Catalog</h1>
            <p className="text-muted-foreground">Manage products, features, and service tiers</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>Configure product details, pricing, and enabled features</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_code">Product Code</Label>
                    <Input id="product_code" name="product_code" defaultValue={editingProduct?.product_code} required />
                  </div>
                  <div>
                    <Label htmlFor="product_name">Product Name</Label>
                    <Input id="product_name" name="product_name" defaultValue={editingProduct?.product_name} required />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={editingProduct?.category || 'core_platform'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core_platform">Core Platform</SelectItem>
                        <SelectItem value="compliance_module">Compliance Module</SelectItem>
                        <SelectItem value="automation_module">Automation Module</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="support_tier">Support Tier</SelectItem>
                        <SelectItem value="storage_addon">Storage Add-on</SelectItem>
                        <SelectItem value="user_pack">User Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="service_tier">Service Tier</Label>
                    <Select name="service_tier" defaultValue={editingProduct?.service_tier || 'basic'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="is_addon">Type</Label>
                    <Select name="is_addon" defaultValue={editingProduct?.is_addon ? 'true' : 'false'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Core Product</SelectItem>
                        <SelectItem value="true">Add-on</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base_price">Base Price</Label>
                    <Input id="base_price" name="base_price" type="number" step="0.01" defaultValue={editingProduct?.base_price} />
                  </div>
                  <div>
                    <Label htmlFor="billing_frequency">Billing Frequency</Label>
                    <Select name="billing_frequency" defaultValue={editingProduct?.billing_frequency || 'monthly'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="enabled_features">Enabled Features (comma-separated)</Label>
                  <Textarea 
                    id="enabled_features" 
                    name="enabled_features" 
                    defaultValue={editingProduct?.enabled_features?.join(', ')}
                    placeholder="dashboard, workflow_automation, cmdb"
                  />
                </div>

                <div>
                  <Label htmlFor="enabled_integrations">Enabled Integrations (comma-separated)</Label>
                  <Textarea 
                    id="enabled_integrations" 
                    name="enabled_integrations" 
                    defaultValue={editingProduct?.enabled_integrations?.join(', ')}
                    placeholder="ninjaone, microsoft365, cipp"
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="core">Core Platform</TabsTrigger>
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products?.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(product.category)}
                        <div>
                          <CardTitle className="text-lg">{product.product_name}</CardTitle>
                          <CardDescription className="text-sm">{product.product_code}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {getTierBadge(product.service_tier)}
                      {product.is_addon && <Badge variant="outline">Add-on</Badge>}
                    </div>

                    {product.base_price && (
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">${product.base_price}</span>
                        <span className="text-sm text-muted-foreground">/ {product.billing_frequency}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium mb-1">Features ({product.enabled_features?.length || 0})</p>
                        <div className="flex flex-wrap gap-1">
                          {product.enabled_features?.slice(0, 3).map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                          ))}
                          {(product.enabled_features?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">+{product.enabled_features.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                      
                      {product.enabled_integrations?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Integrations ({product.enabled_integrations.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {product.enabled_integrations.slice(0, 2).map(integration => (
                              <Badge key={integration} variant="outline" className="text-xs">{integration}</Badge>
                            ))}
                            {product.enabled_integrations.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{product.enabled_integrations.length - 2}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="core">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products?.filter(p => !p.is_addon).map((product) => (
                <Card key={product.id}>
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="addons">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products?.filter(p => p.is_addon).map((product) => (
                <Card key={product.id}>
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
