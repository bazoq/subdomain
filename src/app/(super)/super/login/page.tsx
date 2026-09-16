import { redirect } from "next/navigation";
import { getSuperSession } from "@/server/auth/session";
import { superLogin } from "@/server/auth/actions";
import { LoginForm } from "@/components/admin/login-form";
import { brand } from "@/config/brand";

export const metadata = { title: "Super admin login", robots: { index: false } };

export default async function SuperLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSuperSession()) redirect("/super");
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Super admin</p>
        <p className="mt-1 text-2xl font-bold text-white">{brand.name}</p>
      </div>
      <LoginForm action={superLogin} title="Sign in" subtitle="Platform control panel." next={next} />
    </main>
  );
}
