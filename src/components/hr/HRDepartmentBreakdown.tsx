import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { departmentBreakdown } from "@/lib/hrConfig";

export const HRDepartmentBreakdown = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Breakdown</CardTitle>
        <CardDescription>Employee distribution across departments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departmentBreakdown.map((dept) => (
            <div key={dept.department} className="flex items-center justify-between">
              <span className="font-medium">{dept.department}</span>
              <Badge>{dept.count} employees</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
