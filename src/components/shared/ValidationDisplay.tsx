import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ValidationResult {
  timestamp: string;
  codeAnalysis: {
    modularizationScore: number;
    totalIssues: number;
    criticalIssues: number;
    notes: string[];
  };
  layoutValidation: {
    uniformityScore: number;
    totalPages: number;
    issueCount: number;
    uniqueMaxWidths: string[];
    layoutUsagePct: number;
  };
  priorityActions: string[];
}

/**
 * Displays validation results in chat/UI
 * Prints formatted results to console
 */
export function ValidationDisplay() {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setIsLoading(true);
    
    // Import validation logic
    const files = import.meta.glob('/src/**/*.{ts,tsx}', { as: 'raw', eager: true }) as Record<string, string>;
    const paths = Object.keys(files);

    // Code Analysis
    const hasComponents = paths.some(p => p.includes('/src/components/'));
    const hasHooks = paths.some(p => p.includes('/src/hooks/'));
    const hasServices = paths.some(p => p.includes('/src/services/'));
    const hasUtils = paths.some(p => p.includes('/src/utils/'));

    let modularizationScore = 0;
    if (hasComponents) modularizationScore += 25;
    if (hasHooks) modularizationScore += 25;
    if (hasServices) modularizationScore += 25;
    if (hasUtils) modularizationScore += 25;

    const directAuthFiles = paths.filter(p => 
      /\.tsx?$/.test(p) && /supabase\.auth\.(getUser|getSession|signIn)/.test(files[p])
    );

    // Layout Analysis
    const pageEntries = Object.entries(files).filter(([p]) => 
      p.includes('/src/pages/') && p.endsWith('.tsx')
    );

    const dashboardsAndPortals = pageEntries
      .filter(([p]) => /Dashboard|Portal/i.test(p))
      .map(([p, content]) => ({
        file: p,
        usesLayout: content.includes('DashboardLayout'),
        maxWidths: Array.from(new Set(content.match(/max-w-[\w\[\]-]+/g) || [])),
        hasResponsive: ['sm:', 'md:', 'lg:'].every(bp => content.includes(bp)),
      }));

    const layoutUsageCount = dashboardsAndPortals.filter(la => la.usesLayout).length;
    const layoutUsagePct = dashboardsAndPortals.length
      ? Math.round((layoutUsageCount / dashboardsAndPortals.length) * 100)
      : 0;

    const allMaxWidths = Array.from(new Set(
      dashboardsAndPortals.flatMap(la => la.maxWidths)
    ));

    const responsivePages = dashboardsAndPortals.filter(la => la.hasResponsive).length;
    const responsivePct = dashboardsAndPortals.length
      ? Math.round((responsivePages / dashboardsAndPortals.length) * 100)
      : 0;

    const uniformityScore = Math.round(
      layoutUsagePct * 0.4 + responsivePct * 0.3 + (allMaxWidths.length <= 2 ? 30 : 15)
    );

    const layoutIssues: string[] = [];
    if (layoutUsagePct < 80) layoutIssues.push(`Only ${layoutUsagePct}% use DashboardLayout`);
    if (responsivePct < 70) layoutIssues.push(`Only ${responsivePct}% are fully responsive`);
    if (allMaxWidths.length > 2) layoutIssues.push(`${allMaxWidths.length} different max-widths found`);

    const priorityActions: string[] = [];
    if (modularizationScore < 75) priorityActions.push('HIGH: Improve code organization');
    if (uniformityScore < 70) priorityActions.push('HIGH: Standardize layout dimensions');
    if (directAuthFiles.length > 40) priorityActions.push('MEDIUM: Centralize auth calls');

    const validationResult: ValidationResult = {
      timestamp: new Date().toISOString(),
      codeAnalysis: {
        modularizationScore,
        totalIssues: layoutIssues.length + (directAuthFiles.length > 40 ? 1 : 0),
        criticalIssues: priorityActions.filter(a => a.startsWith('HIGH')).length,
        notes: [
          `${paths.filter(p => files[p].includes('useAuth(')).length} files use useAuth()`,
          `${directAuthFiles.length} files call supabase.auth directly`,
        ],
      },
      layoutValidation: {
        uniformityScore,
        totalPages: dashboardsAndPortals.length,
        issueCount: layoutIssues.length,
        uniqueMaxWidths: allMaxWidths,
        layoutUsagePct,
      },
      priorityActions,
    };

    // Print to console
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION REPORT - ' + new Date().toLocaleString());
    console.log('='.repeat(80));
    console.log('\n🔍 CODE ANALYSIS:');
    console.log(`   Modularization Score: ${validationResult.codeAnalysis.modularizationScore}/100`);
    console.log(`   Total Issues: ${validationResult.codeAnalysis.totalIssues}`);
    console.log(`   Critical Issues: ${validationResult.codeAnalysis.criticalIssues}`);
    console.log('   Notes:');
    validationResult.codeAnalysis.notes.forEach(note => console.log(`     • ${note}`));
    
    console.log('\n📐 LAYOUT VALIDATION:');
    console.log(`   Uniformity Score: ${validationResult.layoutValidation.uniformityScore}/100`);
    console.log(`   Pages Analyzed: ${validationResult.layoutValidation.totalPages}`);
    console.log(`   Layout Usage: ${validationResult.layoutValidation.layoutUsagePct}%`);
    console.log(`   Unique Max-Widths: ${validationResult.layoutValidation.uniqueMaxWidths.join(', ') || 'None'}`);
    console.log(`   Issues Found: ${validationResult.layoutValidation.issueCount}`);
    
    if (validationResult.priorityActions.length > 0) {
      console.log('\n⚠️  PRIORITY ACTIONS:');
      validationResult.priorityActions.forEach((action, i) => 
        console.log(`   ${i + 1}. ${action}`)
      );
    } else {
      console.log('\n✅ No priority actions needed');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');

    setResult(validationResult);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Running Validation...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!result) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Validation Results
            <Badge variant="outline">{new Date(result.timestamp).toLocaleString()}</Badge>
          </CardTitle>
          <CardDescription>
            Automated code quality and layout uniformity analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getScoreIcon(result.codeAnalysis.modularizationScore)}
                <h3 className="font-semibold">Code Analysis</h3>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(result.codeAnalysis.modularizationScore)}`}>
                {result.codeAnalysis.modularizationScore}/100
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Total Issues: {result.codeAnalysis.totalIssues}</div>
                <div>Critical Issues: {result.codeAnalysis.criticalIssues}</div>
                {result.codeAnalysis.notes.map((note, i) => (
                  <div key={i}>• {note}</div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getScoreIcon(result.layoutValidation.uniformityScore)}
                <h3 className="font-semibold">Layout Uniformity</h3>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(result.layoutValidation.uniformityScore)}`}>
                {result.layoutValidation.uniformityScore}/100
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Pages Analyzed: {result.layoutValidation.totalPages}</div>
                <div>Layout Usage: {result.layoutValidation.layoutUsagePct}%</div>
                <div>Issues: {result.layoutValidation.issueCount}</div>
                {result.layoutValidation.uniqueMaxWidths.length > 0 && (
                  <div className="text-xs">
                    Max-widths: {result.layoutValidation.uniqueMaxWidths.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {result.priorityActions.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">⚠️ Priority Actions</h3>
              <ul className="space-y-1 text-sm">
                {result.priorityActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-2">
            💡 Detailed results printed to browser console
          </div>
        </CardContent>
      </Card>
    </div>
  );
}