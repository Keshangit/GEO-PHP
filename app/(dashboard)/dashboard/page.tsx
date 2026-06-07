import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCooldownState } from "@/lib/audits/cooldown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_free_audit_at")
    .eq("id", user!.id)
    .single();

  const { data: audits } = await supabase
    .from("audits")
    .select("id, domain, tier, status, quick_score, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const cooldown = getCooldownState(profile?.last_free_audit_at);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your GEO audit history</p>
        </div>
        <Link href="/scan">
          <Button className="btn-brand">New scan</Button>
        </Link>
      </div>

      {cooldown.active && (
        <Alert className="border-[#3eb1f1]/40 bg-[#e8f4fc]">
          <AlertTitle>Free scan cooldown active</AlertTitle>
          <AlertDescription>
            Next free audit available{" "}
            {cooldown.nextAvailable?.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </AlertDescription>
        </Alert>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent audits</CardTitle>
        </CardHeader>
        <CardContent>
          {!audits?.length ? (
            <p className="text-sm text-muted-foreground">
              No audits yet.{" "}
              <Link href="/scan" className="text-link">
                Run your first scan
              </Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <Link
                        href={`/audits/${audit.id}`}
                        className="font-medium text-link"
                      >
                        {audit.domain}
                      </Link>
                    </TableCell>
                    <TableCell>{audit.quick_score ?? "—"}</TableCell>
                    <TableCell className="capitalize">{audit.tier}</TableCell>
                    <TableCell className="capitalize">{audit.status}</TableCell>
                    <TableCell>
                      {new Date(audit.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
