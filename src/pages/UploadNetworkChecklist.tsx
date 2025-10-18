import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function UploadNetworkChecklist() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadChecklist = async () => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Get customer_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) {
        toast.error("Customer profile not found");
        return;
      }

      const checklistContent = `
# 🧭 OberaConnect Network Site Survey Checklist

## 📋 Pre-Survey Planning

### Business & Technical Requirements
- Define survey goals (coverage, capacity, interference, compliance)
- Identify target areas (indoor/outdoor zones, rack rooms, mesh nodes)
- Choose survey type (passive, active, predictive, hybrid)
- Gather business and technical requirements (SLA, latency, throughput)
- Note compliance frameworks (ISO, HIPAA, NIST, SOC 2)
- Flag environmental constraints (metal, wildlife, burn zones)

### OberaConnect Integration Points
- **NinjaOne Integration**: Pull existing device inventory and network topology
- **CIPP Integration**: Review Microsoft 365 tenant network policies and configurations
- **Configuration Management Database (CMDB)**: Document all Configuration Items (CIs) related to network infrastructure
- **Compliance Portal**: Link survey findings to relevant compliance controls and frameworks

---

## 🧰 Equipment & Tool Preparation

### Survey Tools Setup
- Calibrate survey tools (Ekahau, AirMagnet, NetSpot, WiFi Explorer)
- Load floor plans into mapping software
- Charge devices and pack backups (batteries, adapters, network cables)
- Verify firmware and tool compatibility
- Test connectivity with OberaConnect Knowledge Base for real-time documentation

### OberaConnect Pre-Survey Checklist
- **Access OberaConnect Admin Dashboard**: Verify user permissions and device access
- **NinjaOne Device Health Check**: Review existing wireless APs, switches, and controllers
- **Document Baseline Metrics**: Capture current network performance from NinjaOne monitoring
- **Review Existing Documentation**: Check OberaConnect Knowledge Base for previous survey reports and vendor documentation
- **Prepare Incident Response**: Create pre-configured incident templates for common survey findings

---

## 🏗️ On-Site Execution

### Physical Site Assessment
- Validate physical layout against floor plans
- Mark AP locations, cable paths, switch access, and patch panel locations
- Identify interference sources:
  - Electronic: microwaves, elevators, industrial equipment
  - Environmental: metal structures, water features, wildlife habitats
  - Competing networks: neighboring SSIDs, mesh networks
- Document power availability and PoE budget per switch

### RF Performance Measurements
- Measure RSSI (Received Signal Strength Indicator) across all zones
- Capture SNR (Signal-to-Noise Ratio) and noise floor
- Analyze channel overlap and channel utilization
- Test roaming behavior and handoff performance
- Validate coverage zones and identify dead spots
- Capture spectrum data (non-Wi-Fi interference on 2.4GHz, 5GHz, 6GHz bands)

### OberaConnect Real-Time Documentation
- **Live Data Entry**: Use OberaConnect mobile interface to document findings in real-time
- **Photo/Video Capture**: Upload site photos directly to knowledge base
- **Incident Logging**: Create incidents for immediate issues (damaged cables, offline APs, security gaps)
- **CI Updates**: Update Configuration Items in CMDB with accurate location and status data
- **Integration Sync**: Sync findings with NinjaOne for asset tracking and alerting

---

## 🔐 Security & Compliance Checks

### Physical Security Assessment
- Identify physical security risks:
  - Open network ports in public areas
  - Exposed cabling and equipment
  - Unsecured IDF/MDF rooms
  - Accessible PoE injectors and switches
- Document camera and surveillance coverage gaps
- Verify physical access control systems (badge readers, locks)

### Network Security & Segmentation
- Validate network segmentation zones:
  - Guest Wi-Fi isolation
  - Internal employee networks
  - HIPAA/PCI compliance zones
  - IoT device VLANs
  - Voice/video priority networks
- Check for rogue access points and unauthorized devices
- Verify encryption standards (WPA3, 802.1X, RADIUS)
- Test NAC (Network Access Control) enforcement

### OberaConnect Compliance Integration
- **Compliance Portal Mapping**: Link survey findings to specific compliance controls
- **Automated Clause Mapping**: Use OberaConnect AI to map findings to ISO 27001, NIST CSF, HIPAA, SOC 2 requirements
- **Risk Register Updates**: Create or update risk entries based on security gaps
- **Evidence Collection**: Capture screenshots and logs as compliance evidence
- **Audit Trail**: All survey activities are logged in OberaConnect audit logs with timestamps and user attribution

---

## 📊 Post-Survey Analysis & Reporting

### Data Analysis & Visualization
- Generate RF heatmaps (RSSI, SNR, channel overlap, data rate)
- Create coverage reports with pass/fail zones against SLA thresholds
- Analyze spectrum data for non-Wi-Fi interference
- Compare findings to baseline and historical surveys
- Flag remediation zones and optimization opportunities

### Remediation Planning
- Prioritize issues by business impact and severity
- Create AP placement recommendations with channel plans
- Document required equipment upgrades (APs, switches, controllers)
- Estimate project costs and timelines
- Develop phased rollout plan for minimal disruption

### OberaConnect Knowledge Base Integration
- **Auto-Generated Reports**: Use OberaConnect AI to generate executive summaries
- **Modular HTML Blocks**: Create embeddable dashboard widgets for real-time survey status
- **Knowledge Articles**: Convert survey findings into searchable knowledge articles
- **Vendor Documentation Links**: Cross-reference with vendor-specific best practices from ingested documentation
- **Clause Mapping Engine**: Automatically link findings to compliance requirements
- **Audit-Ready Exports**: Generate PDF/HTML exports with timestamps, evidence, and approval workflows

### Stakeholder Communication
- **Executive Dashboard**: Update executive dashboards with survey KPIs
- **IT Team Notifications**: Send detailed technical reports to IT teams via OberaConnect
- **Compliance Team Updates**: Notify compliance teams of any gaps or violations
- **Change Management Integration**: Create change requests for approved remediation work
- **Incident Management**: Convert high-priority findings into incidents with SLA tracking

---

## 🔗 OberaConnect Ecosystem Integration Summary

### Pre-Survey Integration
- Pull device inventory from **NinjaOne**
- Review network policies via **CIPP (Microsoft 365)**
- Check compliance status in **Compliance Portal**
- Review historical surveys in **Knowledge Base**

### During Survey Integration
- Real-time documentation in **Knowledge Base**
- Live incident creation in **Incident Management**
- CI updates in **CMDB**
- Photo/video uploads to **File Storage**

### Post-Survey Integration
- Auto-generate reports with **AI Assistant**
- Map findings to **Compliance Frameworks**
- Create **Change Requests** for remediation
- Update **Risk Register**
- Generate **Audit Evidence** packages
- Schedule follow-up surveys in **Project Management**

---

## 📝 Checklist Completion Criteria

✅ All areas surveyed with complete RF measurements  
✅ Physical security gaps documented and prioritized  
✅ Compliance violations flagged and escalated  
✅ Remediation plan approved by stakeholders  
✅ All findings documented in OberaConnect Knowledge Base  
✅ Change requests created for approved work  
✅ Executive summary delivered to leadership  
✅ Audit-ready evidence package prepared  
✅ Follow-up survey scheduled (6-12 months)

---

**Document Version**: 1.0  
**Last Updated**: ${new Date().toISOString().split('T')[0]}  
**OberaConnect Integration**: Fully Automated  
**Compliance Frameworks Supported**: ISO 27001, NIST CSF, HIPAA, SOC 2, PCI-DSS
`;

      // Insert the knowledge article
      const { error: insertError } = await supabase
        .from('knowledge_articles')
        .insert({
          customer_id: profile.customer_id,
          title: 'OberaConnect Network Site Survey Checklist',
          content: checklistContent,
          article_type: 'guide',
          status: 'published',
          tags: ['network', 'survey', 'checklist', 'infrastructure', 'compliance', 'security'],
          created_by: user.id,
          department: 'IT'
        });

      if (insertError) throw insertError;

      toast.success("Network survey checklist uploaded to Knowledge Base!");
      navigate("/knowledge");
    } catch (error) {
      console.error("Error uploading checklist:", error);
      toast.error("Failed to upload checklist");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-56 pb-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload Network Survey Checklist</CardTitle>
            <CardDescription>
              Transform the network site survey checklist into an OberaConnect-integrated guide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert">
              <p>
                This will upload a comprehensive network site survey checklist that integrates with:
              </p>
              <ul>
                <li><strong>NinjaOne</strong> - Device inventory and monitoring</li>
                <li><strong>CIPP</strong> - Microsoft 365 policy management</li>
                <li><strong>CMDB</strong> - Configuration item tracking</li>
                <li><strong>Compliance Portal</strong> - Framework mapping and evidence collection</li>
                <li><strong>Knowledge Base</strong> - Documentation and best practices</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUploadChecklist}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Checklist to Knowledge Base
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/knowledge")}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
