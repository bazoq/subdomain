"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ResponsiveCtx = React.createContext(false);

/**
 * Data table. With `responsive`, rows collapse into stacked cards below the `sm`
 * breakpoint; give each `<TD label="…">` so the column name is shown beside its value.
 * The header row is visually hidden on phones but stays in the accessibility tree.
 */
export function Table({ className, responsive = false, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { responsive?: boolean }) {
  return (
    <ResponsiveCtx.Provider value={responsive}>
      <div className={cn("w-full rounded-xl border border-slate-200 bg-white shadow-sm", responsive ? "sm:overflow-x-auto" : "overflow-x-auto")}>
        <table className={cn("w-full caption-bottom text-sm", responsive && "max-sm:block", className)} {...props} />
      </div>
    </ResponsiveCtx.Provider>
  );
}
export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  const responsive = React.useContext(ResponsiveCtx);
  return <thead className={cn("bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500", responsive && "max-sm:sr-only", className)} {...props} />;
}
export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  const responsive = React.useContext(ResponsiveCtx);
  return <tbody className={cn("divide-y divide-slate-100", responsive && "max-sm:block", className)} {...props} />;
}
export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  const responsive = React.useContext(ResponsiveCtx);
  return <tr className={cn("hover:bg-slate-50/60", responsive && "max-sm:block max-sm:px-4 max-sm:py-3", className)} {...props} />;
}
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn("px-4 py-3 font-semibold", className)} {...props} />;
}
export function TD({
  className,
  label,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  /** column name shown beside the value in responsive card mode */
  label?: string;
}) {
  const responsive = React.useContext(ResponsiveCtx);
  if (!responsive) {
    return (
      <td className={cn("px-4 py-3 align-middle text-slate-700", className)} {...props}>
        {children}
      </td>
    );
  }
  return (
    <td className={cn("px-4 py-3 align-middle text-slate-700 max-sm:flex max-sm:items-start max-sm:justify-between max-sm:gap-3 max-sm:px-0 max-sm:py-1.5 max-sm:text-right", className)} {...props}>
      {label ? <span className="shrink-0 text-xs font-medium text-slate-500 sm:hidden">{label}</span> : null}
      <div className="min-w-0 max-sm:flex-1">{children}</div>
    </td>
  );
}

export function Pagination({ page, pageCount, hrefFor, label = "Pagination" }: { page: number; pageCount: number; hrefFor: (p: number) => string; label?: string }) {
  if (pageCount <= 1) return null;
  const cls = "inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
  const disabled = "inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400";
  return (
    <nav aria-label={label} className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className={cls} href={hrefFor(page - 1)} rel="prev">
            Previous
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            Previous
          </span>
        )}
        {page < pageCount ? (
          <Link className={cls} href={hrefFor(page + 1)} rel="next">
            Next
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
