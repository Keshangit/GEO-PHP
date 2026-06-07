import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-teal-950/20">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl justify-center px-6 py-16">
        <AuthForm mode="login" error={params.error} />
      </main>
    </div>
  );
}
