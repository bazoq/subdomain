"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { upsertClass, type ClassInput } from "@/modules/gym/actions";
import { CLASS_LEVELS, WEEKDAYS } from "@/modules/gym/constants";

export type TrainerOption = { id: string; name: string };

const empty: ClassInput = { name: { en: "" }, trainerId: "", dayOfWeek: 1, startTime: "18:00", endTime: "19:00", capacity: "", level: "", isActive: true };

export function ClassFormButton({
  initial,
  id,
  urduEnabled,
  trainers,
  label,
  variant = "default",
  size,
}: {
  initial?: ClassInput;
  id?: string;
  urduEnabled: boolean;
  trainers: TrainerOption[];
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<ClassInput>(initial ?? empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await upsertClass(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setOpen(false);
      if (!id) setValue({ ...empty, dayOfWeek: value.dayOfWeek });
      setErrors({});
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  return (
    <>
      <Button variant={variant} size={size ?? (id ? "sm" : "default")} onClick={() => setOpen(true)}>
        {!id ? <Plus /> : null}
        {label ?? (id ? "Edit" : "Add class")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? "Edit class" : "Add class"}
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
          <LocalizedInput label="Class name" value={value.name} onChange={(v) => setValue({ ...value, name: v })} urduEnabled={urduEnabled} required error={errors["name"] ?? errors["name.en"]} placeholder="e.g. Morning Yoga, CrossFit, Zumba" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trainer" error={errors.trainerId}>
              <Select value={value.trainerId ?? ""} onChange={(e) => setValue({ ...value, trainerId: e.target.value })}>
                <option value="">— No trainer —</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Day" error={errors.dayOfWeek}>
              <Select value={String(value.dayOfWeek)} onChange={(e) => setValue({ ...value, dayOfWeek: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <option key={d} value={d}>
                    {WEEKDAYS[d]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start time" error={errors.startTime} required>
              <Input type="time" value={value.startTime} onChange={(e) => setValue({ ...value, startTime: e.target.value })} />
            </Field>
            <Field label="End time" error={errors.endTime} required>
              <Input type="time" value={value.endTime} onChange={(e) => setValue({ ...value, endTime: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Capacity (spots)" error={errors.capacity} help="Leave blank for unlimited">
              <Input type="number" min={1} value={value.capacity ?? ""} onChange={(e) => setValue({ ...value, capacity: e.target.value === "" ? "" : Number(e.target.value) })} />
            </Field>
            <Field label="Level" error={errors.level}>
              <Select value={value.level ?? ""} onChange={(e) => setValue({ ...value, level: e.target.value })}>
                <option value="">—</option>
                {CLASS_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Switch checked={value.isActive} onChange={(v) => setValue({ ...value, isActive: v })} label="Show on website" />
        </div>
      </Dialog>
    </>
  );
}
