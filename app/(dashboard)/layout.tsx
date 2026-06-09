import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="page-shell flex min-h-full flex-col">
      <SiteHeader email={user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
