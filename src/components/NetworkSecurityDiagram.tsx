import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Lock, Globe, Server, Database, Users, Wifi, CloudCog } from "lucide-react";

/**
 * Network Security Architecture Diagram
 * 
 * ```mermaid
 * graph TB
 *     subgraph Internet["🌐 INTERNET - Untrusted Zone"]
 *         EXT[External Users/Attackers]
 *         DDOS[DDoS Attack Vector]
 *         PHISH[Phishing Attempts]
 *     end
 *     
 *     subgraph Edge["🛡️ NETWORK EDGE - Perimeter Security"]
 *         FW1[Primary Firewall<br/>Stateful Inspection]
 *         WAF[Web Application Firewall<br/>Layer 7 Protection]
 *         IDS[IDS/IPS<br/>Intrusion Detection]
 *         VPN[VPN Gateway<br/>Encrypted Access]
 *         
 *         style FW1 fill:#90EE90
 *         style WAF fill:#90EE90
 *         style IDS fill:#FFD700
 *         style VPN fill:#90EE90
 *     end
 *     
 *     subgraph DMZ["🔒 DMZ - Semi-Trusted Zone"]
 *         WEB[Web Servers<br/>Public Facing]
 *         API[API Gateway<br/>Rate Limited]
 *         MAIL[Mail Relay<br/>Spam Filtering]
 *         DNS[DNS Servers<br/>Split DNS]
 *         
 *         style WEB fill:#FFE4B5
 *         style API fill:#FFE4B5
 *         style MAIL fill:#FFE4B5
 *         style DNS fill:#FFE4B5
 *     end
 *     
 *     subgraph Internal["🏢 INTERNAL NETWORK - Trusted Zone"]
 *         FW2[Internal Firewall<br/>Segmentation]
 *         
 *         subgraph AppTier["Application Tier"]
 *             APP[Application Servers<br/>Business Logic]
 *             MCP[MCP Servers<br/>Workflow Automation]
 *         end
 *         
 *         subgraph DataTier["Data Tier - Highly Restricted"]
 *             DB[(Database Servers<br/>Encrypted at Rest)]
 *             BACKUP[(Backup Systems<br/>Air-gapped)]
 *         end
 *         
 *         subgraph UserTier["User Tier"]
 *             USERS[Employee Workstations<br/>EDR Protected]
 *             MGMT[Management Network<br/>Privileged Access]
 *         end
 *         
 *         style FW2 fill:#90EE90
 *         style APP fill:#87CEEB
 *         style MCP fill:#87CEEB
 *         style DB fill:#FFB6C1
 *         style BACKUP fill:#FFB6C1
 *         style USERS fill:#E6E6FA
 *         style MGMT fill:#FFB6C1
 *     end
 *     
 *     subgraph Cloud["☁️ CLOUD SERVICES - External Dependencies"]
 *         SAAS[SaaS Applications<br/>Microsoft 365, etc.]
 *         CLOUD_DB[Cloud Database<br/>Supabase]
 *         CDN[CDN<br/>Static Assets]
 *         
 *         style SAAS fill:#B0E0E6
 *         style CLOUD_DB fill:#B0E0E6
 *         style CDN fill:#B0E0E6
 *     end
 *     
 *     %% Inbound Data Flow
 *     EXT -->|HTTPS:443| FW1
 *     EXT -->|SSH Attempts:22| FW1
 *     DDOS -.->|Volumetric Attack| FW1
 *     PHISH -.->|Social Engineering| USERS
 *     
 *     FW1 -->|Allowed Traffic| WAF
 *     WAF -->|Filtered| IDS
 *     IDS -->|Inspected| DMZ
 *     
 *     VPN -->|Encrypted Tunnel| FW2
 *     
 *     %% DMZ to Internal
 *     WEB -->|Backend API Calls| FW2
 *     API -->|Data Requests| FW2
 *     FW2 -->|Authorized| APP
 *     
 *     %% Internal Flow
 *     APP -->|SQL Queries| DB
 *     MCP -->|Workflow Data| DB
 *     USERS -->|Business Apps| APP
 *     MGMT -.->|Admin Access| DB
 *     
 *     DB -->|Scheduled Backups| BACKUP
 *     
 *     %% Cloud Integration
 *     APP <-->|API Calls| SAAS
 *     APP <-->|Database Sync| CLOUD_DB
 *     WEB <-->|Asset Delivery| CDN
 *     
 *     %% Outbound Flow
 *     APP -->|Updates/Patches| FW1
 *     FW1 -->|Egress Filter| Internet
 *     
 *     %% Vulnerability Indicators
 *     VULN1[🔴 VULN: Weak Firewall Rules]
 *     VULN2[🔴 VULN: Unpatched Web Servers]
 *     VULN3[🔴 VULN: SQL Injection Risk]
 *     VULN4[🔴 VULN: Weak Passwords]
 *     VULN5[🔴 VULN: Missing Encryption]
 *     VULN6[🔴 VULN: No MFA on VPN]
 *     
 *     VULN1 -.-> FW1
 *     VULN2 -.-> WEB
 *     VULN3 -.-> API
 *     VULN4 -.-> USERS
 *     VULN5 -.-> MAIL
 *     VULN6 -.-> VPN
 *     
 *     style VULN1 fill:#FF6B6B
 *     style VULN2 fill:#FF6B6B
 *     style VULN3 fill:#FF6B6B
 *     style VULN4 fill:#FF6B6B
 *     style VULN5 fill:#FF6B6B
 *     style VULN6 fill:#FF6B6B
 * ```
 */

