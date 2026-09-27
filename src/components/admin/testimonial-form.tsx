"use client";

/** REFERENCE client form: client state + JSON server action, localized text, image upload, toast + refresh. */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea, Select, Switch } from "@/components/ui/input";
import { ImageField } from "@/components/admin/uploader";
import { useToast } from "@/components/ui/toast";
import { upsertTestimonial, type TestimonialInput } from "@/modules/shared/testimonials-actions";

const empty: TestimonialInput = { name: "", role: "", text: { en: "" }, rating: 5, imageUrl: "", isActive: true };

export function TestimonialFormButton({
  initial,
  id,
  urduEnabled,
  label,
  variant = "default",
}: {
  initial?: TestimonialInput;
  id?: string;
  urduEnabled: boolean;
  label?: string;
  variant?: "default" | "outline" | "ghost";
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<TestimonialInput>(initial ?? empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await upsertTestimonial(id ?? null, value);
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
        {label ?? (id ? "Edit" : "Add testimonial")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? "Edit testimonial" : "Add testimonial"}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name" error={errors.name} required>
              <Input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} />
            </Field>
            <Field label="Role / city" error={errors.role}>
              <Input value={value.role ?? ""} placeholder="e.g. Lahore" onChange={(e) => setValue({ ...value, role: e.target.value })} />
            </Field>
          </div>
          <Field label="Review text" error={errors["text.en"]} required>
            <Textarea value={value.text.en} onChange={(e) => setValue({ ...value, text: { ...value.text, en: e.target.value } })} />
          </Field>
          {urduEnabled ? (
            <div dir="rtl">
              <Field label="Review text (اردو)">
                <Textarea className="font-urdu" value={value.text.ur ?? ""} onChange={(e) => setValue({ ...value, text: { ...value.text, ur: e.target.value } })} />
              </Field>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rating">
              <Select value={String(value.rating)} onChange={(e) => setValue({ ...value, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="pt-7">
              <Switch checked={value.isActive} onChange={(v) => setValue({ ...value, isActive: v })} label="Show on website" />
            </div>
          </div>
          <Field label="Photo (optional)">
            <ImageField label="Photo" value={value.imageUrl ?? ""} onChange={(url) => setValue({ ...value, imageUrl: url })} folder="testimonials" aspect="aspect-square" className="max-w-[160px]" />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
