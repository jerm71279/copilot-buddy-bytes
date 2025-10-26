import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck, AlertTriangle, Plus } from "lucide-react";
import { getStatusColor } from "@/lib/complianceConfig";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface Framework {
  id: string;
  framework_name: string;
  framework_code: string;
}

interface EvidenceFile {
  id: string;
  file_name: string;
  uploaded_at: string;
}

interface Report {
  id: string;
  report_name: string;
  framework: string;
  generated_at: string;
  evidence_count: number;
  status: string;
}

interface ComplianceTabContentProps {
  activeTab: string;
  frameworks: Framework[];
  evidenceFiles: EvidenceFile[];
  reports: Report[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

export function ComplianceTabContent({ 
  activeTab, 
  frameworks, 
  evidenceFiles, 
  reports, 
  isLoading,
  onNavigate 
}: ComplianceTabContentProps) {
  if (activeTab === "frameworks") {
    return (
      <>
        {isLoading ? (
          <LoadingSpinner message="Loading frameworks..." />
        ) : frameworks.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No frameworks configured"
            description="Contact support to enable compliance frameworks"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Compliance Framework</CardTitle>
              <CardDescription>Choose a framework to view details and manage compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => onNavigate(`/compliance/frameworks/${value}`)}>
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
      </>
    );
  }

  if (activeTab === "evidence") {
    return (
      <>
        {evidenceFiles.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="No evidence files uploaded"
            description="Upload compliance evidence to get started"
            action={{
              label: "Upload Evidence",
              onClick: () => onNavigate('/compliance/evidence/upload'),
            }}
          />
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
      </>
    );
  }

  if (activeTab === "reports") {
    return (
      <>
        {reports.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No compliance reports"
            description="Generate your first compliance report"
          />
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <Card 
                key={report.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onNavigate(`/compliance/reports/${report.id}`)}
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
      </>
    );
  }

  return null;
}
