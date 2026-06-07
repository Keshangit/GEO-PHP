"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfiguredAsync } from "@/lib/supabase/client";
import { getAppOrigin } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthFormProps {
  mode: "login" | "signup";
  error?: string;
}

const AUTH_TIMEOUT_MS = 30_000;

export function AuthForm({ mode, error }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(error ?? "");
  const [configOk, setConfigOk] = useState(true);

  useEffect(() => {
    isSupabaseConfiguredAsync().then(setConfigOk);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!(await isSupabaseConfiguredAsync())) {
      setMessage(
        "Auth is misconfigured on this deployment. Contact support or redeploy with Supabase env vars at build time."
      );
      setLoading(false);
      return;
    }

    try {
      const supabase = await createClient();

      const authPromise =
        mode === "login"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({
              email,
              password,
              options: {
                data: { full_name: fullName },
                emailRedirectTo: `${getAppOrigin()}/auth/callback`,
              },
            });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Sign-in timed out. Check Supabase URL in Railway build vars and Supabase Auth redirect URLs."
              )
            ),
          AUTH_TIMEOUT_MS
        );
      });

      const { error: authError } = await Promise.race([
        authPromise,
        timeoutPromise,
      ]);

      if (authError) {
        setMessage(authError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass-card w-full max-w-md border-[#d4e0ed]">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create account"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to run your free GEO visibility scan."
            : "Start with a free 48-hour audit snapshot."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!configOk && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Supabase public keys are missing from this build. Set{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
              Railway Variables, then redeploy.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="btn-brand w-full"
            disabled={loading || !configOk}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/signup" className="text-link">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link href="/login" className="text-link">
                Log in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
