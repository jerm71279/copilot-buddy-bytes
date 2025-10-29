/**
 * Knowledge Service
 * Centralized knowledge base operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
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

export class KnowledgeService {
  /**
   * Load knowledge articles
   */
  static async getArticles() {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("status", "published")
      .not("source_type", "in", '("ninjaone_api","sharepoint_api","integration","vendor_documentation")')
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as KnowledgeArticle[];
  }

  /**
   * Load knowledge insights
   */
  static async getInsights() {
    const { data, error } = await supabase
      .from("knowledge_insights")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as KnowledgeInsight[];
  }

  /**
   * Load knowledge categories
   */
  static async getCategories() {
    const { data, error } = await supabase
      .from("knowledge_categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data as KnowledgeCategory[];
  }

  /**
   * Get user department
   */
  static async getUserDepartment(userId: string): Promise<string> {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("department")
      .eq("user_id", userId)
      .maybeSingle();
    
    return profile?.department || 'all';
  }

  /**
   * Filter articles by search query
   */
  static filterArticles(articles: KnowledgeArticle[], searchQuery: string): KnowledgeArticle[] {
    if (!searchQuery) return articles;
    
    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  }

  /**
   * Get articles by type
   */
  static getArticlesByType(articles: KnowledgeArticle[], type: string): KnowledgeArticle[] {
    return articles.filter(a => a.article_type === type);
  }
}
