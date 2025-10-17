import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Portal } from "@/config/portals";
import { PortalDropdown } from "./PortalDropdown";

interface PortalsBarProps {
  portals: Portal[];
  currentPath: string;
  openStates: { [key: string]: boolean };
  onToggle: (key: string) => void;
  onCloseAll: () => void;
  lanesBottom: string;
}

export function PortalsBar({ 
  portals, 
  currentPath, 
  openStates, 
  onToggle,
  onCloseAll,
  lanesBottom 
}: PortalsBarProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2 min-w-max">
        {portals.map((portal) => {
          const isActive = currentPath === portal.path || 
            (portal.children && portal.children.some(child => currentPath.startsWith(child.path)));
          const isOpen = openStates[portal.path];

          return (
            <div key={portal.path} className="relative inline-block">
              {portal.children && portal.children.length > 0 ? (
                <Collapsible open={isOpen} onOpenChange={() => onToggle(portal.path)}>
                  <div className="flex items-center gap-1">
                    <Link
                      to={portal.path}
                      className={cn(
                        "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/30 text-foreground hover:bg-muted/50"
                      )}
                    >
                      {portal.name}
                    </Link>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                    {isOpen && (
                      <PortalDropdown
                        items={portal.children}
                        currentPath={currentPath}
                        onClose={onCloseAll}
                        lanesBottom={lanesBottom}
                      />
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  to={portal.path}
                  className={cn(
                    "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/30 text-foreground hover:bg-muted/50"
                  )}
                >
                  {portal.name}
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
