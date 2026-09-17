"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { upsertShippingZone } from "@/modules/ecommerce/actions";
import { PK_CITIES } from "@/modules/ecommerce/types";

export interface ShippingZoneFormValue {
  name: string;
  /** comma separated */
  cities: string;
  fee: number;
  freeAbove: number | null;
  etaDays: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: ShippingZoneFormValue = { name: "", cities: "", fee: 200, freeAbove: null, etaDays: "2-3", sortOrder: 0, isActive: true };

export function ShippingZoneFormButton({ id, initial, variant = "default", label }: { id?: string; initial?: ShippingZoneFormValue; variant?: "default" | "outline" | "ghost"; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<ShippingZoneFormValue>(initial ?? empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const cities = value.cities.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const res = await upsertShippingZone(id ?? null, { ...value, cities });
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setOpen(false);
      if (!id) setValue(empty);
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  function addCity(c: string) {
    const list = value.cities.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.some((x) => x.toLowerCase() === c.toLowerCase())) return;
    setValue({ ...value, cities: [...list, c].join(", ") });
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
        title={id ? "Edit shipping zone" : "Add shipping zone"}
        description="Cities are matched case-insensitively against the city the customer enters at checkout."
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
          <Field label="Zone name" error={errors.name} required>
            <Input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} placeholder="e.g. Lahore, Punjab, Rest of Pakistan" />
          </Field>
          <Field label="Cities" error={errors.cities} help="Comma separated. Leave empty for a fallback zone matched by name only.">
            <Textarea value={value.cities} onChange={(e) => setValue({ ...value, cities: e.target.value })} placeholder="Lahore, Kasur, Sheikhupura" className="min-h-[70px]" />
            <div className="mt-2 flex flex-wrap gap-1">
              {PK_CITIES.slice(0, 12).map((c) => (
                <button key={c} type="button" onClick={() => addCity(c)} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100">
                  + {c}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Shipping fee (Rs)" error={errors.fee} required>
              <Input type="number" min={0} value={value.fee} onChange={(e) => setValue({ ...value, fee: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
            <Field label="Free above (Rs)" error={errors.freeAbove} help="Blank = never free">
              <Input type="number" min={0} value={value.freeAbove ?? ""} onChange={(e) => setValue({ ...value, freeAbove: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
            <Field label="Delivery ETA (days)" error={errors.etaDays}>
              <Input value={value.etaDays} onChange={(e) => setValue({ ...value, etaDays: e.target.value })} placeholder="2-3" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order" error={errors.sortOrder} help="Zones are matched in this order.">
              <Input type="number" min={0} value={value.sortOrder} onChange={(e) => setValue({ ...value, sortOrder: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
            <div className="pt-7">
              <Switch checked={value.isActive} onChange={(v) => setValue({ ...value, isActive: v })} label="Active" />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
