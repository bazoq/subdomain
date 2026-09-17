"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { toggleProductFlag } from "@/modules/ecommerce/actions";

/** Quick active / featured toggles for the products table. */
export function ProductFlagToggle({ id, flag, value, label }: { id: string; flag: "isActive" | "isFeatured"; value: boolean; label?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  return (
    <Switch
      checked={value}
      disabled={busy}
      label={label}
      onChange={async (v) => {
        setBusy(true);
        const res = await toggleProductFlag(id, flag, v);
        setBusy(false);
        if (res.ok) {
          toast.push("success", res.message ?? "Updated");
          router.refresh();
        } else toast.push("error", res.message);
      }}
    />
  );
}
