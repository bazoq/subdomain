"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { updateApplicationStatus } from "@/modules/recruiting/actions";
import { APPLICATION_PIPELINE, APPLICATION_STATUSES, canTransitionApplication, type ApplicationStatusKey } from "@/modules/recruiting/constants";

/**
 * Status pipeline + recruiter notes for one application.
 * Buttons/options that would be an illegal transition (see `canTransitionApplication`) are disabled,
 * and the server re-validates every move.
 */
export function ApplicationStatusForm({ id, status, notes }: { id: string; status: ApplicationStatusKey; notes: string }) {
  const [value, setValue] = React.useState<ApplicationStatusKey>(status);
  const [text, setText] = React.useState(notes);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const dirty = value !== status || text !== notes;
  const stage = APPLICATION_PIPELINE.indexOf(status);
  const allowed = (s: ApplicationStatusKey) => canTransitionApplication(status, s);

  async function save(next?: ApplicationStatusKey) {
    const s = next ?? value;
    if (!allowed(s)) {
      setError(`Cannot move from ${status} to ${s}.`);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await updateApplicationStatus(id, s, text);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Updated");
      setValue(s);
      router.refresh();
    } else {
      setError(res.fieldErrors?.status ?? null);
      toast.push("error", res.message);
    }
  }

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label="Hiring pipeline">
        {APPLICATION_PIPELINE.map((s, i) => {
          const done = status !== "REJECTED" && i <= stage;
          const can = allowed(s) && s !== status;
          return (
            <li key={s} className="flex items-center gap-1">
              <button
                type="button"
                disabled={saving || !can}
                onClick={() => save(s)}
                title={can ? `Move to ${s}` : s === status ? "Current stage" : `Cannot move from ${status} to ${s}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition disabled:cursor-not-allowed",
                  done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                  !can && s !== status && "opacity-50",
                )}
                aria-current={status === s ? "step" : undefined}
              >
                {done ? <Check className="size-3" aria-hidden="true" /> : null}
                {s}
              </button>
              {i < APPLICATION_PIPELINE.length - 1 ? <span className="text-slate-300" aria-hidden="true">›</span> : null}
            </li>
          );
        })}
        <li>
          <button
            type="button"
            disabled={saving || status === "REJECTED" || !allowed("REJECTED")}
            onClick={() => save("REJECTED")}
            title={status === "HIRED" ? "A hired candidate cannot be rejected; undo to OFFERED first." : "Reject this application"}
            className={cn(
              "ml-2 rounded-full border px-2.5 py-1 font-medium transition disabled:cursor-not-allowed",
              status === "REJECTED" ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700",
              status !== "REJECTED" && !allowed("REJECTED") && "opacity-50",
            )}
          >
            REJECTED
          </button>
        </li>
      </ol>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <Field label="Status" error={error ?? undefined} help={status === "REJECTED" ? "Rejected applications can be reopened to Received or Shortlisted." : status === "HIRED" ? "Hired is final; you can only undo to Offered." : "Move forward freely, or back one stage to undo."}>
          <Select value={value} onChange={(e) => setValue(e.target.value as ApplicationStatusKey)}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s} disabled={!allowed(s)}>
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
