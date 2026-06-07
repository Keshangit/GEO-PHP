import { renderToBuffer } from "@react-pdf/renderer";
import { GeoReportDocument } from "@/lib/pdf/geo-report-document";
import type { FullAuditReport } from "@/lib/types/audit";

export async function generateReportPdf(
  domain: string,
  url: string,
  report: FullAuditReport
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <GeoReportDocument domain={domain} url={url} report={report} />
  );
  return Buffer.from(buffer);
}
