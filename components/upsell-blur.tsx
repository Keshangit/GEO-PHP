"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface UpsellBlurProps {
  auditId: string;
  domain: string;
}

export function UpsellBlur({ auditId, domain }: UpsellBlurProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/audits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit_id: auditId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.href = data.checkout_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-xl">
      <div className="glass-card min-h-[240px] p-8 blur-sm select-none">
        <h3 className="mb-4 text-2xl font-semibold">Full Technical GEO Breakdown</h3>
        <p className="text-muted-foreground">
          Citability deep-dive, brand mention scanning, platform-specific optimization
          (ChatGPT, Perplexity, Google AIO), 30-day action plan, and client-ready PDF report…
        </p>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50 p-6 text-center">
        <Lock className="mb-4 h-12 w-12 text-accent" />
        <p className="mb-4 text-lg">
          Unlock the complete PDF report for <strong>{domain}</strong>
        </p>
        <Button
          size="lg"
          className="btn-brand px-8"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "Redirecting…" : "Unlock for €9"}
        </Button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    </section>
  );
}
