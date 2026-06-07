export type ScoreTier =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "critical";

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type AuditTier = "free" | "paid";

export type AuditStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export interface QuickAuditRequest {
  url: string;
}

export interface QuickAuditResponse {
  url: string;
  domain: string;
  score: {
    overall: number;
    breakdown: {
      technical_geo: number;
      citability: number;
      schema: number;
    };
    tier: ScoreTier;
  };
  summary: {
    tier: "free";
    metrics: Record<string, unknown>;
    quick_wins: Array<{
      action: string;
      impact: string;
      priority: "critical" | "high" | "medium";
    }>;
    insights: string[];
  };
  duration_ms: number;
}

export interface FullAuditRequest {
  url: string;
  domain?: string;
  client_ref?: string;
}

export interface FullAuditEnqueueResponse {
  job_id: string;
  status: "queued";
  url: string;
  domain: string;
}

export interface JobResponse {
  job_id: string;
  status: JobStatus;
  url: string;
  domain: string;
  client_ref: string;
  created_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  report: FullAuditReport | null;
  error: string | null;
}

export interface FullAuditReport {
  url: string;
  brand_name: string;
  date: string;
  geo_score: number;
  scores: {
    ai_citability: number;
    brand_authority: number;
    content_eeat: number;
    technical: number;
    schema: number;
    platform_optimization: number;
  };
  platforms: Record<string, number>;
  executive_summary: string;
  findings: Array<{
    severity: "critical" | "high" | "medium";
    title: string;
    description: string;
  }>;
  quick_wins: Array<{ action: string; impact: string }>;
  medium_term: Array<{ action: string; impact: string }>;
  strategic: Array<{ action: string; impact: string }>;
  crawler_access: Record<
    string,
    { platform: string; status: string; recommendation: string }
  >;
}

export interface ApiError {
  detail: string;
}

export interface AuditRecord {
  id: string;
  user_id: string;
  url: string;
  domain: string;
  tier: AuditTier;
  status: AuditStatus;
  quick_score: number | null;
  quick_summary: QuickAuditResponse["summary"] | null;
  ops_job_id: string | null;
  full_report: FullAuditReport | null;
  error_message: string | null;
  duration_ms: number | null;
  stripe_session_id: string | null;
  paid_at: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface UserStatusResponse {
  last_free_audit_timestamp: string | null;
  cooldown: {
    active: boolean;
    next_available: string;
  } | null;
  unlocked_domains: string[];
}
