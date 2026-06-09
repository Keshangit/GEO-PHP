import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatPlatformName,
  formatScoreLabel,
  formatSeverity,
  orderedPlatformEntries,
  orderedScoreEntries,
} from "@/lib/reports/labels";
import type { FullAuditReport } from "@/lib/types/audit";

const severityColors = {
  critical: "border-red-300 bg-red-100 text-red-800",
  high: "border-orange-300 bg-orange-100 text-orange-900",
  medium: "border-amber-300 bg-amber-100 text-amber-900",
};

interface FullReportViewProps {
  report: FullAuditReport;
  snapshotScore?: number | null;
  onDownload?: () => void;
  pdfLoading?: boolean;
}

function ActionList({
  items,
}: {
  items: Array<{ action: string; impact: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-[#d4e0ed] bg-[#f5f8fc] p-4">
          <p className="font-medium text-[#0b2a5b]">{item.action}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.impact}</p>
        </div>
      ))}
    </div>
  );
}

export function FullReportView({
  report,
  snapshotScore,
  onDownload,
  pdfLoading,
}: FullReportViewProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-[#3eb1f1]/30 bg-[#e8f4fc]/40 px-4 py-3 text-sm text-[#0b2a5b]">
        <p className="font-medium">Full GEO audit report</p>
        <p className="mt-1 text-muted-foreground">
          The comprehensive score below is from your paid full audit. It may differ from the
          free 60-second snapshot
          {snapshotScore != null ? ` (${snapshotScore}/100)` : ""} because it analyzes more
          pages, platforms, and signals.
        </p>
      </div>

      <Card className="glass-card border-[#3eb1f1]/30">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#3eb1f1]">
              Full audit
            </p>
            <CardTitle className="text-2xl text-[#0b2a5b]">
              Comprehensive GEO score
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {report.brand_name} · {report.date}
            </p>
            <p className="text-5xl font-bold text-[#0b2a5b]">
              {report.geo_score}
              <span className="ml-1 text-2xl font-semibold text-muted-foreground">/100</span>
            </p>
          </div>
          {onDownload && (
            <Button
              className="btn-brand shrink-0"
              onClick={onDownload}
              loading={pdfLoading}
            >
              <Download className="size-4" />
              {pdfLoading ? "Generating…" : "Download PDF"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-muted-foreground">{report.executive_summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orderedScoreEntries(report.scores).map(([key, value]) => (
          <Card key={key} className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{formatScoreLabel(key)}</p>
              <p className="text-3xl font-bold text-[#ee810a]">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-[#0b2a5b]">AI Platform Scores</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderedPlatformEntries(report.platforms).map(([platform, score]) => (
            <div key={platform} className="rounded-lg border border-[#d4e0ed] bg-[#f5f8fc] p-4">
              <p className="text-sm font-medium text-[#0b2a5b]">
                {formatPlatformName(platform)}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#0b2a5b]">{score}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-[#0b2a5b]">Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.findings.map((finding, index) => (
            <div key={index} className="rounded-lg border border-[#d4e0ed] p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={severityColors[finding.severity]}>
                  {formatSeverity(finding.severity)}
                </Badge>
                <p className="font-medium text-[#0b2a5b]">{finding.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{finding.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-[#0b2a5b]">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quick">
            <TabsList className="mb-4 w-full justify-start bg-[#eef3f9]">
              <TabsTrigger value="quick">Quick wins</TabsTrigger>
              <TabsTrigger value="medium">Medium term</TabsTrigger>
              <TabsTrigger value="strategic">Strategic</TabsTrigger>
            </TabsList>
            <TabsContent value="quick">
              <ActionList items={report.quick_wins} />
            </TabsContent>
            <TabsContent value="medium">
              <ActionList items={report.medium_term} />
            </TabsContent>
            <TabsContent value="strategic">
              <ActionList items={report.strategic} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
