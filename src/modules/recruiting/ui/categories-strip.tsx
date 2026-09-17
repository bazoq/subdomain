import Link from "next/link";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getJobDepartments } from "../queries";
import { jobsHref } from "../helpers";
import { rs } from "../strings";

/** Horizontal chips of departments with open-job counts → /jobs?department=… */
export async function CategoriesStrip({ ctx, className, max = 12, showTitle = true }: { ctx: SiteContext; className?: string; max?: number; showTitle?: boolean }) {
  const rows = (await getJobDepartments(ctx.tenant.id)).slice(0, max);
  if (rows.length === 0) return null;
  return (
    <div className={className}>
      {showTitle ? <p className="t-eyebrow mb-3">{t(rs.browseByDepartment, ctx.lang)}</p> : null}
      <ul className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
        {rows.map((r) => (
          <li key={r.department} className="shrink-0">
            <Link
              href={jobsHref({ department: r.department })}
              className={cn("inline-flex items-center gap-2 rounded-full border border-t-border bg-t-card px-4 py-2 text-sm font-medium transition hover:border-t-primary hover:text-t-primary")}
            >
              {r.department}
              <span className="rounded-full bg-t-muted px-2 py-0.5 text-xs text-t-muted-fg">{r.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
