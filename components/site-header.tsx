"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigationLoading } from "@/components/navigation-loading-provider";

export function SiteHeader({ email }: { email?: string | null }) {
  const router = useRouter();
  const { startNavigation } = useNavigationLoading();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
      startNavigation();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="brand-header shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          WC <span className="text-[#ee810a]">GEO</span> Audit
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {email ? (
            <>
              <Link
                href="/dashboard"
                className="text-white/85 transition-colors hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/scan"
                className="text-white/85 transition-colors hover:text-white"
              >
                New Scan
              </Link>
              <span className="hidden text-white/70 sm:inline">{email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                loading={signingOut}
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="btn-brand">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
