/**
 * DashboardLayout Component
 * Centralizes Navigation + DashboardNavigation + PageContainer pattern
 * Eliminates 100+ lines of duplicate layout code across pages
 */

import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { PageContainer } from "@/components/shared/PageContainer";

interface DashboardLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showDashboardNavigation?: boolean;
  noPadding?: boolean;
  className?: string;
}

export const DashboardLayout = ({
  children,
  showNavigation = true,
  showDashboardNavigation = true,
  noPadding = false,
  className = "",
}: DashboardLayoutProps) => {
  return (
    <>
      {showNavigation && <Navigation />}
      {showDashboardNavigation && <DashboardNavigation />}
      <PageContainer noPadding={noPadding} className={className}>
        {children}
      </PageContainer>
    </>
  );
};
