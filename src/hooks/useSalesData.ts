import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from '@/hooks/useDemoMode';

export interface SalesStats {
  activeDeals: number;
  monthlyRevenue: number;
  quota: number;
  quotaProgress: number;
  closedDeals: number;
  activitiesThisWeek: number;
}

export const useSalesData = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<SalesStats>({
    activeDeals: 12,
    monthlyRevenue: 145000,
    quota: 200000,
    quotaProgress: 72.5,
    closedDeals: 8,
    activitiesThisWeek: 24
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: 'Sales Rep', department: 'sales' });
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    setUserProfile(profile);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate('/demo');
      return;
    }
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return {
    isLoading,
    userProfile,
    stats,
    isPreviewMode,
    handleSignOut
  };
};
