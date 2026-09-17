"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { upsertCoupon } from "@/modules/ecommerce/actions";

export interface CouponFormValue {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  maxUses: number | null;
  /** yyyy-mm-dd or "" */
  expiresAt: string;
  isActive: boolean;
}

const empty: CouponFormValue = { code: "", type: "PERCENT", value: 10, minOrder: 0, maxUses: null, expiresAt: "", isActive: true };

export function CouponFormButton({ id, initial, variant = "default", label }: { id?: string; initial?: CouponFormValue; variant?: "default" | "outline" | "ghost"; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<CouponFormValue>(initial ?? empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await upsertCoupon(id ?? null, { ...value, maxUses: value.maxUses ?? null });
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

  return (
    <>
      <Button variant={variant} size={id ? "sm" : "default"} onClick={() => setOpen(true)}>
        {!id ? <Plus /> : null}
        {label ?? (id ? "Edit" : "Add coupon")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? "Edit coupon" : "Add coupon"}
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
          <Field label="Coupon code" error={errors.code} help="Customers type this at checkout. Letters, numbers, dash, underscore." required>
            <Input className="uppercase" value={value.code} onChange={(e) => setValue({ ...value, code: e.target.value.toUpperCase() })} placeholder="EID10" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount type" error={errors.type}>
              <Select value={value.type} onChange={(e) => setValue({ ...value, type: e.target.value as CouponFormValue["type"] })}>
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed amount (Rs)</option>
              </Select>
            </Field>
            <Field label={value.type === "PERCENT" ? "Percent off" : "Rupees off"} error={errors.value} required>
              <Input type="number" min={1} max={value.type === "PERCENT" ? 100 : undefined} value={value.value} onChange={(e) => setValue({ ...value, value: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum order (Rs)" error={errors.minOrder} help="0 = no minimum">
              <Input type="number" min={0} value={value.minOrder} onChange={(e) => setValue({ ...value, minOrder: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
            <Field label="Max uses" error={errors.maxUses} help="Blank = unlimited">
              <Input type="number" min={1} value={value.maxUses ?? ""} onChange={(e) => setValue({ ...value, maxUses: e.target.value === "" ? null : Math.max(1, Number(e.target.value) || 1) })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expires on" error={errors.expiresAt} help="Blank = never expires">
              <Input type="date" value={value.expiresAt} onChange={(e) => setValue({ ...value, expiresAt: e.target.value })} />
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
