"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { upsertDeliveryZone, type DeliveryZoneInput } from "@/modules/restaurant/actions";

const empty: DeliveryZoneInput = { name: "", fee: 100, minOrder: 0, etaMins: 45, isActive: true, sortOrder: 0 };

export function DeliveryZoneDialogButton({ id, initial, label, variant = "default" }: { id?: string; initial?: DeliveryZoneInput; label?: string; variant?: "default" | "outline" | "ghost" }) {
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState<DeliveryZoneInput>(initial ?? empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    setErrors({});
    const res = await upsertDeliveryZone(id ?? null, v);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setOpen(false);
      if (!id) setV(empty);
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  return (
    <>
      <Button variant={variant} size={id ? "sm" : "default"} onClick={() => setOpen(true)}>
        {!id ? <Plus /> : null}
        {label ?? (id ? "Edit" : "Add zone")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? "Edit delivery zone" : "Add delivery zone"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Area name" error={errors.name} required help="e.g. DHA Phase 5, Gulberg III, Johar Town, Bahria Town">
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Delivery fee (Rs)" error={errors.fee}>
              <Input type="number" min={0} value={v.fee} onChange={(e) => setV({ ...v, fee: Number(e.target.value) })} />
            </Field>
            <Field label="Min order (Rs)" error={errors.minOrder} help="0 = use default">
              <Input type="number" min={0} value={v.minOrder} onChange={(e) => setV({ ...v, minOrder: Number(e.target.value) })} />
            </Field>
            <Field label="ETA (minutes)" error={errors.etaMins}>
              <Input type="number" min={0} value={v.etaMins ?? ""} onChange={(e) => setV({ ...v, etaMins: e.target.value === "" ? null : Number(e.target.value) })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order">
              <Input type="number" min={0} value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) })} />
            </Field>
            <div className="pt-7">
              <Switch checked={v.isActive} onChange={(b) => setV({ ...v, isActive: b })} label="Active" />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
