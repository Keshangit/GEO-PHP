import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getCooldownState } from "@/lib/audits/cooldown";
import { quickAudit } from "@/lib/geo-ops/client";
import { normalizeDomain, toFetchUrl } from "@/lib/domain";

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const urlInput = (body.url ?? "").trim();
  if (!urlInput) {
    return NextResponse.json({ error: "URL is required." }, { status: 422 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_free_audit_at")
    .eq("id", user!.id)
    .single();

  const cooldownState = getCooldownState(profile?.last_free_audit_at);
  if (cooldownState.active) {
    return NextResponse.json(
      {
        error: "Free audit cooldown active.",
        next_available_at: cooldownState.nextAvailable!.toISOString(),
      },
      { status: 429 }
    );
  }

  let domain: string;
  try {
    domain = normalizeDomain(urlInput);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid URL" },
      { status: 422 }
    );
  }

  const fetchUrl = toFetchUrl(domain);

  const { data: audit, error: insertError } = await supabase
    .from("audits")
    .insert({
      user_id: user!.id,
      url: fetchUrl,
      domain,
      tier: "free",
      status: "pending",
    })
    .select("*")
    .single();

  if (insertError || !audit) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not save audit." },
      { status: 500 }
    );
  }

  try {
    const result = await quickAudit(fetchUrl);

    const { data: completed, error: updateError } = await supabase
      .from("audits")
      .update({
        quick_score: result.score.overall,
        quick_summary: { ...result.summary, score: result.score },
        status: "completed",
        duration_ms: result.duration_ms,
        completed_at: new Date().toISOString(),
      })
      .eq("id", audit.id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase
      .from("profiles")
      .update({ last_free_audit_at: new Date().toISOString() })
      .eq("id", user!.id);

    return NextResponse.json(completed);
  } catch (e) {
    await supabase
      .from("audits")
      .update({
        status: "failed",
        error_message: e instanceof Error ? e.message : "Audit failed",
      })
      .eq("id", audit.id);

    const message = e instanceof Error ? e.message : "Audit failed";
    const status = message.includes("reach") ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
