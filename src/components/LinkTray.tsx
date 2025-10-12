import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreHorizontal, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LinkTrayItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

interface LinkTrayProps {
  items: LinkTrayItem[];
  showBack?: boolean;
  maxVisibleItems?: number;
  className?: string;
}

export function LinkTray({ 
  items, 
  showBack = true, 
  maxVisibleItems = 3,
  className 
}: LinkTrayProps) {
  const navigate = useNavigate();
  
  const visibleItems = items.slice(0, maxVisibleItems);
  const overflowItems = items.slice(maxVisibleItems);
  const hasOverflow = overflowItems.length > 0;

  return (
    <div className={cn("flex items-center gap-2 mb-6 flex-wrap", className)}>
      {showBack && (
        <Button 
          onClick={() => navigate(-1)} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.path}
            onClick={() => navigate(item.path)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </Button>
        );
      })}

      {hasOverflow && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56 bg-popover z-50"
          >
            {overflowItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="cursor-pointer"
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
