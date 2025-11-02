import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";
import { useAuth } from "@/hooks/useAuth";

export default function UploadNetworkChecklist() {
  const navigate = useNavigate();
  const { customerId, isLoading: profileLoading } = useUserProfile();
  const showToast = useStandardToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadChecklist = async () => {
    if (!customerId) {
      showToast.error("Customer profile not found");
      return;
    }

    setIsUploading(true);
    try {
      if (!user) {
        showToast.error("You must be logged in");
        return;
      }

      const checklistContent = `
# 🔧 SOC Network Discovery & Installation Planning Checklist

## 📚 Training Resources & Best Practices

### Recommended Video Training
Before beginning your network discovery and planning, review these practical guides:

1. **[Characterizing the Existing Network and Sites](https://www.youtube.com/watch?v=gglTU0QTGaM)** - Deep dive into auditing, traffic analysis, and planning timelines
2. **[Real Life Example: Network Discovery (Basic)](https://www.youtube.com/watch?v=mkvvbWg-oGQ)** - Hands-on troubleshooting and host tracking using IP-based methods
3. **[Mapping out a Network with Cisco Discovery Protocol (CDP)](https://www.youtube.com/watch?v=hFV2J0eEeFY)** - Topology discovery using CDP and neighbor relationships
4. **[Network Planning Fundamentals](https://www.youtube.com/watch?v=EV9LYUdkyrQ)** - Scoping, cabling, operational cost planning, and project timelines
5. **[Application Discovery with VMware Aria Operations](https://www.youtube.com/watch?v=ubHo1fW9iLQ)** - Application layer discovery using vRealize Network Insight

---

## 📊 Project Overview & Phases

This checklist is organized into **5 distinct phases** that can be executed sequentially or in parallel depending on team capacity:

| Phase | Duration | Owner | Dependencies |
|-------|----------|-------|--------------|
| **Phase 1**: Pre-Discovery Planning | 1-2 days | SOC Lead | None |
| **Phase 2**: Network Discovery & Mapping | 3-5 days | Network Engineer | Phase 1 |
| **Phase 3**: Configuration Design | 2-3 days | Network Architect | Phase 2 |
| **Phase 4**: Equipment Preparation | 2-3 days | IT Admin | Phase 3 |
| **Phase 5**: Installation Planning & Validation | 1-2 days | Project Manager | Phases 2-4 |

**Total Estimated Timeline**: 9-15 business days

---

## 🎯 PHASE 1: Pre-Discovery Planning
**Duration**: 1-2 days | **Owner**: SOC Lead | **Status**: ⬜ Not Started

### Module 1.1: Stakeholder Alignment
- ⬜ Schedule kickoff meeting with IT leadership
- ⬜ Define project scope and success criteria
- ⬜ Identify key stakeholders and decision makers
- ⬜ Establish communication channels and escalation paths
- ⬜ Document business objectives and constraints

**Deliverable**: Project charter and stakeholder contact list

### Module 1.2: Site Assessment & Access
- ⬜ Confirm physical site access and security clearances
- ⬜ Identify network closets, IDFs, and MDFs
- ⬜ Document access hours and on-site contact information
- ⬜ Review building floor plans and cable diagrams
- ⬜ Note environmental factors (HVAC, power, physical constraints)

**Deliverable**: Site access plan and facility documentation

### Module 1.3: Tool & Equipment Validation
- ⬜ Verify access to **NinjaOne** device inventory
- ⬜ Confirm **CIPP** integration for Microsoft 365 policies
- ⬜ Test network discovery tools (Nmap, SolarWinds, Lansweeper)
- ⬜ Prepare network analyzers and cable testers
- ⬜ Set up OberaConnect **Knowledge Base** project workspace

**Deliverable**: Validated toolset and access credentials

### Module 1.4: Documentation Baseline
- ⬜ Gather existing network diagrams and documentation
- ⬜ Review vendor contracts and support agreements
- ⬜ Document known issues and pain points from users
- ⬜ Create **CMDB** project container for all CIs
- ⬜ Set up change request template in OberaConnect

**Deliverable**: Baseline documentation package

**Phase 1 Sign-Off**: ⬜ SOC Lead Approval | ⬜ IT Director Approval

---

## 🔍 PHASE 2: Network Discovery & Mapping
**Duration**: 3-5 days | **Owner**: Network Engineer | **Status**: ⬜ Not Started

### Module 2.1: Active Device Discovery
- ⬜ Run network scans across all IP ranges (Nmap/Lansweeper)
- ⬜ Identify all active hosts, routers, switches, firewalls, APs
- ⬜ Document device manufacturers, models, and firmware versions
- ⬜ Pull NinjaOne inventory for comparison and validation
- ⬜ Flag unknown or unauthorized devices for investigation

**Deliverable**: Complete device inventory spreadsheet

### Module 2.2: Topology Mapping
- ⬜ Use CDP/LLDP to map device neighbor relationships
- ⬜ Trace physical cable runs and patch panel connections
- ⬜ Document uplink/downlink port configurations
- ⬜ Identify trunk ports, access ports, and port channels
- ⬜ Map wireless AP coverage zones and controller relationships

**Deliverable**: Layer 2/Layer 3 topology diagrams

### Module 2.3: Network Services Discovery
- ⬜ Identify DHCP servers and scope configurations
- ⬜ Document DNS servers and zone files
- ⬜ Map VLANs and subnets across the infrastructure
- ⬜ Locate NAT/PAT configurations and firewall rules
- ⬜ Identify routing protocols (OSPF, EIGRP, BGP, static routes)

**Deliverable**: Network services inventory and IP address management (IPAM) documentation

### Module 2.4: Application & Service Dependency Mapping
- ⬜ Identify critical applications and their network dependencies
- ⬜ Document server locations and application flows
- ⬜ Map database connections and API endpoints
- ⬜ Identify single points of failure in application delivery
- ⬜ Document load balancers, proxies, and content filters

**Deliverable**: Application dependency map linked to **CMDB**

### Module 2.5: Security & Compliance Scan
- ⬜ Run vulnerability scans on discovered devices
- ⬜ Check for rogue access points and unauthorized devices
- ⬜ Validate segmentation between VLANs (guest, internal, IoT)
- ⬜ Review firewall rules for overly permissive access
- ⬜ Document encryption standards (WPA3, 802.1X)

**Deliverable**: Security findings report with risk ratings

**Phase 2 Sign-Off**: ⬜ Network Engineer Approval | ⬜ Security Team Review

---

## 🎨 PHASE 3: Configuration Design & Planning
**Duration**: 2-3 days | **Owner**: Network Architect | **Status**: ⬜ Not Started

### Module 3.1: Network Architecture Design
- ⬜ Design logical network topology (layers, tiers, zones)
- ⬜ Define VLAN strategy and IP addressing scheme
- ⬜ Plan routing architecture (protocols, metrics, redundancy)
- ⬜ Design security zones and firewall policy framework
- ⬜ Document naming conventions for devices and interfaces

**Deliverable**: Network architecture design document

### Module 3.2: Equipment Configuration Templates
- ⬜ Create standardized switch configuration templates
- ⬜ Develop router/firewall baseline configurations
- ⬜ Build wireless controller and AP config templates
- ⬜ Document PoE power budgets per switch
- ⬜ Prepare QoS policies for voice/video traffic

**Deliverable**: Configuration template library in OberaConnect Knowledge Base

### Module 3.3: VLAN & Segmentation Planning
- ⬜ Define VLAN IDs and names (management, user, guest, IoT, voice)
- ⬜ Assign IP subnets to each VLAN
- ⬜ Plan inter-VLAN routing and security policies
- ⬜ Design NAC (Network Access Control) integration
- ⬜ Document VLAN tagging across trunk ports

**Deliverable**: VLAN assignment table and security matrix

### Module 3.4: Wireless Network Design
- ⬜ Plan SSID configurations and broadcast settings
- ⬜ Design channel allocation (non-overlapping channels)
- ⬜ Configure 802.1X authentication with RADIUS
- ⬜ Set up guest portal and captive portal policies
- ⬜ Plan fast roaming (802.11k/r/v) settings

**Deliverable**: Wireless design document with RF planning

### Module 3.5: Security & Compliance Baseline
- ⬜ Define security hardening requirements (CIS benchmarks)
- ⬜ Plan logging and SIEM integration points
- ⬜ Configure compliance policies (ISO 27001, NIST CSF, HIPAA)
- ⬜ Document audit trail requirements
- ⬜ Map configurations to **Compliance Portal** controls

**Deliverable**: Security baseline and compliance mapping document

**Phase 3 Sign-Off**: ⬜ Network Architect Approval | ⬜ Security Lead Approval

---

## 🧰 PHASE 4: Equipment Preparation & Staging
**Duration**: 2-3 days | **Owner**: IT Admin | **Status**: ⬜ Not Started

### Module 4.1: Equipment Procurement Validation
- ⬜ Verify all equipment has been delivered and unpacked
- ⬜ Check hardware against purchase orders and BOMs
- ⬜ Document serial numbers and asset tags
- ⬜ Register equipment in **NinjaOne** and **CMDB**
- ⬜ Verify vendor support and warranty activation

**Deliverable**: Equipment receiving report and asset inventory

### Module 4.2: Firmware & Software Updates
- ⬜ Check current firmware versions against recommended releases
- ⬜ Download and stage firmware updates
- ⬜ Test firmware updates in lab environment
- ⬜ Document firmware update procedures
- ⬜ Prepare rollback plan for firmware issues

**Deliverable**: Firmware update plan and staging documentation

### Module 4.3: Configuration Staging
- ⬜ Apply configuration templates to devices in staging environment
- ⬜ Test configurations for syntax errors and conflicts
- ⬜ Validate inter-device connectivity (VLAN trunking, routing)
- ⬜ Test wireless controller and AP association
- ⬜ Backup staged configurations to OberaConnect

**Deliverable**: Validated configuration files ready for deployment

### Module 4.4: Physical Installation Preparation
- ⬜ Prepare rack elevations and mounting hardware
- ⬜ Label all cables (patch cables, fiber, copper uplinks)
- ⬜ Prepare cable management hardware (trays, ties, labels)
- ⬜ Verify power availability and PDU capacity
- ⬜ Coordinate with facilities for rack access and power work

**Deliverable**: Rack installation plan with cable management design

### Module 4.5: Testing & Validation Lab Setup
- ⬜ Build isolated test network in lab
- ⬜ Validate end-to-end connectivity (workstation to server)
- ⬜ Test wireless roaming and authentication
- ⬜ Perform throughput and latency testing
- ⬜ Simulate failure scenarios and validate redundancy

**Deliverable**: Lab test results and validation report

**Phase 4 Sign-Off**: ⬜ IT Admin Approval | ⬜ Network Engineer Approval

---

## 📅 PHASE 5: Installation Planning & Validation
**Duration**: 1-2 days | **Owner**: Project Manager | **Status**: ⬜ Not Started

### Module 5.1: Cutover Planning
- ⬜ Define maintenance window and business impact
- ⬜ Create detailed hour-by-hour cutover timeline
- ⬜ Assign tasks to team members with contact information
- ⬜ Prepare rollback decision criteria and procedures
- ⬜ Schedule stakeholder notifications (email templates)

**Deliverable**: Cutover runbook with roles and responsibilities

### Module 5.2: Communication & Change Management
- ⬜ Create change request in OberaConnect **Change Management**
- ⬜ Get approvals from CAB (Change Advisory Board)
- ⬜ Send advance notifications to end users (1 week, 3 days, 1 day)
- ⬜ Prepare help desk for expected support calls
- ⬜ Document known workarounds for common issues

**Deliverable**: Approved change request and communication plan

### Module 5.3: Risk Assessment & Mitigation
- ⬜ Identify high-risk activities (firewall rule changes, routing updates)
- ⬜ Document rollback procedures for each critical step
- ⬜ Assign backup resources for key roles
- ⬜ Prepare emergency contact escalation matrix
- ⬜ Review insurance and liability coverage

**Deliverable**: Risk register with mitigation strategies

### Module 5.4: Post-Installation Validation Plan
- ⬜ Define acceptance testing criteria
- ⬜ Prepare network monitoring dashboard in NinjaOne
- ⬜ Create incident response plan for Day 1 issues
- ⬜ Schedule post-implementation review (PIR) meeting
- ⬜ Document as-built configuration standards

**Deliverable**: Post-implementation validation checklist

### Module 5.5: Documentation & Handoff
- ⬜ Generate as-built network diagrams (physical & logical)
- ⬜ Document all configuration changes in **CMDB**
- ⬜ Create knowledge articles in OberaConnect for common tasks
- ⬜ Deliver operations runbook to NOC/help desk
- ⬜ Schedule training sessions for support staff

**Deliverable**: Complete handoff package to operations team

**Phase 5 Sign-Off**: ⬜ Project Manager Approval | ⬜ Executive Sponsor Approval

---

## 🔗 OberaConnect Integration Summary

### Pre-Installation Integration
- **NinjaOne**: Device inventory and monitoring baseline
- **CIPP**: Microsoft 365 network policy review
- **CMDB**: Configuration item tracking and relationships
- **Compliance Portal**: Framework mapping and control validation

### During Installation Integration
- **Knowledge Base**: Real-time documentation and runbook storage
- **Incident Management**: Issue tracking with SLA monitoring
- **Change Management**: Change request approvals and audit trail
- **File Storage**: Configuration backups and evidence collection

### Post-Installation Integration
- **AI Assistant**: Auto-generate as-built documentation
- **Compliance Frameworks**: Map configurations to controls
- **Risk Register**: Document residual risks and mitigations
- **Audit Evidence**: Generate compliance packages for auditors

---

## ✅ Project Completion Criteria

### Phase 1 Completion
✅ All discovery tools validated and accessible  
✅ Site access confirmed and documented  
✅ Baseline documentation collected  

### Phase 2 Completion
✅ All network devices discovered and inventoried  
✅ Topology diagrams created and validated  
✅ Security vulnerabilities identified and prioritized  

### Phase 3 Completion
✅ Network architecture design approved  
✅ Configuration templates tested and validated  
✅ Compliance requirements mapped to design  

### Phase 4 Completion
✅ All equipment received and firmware updated  
✅ Configurations staged and tested in lab  
✅ Physical installation plan approved  

### Phase 5 Completion
✅ Cutover plan approved by stakeholders  
✅ Change requests submitted and approved  
✅ Post-installation validation completed  
✅ As-built documentation delivered  
✅ Operations team trained and ready  

---

**Document Version**: 2.0 (Modularized & Phased)  
**Last Updated**: ${new Date().toISOString().split('T')[0]}  
**OberaConnect Integration**: Fully Automated  
**Compliance Frameworks Supported**: ISO 27001, NIST CSF, HIPAA, SOC 2, PCI-DSS

**Estimated Project Duration**: 9-15 business days  
**Recommended Team Size**: 3-5 engineers (Network, Security, IT Admin)
`;

      // Insert the knowledge article
      const { error: insertError } = await supabase
        .from('knowledge_articles')
        .insert({
          customer_id: customerId,
          title: 'SOC Network Discovery & Installation Planning Checklist',
          content: checklistContent,
          article_type: 'guide',
          status: 'published',
          tags: ['network', 'discovery', 'installation', 'checklist', 'configuration', 'planning', 'SOC', 'phased', 'modular', 'training'],
          created_by: user.id
        });

      if (insertError) throw insertError;

      showToast.success("Network discovery & installation checklist uploaded to Knowledge Base!");
      navigate("/knowledge");
    } catch (error) {
      console.error("Error uploading checklist:", error);
      showToast.saveFailed("checklist");
    } finally {
      setIsUploading(false);
    }
  };

  if (profileLoading) {
    return <DashboardLayout showDashboardNavigation={false}><div className="flex items-center justify-center min-h-[400px]">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout showDashboardNavigation={false}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Network Discovery Checklist (Modular & Phased)</CardTitle>
            <CardDescription>
              Comprehensive SOC engineer workflow for network discovery, configuration planning, and installation - organized into 5 distinct phases with training resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert">
              <p>
                This will upload a comprehensive, modular network discovery and installation planning checklist organized into 5 distinct phases with training resources and best practices videos. Integrates with:
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
      </div>
    </DashboardLayout>
  );
}
