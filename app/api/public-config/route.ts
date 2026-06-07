import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Runtime public Supabase config for browser clients (Railway injects vars at runtime). */
export async function GET() {
  try {
    const { url, anonKey } = getSupabasePublicEnv();
    return NextResponse.json({ configured: true, url, anonKey });
  } catch (e) {
    return NextResponse.json(
      {
        configured: false,
        error:
          e instanceof Error
            ? e.message
            : "Supabase is not configured on this deployment.",
      },
      { status: 503 }
    );
  }
}
