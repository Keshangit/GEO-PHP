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

  async function downloadReport() {
    if (!auditId) return;
    const res = await fetch(`/api/audits/${auditId}/report`);
    const data = await res.json();
    if (data.download_url) {
      window.open(data.download_url, "_blank");
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading audit…</p>;
  }

  if (error || !audit) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || "Audit not found"}</AlertDescription>
      </Alert>
    );
  }

  const summary = audit.quick_summary;
  const scoreMeta = summary?.score;
  const tier = scoreMeta?.tier ?? scoreTierFromValue(audit.quick_score ?? 0);

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
        {audit.status === "completed" && audit.pdf_path && (
          <Button onClick={downloadReport} className="btn-brand">
            Download PDF
          </Button>
        )}
      </div>

      {audit.quick_score != null && (
        <div className="grid gap-6 xl:grid-cols-3">
          <AuditScoreCard
            score={audit.quick_score}
            tier={tier}
            breakdown={scoreMeta?.breakdown}
          />
          {summary && (
            <QuickWinsList
              wins={summary.quick_wins ?? []}
              insights={summary.insights}
            />
          )}
        </div>
      )}

      <JobPolling
        auditId={audit.id}
        initialStatus={audit.status as AuditStatus}
        onUpdate={() => loadAudit(audit.id)}
      />

      {audit.status === "failed" && audit.error_message && (
        <Alert variant="destructive">
          <AlertDescription>{audit.error_message}</AlertDescription>
        </Alert>
      )}

      {audit.full_report && audit.status === "completed" && (
        <FullReportView report={audit.full_report} />
      )}

      {!audit.unlocked && audit.tier !== "paid" && audit.quick_score != null && (
        <UpsellBlur auditId={audit.id} domain={audit.domain} />
      )}

      {audit.unlocked &&
        audit.status !== "completed" &&
        !audit.full_report &&
        audit.status !== "failed" && (
          <Alert>
            <AlertDescription>
              Full report unlocked — generation in progress.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
