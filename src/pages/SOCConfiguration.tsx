import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckSquare, FileDown, ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useStandardToast } from "@/hooks/useStandardToast";
import { useOperationsFunctions } from "@/hooks/useOperationsFunctions";

export default function SOCConfiguration() {
  const showToast = useStandardToast();
  const { customerId, isLoading: authLoading } = useCustomerAuth();
  const { generateConfigChecklist } = useOperationsFunctions();
  
  const [projectName, setProjectName] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [deploymentType, setDeploymentType] = useState("new_site");
  const [customRequirements, setCustomRequirements] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [checklist, setChecklist] = useState<string | null>(null);
  const [preChecklistOpen, setPreChecklistOpen] = useState(true);
  const [preChecklistItems, setPreChecklistItems] = useState({
    documentation: false,
    siteInfo: false,
    credentials: false,
    models: false,
    requirements: false,
    timeline: false,
  });

  // Fetch available vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from('documentation_vendors')
        .select('id, vendor_name, vendor_type')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .order('vendor_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleGenerate = async () => {
    if (!projectName.trim()) {
      showToast.error("Project name required", { description: "Please enter a project name" });
      return;
    }

    if (selectedVendors.length === 0) {
      showToast.error("Select vendors", { description: "Please select at least one vendor" });
      return;
    }

    setIsGenerating(true);
    setChecklist(null);

    try {
      const data = await generateConfigChecklist.invoke({
        projectName,
        vendors: selectedVendors,
        deploymentType,
        customRequirements: customRequirements.trim() || undefined,
      });

      if (data?.success) {
        setChecklist(data.checklist);
        showToast.success("Checklist generated", { 
          description: `Generated using ${data.vendorDocs} vendor documentation articles` 
        });
      } else {
        throw new Error(data?.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      showToast.error("Generation failed", { 
        description: error.message || "Failed to generate checklist" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!checklist) return;
    
    const blob = new Blob([checklist], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_checklist.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading || vendorsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-primary" />
            SOC Pre-Deployment Configuration
          </h1>
          <p className="text-muted-foreground">
            Generate AI-powered configuration checklists based on vendor documentation
          </p>
        </div>

        {/* Pre-Configuration Readiness Checklist */}
        <Collapsible open={preChecklistOpen} onOpenChange={setPreChecklistOpen} className="mb-6">
          <Card>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <CardTitle>Pre-Configuration Readiness Checklist</CardTitle>
                  {Object.values(preChecklistItems).every(Boolean) && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${preChecklistOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Complete these items before generating your configuration checklist
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setPreChecklistItems(prev => ({ ...prev, documentation: !prev.documentation }))}
                    className="mt-0.5"
                  >
                    {preChecklistItems.documentation ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">Vendor Documentation Loaded</p>
                    <p className="text-sm text-muted-foreground">
                      Ensure vendor documentation has been ingested for selected equipment
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setPreChecklistItems(prev => ({ ...prev, siteInfo: !prev.siteInfo }))}
                    className="mt-0.5"
                  >
                    {preChecklistItems.siteInfo ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">Site Information Gathered</p>
                    <p className="text-sm text-muted-foreground">
                      IP ranges, VLAN requirements, network topology, site-specific details
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setPreChecklistItems(prev => ({ ...prev, credentials: !prev.credentials }))}
                    className="mt-0.5"
                  >
                    {preChecklistItems.credentials ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">Access Credentials Ready</p>
                    <p className="text-sm text-muted-foreground">
                      Admin credentials, SNMP community strings, management access details
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setPreChecklistItems(prev => ({ ...prev, models: !prev.models }))}
                    className="mt-0.5"
                  >
                    {preChecklistItems.models ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">Equipment Models/Part Numbers Confirmed</p>
                    <p className="text-sm text-muted-foreground">
                      Exact model numbers, firmware versions, license requirements
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setPreChecklistItems(prev => ({ ...prev, requirements: !prev.requirements }))}
                    className="mt-0.5"
                  >
                    {preChecklistItems.requirements ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">Security & Compliance Requirements Defined</p>
                    <p className="text-sm text-muted-foreground">
                      Security policies, compliance standards, hardening requirements
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setPreChecklistItems(prev => ({ ...prev, timeline: !prev.timeline }))}
                    className="mt-0.5"
                  >
                    {preChecklistItems.timeline ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">Deployment Timeline Confirmed</p>
                    <p className="text-sm text-muted-foreground">
                      Installation team coordination, site access, configuration window scheduled
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Configure your deployment parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Regional Office Network Upgrade"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deploymentType">Deployment Type</Label>
                <Select value={deploymentType} onValueChange={setDeploymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_site">New Site</SelectItem>
                    <SelectItem value="upgrade">Equipment Upgrade</SelectItem>
                    <SelectItem value="expansion">Network Expansion</SelectItem>
                    <SelectItem value="replacement">Equipment Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Vendors *</Label>
                <div className="space-y-2 border rounded-md p-4 max-h-48 overflow-y-auto">
                  {vendors?.map((vendor) => (
                    <div key={vendor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={vendor.id}
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={() => handleVendorToggle(vendor.id)}
                      />
                      <label
                        htmlFor={vendor.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {vendor.vendor_name} ({vendor.vendor_type})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customRequirements">Custom Requirements (Optional)</Label>
                <Textarea
                  id="customRequirements"
                  placeholder="e.g., VLAN segmentation for guest network, 802.1X authentication..."
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Checklist...
                  </>
                ) : (
                  'Generate Configuration Checklist'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Checklist */}
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Checklist</CardTitle>
                  <CardDescription>
                    AI-generated based on vendor documentation
                  </CardDescription>
                </div>
                {checklist && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!checklist && !isGenerating && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure project details and generate your checklist</p>
                </div>
              )}
              
              {isGenerating && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing vendor documentation...</p>
                </div>
              )}

              {checklist && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{checklist}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}