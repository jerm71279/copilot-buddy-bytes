import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchResult } from "@/lib/globalSearchConfig";
import { SearchResultItem } from "@/components/search/SearchResultItem";
import { useSearchFunctions } from "@/hooks/useSearchFunctions";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const navigate = useNavigate();
  const { performGlobalSearch, isLoading } = useSearchFunctions();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAiSummary("");
      return;
    }

    const response = await performGlobalSearch(searchQuery);
    if (response) {
      setResults(response.results || []);
      setAiSummary(response.aiSummary || "");
      setDevMode(response.devMode || false);
      setSelectedIndex(0);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    if (result.url?.startsWith("http")) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    } else {
      navigate(result.url);
    }
    onOpenChange(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything - workflows, projects, vendors, incidents, pages..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>

        {aiSummary && (
          <div className="px-4 py-3 bg-muted/50 border-b flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
            <p className="text-sm text-muted-foreground">{aiSummary}</p>
          </div>
        )}

        {devMode && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
              🔓 Development Mode: Showing all results without RBAC filtering
            </p>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Searching...</div>
          ) : results.length === 0 && query ? (
            <div className="p-8 text-center text-muted-foreground">No results found</div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => (
                <SearchResultItem
                  key={`${result.type}-${result.url}`}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => handleSelect(result)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI-powered
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
