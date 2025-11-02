import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Lightweight, client-side validation runner using Vite's import.meta.glob to analyze raw source
// NOTE: This does not modify files; it's a read-only analyzer for quick health checks

interface LayoutAnalysis {
  file: string;
  usesLayout: boolean;
  maxWidths: string[];
  paddings: string[];
  breakpoints: string[];
  hardcodedDims: string[];
}

interface CombinedReport {
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

const extractUnique = (arr: string[]) => Array.from(new Set(arr));

function analyzeLayoutForFile(path: string, content: string): LayoutAnalysis {
  const usesLayout = content.includes("DashboardLayout");
  const maxWidths = extractUnique(content.match(/max-w-[\w\[\]-]+/g) || []);
  const paddings = extractUnique(content.match(/\b(?:p|px|py)-(?:\d|\[.*?\])\b/g) || []);
  const breakpoints: string[] = [];
  ["sm:", "md:", "lg:", "xl:", "2xl:"].forEach((bp) => {
    if (content.includes(bp)) breakpoints.push(bp.slice(0, -1));
  });
  const hardcodedDims = extractUnique(content.match(/(?:width|height):\s*['"]?\d+px/g) || []);

  return { file: path, usesLayout, maxWidths, paddings, breakpoints, hardcodedDims };
}

export default function ValidationRunner() {
  const [report, setReport] = useState<CombinedReport | null>(null);
  const [running, setRunning] = useState(false);

  // Load all TS/TSX files as raw text (Vite-only)
  const files = useMemo(() => {
    const ts = import.meta.glob("/src/**/*.ts", { as: "raw", eager: true }) as Record<string, string>;
    const tsx = import.meta.glob("/src/**/*.tsx", { as: "raw", eager: true }) as Record<string, string>;
    return { ...ts, ...tsx } as Record<string, string>;
  }, []);

  const run = () => {
    setRunning(true);

    // ----- Code Analysis (modularization + patterns) -----
    const paths = Object.keys(files);
    const hasComponents = paths.some((p) => p.includes("/src/components/"));
    const hasHooks = paths.some((p) => p.includes("/src/hooks/"));
    const hasServices = paths.some((p) => p.includes("/src/services/"));
    const hasUtils = paths.some((p) => p.includes("/src/utils/"));

    let modularizationScore = 0;
    const modIssues: string[] = [];
    if (hasComponents) modularizationScore += 25; else modIssues.push("Missing /components");
    if (hasHooks) modularizationScore += 25; else modIssues.push("Missing /hooks");
    if (hasServices) modularizationScore += 25; else modIssues.push("Missing /services");
    if (hasUtils) modularizationScore += 25; else modIssues.push("Missing /utils");

    // Direct auth calls vs useAuth usage
    const directAuthFiles = paths.filter((p) => /\.tsx?$/.test(p) && /supabase\.auth\.(getUser|getSession|signIn)/.test(files[p]));
    const useAuthFiles = paths.filter((p) => /\.tsx?$/.test(p) && (files[p].includes("from \"@/hooks/useAuth\"") || files[p].includes("useAuth(")));

    // ----- Layout Validation (dashboards/portals/pages) -----
    const pageEntries = Object.entries(files).filter(([p]) => p.includes("/src/pages/") && p.endsWith(".tsx"));

    const layoutAnalyses = pageEntries.map(([p, c]) => analyzeLayoutForFile(p, c));
    const dashboardsAndPortals = layoutAnalyses.filter((la) => /Dashboard|Portal/i.test(la.file));

    const layoutUsageCount = dashboardsAndPortals.filter((la) => la.usesLayout).length;
    const layoutUsagePct = dashboardsAndPortals.length
      ? Math.round((layoutUsageCount / dashboardsAndPortals.length) * 100)
      : 0;

    const allMaxWidths = extractUnique(dashboardsAndPortals.flatMap((la) => la.maxWidths));

    const responsivePages = dashboardsAndPortals.filter((la) => la.breakpoints.length >= 3).length;
    const responsiveScore = dashboardsAndPortals.length
      ? Math.round((responsivePages / dashboardsAndPortals.length) * 100)
      : 0;

    const uniqueMaxWidthPenalty = allMaxWidths.length <= 2 ? 100 : 50;
    const uniformityScore = Math.round(layoutUsagePct * 0.4 + responsiveScore * 0.3 + uniqueMaxWidthPenalty * 0.3);

    const layoutIssues: string[] = [];
    if (layoutUsagePct < 80) layoutIssues.push(`Only ${layoutUsagePct}% of pages use layout components`);
    if (responsiveScore < 70) layoutIssues.push(`Only ${responsiveScore}% of pages include >=3 responsive breakpoints`);
    if (allMaxWidths.length > 2) layoutIssues.push(`Inconsistent max-width values: ${allMaxWidths.join(", ")}`);

    const recommendations: string[] = [];
    if (uniformityScore < 60) recommendations.push("CRITICAL: Implement consistent layout system across all dashboards");
    if (allMaxWidths.length > 2) recommendations.push("Standardize dimensions using design tokens (tailwind.config) and max-w-7xl by default");
    if (layoutIssues.length > 0) recommendations.push("Create/Enforce shared layout patterns via DashboardLayout + PageContainer");

    const totalIssues = layoutIssues.length + (directAuthFiles.length > 40 ? 1 : 0);

    const combined: CombinedReport = {
      timestamp: new Date().toISOString(),
      codeAnalysis: {
        modularizationScore,
        totalIssues,
        criticalIssues: 0,
        notes: [
          `${useAuthFiles.length} files use useAuth()`,
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
      priorityActions: [
        ...(modularizationScore < 75 ? ["HIGH: Improve code modularization structure"] : []),
        ...(uniformityScore < 70 ? ["HIGH: Standardize layout dimensions and patterns"] : []),
        ...(directAuthFiles.length > 40 ? ["MEDIUM: Centralize direct auth calls into services/hooks"] : []),
      ],
    };

    // Print formatted results to console
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION REPORT - ' + new Date().toLocaleString());
    console.log('='.repeat(80));
    console.log('\n🔍 CODE ANALYSIS:');
    console.log(`   Modularization Score: ${combined.codeAnalysis.modularizationScore}/100`);
    console.log(`   Total Issues: ${combined.codeAnalysis.totalIssues}`);
    console.log(`   Critical Issues: ${combined.codeAnalysis.criticalIssues}`);
    console.log('   Notes:');
    combined.codeAnalysis.notes.forEach(note => console.log(`     • ${note}`));
    
    console.log('\n📐 LAYOUT VALIDATION:');
    console.log(`   Uniformity Score: ${combined.layoutValidation.uniformityScore}/100`);
    console.log(`   Pages Analyzed: ${combined.layoutValidation.totalPages}`);
    console.log(`   Layout Usage: ${combined.layoutValidation.layoutUsagePct}%`);
    console.log(`   Unique Max-Widths: ${combined.layoutValidation.uniqueMaxWidths.join(', ') || 'None'}`);
    console.log(`   Issues Found: ${combined.layoutValidation.issueCount}`);
    
    if (combined.priorityActions.length > 0) {
      console.log('\n⚠️  PRIORITY ACTIONS:');
      combined.priorityActions.forEach((action, i) => 
        console.log(`   ${i + 1}. ${action}`)
      );
    } else {
      console.log('\n✅ No priority actions needed');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    setReport(combined);
    setRunning(false);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copySummary = () => {
    if (!report) return;
    const summary = [
      "📊 COMBINED VALIDATION SUMMARY",
      `Timestamp: ${report.timestamp}`,
      "\nCode Analysis:",
      `  - Modularization: ${report.codeAnalysis.modularizationScore}/100`,
      `  - Total Issues: ${report.codeAnalysis.totalIssues}`,
      `  - Notes: ${report.codeAnalysis.notes.join(" | ")}`,
      "\nLayout Validation:",
      `  - Uniformity: ${report.layoutValidation.uniformityScore}/100`,
      `  - Pages Analyzed: ${report.layoutValidation.totalPages}`,
      `  - Layout Usage: ${report.layoutValidation.layoutUsagePct}%`,
      `  - Unique max-widths: ${report.layoutValidation.uniqueMaxWidths.join(", ") || "None"}`,
      `  - Issues: ${report.layoutValidation.issueCount}`,
      "\nPriority Actions:",
      ...(report.priorityActions.length ? report.priorityActions.map((a, i) => `  ${i + 1}. ${a}`) : ["  None"]),
    ].join("\n");

    navigator.clipboard.writeText(summary).catch(() => {});
  };

  return (
    <DashboardLayout className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Validation Runner</h1>
          <p className="text-muted-foreground">Analyze modularization and layout uniformity</p>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <Badge variant={report.layoutValidation.uniformityScore >= 80 ? "success" : "outline"}>
              Score: {report.layoutValidation.uniformityScore}
            </Badge>
          )}
          <Button onClick={run} disabled={running} variant="secondary">
            {running ? "Running..." : "Run Analysis"}
          </Button>
          <Button onClick={copySummary} disabled={!report}>
            Copy Summary
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Code Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Modularization Score: <strong>{report?.codeAnalysis.modularizationScore ?? "-"}/100</strong></div>
            <div>Total Issues: <strong>{report?.codeAnalysis.totalIssues ?? "-"}</strong></div>
            <div>Critical Issues: <strong>{report?.codeAnalysis.criticalIssues ?? "-"}</strong></div>
            <div className="text-muted-foreground">
              {report?.codeAnalysis.notes.map((n, i) => (
                <div key={i}>• {n}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layout Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Uniformity Score: <strong>{report?.layoutValidation.uniformityScore ?? "-"}/100</strong></div>
            <div>Pages Analyzed: <strong>{report?.layoutValidation.totalPages ?? "-"}</strong></div>
            <div>Layout Usage: <strong>{report?.layoutValidation.layoutUsagePct ?? "-"}%</strong></div>
            <div>Unique max-widths: <span className="text-muted-foreground">{report?.layoutValidation.uniqueMaxWidths.join(", ") || "None"}</span></div>
            <div>Issues Found: <strong>{report?.layoutValidation.issueCount ?? "-"}</strong></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priority Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {report?.priorityActions.length ? (
            report.priorityActions.map((a, i) => <div key={i}>• {a}</div>)
          ) : (
            <div className="text-muted-foreground">None</div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
