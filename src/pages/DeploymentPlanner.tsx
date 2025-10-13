import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Network, AlertTriangle, Users, BarChart3, Plus, CheckCircle } from "lucide-react";

const DeploymentPlanner = () => {
  return (
    <div className="container mx-auto p-6 max-w-[1800px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Deployment Planner</h1>
          <p className="text-muted-foreground">
            Comprehensive project planning with Gantt charts, dependency tracking, and risk analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Export Timeline
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Gantt Charts
            </CardTitle>
            <CardDescription>
              Visual timeline of tasks, dependencies, and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Timeline visualization by month/quarter/year
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Task progress tracking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Milestone markers
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-500" />
              Dependency Tracking
            </CardTitle>
            <CardDescription>
              Map task relationships and identify bottlenecks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Task dependency visualization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Blocked task identification
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Risk Management
            </CardTitle>
            <CardDescription>
              Identify and monitor project risks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Risk probability × impact matrix
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Mitigation plan tracking
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Database Setup Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900">Database Schema Ready</div>
              <div className="text-sm text-blue-700 mt-1">
                Complete project planning database schema implemented: projects, tasks, dependencies, 
                milestones, resource allocation, and risk management tables.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentPlanner;