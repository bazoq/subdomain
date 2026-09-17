import type { SiteContext } from "@/templates/types";
import { ProcessBlock } from "@/modules/shared/ui/section-blocks";
import type { ProcessData } from "@/modules/shared/ui/section-types";

const DEFAULT: Partial<ProcessData> = {
  eyebrow: "How it works",
  title: { en: "From file to finished print", ur: "فائل سے تیار پرنٹ تک" },
  steps: [
    { title: { en: "Send your design", ur: "ڈیزائن بھیجیں" }, text: { en: "Upload your PDF/AI file or describe what you need – we can design it for you.", ur: "اپنی فائل اپ لوڈ کریں یا بتائیں کیا چاہیے – ہم ڈیزائن بھی کر سکتے ہیں۔" }, icon: "Upload" },
    { title: { en: "Approve the quote", ur: "قیمت منظور کریں" }, text: { en: "We reply on WhatsApp with price and a digital proof within hours.", ur: "ہم واٹس ایپ پر قیمت اور پروف چند گھنٹوں میں بھیجتے ہیں۔" }, icon: "BadgeCheck" },
    { title: { en: "Print & deliver", ur: "پرنٹ اور ڈیلیوری" }, text: { en: "Pick up from our shop or get it delivered anywhere in Pakistan.", ur: "دکان سے لیں یا پاکستان بھر میں ڈیلیوری۔" }, icon: "Truck" },
  ],
};

/** Ordering process (upload → proof → print) from the `process` section; falls back to printing defaults. */
export function HowItWorks({ ctx, variant = "steps", light, className, bare, data }: { ctx: SiteContext; variant?: "steps" | "timeline"; light?: boolean; className?: string; bare?: boolean; data?: Partial<ProcessData> }) {
  const enabled = ctx.sections.process?.enabled;
  return <ProcessBlock ctx={ctx} id="how-it-works" variant={variant} light={light} className={className} bare={bare} data={data ?? (enabled ? undefined : DEFAULT)} />;
}
