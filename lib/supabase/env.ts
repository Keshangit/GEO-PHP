/** NEXT_PUBLIC_* vars are inlined at `next build` — must be set during Docker build on Railway. */

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY at build time (Railway Variables → redeploy)."
    );
  }

  if (!url.startsWith("https://") || !url.includes("supabase.co")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL looks invalid. Expected https://xxxx.supabase.co"
    );
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabasePublicEnv();
    return true;
  } catch {
    return false;
  }
}
