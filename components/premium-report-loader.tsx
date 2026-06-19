"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditStatus } from "@/lib/types/audit";

interface PremiumReportLoaderProps {
  auditId: string;
  status: AuditStatus;
  opsJobId?: string | null;
  unlocked: boolean;
  tier: string;
  hasFullReport: boolean;
  paymentJustCompleted?: boolean;
  onUpdate?: () => void;
}

const activeStatuses = ["queued", "processing", "pending"] as const;

const statusLabels: Record<(typeof activeStatuses)[number], string> = {
  pending: "Starting",
  queued: "Queued",
  processing: "Running",
};

function isActiveStatus(status: AuditStatus): status is (typeof activeStatuses)[number] {
  return (activeStatuses as readonly AuditStatus[]).includes(status);
}

function getLoaderCopy({
  status,
  opsJobId,
  unlocked,
  paymentJustCompleted,
}: {
  status: AuditStatus;
  opsJobId?: string | null;
  unlocked: boolean;
  paymentJustCompleted?: boolean;
}): { title: string; message: string; badge?: string } {
  if (paymentJustCompleted && !unlocked) {
    return {
      title: "Payment successful",
      message:
        "Thanks for your purchase. We are activating your full GEO report now — this usually takes under a minute.",
      badge: "Confirming",
    };
  }

  if (status === "failed") {
    return {
      title: "Report unavailable",
      message: "Something went wrong while generating your full report.",
    };
  }

  if (isActiveStatus(status)) {
    if (!opsJobId && status === "queued") {
      return {
        title: "Starting full report",
        message: "Connecting to the analysis service and queueing your comprehensive audit.",
        badge: "Starting",
      };
    }

    return {
      title: "Generating full report",
      message:
        status === "processing"
          ? "Crawling pages, scoring citability, and building your premium report."
          : status === "queued"
            ? "Your audit is in the queue. Timing depends on current load."
            : "Setting up your full GEO audit.",
      badge: statusLabels[status],
    };
  }

  return {
    title: "Preparing your full report",
    message:
      "Your payment is confirmed. The comprehensive audit is being set up and will appear here automatically.",
    badge: "Unlocking",
  };
}

export function PremiumReportLoader({
  auditId,
  status,
  opsJobId = null,
  unlocked,
  tier,
  hasFullReport,
  paymentJustCompleted = false,
  onUpdate,
}: PremiumReportLoaderProps) {
  const [liveStatus, setLiveStatus] = useState(status);

  useEffect(() => {
    setLiveStatus(status);
  }, [status]);

  const isPremiumPending =
    (unlocked || tier === "paid") && !hasFullReport && liveStatus !== "failed";

  useEffect(() => {
    if (!isPremiumPending) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/audits/${auditId}`, { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      setLiveStatus(data.status);

      const reportReady =
        data.full_report != null && data.status === "completed";
      const noLongerPending =
        reportReady ||
        data.status === "failed" ||
        (!data.unlocked && data.tier !== "paid");

      if (noLongerPending || reportReady) {
        onUpdate?.();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [auditId, isPremiumPending, onUpdate]);

  if (!isPremiumPending) return null;

  const copy = getLoaderCopy({
    status: liveStatus,
    opsJobId,
    unlocked,
    paymentJustCompleted,
  });

  return (
    <Card className="glass-card border-[#3eb1f1]/40 bg-[#f5f8fc]">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-[#0b2a5b]">
          {paymentJustCompleted && !unlocked ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-[#3eb1f1]" aria-hidden />
          )}
          {copy.title}
          {copy.badge && (
            <Badge variant="outline" className="border-[#3eb1f1]/40 bg-[#e8f4fc] text-[#0b2a5b]">
              {copy.badge}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="report-loading-track"
          role="progressbar"
          aria-busy="true"
          aria-label="Premium report loading"
        >
          <div className="report-loading-bar" />
        </div>
        <p className="text-sm text-muted-foreground">{copy.message}</p>
        <p className="text-xs text-muted-foreground">
          Keep this page open — your full audit scores, findings, and recommendations will load
          here automatically. This usually takes a few minutes.
        </p>
      </CardContent>
    </Card>
  );
}

export function isPremiumReportPending(audit: {
  unlocked: boolean;
  tier: string;
  status: string;
  full_report: unknown | null;
}): boolean {
  return (
    (audit.unlocked || audit.tier === "paid") &&
    !(audit.full_report != null && audit.status === "completed") &&
    audit.status !== "failed"
  );
}
