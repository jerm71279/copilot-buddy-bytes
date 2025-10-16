import { useState } from "react";
import { toast } from "sonner";

interface UseAIStreamOptions {
  onChunk?: (content: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const useAIStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);

  const streamResponse = async (
    url: string,
    body: any,
    options: UseAIStreamOptions = {}
  ) => {
    setIsStreaming(true);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();

            if (jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content;

              if (content && options.onChunk) {
                options.onChunk(content);
              }
            } catch (e) {
              console.error("Error parsing SSE:", e);
            }
          }
        }
      }

      options.onComplete?.();
    } catch (error) {
      console.error("Stream error:", error);
      const err = error instanceof Error ? error : new Error("Unknown error");
      
      options.onError?.(err);
      
      toast.error("Request Failed", {
        description: err.message,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return { streamResponse, isStreaming };
};
