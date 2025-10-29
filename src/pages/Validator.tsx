import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

// Simple in-browser validator that scans source files via Vite's import.meta.glob
// Note: This mirrors key checks from the CLI scripts that are safe to run in the browser

type Finding = {
  file: string;
  line: number;
  preview: string;
};

type Results = {
  singleUsage: Finding[];
  hardcodedColors: Finding[];
  layoutIssues: { file: string; missing: string[] }[];
};

const initialResults: Results = {
  singleUsage: [],
  hardcodedColors: [],
  layoutIssues: [],
};

function useSEO() {
  useEffect(() => {
    const title = "In-Browser Validator | Code Quality Checks";
    const description = "Run in-browser validation checks: query safety, design system, layout uniformity.";
    document.title = title;

    // Meta description
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description.slice(0, 160));

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    try {
      const url = new URL(window.location.href);
      url.hash = "";
      canonical.setAttribute("href", `${url.origin}/validator`);
    } catch {}
  }, []);
}

function scanLines(content: string, matcher: (line: string) => boolean): Finding[] {
  const out: Finding[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (matcher(line)) {
      out.push({ file: "", line: i + 1, preview: line.trim().slice(0, 200) });
    }
  }
  return out;
}

function mergeFindingsWithFile(findings: Finding[], file: string): Finding[] {
  return findings.map((f) => ({ ...f, file }));
}

const Validator: React.FC = () => {
  useSEO();

  // Eagerly import raw source files at build time
  const srcFiles = useMemo(() => {
    const g1 = import.meta.glob("../**/*.{ts,tsx}", { as: "raw", eager: true }) as Record<string, string>;
    const g2 = import.meta.glob("../../supabase/functions/**/*.{ts,tsx}", { as: "raw", eager: true }) as Record<string, string>;
    // Merge maps
    return { ...g1, ...g2 } as Record<string, string>;
  }, []);

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Results>(initialResults);
  const [timestamp, setTimestamp] = useState<string>("");

  const runValidation = () => {
    setRunning(true);

    const singleResults: Finding[] = [];
    const hardcodedResults: Finding[] = [];
    const layoutIssues: { file: string; missing: string[] }[] = [];

    const colorRegex = /className\s*=\s*{?\"([^\"]*)\"|className\s*=\s*{`([^`]+)`}/g; // capture class strings
    const disallowedToken = /(\btext-(?!foreground|muted|primary|secondary|accent|destructive|card|popover|ring|background)[a-z0-9-]+\b|\bbg-(?!background|muted|primary|secondary|accent|destructive|card|popover|ring|foreground)[a-z0-9-]+\b)/;

    Object.entries(srcFiles).forEach(([path, content]) => {
      // 1) .single() usage
      const singleFinds = scanLines(content, (line) => /\.single\s*\(/.test(line));
      singleResults.push(...mergeFindingsWithFile(singleFinds, normalizePath(path)));

      // 2) Hardcoded colors (basic heuristic on Tailwind utility tokens)
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m: RegExpExecArray | null;
        colorRegex.lastIndex = 0;
        while ((m = colorRegex.exec(line))) {
          const classes = (m[1] || m[2] || "").split(/\s+/);
          if (classes.some((c) => disallowedToken.test(c))) {
            hardcodedResults.push({
              file: normalizePath(path),
              line: i + 1,
              preview: line.trim().slice(0, 200),
            });
            break;
          }
        }
      }

      // 3) Layout uniformity (pages should include min-h-screen and bg-background)
      if (/src\/pages\/.*\.tsx$/.test(normalizePath(path))) {
        const missing: string[] = [];
        if (!/min-h-screen/.test(content)) missing.push("min-h-screen");
        if (!/bg-background/.test(content)) missing.push("bg-background");
        if (missing.length) {
          layoutIssues.push({ file: normalizePath(path), missing });
        }
      }
    });

    setResults({
      singleUsage: singleResults,
      hardcodedColors: hardcodedResults,
      layoutIssues,
    });
    setTimestamp(new Date().toLocaleString());
    setRunning(false);
  };

  const totalIssues = results.singleUsage.length + results.hardcodedColors.length + results.layoutIssues.length;

  return (
    <DashboardLayout>
      <main className="space-y-8">
      <section className="container mx-auto px-4 py-6 md:py-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">In-Browser Validation</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">Run fast checks for query safety, design system tokens, and layout patterns.</p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div className="text-sm text-muted-foreground">{timestamp ? `Last run: ${timestamp}` : "Not run yet"}</div>
          <div className="flex gap-2">
            <Button onClick={runValidation} disabled={running}>
              {running ? "Running…" : "Run Validation"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>.single() usage</CardTitle>
              <CardDescription>Should use .maybeSingle() with null handling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{results.singleUsage.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hardcoded colors</CardTitle>
              <CardDescription>Use design tokens (semantic Tailwind)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{results.hardcodedColors.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout issues</CardTitle>
              <CardDescription>Missing min-h-screen or bg-background</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{results.layoutIssues.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                {totalIssues === 0 ? "All checks passed in the browser run." : `${totalIssues} findings across ${Object.keys(srcFiles).length} files.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalIssues === 0 ? (
                <p className="text-sm text-muted-foreground">No issues detected by the in-browser checks.</p>
              ) : (
                <div className="space-y-8">
                  {results.singleUsage.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold mb-2 text-foreground">.single() occurrences</h2>
                      <ul className="space-y-1 text-sm">
                        {results.singleUsage.slice(0, 100).map((f, idx) => (
                          <li key={`single-${idx}`} className="text-muted-foreground">
                            <span className="text-foreground">{f.file}</span>:L{f.line} — <code>{f.preview}</code>
                          </li>
                        ))}
                        {results.singleUsage.length > 100 && (
                          <li className="text-muted-foreground">…and {results.singleUsage.length - 100} more</li>
                        )}
                      </ul>
                    </section>
                  )}

                  {results.hardcodedColors.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold mb-2 text-foreground">Potential hardcoded color classes</h2>
                      <ul className="space-y-1 text-sm">
                        {results.hardcodedColors.slice(0, 100).map((f, idx) => (
                          <li key={`color-${idx}`} className="text-muted-foreground">
                            <span className="text-foreground">{f.file}</span>:L{f.line} — <code>{f.preview}</code>
                          </li>
                        ))}
                        {results.hardcodedColors.length > 100 && (
                          <li className="text-muted-foreground">…and {results.hardcodedColors.length - 100} more</li>
                        )}
                      </ul>
                    </section>
                  )}

                  {results.layoutIssues.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold mb-2 text-foreground">Layout uniformity</h2>
                      <ul className="space-y-1 text-sm">
                        {results.layoutIssues.slice(0, 100).map((f, idx) => (
                          <li key={`layout-${idx}`} className="text-muted-foreground">
                            <span className="text-foreground">{f.file}</span> — Missing: {f.missing.join(", ")}
                          </li>
                        ))}
                        {results.layoutIssues.length > 100 && (
                          <li className="text-muted-foreground">…and {results.layoutIssues.length - 100} more</li>
                        )}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      </main>
    </DashboardLayout>
  );
};

function normalizePath(p: string): string {
  // Vite glob keys may include relative paths like "../components/.." — normalize to project-like paths
  return p
    .replace(/^\.\.\//, "src/")
    .replace(/^\.\.\/\.\.\//, "") // e.g., ../../supabase/… -> supabase/…
    .replace(/\/\.#/, "/");
}

export default Validator;
