import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { typeIcons, typeLabels, SearchResult } from "@/lib/globalSearchConfig";

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

export function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const Icon = typeIcons[result.type as keyof typeof typeIcons] || FileText;
  const label = typeLabels[result.type as keyof typeof typeLabels] || result.type;
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left hover:bg-accent transition-colors ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{result.title}</div>
        {(result.data.description || (result.url?.startsWith('http') ? result.url : '')) && (
          <div className="text-sm text-muted-foreground truncate">
            {result.data.description || (result.url?.startsWith('http') ? result.url : '')}
          </div>
        )}
      </div>
      <Badge variant="secondary" className="flex-shrink-0">
        {label}
      </Badge>
    </button>
  );
}
