import { SuperHeader } from "@/components/super-site/header";
import { SuperFooter } from "@/components/super-site/footer";

export default function SuperSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SuperHeader />
      <main className="flex-1">{children}</main>
      <SuperFooter />
    </div>
  );
}
