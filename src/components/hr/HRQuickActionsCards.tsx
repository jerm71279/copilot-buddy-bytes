import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hrQuickActions } from "@/lib/hrConfig";

export const HRQuickActionsCards = () => {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hrQuickActions.map((action) => (
        <Card 
          key={action.title}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(action.path)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <action.icon className="h-5 w-5" />
              {action.title}
            </CardTitle>
            <CardDescription>{action.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              {action.buttonLabel}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
