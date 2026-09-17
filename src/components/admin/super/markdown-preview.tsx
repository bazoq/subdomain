"use client";

import { renderMarkdown } from "@/server/super/markdown";
import { cn } from "@/lib/utils";

/** Live markdown preview for the blog editor (reuses the server-safe renderer). */
export function MarkdownPreview({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-none text-sm leading-relaxed text-slate-800",
        "[&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:font-semibold",
        "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
        "[&_a]:text-brand-600 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600",
        "[&_hr]:my-4 [&_hr]:border-slate-200 [&_img]:my-3 [&_img]:max-h-80 [&_img]:rounded-lg",
        className,
      )}
    >
      {source.trim() ? renderMarkdown(source) : <p className="text-slate-400">Nothing to preview yet.</p>}
    </div>
  );
}
