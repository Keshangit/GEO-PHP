"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuditScoreCard } from "@/components/audit-score-card";
import { QuickWinsList } from "@/components/quick-wins-list";
import { UpsellBlur } from "@/components/upsell-blur";
import { JobPolling } from "@/components/job-polling";
import { FullReportView } from "@/components/full-report-view";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageLoadingState } from "@/components/page-loading-state";
import type {
  FullAuditReport,
  QuickAuditResponse,
  ScoreTier,
  AuditStatus,
} from "@/lib/types/audit";

type StoredQuickSummary = QuickAuditResponse["summary"] & {
  score?: QuickAuditResponse["score"];
};

interface AuditDetail {
  id: string;
  url: string;
  domain: string;
  tier: string;
  status: string;
  ops_job_id: string | null;
  quick_score: number | null;
  quick_summary: StoredQuickSummary | null;
  full_report: FullAuditReport | null;
  error_message: string | null;
  pdf_path: string | null;
  unlocked: boolean;
}

function scoreTierFromValue(score: number): ScoreTier {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "fair";
  if (score >= 40) return "poor";
  return "critical";
}

export default function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [auditId, setAuditId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [retryLoading, setRetryLoading] = useState(false);

  const loadAudit = useCallback(async (id: string) => {
    const res = await fetch(`/api/audits/${id}`);
    if (!res.ok) {
      setError("Audit not found");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAudit(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    params.then(({ id }) => {
      setAuditId(id);
      loadAudit(id);
    });
  }, [params, loadAudit]);

  async function retryReport() {
    if (!auditId) return;
    setRetryLoading(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Retry failed");
      }
      setAudit(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetryLoading(false);
    }
  }

  async function downloadReport() {
    if (!auditId || !audit) return;
    setPdfLoading(true);
    setPdfError("");
    try {
      const res = await fetch(`/api/audits/${auditId}/report`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `WebConsulting-GEO-${audit.domain}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) {
    return <PageLoadingState message="Loading audit…" />;
  }

  if (error || !audit) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || "Audit not found"}</AlertDescription>
      </Alert>
    );
  }

  const canDownloadPdf =
    audit.status === "completed" &&
    audit.full_report != null &&
    (audit.unlocked || audit.tier === "paid");

  const summary = audit.quick_summary;
  const scoreMeta = summary?.score;
  const tier = scoreMeta?.tier ?? scoreTierFromValue(audit.quick_score ?? 0);
  const hasFullReport =
    audit.full_report != null && audit.status === "completed";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-link">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{audit.domain}</h1>
          <p className="text-sm text-muted-foreground">{audit.url}</p>
        </div>
        {canDownloadPdf && (
          <Button
            onClick={downloadReport}
            className="btn-brand"
            loading={pdfLoading}
          >
            {pdfLoading ? "Generating PDF…" : "Download PDF Report"}
          </Button>
        )}
      </div>

      {pdfError && (
        <Alert variant="destructive">
          <AlertDescription>{pdfError}</AlertDescription>
        </Alert>
      )}

      {audit.quick_score != null && (
        <div className="space-y-4">
          {hasFullReport && (
            <div className="rounded-lg border border-[#d4e0ed] bg-white px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-[#0b2a5b]">Free scan snapshot</span>
              {" · "}
              Quick results from your 60-second scan ({audit.quick_score}/100). See the full
              audit report below for the comprehensive score.
            </div>
          )}
          <div className={`grid gap-6 ${hasFullReport ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
            {!hasFullReport && (
              <AuditScoreCard
                score={audit.quick_score}
                tier={tier}
                breakdown={scoreMeta?.breakdown}
              />
            )}
            {summary && (
              <QuickWinsList
                wins={summary.quick_wins ?? []}
                insights={summary.insights}
              />
            )}
          </div>
        </div>
      )}

      <JobPolling
        auditId={audit.id}
        initialStatus={audit.status as AuditStatus}
        opsJobId={audit.ops_job_id}
        onUpdate={() => loadAudit(audit.id)}
      />

      {audit.status === "failed" && audit.error_message && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-red-800">
            <span>{audit.error_message}</span>
            {(audit.unlocked || audit.tier === "paid") && (
              <Button
                size="sm"
                className="btn-brand shrink-0"
                onClick={retryReport}
                loading={retryLoading}
              >
                {retryLoading ? "Retrying…" : "Retry report"}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {hasFullReport && audit.full_report && (
        <FullReportView
          report={audit.full_report}
          snapshotScore={audit.quick_score}
          onDownload={canDownloadPdf ? downloadReport : undefined}
          pdfLoading={pdfLoading}
        />
      )}

      {!audit.unlocked && audit.tier !== "paid" && audit.quick_score != null && (
        <UpsellBlur auditId={audit.id} domain={audit.domain} />
      )}
    </div>
  );
}
