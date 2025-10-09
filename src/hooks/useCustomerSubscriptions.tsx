import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: string;
  revio_subscription_id: string | null;
  revio_customer_id: string | null;
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  current_price: number | null;
  billing_frequency: string | null;
  usage_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  products?: {
    product_name: string;
    product_code: string;
    enabled_features: string[];
    enabled_integrations: string[];
  };
}

export const useCustomerSubscriptions = (customerId?: string) => {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ['customer-subscriptions', customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select(`
          *,
          products:product_id (
            product_name,
            product_code,
            enabled_features,
            enabled_integrations
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerSubscription[];
    },
    enabled: !!customerId
  });

  const activeSubscriptions = subscriptions?.filter(
    sub => sub.status === 'active' && (!sub.end_date || new Date(sub.end_date) >= new Date())
  );

  const addSubscription = useMutation({
    mutationFn: async (subscription: Partial<CustomerSubscription>) => {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .insert(subscription)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      toast.success('Subscription added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add subscription: ${error.message}`);
    }
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomerSubscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      toast.success('Subscription updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update subscription: ${error.message}`);
    }
  });

  return {
    subscriptions,
    activeSubscriptions,
    isLoading,
    error,
    addSubscription,
    updateSubscription
  };
};
