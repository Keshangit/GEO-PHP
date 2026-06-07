import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FullAuditReport } from "@/lib/types/audit";

const severityColors = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-amber-500/20 text-amber-400",
};

interface FullReportViewProps {
  report: FullAuditReport;
  onDownload?: () => void;
  pdfLoading?: boolean;
}

function ActionList({
  title,
  items,
}: {
  title: string;
  items: Array<{ action: string; impact: string }>;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{title}</h4>
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-border/60 p-3">
          <p className="font-medium">{item.action}</p>
          <p className="text-sm text-muted-foreground">{item.impact}</p>
        </div>
      ))}
    </div>
  );
}

export function FullReportView({ report, onDownload, pdfLoading }: FullReportViewProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-card border-brand-blue/40">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="text-3xl text-brand-navy">
            {report.brand_name} · GEO Score {report.geo_score}/100
          </CardTitle>
          {onDownload && (
            <Button
              className="btn-brand shrink-0"
              onClick={onDownload}
              disabled={pdfLoading}
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
        {Object.entries(report.scores).map(([key, value]) => (
          <Card key={key} className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm capitalize text-muted-foreground">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-3xl font-bold text-brand-orange">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>AI Platform Scores</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(report.platforms).map(([platform, score]) => (
            <div key={platform} className="rounded-lg border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">{platform}</p>
              <p className="text-2xl font-semibold">{score}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.findings.map((finding, index) => (
            <div key={index} className="rounded-lg border border-border/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge className={severityColors[finding.severity]}>
                  {finding.severity}
                </Badge>
                <p className="font-medium">{finding.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{finding.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="quick">
        <TabsList>
          <TabsTrigger value="quick">Quick wins</TabsTrigger>
          <TabsTrigger value="medium">Medium term</TabsTrigger>
          <TabsTrigger value="strategic">Strategic</TabsTrigger>
        </TabsList>
        <TabsContent value="quick" className="mt-4">
          <ActionList title="Quick wins" items={report.quick_wins} />
        </TabsContent>
        <TabsContent value="medium" className="mt-4">
          <ActionList title="Medium term" items={report.medium_term} />
        </TabsContent>
        <TabsContent value="strategic" className="mt-4">
          <ActionList title="Strategic" items={report.strategic} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
