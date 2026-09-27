import Link from "next/link";
import { Eye } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { t, ui } from "@/lib/i18n";

/** Sticky notice shown to signed-in staff browsing a DRAFT site (visitors see the coming-soon page instead). */
export function PreviewBanner({ lang = "en" }: { lang?: Lang }) {
  return (
    <div role="status" className="sticky top-0 z-[70] border-b border-amber-300 bg-amber-50 text-amber-900 print:hidden">
      <div className="t-container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm">
        <p className="flex items-center gap-2">
          <Eye className="size-4 shrink-0" aria-hidden="true" focusable="false" />
          <span>
            <strong className="font-semibold">{t(ui.previewTitle, lang)}</strong> <span className="hidden sm:inline">{t(ui.previewText, lang)}</span>
          </span>
        </p>
        <Link href="/admin" className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
          {t(ui.openAdmin, lang)}
        </Link>
      </div>
    </div>
  );
}
