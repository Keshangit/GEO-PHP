import type {
  FullAuditEnqueueResponse,
  JobResponse,
  QuickAuditResponse,
} from "@/lib/types/audit";

const BASE = (process.env.OPS_API_BASE_URL ?? "http://127.0.0.1:8000").replace(
  /\/+$/,
  ""
);
const KEY = process.env.OPS_API_KEY ?? "";

async function opsFetch(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65_000);

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail =
        typeof err.detail === "string"
          ? err.detail
          : Array.isArray(err.detail)
            ? err.detail.map((d: { msg?: string }) => d.msg).join(", ")
            : res.statusText;
      throw new Error(detail || res.statusText);
    }

    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function quickAudit(url: string): Promise<QuickAuditResponse> {
  const res = await opsFetch("/v1/audits/quick", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function startFullAudit(
  url: string,
  domain: string,
  clientRef: string
): Promise<FullAuditEnqueueResponse> {
  const res = await opsFetch("/v1/audits/full", {
    method: "POST",
    body: JSON.stringify({ url, domain, client_ref: clientRef }),
  });
  return res.json();
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const res = await opsFetch(`/v1/jobs/${jobId}`);
  return res.json();
}

export async function checkOpsHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`, { next: { revalidate: 0 } });
    return res.ok;
  } catch {
    return false;
  }
}
