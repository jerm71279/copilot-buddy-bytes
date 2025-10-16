import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { clientTicketSchema, sanitizeText } from "@/lib/validation";

/**
 * Centralized hook for fetching all Client Portal data
 * Eliminates duplicate data fetching patterns
 */
export const useClientPortalData = () => {
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["client_tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: serviceRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["service_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*, service_catalog(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: serviceCatalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["service_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("is_active", true)
        .order("category");
      if (error) throw error;
      return data;
    },
  });

  return {
    tickets,
    serviceRequests,
    serviceCatalog,
    isLoading: ticketsLoading || requestsLoading || catalogLoading,
  };
};

/**
 * Hook for creating support tickets with validation
 */
export const useCreateTicket = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: {
      subject: string;
      description: string;
      priority: string;
      category: string;
    }) => {
      // Validate ticket data
      const validatedData = clientTicketSchema.parse({
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category as any,
        priority: ticket.priority as any,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke("client-portal", {
        body: {
          action: "create_ticket",
          customerId: profile?.customer_id,
          submittedBy: user.id,
          subject: validatedData.subject,
          description: sanitizeText(validatedData.description),
          category: validatedData.category,
          priority: validatedData.priority,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_tickets"] });
      toast.success("Support ticket created successfully");
      onSuccess?.();
    },
    onError: (error: any) => {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(`${firstError.path.join(".")}: ${firstError.message}`);
      } else {
        toast.error(error.message || "Failed to create ticket");
      }
    },
  });
};

/**
 * Calculate portal metrics
 */
export const usePortalMetrics = () => {
  const { tickets, serviceRequests, serviceCatalog } = useClientPortalData();

  const openTicketsCount = tickets?.filter(t => 
    ["open", "assigned", "in_progress"].includes(t.status)
  ).length || 0;

  const activeRequestsCount = serviceRequests?.filter(r => 
    ["submitted", "approved", "in_progress"].includes(r.status)
  ).length || 0;

  const availableServicesCount = serviceCatalog?.length || 0;

  return {
    openTicketsCount,
    activeRequestsCount,
    availableServicesCount,
  };
};
