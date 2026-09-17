"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Full-page admin form layout: main column + side column + sticky save bar. */
export function FormShell({
  main,
  side,
  onSave,
  saving,
  dirty,
  saveLabel = "Save changes",
  extraActions,
}: {
  main: React.ReactNode;
  side?: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  dirty?: boolean;
  saveLabel?: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="space-y-6"
    >
      <div className={cn("grid gap-6", side && "lg:grid-cols-3")}>
        <div className={cn("space-y-6", side && "lg:col-span-2")}>{main}</div>
        {side ? <div className="space-y-6">{side}</div> : null}
      </div>
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">{extraActions}</div>
        <div className="flex items-center gap-3">
          {dirty ? <span className="text-xs text-amber-600">Unsaved changes</span> : null}
          <Button type="submit" loading={saving}>
            {saveLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function FormCard({ title, description, children, className }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
      {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
      <div className={cn("space-y-4", (title || description) && "mt-4")}>{children}</div>
    </div>
  );
}
