import { createAdminClient } from "@/lib/supabase/admin";
import { generateReportPdf } from "@/lib/pdf/generate-report";
import { sendReportReadyEmail } from "@/lib/email/send-report-ready";
import type { AuditRecord, FullAuditReport } from "@/lib/types/audit";

const REPORTS_BUCKET = "reports";

export async function deliverCompletedReport(audit: AuditRecord): Promise<void> {
  if (!audit.full_report || audit.pdf_path) {
    return;
  }

  const admin = createAdminClient();
  const report = audit.full_report as FullAuditReport;
  const pdfBuffer = await generateReportPdf(audit.domain, audit.url, report);
  const storagePath = `${audit.user_id}/${audit.id}/geo-report-${audit.domain}.pdf`;

  const { error: uploadError } = await admin.storage
    .from(REPORTS_BUCKET)
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`PDF upload failed: ${uploadError.message}`);
  }

  const { error: updateError } = await admin
    .from("audits")
    .update({ pdf_path: storagePath })
    .eq("id", audit.id);

  if (updateError) {
    throw new Error(`Failed to save pdf_path: ${updateError.message}`);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", audit.user_id)
    .single();

  if (profile?.email) {
    await sendReportReadyEmail(profile.email, audit.domain, audit.id);
  }
}

export async function getSignedReportUrl(
  pdfPath: string,
  expiresIn = 3600
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(pdfPath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not create signed URL");
  }

  return data.signedUrl;
}
