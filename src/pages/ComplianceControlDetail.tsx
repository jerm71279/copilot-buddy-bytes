import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, CheckCircle2 } from "lucide-react";
import { LinkTray } from "@/components/LinkTray";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useStandardToast } from "@/hooks/useStandardToast";

interface Control {
  id: string;
  framework_id: string;
  control_id: string;
  control_name: string;
  description: string;
  category: string;
  automation_level: string;
  required_evidence: string[];
}

interface Framework {
  id: string;
  framework_name: string;
  framework_code: string;
}

interface EvidenceFile {
  id: string;
  file_name: string;
  control_id: string;
  uploaded_at: string;
  uploaded_by: string;
}

export default function ComplianceControlDetail() {
  const { frameworkId, controlId } = useParams();
  const navigate = useNavigate();
  const toast = useStandardToast();
  const [control, setControl] = useState<Control | null>(null);
  const [framework, setFramework] = useState<Framework | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadControlDetails();
  }, [frameworkId, controlId]);

  const loadControlDetails = async () => {
    setIsLoading(true);
    try {
      // Load control details
      const { data: controlData, error: controlError } = await supabase
        .from('compliance_controls')
        .select('*')
        .eq('id', controlId)
        .eq('framework_id', frameworkId)
        .maybeSingle();

      if (controlError) throw controlError;
      setControl(controlData);

      // Load framework details
      const { data: frameworkData, error: frameworkError } = await supabase
        .from('compliance_frameworks')
        .select('id, framework_name, framework_code')
        .eq('id', frameworkId)
        .maybeSingle();

      if (frameworkError) throw frameworkError;
      setFramework(frameworkData);

      // Load evidence files for this control
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence_files')
        .select('*')
        .eq('framework_id', frameworkId)
        .eq('control_id', controlData.control_id)
        .order('uploaded_at', { ascending: false });

      if (evidenceError) throw evidenceError;
      setEvidenceFiles(evidenceData || []);
    } catch (error) {
      console.error('Error loading control details:', error);
      toast.loadFailed('control details');
    } finally {
      setIsLoading(false);
    }
  };

  const getAutomationColor = (level: string) => {
    switch (level) {
      case 'automated': return 'default';
      case 'semi-automated': return 'secondary';
      case 'manual': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading control details..." />
      </DashboardLayout>
    );
  }

  if (!control || !framework) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Shield}
          title="Control Not Found"
          description="The requested control could not be found."
          action={{
            label: "Go Back",
            onClick: () => navigate(-1),
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout noPadding>
      <div className="px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{framework.framework_code}</Badge>
              <Badge variant={getAutomationColor(control.automation_level)}>
                {control.automation_level}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {control.control_id}: {control.control_name}
            </h1>
            <p className="text-muted-foreground">{framework.framework_name}</p>
          </div>
          <LinkTray
            items={[
              { label: "Framework", path: `/compliance/frameworks/${frameworkId}`, icon: Shield },
              { label: "Compliance", path: "/compliance", icon: FileText },
            ]}
            maxVisibleItems={2}
            showBack={false}
          />
        </div>

        <div className="grid gap-6">
          {/* Control Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Control Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{control.description || 'No description available'}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Category</h3>
                <Badge>{control.category}</Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Automation Level</h3>
                <Badge variant={getAutomationColor(control.automation_level)}>
                  {control.automation_level}
                </Badge>
              </div>

              {control.required_evidence && control.required_evidence.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Required Evidence</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {control.required_evidence.map((evidence, idx) => (
                      <li key={idx} className="text-muted-foreground">{evidence}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidence Files ({evidenceFiles.length})
                </div>
                <Button 
                  size="sm"
                  onClick={() => navigate('/compliance/evidence/upload')}
                >
                  Upload Evidence
                </Button>
              </CardTitle>
              <CardDescription>
                Supporting documentation and evidence for this control
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidenceFiles.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No evidence files uploaded yet"
                  description="Upload evidence files to document this control's implementation"
                />
              ) : (
                <div className="space-y-2">
                  {evidenceFiles.map((file) => (
                    <div 
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Control: {file.control_id}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Implementation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary">{evidenceFiles.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Evidence Files</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {control.required_evidence?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Required Evidence</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {evidenceFiles.length >= (control.required_evidence?.length || 0) ? '100%' : 
                     Math.round((evidenceFiles.length / (control.required_evidence?.length || 1)) * 100) + '%'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Compliance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
    </DashboardLayout>
  );
}
