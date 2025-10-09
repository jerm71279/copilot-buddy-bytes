import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerSubscriptions } from './useCustomerSubscriptions';

export const useFeatureAccess = (customerId?: string) => {
  const { activeSubscriptions, isLoading: subscriptionsLoading } = useCustomerSubscriptions(customerId);

  // Get all enabled features from active subscriptions
  const enabledFeatures = activeSubscriptions?.flatMap(
    sub => sub.products?.enabled_features || []
  ) || [];

  // Get all enabled integrations from active subscriptions
  const enabledIntegrations = activeSubscriptions?.flatMap(
    sub => sub.products?.enabled_integrations || []
  ) || [];

  // Check if a specific feature is enabled
  const hasFeature = (featureName: string): boolean => {
    return enabledFeatures.includes(featureName);
  };

  // Check if a specific integration is enabled
  const hasIntegration = (integrationName: string): boolean => {
    return enabledIntegrations.includes(integrationName);
  };

  // Log feature access attempt
  const logFeatureAccess = async (
    featureName: string,
    userId?: string,
    granted: boolean = false,
    reason?: string
  ) => {
    if (!customerId) return;

    try {
      await supabase.from('feature_access_log').insert({
        customer_id: customerId,
        user_id: userId,
        feature_name: featureName,
        access_granted: granted,
        reason: reason || (granted ? 'subscription_active' : 'feature_not_in_plan')
      });
    } catch (error) {
      console.error('Failed to log feature access:', error);
    }
  };

  // Get service tier from subscriptions
  const serviceTier = activeSubscriptions?.reduce((highest, sub) => {
    const tierOrder = { basic: 1, professional: 2, enterprise: 3, custom: 4 };
    const currentTier = sub.products?.product_code?.includes('ENT') ? 'enterprise' :
                       sub.products?.product_code?.includes('PRO') ? 'professional' : 'basic';
    return tierOrder[currentTier as keyof typeof tierOrder] > tierOrder[highest as keyof typeof tierOrder] ? currentTier : highest;
  }, 'basic');

  return {
    enabledFeatures,
    enabledIntegrations,
    hasFeature,
    hasIntegration,
    logFeatureAccess,
    serviceTier,
    isLoading: subscriptionsLoading
  };
};
