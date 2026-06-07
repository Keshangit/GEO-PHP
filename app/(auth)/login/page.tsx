import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl justify-center px-6 py-16">
        <AuthForm mode="login" error={params.error} />
      </main>
    </div>
  );
}
