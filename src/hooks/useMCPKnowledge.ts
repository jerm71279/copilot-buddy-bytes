import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KnowledgeEntry {
  id: string;
  customer_id: string;
  server_id: string | null;
  title: string;
  content: string;
  content_type: string;
  source_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch knowledge base entries
 */
export function useMCPKnowledge(serverId?: string) {
  return useQuery({
    queryKey: ["mcp-knowledge", serverId],
    queryFn: async () => {
      let query = supabase
        .from("mcp_knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });

      if (serverId) {
        query = query.eq("server_id", serverId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KnowledgeEntry[];
    },
  });
}

/**
 * Hook to delete a knowledge entry
 */
export function useDeleteKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (knowledgeId: string) => {
      const { error } = await supabase
        .from("mcp_knowledge_base")
        .delete()
        .eq("id", knowledgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-knowledge"] });
      toast.success("Knowledge entry deleted");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete knowledge entry");
    },
  });
}

/**
 * Hook to fetch RAG query history
 */
export function useMCPRAGHistory(serverId?: string, limit: number = 20) {
  return useQuery({
    queryKey: ["mcp-rag-history", serverId, limit],
    queryFn: async () => {
      let query = supabase
        .from("mcp_rag_queries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (serverId) {
        query = query.eq("server_id", serverId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}
