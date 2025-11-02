import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowUpDown } from "lucide-react";

export type SortOption = 
  | "name-asc" 
  | "name-desc" 
  | "date-newest" 
  | "date-oldest" 
  | "status-asc" 
  | "status-desc"
  | "type-asc"
  | "type-desc";

interface MCPSortOptionsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function MCPSortOptions({ value, onChange }: MCPSortOptionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="sort" className="text-sm text-muted-foreground">Sort by:</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="sort" className="w-[180px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="date-newest">Newest First</SelectItem>
          <SelectItem value="date-oldest">Oldest First</SelectItem>
          <SelectItem value="status-asc">Status (Active First)</SelectItem>
          <SelectItem value="status-desc">Status (Inactive First)</SelectItem>
          <SelectItem value="type-asc">Type (A-Z)</SelectItem>
          <SelectItem value="type-desc">Type (Z-A)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
