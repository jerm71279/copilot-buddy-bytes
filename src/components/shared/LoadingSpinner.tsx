/**
 * LoadingSpinner Component
 * Reusable loading state for consistent UX across the platform
 * Eliminates inconsistent loading patterns
 */

import { Card, CardContent } from "@/components/ui/card";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 border-2",
  md: "h-12 w-12 border-b-2",
  lg: "h-16 w-16 border-b-4",
};

export const LoadingSpinner = ({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) => {
  const spinner = (
    <div className="text-center">
      <div
        className={`animate-spin rounded-full border-primary mx-auto mb-4 ${sizeClasses[size]}`}
      />
      {message && <p className="text-muted-foreground">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
        {spinner}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="py-8">{spinner}</CardContent>
    </Card>
  );
};
