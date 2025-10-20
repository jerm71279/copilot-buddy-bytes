import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck, Plus } from "lucide-react";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import MCPServerStatus from "@/components/MCPServerStatus";
import { useComplianceData } from "@/hooks/useComplianceData";
import { complianceStatCards } from "@/lib/complianceConfig";
import { ComplianceTabContent } from "@/components/compliance/ComplianceTabContent";

export default function CompliancePortal() {
  const navigate = useNavigate();
  const { frameworks, evidenceFiles, reports, isLoading, stats } = useComplianceData();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Compliance Management</h1>
            <p className="text-muted-foreground">Track compliance frameworks and evidence collection</p>
          </div>
          <DashboardSettingsMenu dashboardName="Compliance Portal" />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6 overflow-x-auto">
          <Button size="sm" onClick={() => navigate('/compliance/audit-reports')}>
            <FileCheck className="mr-2 h-4 w-4" />
            Generate Audit Report
          </Button>
          <Button size="sm" onClick={() => navigate('/compliance/evidence/upload')} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Upload Evidence
          </Button>
        </div>

        <Tabs defaultValue="frameworks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="frameworks" className="space-y-4">
            <ComplianceTabContent 
              activeTab="frameworks"
              frameworks={frameworks}
              evidenceFiles={evidenceFiles}
              reports={reports}
              isLoading={isLoading}
              onNavigate={navigate}
            />
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            <ComplianceTabContent 
              activeTab="evidence"
              frameworks={frameworks}
              evidenceFiles={evidenceFiles}
              reports={reports}
              isLoading={isLoading}
              onNavigate={navigate}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ComplianceTabContent 
              activeTab="reports"
              frameworks={frameworks}
              evidenceFiles={evidenceFiles}
              reports={reports}
              isLoading={isLoading}
              onNavigate={navigate}
            />
          </TabsContent>
        </Tabs>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {complianceStatCards.map((card) => {
            const Icon = card.icon;
            const value = card.getValue(stats);
            return (
              <Card key={card.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${card.className || ''}`}>
                    {value}
                  </div>
                  {card.id === 'score' && typeof value === 'string' && (
                    <Progress value={stats.complianceScore} className="mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <DepartmentAIAssistant department="compliance" departmentLabel="Compliance" />
          <MCPServerStatus filterByServerType="compliance" />
        </div>
      </main>
    </div>
  );
}
