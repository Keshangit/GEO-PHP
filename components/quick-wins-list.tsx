import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickWin {
  action: string;
  impact: string;
  priority?: "critical" | "high" | "medium";
}

const priorityLabels: Record<NonNullable<QuickWin["priority"]>, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
};

const priorityColors: Record<NonNullable<QuickWin["priority"]>, string> = {
  critical: "border-red-300 bg-red-100 text-red-800",
  high: "border-orange-300 bg-orange-100 text-orange-900",
  medium: "border-amber-300 bg-amber-100 text-amber-900",
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
                  <Badge variant="outline" className={priorityColors[win.priority]}>
                    {priorityLabels[win.priority]}
                  </Badge>
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
