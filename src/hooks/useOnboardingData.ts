/**
 * Centralized onboarding data fetching hooks
 * Eliminates duplicate data loading patterns
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export interface User {
  user_id: string;
  full_name: string;
}

export interface Template {
  id: string;
  template_name: string;
  description: string | null;
  department_type?: string;
  estimated_days?: number | null;
}

/**
 * Hook to load roles for onboarding forms
 */
export function useOnboardingRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { roles, isLoading, reload: loadRoles };
}

/**
 * Hook to load users (managers) for onboarding forms
 */
export function useOnboardingUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { users, isLoading, reload: loadUsers };
}

/**
 * Hook to load templates for onboarding forms
 */
export function useOnboardingTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Get current user's customer_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) {
        console.error('No customer_id found for user');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('employee_onboarding_templates')
        .select('id, template_name, description, department_type, estimated_days')
        .eq('customer_id', profile.customer_id)
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { templates, isLoading, reload: loadTemplates };
}
