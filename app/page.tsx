import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="page-shell">
      <SiteHeader email={user?.email} />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center">
        <p className="mb-4 text-sm uppercase tracking-widest text-brand-orange">
          Web Consulting Agency
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          GEO Visibility Audit for AI Search
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Measure how discoverable your site is to ChatGPT, Perplexity, Google AI Overviews,
          and more. Free snapshot every 48 hours — unlock the full technical PDF for €9.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href={user ? "/scan" : "/signup"}>
            <Button size="lg" className="btn-brand">
              {user ? "Run free scan" : "Get started free"}
            </Button>
          </Link>
          <Link href="https://webconsulting.ie" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline">
              webconsulting.ie
            </Button>
          </Link>
        </div>
        <div className="mt-20 grid w-full gap-6 text-left sm:grid-cols-3">
          {[
            {
              title: "Free snapshot",
              body: "Crawler access, schema, citability score, and quick wins in under 60 seconds.",
            },
            {
              title: "Full GEO report",
              body: "Deep Claude analysis, platform scores, findings, and a client-ready PDF.",
            },
            {
              title: "Per-domain unlock",
              body: "Pay €9 once per domain — no subscription required.",
            },
          ].map((item) => (
            <div key={item.title} className="glass-card rounded-xl p-6">
              <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
