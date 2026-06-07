import { createAdminClient } from "@/lib/supabase/admin";
import { generateReportPdf } from "@/lib/pdf/generate-report";
import type { AuditRecord, FullAuditReport } from "@/lib/types/audit";

const REPORTS_BUCKET = "reports";

export async function getOrCreateReportPdf(audit: AuditRecord): Promise<Buffer> {
  if (!audit.full_report) {
    throw new Error("Full report data is not available.");
  }

  const admin = createAdminClient();
  const report = audit.full_report as FullAuditReport;

  if (audit.pdf_path) {
    const { data, error } = await admin.storage
      .from(REPORTS_BUCKET)
      .download(audit.pdf_path);

    if (!error && data) {
      return Buffer.from(await data.arrayBuffer());
    }
  }

  const pdfBuffer = await generateReportPdf(audit.domain, audit.url, report);
  const storagePath = `${audit.user_id}/${audit.id}/geo-report-${audit.domain}.pdf`;

  await admin.storage.from(REPORTS_BUCKET).upload(storagePath, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  await admin
    .from("audits")
    .update({ pdf_path: storagePath })
    .eq("id", audit.id);

  return pdfBuffer;
}
