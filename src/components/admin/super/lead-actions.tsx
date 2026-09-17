"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ActionButton } from "@/components/admin/action-button";
import { deleteSuperLead, updateSuperLeadStatus } from "@/server/super/leads-actions";

const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "SPAM"] as const;

export function LeadStatusSelect({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  return (
    <Select
      value={status}
      disabled={busy}
      className="h-8 w-36 text-xs"
      onChange={async (e) => {
        setBusy(true);
        const res = await updateSuperLeadStatus(id, e.target.value);
        setBusy(false);
        if (res.ok) router.refresh();
        else toast.push("error", res.message);
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </Select>
  );
}

export function LeadDeleteButton({ id }: { id: string }) {
  return (
    <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this lead?" action={() => deleteSuperLead(id)}>
      <Trash2 />
    </ActionButton>
  );
}
