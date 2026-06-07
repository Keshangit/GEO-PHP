import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { FullAuditReport } from "@/lib/types/audit";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#555",
    marginBottom: 20,
  },
  score: {
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#0d9488",
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  body: {
    lineHeight: 1.5,
    marginBottom: 8,
  },
  finding: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  findingTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#888",
    textAlign: "center",
  },
});

interface GeoReportDocumentProps {
  domain: string;
  url: string;
  report: FullAuditReport;
}

export function GeoReportDocument({
  domain,
  url,
  report,
}: GeoReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>GEO Audit Report</Text>
        <Text style={styles.subtitle}>
          {report.brand_name || domain} · {url}
        </Text>
        <Text style={styles.score}>GEO Score: {report.geo_score}/100</Text>
        <Text style={styles.section}>Executive Summary</Text>
        <Text style={styles.body}>{report.executive_summary}</Text>

        <Text style={styles.section}>Category Scores</Text>
        {Object.entries(report.scores).map(([key, value]) => (
          <Text key={key} style={styles.body}>
            {key.replace(/_/g, " ")}: {value}
          </Text>
        ))}

        <Text style={styles.section}>Key Findings</Text>
        {report.findings.slice(0, 8).map((finding, index) => (
          <View key={index} style={styles.finding}>
            <Text style={styles.findingTitle}>
              [{finding.severity.toUpperCase()}] {finding.title}
            </Text>
            <Text style={styles.body}>{finding.description}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Web Consulting Agency · GEO Audit · {report.date}
        </Text>
      </Page>
    </Document>
  );
}
