import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import DashboardNavigation from '@/components/DashboardNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  Lock,
  Zap,
  Server,
  Eye,
  Settings,
  Users,
  Database,
  Network
} from 'lucide-react';

interface RiskItem {
  id: string;
  name: string;
  category: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  description: string;
  impact: string;
  likelihood: string;
  annualLoss?: string;
  mitigation: string;
  owner: string;
  status: 'open' | 'mitigating' | 'mitigated' | 'accepted';
}

interface TechnicalControl {
  id: string;
  name: string;
  purpose: string;
  status: 'implemented' | 'in-progress' | 'planned';
  coverage: number;
  lastAudit: string;
}

interface IncidentPhase {
  name: string;
  description: string;
  keyActivities: string[];
  status: 'ready' | 'needs-review';
}

const RiskAssessmentPortal = () => {
  const navigate = useNavigate();
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');

  const riskRegister: RiskItem[] = [
    {
      id: 'R-001',
      name: 'Credential Stuffing Attack',
      category: 'Authentication',
      level: 'high',
      score: 6.0,
      description: 'Automated brute force attacks using leaked credentials from external breaches',
      impact: 'Account compromise, unauthorized data access',
      likelihood: 'High (public-facing auth)',
      annualLoss: '$1.15M',
      mitigation: 'Implement MFA, rate limiting, leaked password protection',
      owner: 'Security Team',
      status: 'mitigating'
    },
    {
      id: 'R-002',
      name: 'DDoS Attack',
      category: 'Availability',
      level: 'medium',
      score: 5.0,
      description: 'Distributed denial of service targeting web application',
      impact: 'Service unavailability, revenue loss',
      likelihood: 'Medium',
      annualLoss: '$750K',
      mitigation: 'Deploy WAF, implement rate limiting, CDN protection',
      owner: 'Infrastructure Team',
      status: 'mitigating'
    },
    {
      id: 'R-003',
      name: 'SQL Injection',
      category: 'Application Security',
      level: 'medium',
      score: 5.0,
      description: 'Code injection through user inputs',
      impact: 'Data breach, system compromise',
      likelihood: 'Low (comprehensive RLS)',
      mitigation: 'Parameterized queries, input validation, RLS policies',
      owner: 'Development Team',
      status: 'mitigated'
    },
    {
      id: 'R-004',
      name: 'Third-Party Integration Breach',
      category: 'Supply Chain',
      level: 'high',
      score: 7.0,
      description: 'Compromise through NinjaOne, CIPP, or other integrations',
      impact: 'Multi-tenant data exposure',
      likelihood: 'Medium',
      annualLoss: '$2.8M',
      mitigation: 'Credential rotation, API monitoring, least privilege access',
      owner: 'Security Team',
      status: 'mitigating'
    },
    {
      id: 'R-005',
      name: 'Insider Threat',
      category: 'Human Risk',
      level: 'medium',
      score: 5.0,
      description: 'Malicious or negligent insider actions',
      impact: 'Data exfiltration, compliance violations',
      likelihood: 'Low (RBAC + audit logs)',
      mitigation: 'RBAC enforcement, audit logging, user behavior analytics',
      owner: 'HR & Security',
      status: 'mitigated'
    },
    {
      id: 'R-006',
      name: 'Data Breach',
      category: 'Data Protection',
      level: 'low',
      score: 3.0,
      description: 'Unauthorized access to sensitive data',
      impact: 'Regulatory fines, reputation damage',
      likelihood: 'Very Low (100% RLS)',
      mitigation: 'Row-level security, encryption, access controls',
      owner: 'Security Team',
      status: 'mitigated'
    },
    {
      id: 'R-007',
      name: 'Compliance Risk - GDPR',
      category: 'Compliance',
      level: 'medium',
      score: 4.0,
      description: 'Non-compliance with GDPR data subject rights',
      impact: 'Regulatory fines up to 4% revenue',
      likelihood: 'Low',
      annualLoss: '$500K',
      mitigation: 'Data retention policies, subject access request automation, consent management',
      owner: 'Legal & Compliance',
      status: 'mitigating'
    },
    {
      id: 'R-008',
      name: 'Frontend Dependency Vulnerability',
      category: 'Supply Chain',
      level: 'medium',
      score: 5.0,
      description: 'Vulnerable npm packages in React/Vite stack',
      impact: 'XSS, supply chain attack',
      likelihood: 'Medium',
      mitigation: 'Automated dependency scanning, SCA tools, regular updates',
      owner: 'Development Team',
      status: 'mitigating'
    },
    {
      id: 'R-009',
      name: 'API Rate Limit Bypass',
      category: 'Application Security',
      level: 'low',
      score: 3.0,
      description: 'Bypass of rate limiting controls',
      impact: 'Resource exhaustion, service degradation',
      likelihood: 'Low',
      mitigation: 'Multi-layer rate limiting, IP reputation checks',
      owner: 'Infrastructure Team',
      status: 'mitigated'
    },
    {
      id: 'R-010',
      name: 'Key Personnel Dependency',
      category: 'Business Continuity',
      level: 'low',
      score: 4.0,
      description: 'Critical knowledge concentrated in few individuals',
      impact: 'Operational disruption',
      likelihood: 'Low',
      mitigation: 'Documentation, cross-training, knowledge sharing',
      owner: 'Management',
      status: 'mitigating'
    }
  ];

  const technicalControls: TechnicalControl[] = [
    {
      id: 'TC-001',
      name: 'API Rate Limiting',
      purpose: 'Prevent DDoS and credential stuffing attacks',
      status: 'in-progress',
      coverage: 65,
      lastAudit: '2025-10-05'
    },
    {
      id: 'TC-002',
      name: 'Multi-Factor Authentication',
      purpose: 'Enhance authentication security',
      status: 'planned',
      coverage: 0,
      lastAudit: 'N/A'
    },
    {
      id: 'TC-003',
      name: 'Leaked Password Protection',
      purpose: 'Block compromised credentials',
      status: 'planned',
      coverage: 0,
      lastAudit: 'N/A'
    },
    {
      id: 'TC-004',
      name: 'Web Application Firewall',
      purpose: 'Block malicious traffic and attacks',
      status: 'planned',
      coverage: 0,
      lastAudit: 'N/A'
    },
    {
      id: 'TC-005',
      name: 'Intrusion Detection & SIEM',
      purpose: 'Real-time threat detection and response',
      status: 'in-progress',
      coverage: 40,
      lastAudit: '2025-10-01'
    },
    {
      id: 'TC-006',
      name: 'Automated Vulnerability Scanning',
      purpose: 'Continuous security assessment',
      status: 'implemented',
      coverage: 100,
      lastAudit: '2025-10-10'
    }
  ];

  const incidentResponsePhases: IncidentPhase[] = [
    {
      name: 'Preparation',
      description: 'Establish IR team, tools, and procedures',
      keyActivities: ['IR team defined', 'Playbooks documented', 'Tools configured', 'Training completed'],
      status: 'ready'
    },
    {
      name: 'Detection & Analysis',
      description: 'Identify and assess security incidents',
      keyActivities: ['SIEM monitoring', 'Alert triage', 'Incident classification', 'Impact assessment'],
      status: 'ready'
    },
    {
      name: 'Containment',
      description: 'Limit incident spread and damage',
      keyActivities: ['Short-term containment', 'System backup', 'Long-term containment', 'Evidence preservation'],
      status: 'ready'
    },
    {
      name: 'Eradication',
      description: 'Remove threat from environment',
      keyActivities: ['Root cause identified', 'Malware removed', 'Vulnerabilities patched', 'Systems hardened'],
      status: 'ready'
    },
    {
      name: 'Recovery',
      description: 'Restore normal operations',
      keyActivities: ['Systems restored', 'Services verified', 'Monitoring increased', 'Users notified'],
      status: 'ready'
    },
    {
      name: 'Post-Incident',
      description: 'Learn and improve',
      keyActivities: ['Lessons learned session', 'Documentation updated', 'Controls improved', 'Metrics tracked'],
      status: 'needs-review'
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mitigated':
        return 'text-green-600';
      case 'mitigating':
        return 'text-yellow-600';
      case 'open':
        return 'text-red-600';
      case 'accepted':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getControlStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'planned':
        return <Target className="h-4 w-4 text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const filteredRisks = selectedRiskLevel === 'all' 
    ? riskRegister 
    : riskRegister.filter(r => r.level === selectedRiskLevel);

  const riskStats = {
    total: riskRegister.length,
    critical: riskRegister.filter(r => r.level === 'critical').length,
    high: riskRegister.filter(r => r.level === 'high').length,
    medium: riskRegister.filter(r => r.level === 'medium').length,
    low: riskRegister.filter(r => r.level === 'low').length,
    mitigated: riskRegister.filter(r => r.status === 'mitigated').length,
  };

  const overallRiskScore = Math.round(
    riskRegister.reduce((sum, r) => sum + r.score, 0) / riskRegister.length * 10
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-56 pb-8">
        <DashboardNavigation 
          title="Risk Assessment Portal"
          dashboards={[
            { name: "SOC Dashboard", path: "/dashboard/soc" },
            { name: "Compliance Dashboard", path: "/dashboard/compliance" },
            { name: "Admin Dashboard", path: "/admin" },
          ]}
        />
        
        <div className="mb-8">
          <p className="text-muted-foreground">
            CISSP-aligned risk assessment, technical controls, and NIST incident response framework
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedRiskLevel('all')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riskStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {riskStats.mitigated} mitigated
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedRiskLevel('high')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{riskStats.high}</div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedRiskLevel('medium')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Risks</CardTitle>
              <Activity className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{riskStats.medium}</div>
              <p className="text-xs text-muted-foreground">
                Monitor and mitigate
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallRiskScore}/100</div>
              <Progress value={overallRiskScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Controls</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{technicalControls.length}</div>
              <p className="text-xs text-muted-foreground">
                {technicalControls.filter(c => c.status === 'implemented').length} active
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="register">Risk Register</TabsTrigger>
            <TabsTrigger value="controls">Technical Controls</TabsTrigger>
            <TabsTrigger value="incident-response">Incident Response</TabsTrigger>
            <TabsTrigger value="threats">Threat Landscape</TabsTrigger>
          </TabsList>

          {/* Risk Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button 
                variant={selectedRiskLevel === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedRiskLevel('all')}
              >
                All ({riskStats.total})
              </Button>
              <Button 
                variant={selectedRiskLevel === 'high' ? 'destructive' : 'outline'} 
                size="sm"
                onClick={() => setSelectedRiskLevel('high')}
              >
                High ({riskStats.high})
              </Button>
              <Button 
                variant={selectedRiskLevel === 'medium' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedRiskLevel('medium')}
              >
                Medium ({riskStats.medium})
              </Button>
              <Button 
                variant={selectedRiskLevel === 'low' ? 'secondary' : 'outline'} 
                size="sm"
                onClick={() => setSelectedRiskLevel('low')}
              >
                Low ({riskStats.low})
              </Button>
            </div>

            {filteredRisks.map((risk) => (
              <Card key={risk.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{risk.id}: {risk.name}</CardTitle>
                        <Badge variant={getRiskColor(risk.level)}>{risk.level.toUpperCase()}</Badge>
                        <Badge variant="outline" className={getStatusColor(risk.status)}>
                          {risk.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <CardDescription>{risk.category}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{risk.score.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Risk Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Description:</p>
                    <p className="text-sm text-muted-foreground">{risk.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold">Impact:</p>
                      <p className="text-sm text-muted-foreground">{risk.impact}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Likelihood:</p>
                      <p className="text-sm text-muted-foreground">{risk.likelihood}</p>
                    </div>
                  </div>
                  {risk.annualLoss && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Annual Loss Expectancy</AlertTitle>
                      <AlertDescription>{risk.annualLoss}</AlertDescription>
                    </Alert>
                  )}
                  <div>
                    <p className="text-sm font-semibold">Mitigation Strategy:</p>
                    <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{risk.owner}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Technical Controls Tab */}
          <TabsContent value="controls" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Controls Framework</AlertTitle>
              <AlertDescription>
                NIST SP 800-53 aligned technical controls for risk mitigation
              </AlertDescription>
            </Alert>

            {technicalControls.map((control) => (
              <Card key={control.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getControlStatusIcon(control.status)}
                        <CardTitle className="text-lg">{control.name}</CardTitle>
                      </div>
                      <CardDescription>{control.purpose}</CardDescription>
                    </div>
                    <Badge variant={control.status === 'implemented' ? 'default' : 'outline'}>
                      {control.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Coverage</span>
                      <span className="text-sm font-bold">{control.coverage}%</span>
                    </div>
                    <Progress value={control.coverage} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Last Audit: {control.lastAudit}</span>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Incident Response Tab */}
          <TabsContent value="incident-response" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>NIST SP 800-61 Rev. 3 Framework</AlertTitle>
              <AlertDescription>
                Computer security incident handling guide implementation
              </AlertDescription>
            </Alert>

            {incidentResponsePhases.map((phase, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Phase {idx + 1}: {phase.name}</CardTitle>
                        {phase.status === 'ready' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <CardDescription>{phase.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-sm font-semibold mb-2">Key Activities:</p>
                    <ul className="space-y-1">
                      {phase.keyActivities.map((activity, actIdx) => (
                        <li key={actIdx} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Incident Response Team
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-semibold">IR Manager</p>
                  <p className="text-sm text-muted-foreground">Coordinates response efforts</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Security Analysts</p>
                  <p className="text-sm text-muted-foreground">Investigation & analysis</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">IT Operations</p>
                  <p className="text-sm text-muted-foreground">System recovery</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threat Landscape Tab */}
          <TabsContent value="threats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    External Threat Actors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">Cybercriminals</p>
                    <p className="text-sm text-muted-foreground">Motivation: Financial gain</p>
                    <p className="text-sm text-muted-foreground">Capability: Moderate to High</p>
                  </div>
                  <div>
                    <p className="font-semibold">Hacktivists</p>
                    <p className="text-sm text-muted-foreground">Motivation: Ideological</p>
                    <p className="text-sm text-muted-foreground">Capability: Low to Moderate</p>
                  </div>
                  <div>
                    <p className="font-semibold">Competitors</p>
                    <p className="text-sm text-muted-foreground">Motivation: Business intelligence</p>
                    <p className="text-sm text-muted-foreground">Capability: Varies</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Internal Threats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">Malicious Insiders</p>
                    <p className="text-sm text-muted-foreground">Risk: Mitigated by RBAC & audit logs</p>
                  </div>
                  <div>
                    <p className="font-semibold">Negligent Users</p>
                    <p className="text-sm text-muted-foreground">Risk: Training & awareness programs</p>
                  </div>
                  <div>
                    <p className="font-semibold">Compromised Credentials</p>
                    <p className="text-sm text-muted-foreground">Risk: MFA enforcement (planned)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Attack Vectors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Web Application</span>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Endpoints</span>
                    <Badge variant="default">Medium Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Third-Party Integrations</span>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supply Chain</span>
                    <Badge variant="default">Medium Risk</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Monitoring & Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SIEM Integration</span>
                    <CheckCircle2 className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audit Logging</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Anomaly Detection</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Threat Intelligence</span>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Current Security Posture</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Overall Security Rating</span>
                    <Badge variant="default">A-</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>RLS Coverage</span>
                    <Badge variant="default">100%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Critical Vulnerabilities</span>
                    <Badge variant="default">0</Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RiskAssessmentPortal;
