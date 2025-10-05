import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText } from "lucide-react";

export default function ComplianceEvidenceUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    fileName: "",
    description: "",
    frameworkId: "",
    controlId: "",
    complianceTags: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Get user's customer_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.customer_id) {
        throw new Error('Customer ID not found');
      }

      // Create evidence file record
      const { error } = await supabase
        .from('evidence_files')
        .insert({
          file_name: formData.fileName,
          description: formData.description,
          framework_id: formData.frameworkId || null,
          control_id: formData.controlId || null,
          compliance_tags: formData.complianceTags.split(',').map(t => t.trim()).filter(Boolean),
          customer_id: profile.customer_id,
          uploaded_by: session.user.id,
          file_type: 'document',
          file_size: 0,
          storage_path: `/evidence/${formData.fileName}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Evidence file uploaded successfully"
      });

      navigate('/compliance');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload evidence",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Compliance Evidence
            </CardTitle>
            <CardDescription>
              Add evidence files to support compliance controls and frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileName">File Name *</Label>
                <Input
                  id="fileName"
                  required
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  placeholder="e.g., Security_Policy_2025.pdf"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the evidence and its purpose"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="controlId">Control ID</Label>
                <Input
                  id="controlId"
                  value={formData.controlId}
                  onChange={(e) => setFormData({ ...formData, controlId: e.target.value })}
                  placeholder="e.g., ISO-A.5.1, SOC2-CC6.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceTags">Compliance Tags</Label>
                <Input
                  id="complianceTags"
                  value={formData.complianceTags}
                  onChange={(e) => setFormData({ ...formData, complianceTags: e.target.value })}
                  placeholder="e.g., ISO27001, SOC2, access_control (comma-separated)"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isUploading}>
                  <FileText className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Evidence"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/compliance')}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
