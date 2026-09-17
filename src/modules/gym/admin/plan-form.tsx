"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { LocalizedListEditor } from "@/components/admin/shared/list-editor";
import { upsertPlan, type PlanInput } from "@/modules/gym/actions";
import { PLAN_PERIODS, PLAN_PERIOD_LABELS } from "@/modules/gym/constants";

const empty: PlanInput = { name: { en: "" }, price: 0, period: "MONTH", features: [], isPopular: false, isActive: true, sortOrder: 0 };

export function PlanFormButton({ initial, id, urduEnabled, label, variant = "default" }: { initial?: PlanInput; id?: string; urduEnabled: boolean; label?: string; variant?: "default" | "outline" | "ghost" }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<PlanInput>(initial ?? empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await upsertPlan(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setOpen(false);
      if (!id) setValue(empty);
      setErrors({});
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
        {label ?? (id ? "Edit" : "Add plan")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? "Edit membership plan" : "Add membership plan"}
        className="max-w-2xl"
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
          <LocalizedInput label="Plan name" value={value.name} onChange={(v) => setValue({ ...value, name: v })} urduEnabled={urduEnabled} required error={errors["name"] ?? errors["name.en"]} placeholder="e.g. Gold – Cardio + Weights" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (Rs)" error={errors.price} required>
              <Input type="number" min={0} inputMode="numeric" value={value.price} onChange={(e) => setValue({ ...value, price: Number(e.target.value) })} />
            </Field>
            <Field label="Billing period" error={errors.period}>
              <Select value={value.period} onChange={(e) => setValue({ ...value, period: e.target.value as PlanInput["period"] })}>
                {PLAN_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {PLAN_PERIOD_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Display order" help="Lower shows first">
              <Input type="number" min={0} value={value.sortOrder} onChange={(e) => setValue({ ...value, sortOrder: Number(e.target.value) })} />
            </Field>
          </div>
          <LocalizedListEditor label="What's included" value={value.features} onChange={(v) => setValue({ ...value, features: v })} urduEnabled={urduEnabled} placeholder="e.g. Unlimited cardio & weights" addLabel="Add feature" />
          <div className="flex flex-wrap gap-6 pt-1">
            <Switch checked={value.isPopular} onChange={(v) => setValue({ ...value, isPopular: v })} label="Highlight as most popular" />
            <Switch checked={value.isActive} onChange={(v) => setValue({ ...value, isActive: v })} label="Show on website" />
          </div>
        </div>
      </Dialog>
    </>
  );
}
