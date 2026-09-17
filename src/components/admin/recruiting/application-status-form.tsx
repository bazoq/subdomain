"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { updateApplicationStatus } from "@/modules/recruiting/actions";
import { APPLICATION_STATUSES, type ApplicationStatusKey } from "@/modules/recruiting/constants";

const PIPELINE: ApplicationStatusKey[] = ["RECEIVED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"];

/** Status pipeline + recruiter notes for one application. */
export function ApplicationStatusForm({ id, status, notes }: { id: string; status: ApplicationStatusKey; notes: string }) {
  const [value, setValue] = React.useState<ApplicationStatusKey>(status);
  const [text, setText] = React.useState(notes);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  const dirty = value !== status || text !== notes;
  const stage = PIPELINE.indexOf(status);

  async function save(next?: ApplicationStatusKey) {
    setSaving(true);
    const s = next ?? value;
    const res = await updateApplicationStatus(id, s, text);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Updated");
      setValue(s);
      router.refresh();
    } else toast.push("error", res.message);
  }

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label="Hiring pipeline">
        {PIPELINE.map((s, i) => {
          const done = status !== "REJECTED" && i <= stage;
          return (
            <li key={s} className="flex items-center gap-1">
              <button
                type="button"
                disabled={saving}
                onClick={() => save(s)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition",
                  done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                )}
                aria-current={status === s ? "step" : undefined}
              >
                {done ? <Check className="size-3" /> : null}
                {s}
              </button>
              {i < PIPELINE.length - 1 ? <span className="text-slate-300">›</span> : null}
            </li>
          );
        })}
        <li>
          <button
            type="button"
            disabled={saving}
            onClick={() => save("REJECTED")}
            className={cn(
              "ml-2 rounded-full border px-2.5 py-1 font-medium transition",
              status === "REJECTED" ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700",
            )}
          >
            REJECTED
          </button>
        </li>
      </ol>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <Field label="Status">
          <Select value={value} onChange={(e) => setValue(e.target.value as ApplicationStatusKey)}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Recruiter notes" help="Private — never shown to the candidate.">
          <Textarea value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="Interview feedback, documents pending, expected joining date…" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={() => save()} loading={saving} disabled={!dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}
