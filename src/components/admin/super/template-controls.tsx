"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Switch, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { upsertTemplateSetting } from "@/server/super/templates-actions";

export function TemplateControls({ templateId, enabled, featured, sortOrder }: { templateId: string; enabled: boolean; featured: boolean; sortOrder: number }) {
  const [order, setOrder] = React.useState(String(sortOrder));
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  async function apply(patch: { enabled?: boolean; featured?: boolean; sortOrder?: number }) {
    setBusy(true);
    const res = await upsertTemplateSetting(templateId, patch);
    setBusy(false);
    if (res.ok) router.refresh();
    else toast.push("error", res.message);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Switch checked={enabled} disabled={busy} onChange={(v) => apply({ enabled: v })} label="Enabled" />
      <Switch checked={featured} disabled={busy} onChange={(v) => apply({ featured: v })} label="Featured" />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        Order
        <Input
          type="number"
          className="h-8 w-20"
          value={order}
          disabled={busy}
          onChange={(e) => setOrder(e.target.value)}
          onBlur={() => {
            const n = Number(order);
            if (Number.isFinite(n) && n !== sortOrder) apply({ sortOrder: Math.trunc(n) });
          }}
        />
      </label>
    </div>
  );
}
