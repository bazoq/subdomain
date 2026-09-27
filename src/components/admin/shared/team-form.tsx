"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "@/components/admin/uploader";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { ChipsInput } from "@/components/admin/shared/list-editor";
import { upsertTeamMember, type TeamMemberInput } from "@/modules/shared/team-actions";
import { slugify } from "@/lib/utils";

export const emptyMember: TeamMemberInput = { name: "", slug: "", role: { en: "" }, bio: { en: "" }, imageUrl: "", phone: "", email: "", socials: {}, specialties: [], isActive: true, sortOrder: 0 };

export function TeamFormButton({
  initial,
  id,
  urduEnabled,
  entityLabel = "member",
  specialtySuggestions,
  label,
  variant = "default",
}: {
  initial?: TeamMemberInput;
  id?: string;
  urduEnabled: boolean;
  entityLabel?: string;
  specialtySuggestions?: string[];
  label?: string;
  variant?: "default" | "outline" | "ghost";
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<TeamMemberInput>(initial ?? emptyMember);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const set = (patch: Partial<TeamMemberInput>) => setValue((v) => ({ ...v, ...patch }));
  const social = (k: keyof NonNullable<TeamMemberInput["socials"]>, v: string) => set({ socials: { ...value.socials, [k]: v } });

  async function save() {
    setSaving(true);
    const res = await upsertTeamMember(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setOpen(false);
      if (!id) setValue(emptyMember);
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
        {label ?? (id ? "Edit" : `Add ${entityLabel}`)}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
        className="max-w-3xl"
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
        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          <div>
            <Field label="Photo">
              <ImageField label="Photo" value={value.imageUrl ?? ""} onChange={(url) => set({ imageUrl: url })} folder="team" aspect="aspect-[4/5]" />
            </Field>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} required>
                <Input value={value.name} onChange={(e) => set({ name: e.target.value, slug: id ? value.slug : slugify(e.target.value) })} placeholder="e.g. Adv. Ahmed Raza" />
              </Field>
              <Field label="URL slug" error={errors.slug} help={`/team/${value.slug || "…"}`}>
                <Input value={value.slug ?? ""} onChange={(e) => set({ slug: slugify(e.target.value) })} />
              </Field>
            </div>
            <LocalizedInput label="Role / designation" value={value.role} onChange={(v) => set({ role: v })} urduEnabled={urduEnabled} error={errors["role.en"]} placeholder="e.g. Senior Partner, Head Trainer" />
            <LocalizedInput label="Bio" value={value.bio} onChange={(v) => set({ bio: v })} urduEnabled={urduEnabled} multiline rows={5} error={errors["bio.en"]} richHint />
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <ChipsInput label="Specialties" value={value.specialties} onChange={(v) => set({ specialties: v })} placeholder="e.g. Family law, Property – press Enter" suggestions={specialtySuggestions} help="Shown as tags on the profile." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone}>
              <Input value={value.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" inputMode="tel" />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={value.email ?? ""} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Facebook" error={errors["socials.facebook"]}>
              <Input value={value.socials?.facebook ?? ""} onChange={(e) => social("facebook", e.target.value)} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="Instagram" error={errors["socials.instagram"]}>
              <Input value={value.socials?.instagram ?? ""} onChange={(e) => social("instagram", e.target.value)} placeholder="https://instagram.com/…" />
            </Field>
            <Field label="LinkedIn" error={errors["socials.linkedin"]}>
              <Input value={value.socials?.linkedin ?? ""} onChange={(e) => social("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Switch checked={value.isActive} onChange={(v) => set({ isActive: v })} label="Show on website" />
            <Field label="Display order" className="w-32">
              <Input type="number" min={0} value={value.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
            </Field>
          </div>
        </div>
      </Dialog>
    </>
  );
}
