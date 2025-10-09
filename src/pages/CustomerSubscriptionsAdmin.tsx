import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerSubscriptions } from '@/hooks/useCustomerSubscriptions';
import { useProductCatalog } from '@/hooks/useProductCatalog';
import { useRevioData } from '@/hooks/useRevioData';
import { Plus, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function CustomerSubscriptionsAdmin() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { products } = useProductCatalog();
  const { subscriptions, addSubscription, updateSubscription } = useCustomerSubscriptions(selectedCustomerId);
  const { data: revioData } = useRevioData();

  // Fetch all customers
  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('customer_id, full_name')
        .not('customer_id', 'is', null);

      if (error) throw error;
      
      // Deduplicate by customer_id
      const uniqueCustomers = Array.from(
        new Map(data.map(item => [item.customer_id, item])).values()
      );
      
      return uniqueCustomers;
    }
  });

  const handleAddSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await addSubscription.mutateAsync({
      customer_id: selectedCustomerId,
      product_id: formData.get('product_id') as string,
      status: 'active',
      start_date: formData.get('start_date') as string,
      renewal_date: formData.get('renewal_date') as string,
      current_price: parseFloat(formData.get('current_price') as string),
      billing_frequency: formData.get('billing_frequency') as string,
      revio_customer_id: formData.get('revio_customer_id') as string
    });
    
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string, endDate?: string | null) => {
    if (status === 'active' && (!endDate || new Date(endDate) >= new Date())) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    } else if (status === 'suspended') {
      return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    }
  };

  // Find Revio customer data
  const getRevioCustomer = (revioCustomerId: string | null) => {
    if (!revioCustomerId || !revioData) return null;
    
    // Search across all Revio data categories
    const allCustomers = [
      ...(revioData.customers_by_ticket?.flatMap(ct => ct.customers) || []),
      ...(revioData.customers_by_sla?.flatMap(cs => cs.customers) || []),
      ...(revioData.customers_by_revenue?.flatMap(cr => cr.customers) || [])
    ];
    
    return allCustomers.find(c => c.id === revioCustomerId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Customer Subscriptions</h1>
            <p className="text-muted-foreground">Manage customer product subscriptions and access</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Customer</CardTitle>
              <CardDescription>Choose a customer to view and manage their subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.customer_id} value={customer.customer_id}>
                      {customer.full_name || customer.customer_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedCustomerId && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Active Subscriptions</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subscription</DialogTitle>
                      <DialogDescription>Assign a product to this customer</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubscription} className="space-y-4">
                      <div>
                        <Label htmlFor="product_id">Product</Label>
                        <Select name="product_id" required>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.product_name} - ${product.base_price}/{product.billing_frequency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_date">Start Date</Label>
                          <Input id="start_date" name="start_date" type="date" required />
                        </div>
                        <div>
                          <Label htmlFor="renewal_date">Renewal Date</Label>
                          <Input id="renewal_date" name="renewal_date" type="date" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="current_price">Price</Label>
                          <Input id="current_price" name="current_price" type="number" step="0.01" required />
                        </div>
                        <div>
                          <Label htmlFor="billing_frequency">Frequency</Label>
                          <Select name="billing_frequency" defaultValue="monthly">
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
                        <Label htmlFor="revio_customer_id">Revio Customer ID (Optional)</Label>
                        <Input id="revio_customer_id" name="revio_customer_id" placeholder="Link to Revio billing" />
                      </div>

                      <Button type="submit" className="w-full">Add Subscription</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Renewal</TableHead>
                        <TableHead>Revio</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions?.map((sub) => {
                        const revioCustomer = getRevioCustomer(sub.revio_customer_id);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sub.products?.product_name}</p>
                                <p className="text-sm text-muted-foreground">{sub.products?.product_code}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(sub.status, sub.end_date)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{sub.current_price}</span>
                                <span className="text-sm text-muted-foreground">/ {sub.billing_frequency}</span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(sub.start_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              {revioCustomer ? (
                                <div className="text-sm">
                                  <p className="font-medium">{revioCustomer.name}</p>
                                  <p className="text-muted-foreground">{revioCustomer.subscription_tier}</p>
                                </div>
                              ) : sub.revio_customer_id ? (
                                <Badge variant="outline">Linked</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  updateSubscription.mutate({
                                    id: sub.id,
                                    status: sub.status === 'active' ? 'suspended' : 'active'
                                  });
                                }}
                              >
                                {sub.status === 'active' ? 'Suspend' : 'Activate'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
