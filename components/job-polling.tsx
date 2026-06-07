"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditStatus } from "@/lib/types/audit";

interface JobPollingProps {
  auditId: string;
  initialStatus: AuditStatus;
  onUpdate?: () => void;
}

const activeStatuses: AuditStatus[] = ["queued", "processing", "pending"];

const statusLabels: Record<(typeof activeStatuses)[number], string> = {
  pending: "Starting",
  queued: "Queued",
  processing: "Running",
};

const statusMessages: Record<(typeof activeStatuses)[number], string> = {
  pending: "Setting up your full GEO audit.",
  queued: "Waiting for an analysis slot — timing depends on queue load.",
  processing: "Crawling pages, scoring citability, and building your report.",
};

export function JobPolling({ auditId, initialStatus, onUpdate }: JobPollingProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!activeStatuses.includes(status)) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/audits/${auditId}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      if (!activeStatuses.includes(data.status)) {
        onUpdate?.();
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [auditId, status, onUpdate]);

  if (!activeStatuses.includes(status)) return null;

  const activeStatus = status as (typeof activeStatuses)[number];

  return (
    <Card className="glass-card border-[#3eb1f1]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0b2a5b]">
          <Loader2 className="h-5 w-5 animate-spin text-[#3eb1f1]" aria-hidden />
          Generating full report
          <Badge variant="outline" className="border-[#3eb1f1]/40 bg-[#e8f4fc] text-[#0b2a5b]">
            {statusLabels[activeStatus]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="report-loading-track"
          role="progressbar"
          aria-busy="true"
          aria-label="Full report generation in progress"
        >
          <div className="report-loading-bar" />
        </div>
        <p className="text-sm text-muted-foreground">{statusMessages[activeStatus]}</p>
        <p className="text-xs text-muted-foreground">
          This page refreshes automatically every 15 seconds. Full reports usually take a few
          minutes, but timing can vary.
        </p>
      </CardContent>
    </Card>
  );
}
