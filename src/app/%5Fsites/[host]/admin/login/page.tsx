import { redirect } from "next/navigation";
import { requireTenant } from "@/server/site";
import { getTenantSession } from "@/server/auth/session";
import { tenantLogin } from "@/server/auth/actions";
import { LoginForm } from "@/components/admin/login-form";
import { brand } from "@/config/brand";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function TenantLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const tc = await requireTenant();
  const existing = await getTenantSession(tc.tenant.id);
  if (existing) redirect("/admin");
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-brand-50 px-4">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Admin panel</p>
        <p className="mt-1 text-lg font-semibold text-slate-800">{tc.tenant.name}</p>
      </div>
      <LoginForm action={tenantLogin} title="Sign in" subtitle="Manage your website, orders and content." next={next} />
      <p className="mt-8 text-xs text-slate-400">
        Powered by {brand.name}
      </p>
    </main>
  );
}
