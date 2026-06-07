import { getAppUrl } from "@/lib/stripe";

export async function sendReportReadyEmail(
  to: string,
  domain: string,
  auditId: string
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const templateId = process.env.SENDGRID_TEMPLATE_ID;
  const downloadUrl = `${getAppUrl()}/api/audits/${auditId}/report`;

  if (!apiKey) {
    console.warn("SENDGRID_API_KEY not configured — skipping email");
    return;
  }

  const body = templateId
    ? {
        personalizations: [
          {
            to: [{ email: to }],
            dynamic_template_data: { domain, download_url: downloadUrl },
          },
        ],
        from: {
          email:
            process.env.SENDGRID_FROM_EMAIL ?? "noreply@webconsulting.ie",
          name: "Web Consulting Agency",
        },
        template_id: templateId,
      }
    : {
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email:
            process.env.SENDGRID_FROM_EMAIL ?? "noreply@webconsulting.ie",
          name: "Web Consulting Agency",
        },
        subject: `Your GEO Audit Report is Ready — ${domain}`,
        content: [
          {
            type: "text/html",
            value: `<p>Your full technical GEO report for <strong>${domain}</strong> has been generated.</p>
<p><a href="${downloadUrl}">Download your PDF report</a></p>
<p>Web Consulting Agency</p>`,
          },
        ],
      };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error: ${text}`);
  }
}
