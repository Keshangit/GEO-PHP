import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getSignedReportUrl } from "@/lib/reports/deliver";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data: audit, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  if (audit.status !== "completed" || !audit.pdf_path) {
    return NextResponse.json(
      { error: "Report not ready.", status: audit.status },
      { status: 409 }
    );
  }

  try {
    const download_url = await getSignedReportUrl(audit.pdf_path);
    return NextResponse.json({ download_url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Report unavailable" },
      { status: 404 }
    );
  }
}
