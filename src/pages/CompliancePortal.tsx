import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, FileCheck, AlertTriangle, Plus } from "lucide-react";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import MCPServerStatus from "@/components/MCPServerStatus";
import { useComplianceData } from "@/hooks/useComplianceData";
import { complianceStatCards, getStatusColor } from "@/lib/complianceConfig";

export default function CompliancePortal() {
  const navigate = useNavigate();
  const { frameworks, evidenceFiles, reports, isLoading, stats } = useComplianceData();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>
        
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
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  Loading frameworks...
                </CardContent>
              </Card>
            ) : frameworks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No frameworks configured</h3>
                  <p className="text-muted-foreground">Contact support to enable compliance frameworks</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Compliance Framework</CardTitle>
                  <CardDescription>Choose a framework to view details and manage compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={(value) => navigate(`/compliance/frameworks/${value}`)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a compliance framework..." />
                    </SelectTrigger>
                    <SelectContent>
                      {frameworks.map((framework) => (
                        <SelectItem key={framework.id} value={framework.id}>
                          {framework.framework_name} ({framework.framework_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            {evidenceFiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No evidence files uploaded</h3>
                  <p className="text-muted-foreground mb-4">Upload compliance evidence to get started</p>
                  <Button onClick={() => navigate('/compliance/evidence/upload')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Evidence
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {evidenceFiles.slice(0, 10).map((file) => (
                  <Card key={file.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No compliance reports</h3>
                  <p className="text-muted-foreground">Generate your first compliance report</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <Card 
                    key={report.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/compliance/reports/${report.id}`)}
                  >
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{report.report_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.framework} • {new Date(report.generated_at).toLocaleDateString()} • {report.evidence_count} evidence files
                          </p>
                        </div>
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
