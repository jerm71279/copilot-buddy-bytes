import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";


interface PortalDropdownProps {
  items: { name: string; path: string }[];
  currentPath: string;
  onClose: () => void;
  lanesBottom: string;
}

export function PortalDropdown({ items, currentPath, onClose, lanesBottom }: PortalDropdownProps) {
  const getGridColumns = (itemCount: number): string => {
    if (itemCount <= 4) return "grid-cols-1 sm:grid-cols-2";
    if (itemCount <= 8) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[10000]" 
        onClick={onClose}
      />
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-[10001] bg-popover border border-border rounded-lg shadow-2xl p-6 max-w-4xl w-[90vw]"
        style={{ top: lanesBottom }}
      >
        <div className={cn("grid gap-3", getGridColumns(items.length))}>
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "block px-4 py-3 text-sm rounded-md transition-colors",
                currentPath === item.path
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
