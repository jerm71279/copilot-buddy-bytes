import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ComplianceFrameworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [framework, setFramework] = useState<any>(null);
  const [controls, setControls] = useState<any[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFrameworkDetails();
  }, [id]);

  const loadFrameworkDetails = async () => {
    try {
      // Load framework
      const { data: frameworkData, error: frameworkError } = await supabase
        .from('compliance_frameworks')
        .select('*')
        .eq('id', id)
        .single();

      if (frameworkError) throw frameworkError;
      setFramework(frameworkData);

      // Load controls for this framework
      const { data: controlsData, error: controlsError } = await supabase
        .from('compliance_controls')
        .select('*')
        .eq('framework_id', id);

      if (controlsError) throw controlsError;
      setControls(controlsData || []);

      // Load evidence files for this framework
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence_files')
        .select('*')
        .eq('framework_id', id);

      if (evidenceError) throw evidenceError;
      setEvidenceFiles(evidenceData || []);

    } catch (error: any) {
      console.error('Error loading framework details:', error);
      toast.error('Failed to load framework details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading framework details...</p>
        </div>
      </div>
    );
  }

  if (!framework) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Framework not found</p>
          <Button onClick={() => navigate('/compliance')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Compliance Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate('/compliance')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Compliance Portal
        </Button>

        <div className="flex items-start gap-4 mb-6">
          <Shield className="h-12 w-12 text-primary" />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{framework.framework_name}</h1>
            <p className="text-muted-foreground mb-4">{framework.description}</p>
            <div className="flex gap-2">
              <Badge variant="outline">{framework.framework_code}</Badge>
              <Badge variant="outline">{framework.industry}</Badge>
              {framework.version && <Badge variant="outline">v{framework.version}</Badge>}
              {framework.is_active && <Badge>Active</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{controls.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evidence Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evidenceFiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {controls.length > 0 ? Math.round((evidenceFiles.length / controls.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {controls.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>
                Compliance controls defined for {framework.framework_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {controls.map((control) => (
                  <div key={control.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{control.control_name}</h4>
                        <p className="text-sm text-muted-foreground">{control.control_id}</p>
                      </div>
                      <Badge variant="outline">{control.category}</Badge>
                    </div>
                    {control.description && (
                      <p className="text-sm text-muted-foreground mb-2">{control.description}</p>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Automation: {control.automation_level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {evidenceFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evidence Files</CardTitle>
              <CardDescription>
                Supporting evidence for {framework.framework_name} compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {evidenceFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.control_id && `Control: ${file.control_id}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {controls.length === 0 && evidenceFiles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No controls or evidence yet</h3>
              <p className="text-muted-foreground">
                This framework is configured but doesn't have controls or evidence files yet.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
