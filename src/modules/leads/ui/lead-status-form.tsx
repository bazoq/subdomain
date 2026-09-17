"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ActionButton } from "@/components/admin/action-button";
import { deleteLead, updateLeadStatus } from "@/modules/leads/actions";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "SPAM"] as const;

export function LeadStatusForm({ id, status, notes }: { id: string; status: string; notes: string }) {
  const [s, setS] = React.useState(status);
  const [n, setN] = React.useState(notes);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  async function save() {
    setSaving(true);
    const res = await updateLeadStatus(id, s, n);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Updated");
      router.refresh();
    } else toast.push("error", res.message);
  }
  return (
    <div className="space-y-4">
      <Field label="Status">
        <Select value={s} onChange={(e) => setS(e.target.value)}>
          {LEAD_STATUSES.map((x) => (
            <option key={x} value={x}>
              {x.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Internal notes" help="Only visible to your team.">
        <Textarea value={n} onChange={(e) => setN(e.target.value)} maxLength={2000} placeholder="e.g. Called on Monday, wants a callback after 5 PM." />
      </Field>
      <div className="flex items-center justify-between gap-2">
        <ActionButton variant="ghost" className="text-red-600" confirm="Delete this message permanently?" action={() => deleteLead(id)} redirectTo="/admin/leads">
          <Trash2 /> Delete
        </ActionButton>
        <Button onClick={save} loading={saving}>
          Save
        </Button>
      </div>
    </div>
  );
}

/** Inline status select for the list view. */
export function LeadStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, setPending] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  return (
    <Select
      value={status}
      disabled={pending}
      className="h-8 w-36 text-xs"
      aria-label="Status"
      onChange={async (e) => {
        setPending(true);
        const res = await updateLeadStatus(id, e.target.value);
        setPending(false);
        if (res.ok) router.refresh();
        else toast.push("error", res.message);
      }}
    >
      {LEAD_STATUSES.map((x) => (
        <option key={x} value={x}>
          {x.replace(/_/g, " ")}
        </option>
      ))}
    </Select>
  );
}
