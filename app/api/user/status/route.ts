import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getCooldownState } from "@/lib/audits/cooldown";
import type { UserStatusResponse } from "@/lib/types/audit";

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_free_audit_at")
    .eq("id", user!.id)
    .single();

  const { data: unlocked } = await supabase
    .from("unlocked_domains")
    .select("domain")
    .eq("user_id", user!.id);

  const cooldownState = getCooldownState(profile?.last_free_audit_at);

  const payload: UserStatusResponse = {
    last_free_audit_timestamp: profile?.last_free_audit_at ?? null,
    cooldown: cooldownState.active
      ? {
          active: true,
          next_available: cooldownState.nextAvailable!.toISOString(),
        }
      : null,
    unlocked_domains: (unlocked ?? []).map((row) => row.domain),
  };

  return NextResponse.json(payload);
}
