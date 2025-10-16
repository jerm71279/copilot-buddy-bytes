import { Server, Calculator, Bot, Settings } from "lucide-react";

export type QuickActionCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

export function getQuickActionCards(navigate: (path: string) => void, setActiveView: (view: string) => void): QuickActionCard[] {
  return [
    {
      id: 'applications',
      title: 'Applications',
      description: 'Manage system applications',
      icon: Server,
      onClick: () => navigate('/admin/applications')
    },
    {
      id: 'products',
      title: 'Products',
      description: 'Manage product offerings',
      icon: Server,
      onClick: () => navigate('/admin/products')
    },
    {
      id: 'modules',
      title: 'Module Management',
      description: 'Enable/disable portals and modules',
      icon: Server,
      onClick: () => navigate('/admin/modules')
    },
    {
      id: 'cost-calculator',
      title: 'Cost Calculator',
      description: 'Calculate Lovable infrastructure costs',
      icon: Calculator,
      onClick: () => navigate('/admin/cost-calculator')
    },
    {
      id: 'ai-agents',
      title: 'AI Agents',
      description: 'Monitor autonomous department agents',
      icon: Bot,
      onClick: () => setActiveView('ai-agents')
    },
    {
      id: 'ai-config',
      title: 'AI Configuration',
      description: 'Configure agents and automated tasks',
      icon: Settings,
      onClick: () => setActiveView('ai-config')
    }
  ];
}

export function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    active: "default",
    trial: "secondary",
    inactive: "destructive",
  };
  return variants[status] || "default";
}
