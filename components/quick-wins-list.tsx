import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickWin {
  action: string;
  impact: string;
  priority?: "critical" | "high" | "medium";
}

const priorityColors = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-amber-500/20 text-amber-400",
};

export function QuickWinsList({
  wins,
  insights,
}: {
  wins: QuickWin[];
  insights?: string[];
}) {
  return (
    <div className="contents">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Wins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {wins.length === 0 && (
            <p className="text-sm text-muted-foreground">No quick wins identified.</p>
          )}
          {wins.map((win, index) => (
            <div key={index} className="rounded-lg border border-border/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{win.action}</p>
                {win.priority && (
                  <Badge className={priorityColors[win.priority]}>{win.priority}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{win.impact}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {insights && insights.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {insights.map((insight, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
