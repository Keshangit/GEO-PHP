import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { FullAuditReport } from "@/lib/types/audit";
import { WC_BRAND } from "@/lib/pdf/brand";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: WC_BRAND.text,
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: WC_BRAND.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
  },
  headerBrand: {
    color: WC_BRAND.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  headerTag: {
    color: WC_BRAND.blue,
    fontSize: 9,
  },
  accentLine: {
    height: 3,
    backgroundColor: WC_BRAND.orange,
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: WC_BRAND.navy,
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: WC_BRAND.muted,
    marginBottom: 12,
    lineHeight: 1.4,
  },
  scoreBadge: {
    alignSelf: "flex-start",
    backgroundColor: WC_BRAND.navy,
    borderWidth: 2,
    borderColor: WC_BRAND.orange,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  scoreValue: {
    color: WC_BRAND.blue,
    fontSize: 28,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: WC_BRAND.navy,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: WC_BRAND.blue,
  },
  body: {
    lineHeight: 1.5,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: WC_BRAND.lightBg,
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
  },
  tableCellLabel: { flex: 2 },
  tableCellValue: { flex: 1, fontWeight: "bold" },
  finding: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: WC_BRAND.orange,
  },
  findingCritical: { borderLeftColor: "#DC2626" },
  findingHigh: { borderLeftColor: WC_BRAND.orange },
  findingMedium: { borderLeftColor: "#D97706" },
  findingTitle: { fontWeight: "bold", marginBottom: 2, fontSize: 10 },
  actionItem: { marginBottom: 5, paddingLeft: 6 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: WC_BRAND.muted,
  },
});

const SCORE_LABELS: Record<string, string> = {
  ai_citability: "AI Citability & Visibility",
  brand_authority: "Brand Authority Signals",
  content_eeat: "Content Quality & E-E-A-T",
  technical: "Technical GEO",
  schema: "Structured Data",
  platform_optimization: "Platform Optimization",
};

interface GeoReportDocumentProps {
  domain: string;
  url: string;
  report: FullAuditReport;
}

function PageFooter({ date }: { date: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{WC_BRAND.agencyName} · {WC_BRAND.website}</Text>
      <Text>GEO Audit Report · {date}</Text>
    </View>
  );
}

function PageHeader() {
  return (
    <View style={styles.headerBar} fixed>
      <Text style={styles.headerBrand}>{WC_BRAND.agencyName}</Text>
      <Text style={styles.headerTag}>GEO Audit · Generative Engine Optimization</Text>
    </View>
  );
}

export function GeoReportDocument({
  domain,
  url,
  report,
}: GeoReportDocumentProps) {
  const date = report.date || new Date().toISOString().slice(0, 10);

  return (
    <Document
      title={`GEO Audit — ${domain}`}
      author={WC_BRAND.agencyName}
      subject={`GEO visibility audit for ${domain}`}
    >
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <View style={styles.accentLine} />
        <Text style={styles.title}>GEO Audit Report</Text>
        <Text style={styles.meta}>
          Domain: {domain}{"\n"}
          URL: {url}{"\n"}
          Brand: {report.brand_name || domain}{"\n"}
          Generated: {date}{"\n"}
          Methodology: geo-seo-claude (Generative Engine Optimization)
        </Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{report.geo_score}/100</Text>
        </View>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.body}>{report.executive_summary}</Text>
        <PageFooter date={date} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader />
        <Text style={styles.sectionTitle}>Category Scores</Text>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCellLabel}>Category</Text>
          <Text style={styles.tableCellValue}>Score</Text>
        </View>
        {Object.entries(report.scores).map(([key, value]) => (
          <View key={key} style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>
              {SCORE_LABELS[key] ?? key.replace(/_/g, " ")}
            </Text>
            <Text style={styles.tableCellValue}>{value}/100</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>AI Platform Scores</Text>
        {Object.entries(report.platforms).map(([platform, score]) => (
          <View key={platform} style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>{platform}</Text>
            <Text style={styles.tableCellValue}>{score}</Text>
          </View>
        ))}
        <PageFooter date={date} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader />
        <Text style={styles.sectionTitle}>Key Findings</Text>
        {report.findings.slice(0, 10).map((finding, index) => (
          <View
            key={index}
            style={[
              styles.finding,
              finding.severity === "critical"
                ? styles.findingCritical
                : finding.severity === "high"
                  ? styles.findingHigh
                  : styles.findingMedium,
            ]}
          >
            <Text style={styles.findingTitle}>
              [{finding.severity.toUpperCase()}] {finding.title}
            </Text>
            <Text style={styles.body}>{finding.description}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Quick Wins</Text>
        {report.quick_wins.slice(0, 6).map((item, index) => (
          <Text key={index} style={styles.actionItem}>
            • {item.action} — {item.impact}
          </Text>
        ))}
        <PageFooter date={date} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader />
        <Text style={styles.sectionTitle}>Medium-Term Actions</Text>
        {report.medium_term.slice(0, 6).map((item, index) => (
          <Text key={index} style={styles.actionItem}>
            • {item.action} — {item.impact}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Strategic Recommendations</Text>
        {report.strategic.slice(0, 6).map((item, index) => (
          <Text key={index} style={styles.actionItem}>
            • {item.action} — {item.impact}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>About This Report</Text>
        <Text style={styles.body}>
          Prepared by {WC_BRAND.agencyName} ({WC_BRAND.website}). This report
          assesses Generative Engine Optimization (GEO) visibility — how
          discoverable your brand is across AI search surfaces including
          ChatGPT, Perplexity, Google AI Overviews, and Gemini.
        </Text>
        <PageFooter date={date} />
      </Page>
    </Document>
  );
}
