"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { upsertFaq, type FaqInput } from "@/modules/shared/faq-actions";

const empty: FaqInput = { question: { en: "" }, answer: { en: "" }, isActive: true };

export function FaqFormButton({ initial, id, urduEnabled, label, variant = "default" }: { initial?: FaqInput; id?: string; urduEnabled: boolean; label?: string; variant?: "default" | "outline" | "ghost" }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<FaqInput>(initial ?? empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await upsertFaq(id ?? null, value);
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
        {label ?? (id ? "Edit" : "Add question")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? "Edit question" : "Add question"}
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
          <LocalizedInput label="Question" value={value.question} onChange={(v) => setValue({ ...value, question: v })} urduEnabled={urduEnabled} required error={errors["question"] ?? errors["question.en"]} placeholder="e.g. Do you deliver outside Lahore?" />
          <LocalizedInput label="Answer" value={value.answer} onChange={(v) => setValue({ ...value, answer: v })} urduEnabled={urduEnabled} multiline rows={5} required error={errors["answer"] ?? errors["answer.en"]} />
          <Switch checked={value.isActive} onChange={(v) => setValue({ ...value, isActive: v })} label="Show on website" />
        </div>
      </Dialog>
    </>
  );
}
