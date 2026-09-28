import type { Metadata } from "next";
import { ClipboardList, Handshake, ShieldCheck, UserSearch } from "lucide-react";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { requireModulePage } from "@/modules/shared/module-gate";
import { Container } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { whatsappLink } from "@/lib/utils";
import { EmployerRequestForm, recruitingStrings as rs } from "@/modules/recruiting/ui";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  requireModulePage(ctx, "recruiting");
  return tenantPageMetadata(tc, ctx.lang, {
    title: t(rs.employerTitle, ctx.lang),
    description: `Hire skilled and semi-skilled staff for Pakistan and the Gulf through ${ctx.tenant.name}. Send us your manpower requirement.`,
    path: "/employers",
  });
}

const steps = [
  { icon: ClipboardList, title: { en: "Share your requirement", ur: "اپنی ضرورت بتائیں" }, text: { en: "Tell us the roles, headcount, location and salary range.", ur: "کردار، تعداد، مقام اور تنخواہ کی حد بتائیں۔" } },
  { icon: UserSearch, title: { en: "We shortlist candidates", ur: "ہم امیدوار منتخب کرتے ہیں" }, text: { en: "Screened CVs and trade-tested candidates from our database.", ur: "ہمارے ڈیٹا بیس سے جانچے گئے سی وی اور ٹریڈ ٹیسٹ شدہ امیدوار۔" } },
  { icon: ShieldCheck, title: { en: "Interviews & documentation", ur: "انٹرویو اور دستاویزات" }, text: { en: "Interview support, medical, visa processing and protector.", ur: "انٹرویو، میڈیکل، ویزا پروسیسنگ اور پروٹیکٹر میں معاونت۔" } },
  { icon: Handshake, title: { en: "Deployment", ur: "روانگی" }, text: { en: "Ticketing, briefing and follow-up after joining.", ur: "ٹکٹنگ، بریفنگ اور جوائننگ کے بعد فالو اپ۔" } },
];

export default async function EmployersPage() {
  const ctx = await getSiteContext();
  requireModulePage(ctx, "recruiting");
  const lang = ctx.lang;
  const wa = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;
  return (
    <Container className="py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div>
          <span className="t-eyebrow">{lang === "ur" ? "آجروں کے لیے" : "For employers"}</span>
          <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(rs.employerTitle, lang)}</h1>
          <p className="mt-4 text-t-muted-fg">
            {lang === "ur"
              ? `${ctx.tenant.name} پاکستان اور خلیجی ممالک کے آجروں کو ہنر مند اور نیم ہنر مند عملہ فراہم کرتا ہے۔ فارم بھریں اور ہماری ٹیم آپ سے رابطہ کرے گی۔`
              : `${ctx.tenant.name} supplies skilled and semi-skilled manpower to employers across Pakistan and the Gulf. Send us your requirement and our team will get back within one working day.`}
          </p>
          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary">
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-heading font-semibold">
                    {i + 1}. {t(s.title, lang)}
                  </p>
                  <p className="text-sm text-t-muted-fg">{t(s.text, lang)}</p>
                </div>
              </li>
            ))}
          </ol>
          {wa ? (
            <a href={whatsappLink(wa, `Assalam o Alaikum ${ctx.tenant.name}, we need staff for our company.`)} target="_blank" rel="noreferrer" className="t-btn t-btn-outline mt-8 text-sm">
              {lang === "ur" ? "واٹس ایپ پر بات کریں" : "Talk to us on WhatsApp"}
            </a>
          ) : null}
        </div>
        <div className="t-card p-5 sm:p-8">
          <h2 className="font-heading text-xl font-bold">{lang === "ur" ? "عملے کی درخواست بھیجیں" : "Send a manpower request"}</h2>
          <EmployerRequestForm ctx={ctx} className="mt-5" />
        </div>
      </div>
    </Container>
  );
}
