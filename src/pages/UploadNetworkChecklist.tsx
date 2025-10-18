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
# 🔧 SOC Network Discovery & Installation Planning Checklist

## 📋 Phase 1: Network Scope & Discovery

### Initial Site Assessment
- Conduct site walkthrough and document physical layout
- Identify all network closets, patch panels, and cable runs
- Document existing network equipment (switches, routers, firewalls, APs)
- Note power availability and PoE requirements
- Identify environmental constraints (HVAC, electrical interference, physical obstructions)
- Map building access points and security requirements

### Network Discovery Tools
- **NinjaOne Integration**: Pull existing device inventory and network topology
- **Network Scanning**: Use discovery tools (Nmap, SolarWinds, Lansweeper) to identify:
  - Active devices and IP ranges
  - Operating systems and firmware versions
  - Open ports and services
  - Network protocols in use
  - Unauthorized or rogue devices
- **CMDB Documentation**: Record all discovered Configuration Items (CIs)
- **Diagram Creation**: Generate network topology diagrams in OberaConnect Knowledge Base

### Existing Infrastructure Analysis
- Document current network architecture and design
- Identify VLANs, subnets, and routing configuration
- Review existing security policies and ACLs
- Note any legacy systems or end-of-life equipment
- Document current bandwidth utilization and traffic patterns
- Review existing vendor support contracts and warranty status

---

## 🛠️ Phase 2: Configuration Planning

### Equipment Configuration Requirements
- **Switch Configuration**:
  - Port assignments and VLAN tagging
  - Trunk port configuration for inter-switch links
  - PoE budget allocation per port
  - QoS policies for voice/video traffic
  - Link aggregation (LACP) where needed
  - Spanning Tree Protocol (STP) configuration
  
- **Router/Firewall Configuration**:
  - Routing protocols (OSPF, BGP, static routes)
  - Security policies and rule sets
  - NAT and port forwarding rules
  - VPN configurations
  - Interface IP addressing scheme

- **Wireless Configuration**:
  - SSID configuration and broadcast settings
  - Security settings (WPA3, 802.1X, RADIUS)
  - Channel planning and RF optimization
  - Roaming policies and fast transition
  - Guest network isolation
  - IoT device segmentation

### Network Segmentation Design
- Define VLAN strategy:
  - Management VLAN (network devices)
  - User VLANs (departments, groups)
  - Guest VLAN (isolated internet-only access)
  - Voice VLAN (VoIP phones and UC devices)
  - IoT VLAN (cameras, sensors, building automation)
  - Server VLAN (production systems)
- Document IP addressing scheme for each segment
- Plan security zones and firewall policies between VLANs
- Design access control lists (ACLs) for inter-VLAN routing

---

## 📊 Phase 3: Execution Plan Development

### Pre-Installation Preparation
- **Equipment Procurement**:
  - Verify all equipment has been received
  - Check firmware versions and plan updates
  - Test equipment functionality in lab environment
  - Prepare backup configurations
  
- **Configuration Templates**:
  - Create standardized configuration templates
  - Document naming conventions for devices and interfaces
  - Prepare staging scripts for bulk configuration
  - Test configurations in isolated environment

- **Documentation Requirements**:
  - Network diagrams (physical and logical topology)
  - IP address management (IPAM) spreadsheet
  - VLAN and subnet allocation table
  - Port assignments and cable labeling scheme
  - Equipment rack elevation diagrams
  - As-built documentation templates

### Installation Timeline & Milestones
- **Day 1: Physical Installation**
  - Rack and mount equipment
  - Run and terminate cabling
  - Label all cables and ports
  - Verify power and environmental conditions
  
- **Day 2: Base Configuration**
  - Configure management IP addresses
  - Apply baseline security settings
  - Set up SNMP monitoring
  - Integrate devices with NinjaOne
  
- **Day 3: Service Configuration**
  - Configure VLANs and routing
  - Apply security policies
  - Configure wireless controllers and APs
  - Implement QoS policies
  
- **Day 4: Testing & Validation**
  - End-to-end connectivity testing
  - Performance and throughput testing
  - Security validation (port scanning, vulnerability assessment)
  - Wireless coverage validation
  
- **Day 5: Cutover & Documentation**
  - Migrate users to new network infrastructure
  - Monitor for issues and troubleshoot
  - Complete as-built documentation
  - Deliver handoff to operations team

### Risk Mitigation Strategies
- **Rollback Plan**:
  - Maintain existing network as backup during cutover
  - Document rollback procedures for each phase
  - Define rollback decision criteria and approval process
  
- **Backup & Recovery**:
  - Schedule configuration backups before any changes
  - Store backups in OberaConnect Knowledge Base
  - Test configuration restoration procedures
  
- **Change Management**:
  - Create change requests in OberaConnect for all major milestones
  - Define approval workflows and stakeholder notifications
  - Schedule maintenance windows with business units
  - Prepare communication templates for users

---

## 🔐 Phase 4: Security & Compliance Validation

### Security Baseline Configuration
- Disable unused ports and services
- Configure strong authentication (TACACS+, RADIUS)
- Enable logging and SIEM integration
- Apply vendor security hardening guides
- Configure secure management access (SSH, HTTPS only)
- Implement network access control (NAC) where required

### Compliance Requirements
- **OberaConnect Compliance Integration**:
  - Map network configuration to compliance frameworks
  - Document security controls for audit evidence
  - Link configurations to ISO 27001, NIST CSF, HIPAA, SOC 2 requirements
  - Generate compliance reports for stakeholders

- **Audit Trail & Evidence Collection**:
  - Capture configuration files as evidence
  - Document approval workflows
  - Log all configuration changes with timestamps
  - Prepare audit-ready documentation packages

---

## 🔗 OberaConnect Integration Summary

### Pre-Installation Integration
- Pull device inventory from **NinjaOne**
- Review existing network policies via **CIPP (Microsoft 365)**
- Document all CIs in **CMDB**
- Review compliance requirements in **Compliance Portal**

### During Installation Integration
- Real-time progress updates in **Knowledge Base**
- Incident creation for any issues in **Incident Management**
- Configuration file storage in **File Storage**
- Change request tracking in **Change Management**

### Post-Installation Integration
- Auto-generate as-built documentation with **AI Assistant**
- Map configurations to **Compliance Frameworks**
- Update **Risk Register** with residual risks
- Generate **Audit Evidence** packages for compliance teams
- Schedule follow-up reviews in **Project Management**

---

## ✅ Checklist Completion Criteria

✅ All existing network devices discovered and documented  
✅ Network topology diagrams created and approved  
✅ Configuration templates tested and validated  
✅ VLAN and IP addressing scheme defined  
✅ Installation timeline and milestones approved  
✅ Risk mitigation and rollback plans documented  
✅ All configurations stored in OberaConnect Knowledge Base  
✅ Security baseline applied and validated  
✅ Compliance evidence collected and mapped  
✅ As-built documentation delivered to stakeholders  
✅ Handoff to operations team completed

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
          title: 'SOC Network Discovery & Installation Planning Checklist',
          content: checklistContent,
          article_type: 'guide',
          status: 'published',
          tags: ['network', 'discovery', 'installation', 'checklist', 'configuration', 'planning', 'SOC'],
          created_by: user.id
        });

      if (insertError) throw insertError;

      toast.success("Network discovery & installation checklist uploaded to Knowledge Base!");
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
            <CardTitle>Upload Network Discovery Checklist</CardTitle>
            <CardDescription>
              SOC Engineer workflow for network discovery, configuration planning, and installation preparation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert">
              <p>
                This will upload a comprehensive network discovery and installation planning checklist that integrates with:
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
