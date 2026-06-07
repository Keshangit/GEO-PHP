import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreTier } from "@/lib/types/audit";

const tierLabels: Record<ScoreTier, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  critical: "Critical",
};

const tierColors: Record<ScoreTier, string> = {
  excellent: "bg-emerald-500/20 text-emerald-400",
  good: "bg-teal-500/20 text-teal-400",
  fair: "bg-amber-500/20 text-amber-400",
  poor: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
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
  const rotation = -45 + Math.round((score / 100) * 147);

  return (
    <Card className="glass-card border-t-2 border-teal-500/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">GEO Visibility Score</CardTitle>
        <Badge className={tierColors[tier]}>{tierLabels[tier]}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative flex h-40 w-40 items-end justify-center">
          <div className="absolute inset-0 rounded-full border-8 border-muted" />
          <div
            className="absolute bottom-0 left-1/2 h-20 w-1 origin-bottom bg-teal-500"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          />
          <span className="relative pb-2 text-5xl font-bold text-teal-400">{score}</span>
        </div>
        {breakdown && (
          <div className="grid w-full grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Technical</p>
              <p className="text-xl font-semibold">{breakdown.technical_geo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Citability</p>
              <p className="text-xl font-semibold">{breakdown.citability}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Schema</p>
              <p className="text-xl font-semibold">{breakdown.schema}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
