"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AuditStatus } from "@/lib/types/audit";

interface JobPollingProps {
  auditId: string;
  initialStatus: AuditStatus;
  onUpdate?: () => void;
}

const activeStatuses: AuditStatus[] = ["queued", "processing", "pending"];

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

  const progress =
    status === "queued" ? 25 : status === "processing" ? 65 : 10;

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Generating full report
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Your comprehensive GEO audit is running. This page updates automatically every 15
          seconds — typically 5–10 minutes.
        </p>
      </CardContent>
    </Card>
  );
}
