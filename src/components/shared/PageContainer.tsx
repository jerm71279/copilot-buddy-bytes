/**
 * PageContainer Component
 * Standard page container with consistent spacing and layout
 * Eliminates layout inconsistencies across the platform
 */

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const PageContainer = ({
  children,
  className = "",
  noPadding = false,
}: PageContainerProps) => {
  const paddingClasses = noPadding ? "" : "px-4 pb-8 pt-8";
  
  return (
    <div className="min-h-screen bg-background">
      <main
        className={`container mx-auto ${paddingClasses} ${className}`}
        style={{ marginTop: 'var(--lanes-height, 0px)' }}
      >
        {children}
      </main>
    </div>
  );
};