export const NetworkSecurityDiagram = () => {
  const vulnerabilities = [
    {
      id: "VULN-001",
      severity: "critical",
      location: "Network Edge - Primary Firewall",
      issue: "Weak Firewall Rules",
      description: "Overly permissive rules allowing unnecessary ports (e.g., Telnet:23, FTP:21)",
      impact: "Unauthorized access, data exfiltration",
      mitigation: "Implement principle of least privilege, close unused ports, enable geo-blocking"
    },
    {
      id: "VULN-002",
      severity: "high",
      location: "DMZ - Web Servers",
      issue: "Unpatched Web Servers",
      description: "Running outdated versions with known CVEs",
      impact: "Remote code execution, server compromise",
      mitigation: "Implement automated patching, vulnerability scanning, WAF rules"
    },
    {
      id: "VULN-003",
      severity: "critical",
      location: "DMZ - API Gateway",
      issue: "SQL Injection Vulnerability",
      description: "Insufficient input validation and parameterized queries",
      impact: "Database breach, data theft, privilege escalation",
      mitigation: "Implement prepared statements, input sanitization, API rate limiting"
    },
    {
      id: "VULN-004",
      severity: "medium",
      location: "Internal Network - User Workstations",
      issue: "Weak Password Policy",
      description: "No password complexity requirements or rotation",
      impact: "Credential stuffing, brute force attacks, lateral movement",
      mitigation: "Enforce strong passwords, implement MFA, password manager deployment"
    },
    {
      id: "VULN-005",
      severity: "high",
      location: "DMZ - Mail Relay",
      issue: "Missing Email Encryption",
      description: "Emails transmitted without TLS encryption",
      impact: "Man-in-the-middle attacks, sensitive data exposure",
      mitigation: "Enforce TLS for all email, implement DMARC/SPF/DKIM"
    },
    {
      id: "VULN-006",
      severity: "critical",
      location: "Network Edge - VPN Gateway",
      issue: "No MFA on VPN Access",
      description: "Single-factor authentication for remote access",
      impact: "Unauthorized remote access, credential theft, network breach",
      mitigation: "Implement MFA for all VPN users, certificate-based auth, session monitoring"
    },
    {
      id: "VULN-007",
      severity: "medium",
      location: "Internal Network - Database",
      issue: "Insufficient Access Controls",
      description: "Application accounts have excessive database privileges",
      impact: "Privilege escalation, data manipulation",
      mitigation: "Implement least privilege, separate read/write accounts, query logging"
    },
    {
      id: "VULN-008",
      severity: "high",
      location: "Cloud Services Integration",
      issue: "Inadequate API Key Management",
      description: "API keys stored in code or transmitted insecurely",
      impact: "Unauthorized API access, data breach, service abuse",
      mitigation: "Use secret management systems, rotate keys regularly, implement API quotas"
    }
  ];

  const dataFlowPaths = [
    {
      name: "Inbound Web Traffic",
      path: "Internet → Firewall → WAF → IDS/IPS → DMZ Web Servers → Internal Firewall → Application Servers → Database",
      protocols: ["HTTPS:443", "HTTP:80 (redirected)"],
      protection: ["Stateful inspection", "Layer 7 filtering", "Signature detection", "Rate limiting"]
    },
    {
      name: "Remote VPN Access",
      path: "Remote User → VPN Gateway → Internal Firewall → User Network → Applications",
      protocols: ["IPSec", "OpenVPN", "WireGuard"],
      protection: ["Encryption", "Authentication", "Session monitoring", "Access logging"]
    },
    {
      name: "API Requests",
      path: "External Client → Firewall → API Gateway (DMZ) → Internal Firewall → Application Tier → Database",
      protocols: ["HTTPS:443", "REST/GraphQL"],
      protection: ["Rate limiting", "API authentication", "Input validation", "SQL injection prevention"]
    },
    {
      name: "Outbound Updates",
      path: "Application Servers → Internal Firewall → Edge Firewall → Internet (Update Servers)",
      protocols: ["HTTPS:443"],
      protection: ["Egress filtering", "Allowlist domains", "Proxy inspection", "Malware scanning"]
    },
    {
      name: "Cloud Service Integration",
      path: "Application Servers → Firewall → Internet → Cloud Services (Microsoft 365, Supabase)",
      protocols: ["HTTPS:443", "API Calls"],
      protection: ["TLS encryption", "OAuth 2.0", "API key rotation", "Connection monitoring"]
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Network Security Architecture</CardTitle>
          </div>
          <CardDescription>
            Complete network topology showing data flow, security controls, and vulnerability points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Network Zones */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Network Security Zones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-red-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Internet Zone</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <Badge variant="destructive" className="mb-2">Untrusted</Badge>
                  <p>• External users</p>
                  <p>• Attack vectors</p>
                  <p>• No internal access</p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Network Edge</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <Badge variant="default" className="mb-2">Filtered</Badge>
                  <p>• Firewall</p>
                  <p>• WAF</p>
                  <p>• IDS/IPS</p>
                  <p>• VPN Gateway</p>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">DMZ Zone</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <Badge variant="secondary" className="mb-2">Semi-Trusted</Badge>
                  <p>• Web servers</p>
                  <p>• API gateway</p>
                  <p>• Mail relay</p>
                  <p>• DNS servers</p>
                </CardContent>
              </Card>

              <Card className="border-green-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Internal Zone</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <Badge variant="outline" className="mb-2 bg-green-500/10">Trusted</Badge>
                  <p>• Applications</p>
                  <p>• Databases</p>
                  <p>• Workstations</p>
                  <p>• Admin network</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Data Flow Paths */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Data Flow Paths & Controls
            </h3>
            <div className="space-y-3">
              {dataFlowPaths.map((flow, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Server className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-2">{flow.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2 font-mono bg-muted p-2 rounded">
                          {flow.path}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {flow.protocols.map((protocol, pidx) => (
                            <Badge key={pidx} variant="outline" className="text-xs">
                              {protocol}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {flow.protection.map((control, cidx) => (
                            <Badge key={cidx} variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              {control}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Vulnerabilities */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Identified Vulnerabilities & Attack Vectors
            </h3>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {vulnerabilities.filter(v => v.severity === "critical").length} Critical vulnerabilities require immediate attention
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              {vulnerabilities.map((vuln) => (
                <Card key={vuln.id} className="border-l-4" style={{
                  borderLeftColor: vuln.severity === "critical" ? "rgb(239, 68, 68)" : 
                                   vuln.severity === "high" ? "rgb(249, 115, 22)" : "rgb(234, 179, 8)"
                }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-1 ${
                        vuln.severity === "critical" ? "text-red-500" : 
                        vuln.severity === "high" ? "text-orange-500" : "text-yellow-500"
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getSeverityColor(vuln.severity)} className="text-xs">
                                {vuln.severity.toUpperCase()}
                              </Badge>
                              <span className="font-mono text-xs text-muted-foreground">{vuln.id}</span>
                            </div>
                            <h4 className="font-semibold">{vuln.issue}</h4>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Location:</strong> {vuln.location}
                        </p>
                        <p className="text-sm mb-2">{vuln.description}</p>
                        <div className="bg-muted p-3 rounded space-y-2 text-sm">
                          <p><strong className="text-red-600">Impact:</strong> {vuln.impact}</p>
                          <p><strong className="text-green-600">Mitigation:</strong> {vuln.mitigation}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security Recommendations */}
          <Card className="bg-primary/5 border-primary">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Hardening Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>✅ Implement network segmentation with VLANs for each security zone</p>
              <p>✅ Deploy next-generation firewall with deep packet inspection</p>
              <p>✅ Enable zero-trust architecture - verify every access request</p>
              <p>✅ Implement SIEM for centralized log analysis and correlation</p>
              <p>✅ Regular penetration testing and vulnerability assessments</p>
              <p>✅ Deploy endpoint detection and response (EDR) on all workstations</p>
              <p>✅ Implement network access control (NAC) for device authentication</p>
              <p>✅ Enable DDoS protection at ISP and edge levels</p>
              <p>✅ Implement data loss prevention (DLP) controls</p>
              <p>✅ Regular security awareness training for all users</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
