import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getOrCreateReportPdf } from "@/lib/reports/get-or-create-pdf";
import type { AuditRecord } from "@/lib/types/audit";

export async function GET(
  request: Request,
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

  const record = audit as AuditRecord;

  if (record.status !== "completed" || !record.full_report) {
    return NextResponse.json(
      { error: "Report not ready.", status: record.status },
      { status: 409 }
    );
  }

  const { data: unlocked } = await supabase
    .from("unlocked_domains")
    .select("id")
    .eq("user_id", user!.id)
    .eq("domain", record.domain)
    .maybeSingle();

  if (!unlocked && record.tier !== "paid") {
    return NextResponse.json(
      { error: "Unlock the full report to download the PDF." },
      { status: 403 }
    );
  }

  try {
    const pdfBuffer = await getOrCreateReportPdf(record);
    const filename = `WebConsulting-GEO-${record.domain}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not generate PDF" },
      { status: 500 }
    );
  }
}
