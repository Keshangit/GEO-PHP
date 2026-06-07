import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GeoScoreGauge } from "@/components/geo-score-gauge";
import type { ScoreTier } from "@/lib/types/audit";

const tierLabels: Record<ScoreTier, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  critical: "Critical",
};

const tierBadgeStyles: Record<ScoreTier, string> = {
  excellent: "border-emerald-300 bg-emerald-100 text-emerald-800",
  good: "border-[#3eb1f1] bg-[#e8f4fc] text-[#0b2a5b]",
  fair: "border-amber-300 bg-amber-100 text-amber-900",
  poor: "border-orange-300 bg-orange-100 text-orange-900",
  critical: "border-red-300 bg-red-100 text-red-800",
};

interface AuditScoreCardProps {
  score: number;
  tier?: ScoreTier;
  breakdown?: {
    technical_geo: number;
    citability: number;
    schema: number;
  };
}

export function AuditScoreCard({ score, tier = "fair", breakdown }: AuditScoreCardProps) {
  return (
    <Card className="glass-card border-[#3eb1f1]/30">
      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-xl text-[#0b2a5b]">GEO Visibility Score</CardTitle>
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className={`px-3 py-1 text-sm font-semibold ${tierBadgeStyles[tier]}`}
          >
            {tierLabels[tier]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 pt-2">
        <GeoScoreGauge score={score} tier={tier} />

        {breakdown && (
          <div className="grid w-full grid-cols-3 gap-2 border-t border-[#d4e0ed] pt-4 text-center text-sm">
            <div className="rounded-lg bg-[#f5f8fc] px-2 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#49607e]">
                Technical
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0b2a5b]">
                {breakdown.technical_geo}
              </p>
            </div>
            <div className="rounded-lg bg-[#f5f8fc] px-2 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#49607e]">
                Citability
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0b2a5b]">
                {breakdown.citability}
              </p>
            </div>
            <div className="rounded-lg bg-[#f5f8fc] px-2 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#49607e]">
                Schema
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0b2a5b]">{breakdown.schema}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
