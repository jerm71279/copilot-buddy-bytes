import { useNavigate } from "react-router-dom";
import { QuickActionGrid } from "@/components/ui/quick-action-grid";
import { hrQuickActions } from "@/lib/hrConfig";

export const HRQuickActionsCards = () => {
  const navigate = useNavigate();

  const actionsData = hrQuickActions.map((action) => ({
    title: action.title,
    description: action.description,
    icon: action.icon,
    buttonLabel: action.buttonLabel,
    onClick: () => navigate(action.path)
  }));

  return <QuickActionGrid actions={actionsData} columns={3} />;
};
