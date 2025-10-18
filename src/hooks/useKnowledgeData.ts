import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Centralized Knowledge Base Data Hook
 * Handles all data fetching for knowledge articles, insights, and categories
 */

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  knowledge_type?: string;
  article_type: string;
  version: number | string;
  tags: string[];
  updated_at: string;
  status: string;
  category_id?: string;
  created_at: string;
  created_by?: string;
  customer_id: string;
  source_metadata?: any;
  source_type?: string;
}

export interface KnowledgeInsight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  confidence_score: number;
  created_at: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
}

export function useKnowledgeData() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [insights, setInsights] = useState<KnowledgeInsight[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDepartment, setUserDepartment] = useState<string>('all');

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      
      // Get user profile to determine department
      const { data: { session } } = await supabase.auth.getSession();
      let dept = 'all';
      
      if (session) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("department")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (profile?.department) {
          dept = profile.department;
          setUserDepartment(dept);
        }
      }

      // Load all data in parallel for efficiency
      const [articlesResult, insightsResult, categoriesResult] = await Promise.all([
        supabase
          .from("knowledge_articles")
          .select("*")
          .eq("status", "published")
          .order("updated_at", { ascending: false }),
        supabase
          .from("knowledge_insights")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("knowledge_categories")
          .select("*")
          .order("name")
      ]);

      if (articlesResult.error) throw articlesResult.error;
      if (insightsResult.error) throw insightsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setArticles(articlesResult.data || []);
      setInsights(insightsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error("Error loading knowledge base:", error);
      toast.error("Failed to load knowledge base");
    } finally {
      setIsLoading(false);
    }
  };

  const filterArticles = (searchQuery: string) => {
    if (!searchQuery) return articles;
    
    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  };

  const getArticlesByType = (type: string) => {
    return articles.filter(a => a.article_type === type);
  };

  return {
    articles,
    insights,
    categories,
    isLoading,
    userDepartment,
    filterArticles,
    getArticlesByType,
    refresh: loadKnowledgeBase
  };
}
