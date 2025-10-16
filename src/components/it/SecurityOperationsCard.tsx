import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { securityCard } from "@/lib/itConfig";

export function SecurityOperationsCard() {
  const Icon = securityCard.icon;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{securityCard.title}</CardTitle>
        <CardDescription>{securityCard.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={securityCard.path}>
          <Button className="w-full" variant="outline" size="lg">
            <Icon className="h-5 w-5 mr-2" />
            {securityCard.buttonText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
