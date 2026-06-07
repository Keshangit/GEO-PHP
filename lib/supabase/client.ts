import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let cachedClient: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

async function loadPublicEnv(): Promise<{ url: string; anonKey: string }> {
  try {
    return getSupabasePublicEnv();
  } catch {
    const res = await fetch("/api/public-config", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.configured) {
      throw new Error(data.error ?? "Supabase is not configured.");
    }
    return { url: data.url, anonKey: data.anonKey };
  }
}

/** Browser Supabase client — uses build-time env locally, runtime /api/public-config on Railway. */
export async function createClient(): Promise<SupabaseClient> {
  if (cachedClient) return cachedClient;

  if (!initPromise) {
    initPromise = loadPublicEnv().then(({ url, anonKey }) => {
      cachedClient = createBrowserClient(url, anonKey);
      return cachedClient;
    });
  }

  return initPromise;
}

export async function isSupabaseConfiguredAsync(): Promise<boolean> {
  try {
    await loadPublicEnv();
    return true;
  } catch {
    return false;
  }
}
