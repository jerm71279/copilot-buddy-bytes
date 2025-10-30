/**
 * PageContainer Component
 * Standard page container with consistent spacing and layout
 * Prevents scroll bouncing and layout shifts
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
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <main
        className={`container mx-auto ${paddingClasses} ${className}`}
        style={{ 
          marginTop: 'var(--lanes-height, 0px)',
          minHeight: 'calc(100vh - var(--lanes-height, 0px))',
          willChange: 'transform',
          position: 'relative',
          zIndex: 1
        }}
      >
        {children}
      </main>
    </div>
  );
};
