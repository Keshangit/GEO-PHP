/**
 * Normalize public Supabase project URL.
 * Must be https://PROJECT_REF.supabase.co — no /rest/v1, /auth/v1, or trailing slash.
 */
export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.endsWith(".supabase.co")) {
      // Always project root — pasting REST/Auth API URLs breaks browser auth
      return parsed.origin;
    }
  } catch {
    // fall through
  }

  let url = trimmed.replace(/\/+$/, "");
  url = url.replace(/\/(?:auth|rest|storage|functions)\/v1$/i, "");
  return url.replace(/\/+$/, "");
}

/** NEXT_PUBLIC_* vars are inlined at `next build` — must be set during Docker build on Railway. */
export function getSupabasePublicEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!rawUrl || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY at build time (Railway Variables → redeploy)."
    );
  }

  const url = normalizeSupabaseUrl(rawUrl);

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be https://YOUR_PROJECT_REF.supabase.co (no /auth/v1, no trailing slash)."
    );
  }

  // Reject using the Railway/Next app URL by mistake
  if (url.includes("railway.app") || url.includes("vercel.app")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be your Supabase project URL (*.supabase.co), not your Railway app URL."
    );
  }

  return { url, anonKey };
}

export function getAppOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!raw) {
    return "http://localhost:3000";
  }

  try {
    // Use URL parser so values like https://app.com/extra/path normalize to origin only
    return new URL(raw.replace(/\/+$/, "")).origin;
  } catch {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be a valid URL like https://your-app.up.railway.app"
    );
  }
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabasePublicEnv();
    return true;
  } catch {
    return false;
  }
}
