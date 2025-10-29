/**
 * AI Service
 * Handles AI streaming and generation operations
 */

import { supabase } from "@/integrations/supabase/client";

export class AIService {
  /**
   * Stream AI response
   */
  static async streamAI(
    prompt: string,
    systemPrompt?: string,
    onChunk?: (content: string) => void
  ): Promise<string> {
    const { data, error } = await supabase.functions.invoke('ai-stream', {
      body: { prompt, systemPrompt }
    });

    if (error) throw error;

    // Handle streaming response
    let fullContent = '';
    if (data?.content) {
      fullContent = data.content;
      if (onChunk) {
        onChunk(fullContent);
      }
    }

    return fullContent;
  }

  /**
   * Generate AI completion
   */
  static async generateCompletion(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) {
    const { data, error } = await supabase.functions.invoke('ai-generate', {
      body: { prompt, ...options }
    });

    if (error) throw error;
    return data;
  }
}
