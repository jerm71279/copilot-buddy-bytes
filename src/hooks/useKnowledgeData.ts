import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KnowledgeService, type KnowledgeArticle, type KnowledgeInsight, type KnowledgeCategory } from "@/services/knowledgeService";
import { AuthService } from "@/services/authService";

/**
 * Centralized Knowledge Base Data Hook
 * Handles all data fetching for knowledge articles, insights, and categories
 */

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
      const session = await AuthService.getSession();
      let dept = 'all';
      
      if (session) {
        dept = await KnowledgeService.getUserDepartment(session.user.id);
        setUserDepartment(dept);
      }

      // Load all data in parallel
      const [articlesResponse, insightsResponse, categoriesResponse] = await Promise.all([
        KnowledgeService.getArticles(),
        KnowledgeService.getInsights(),
        KnowledgeService.getCategories()
      ]);

      setArticles(articlesResponse.data || []);
      setInsights(insightsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error("Error loading knowledge base:", error);
      toast.error("Failed to load knowledge base");
    } finally {
      setIsLoading(false);
    }
  };

  const filterArticles = (searchQuery: string) => {
    return KnowledgeService.filterArticles(articles, searchQuery);
  };

  const getArticlesByType = (type: string) => {
    return KnowledgeService.getArticlesByType(articles, type);
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
