"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Switch } from "@/components/ui/input";
import { FieldsForm } from "@/components/admin/section-editor";
import { ActionButton } from "@/components/admin/action-button";
import { useToast } from "@/components/ui/toast";
import { f } from "@/templates/fields";
import type { LocalizedString } from "@/lib/i18n";
import { formatPKR, slugify } from "@/lib/utils";
import { deleteJob, upsertJob } from "@/modules/recruiting/actions";
import { EXPERIENCE_LEVELS, JOB_COUNTRIES, JOB_TYPES } from "@/modules/recruiting/constants";
import { emptyJob, type JobFormValue } from "@/modules/recruiting/schema";

const titleFields = [f.localized("title", "Job title")];
const descriptionFields = [f.richtext("description", "Job description")];
const requirementFields = [f.richtext("requirements", "Requirements")];

export function JobForm({ id, initial, urduEnabled }: { id?: string; initial?: JobFormValue; urduEnabled: boolean }) {
  const [value, setValue] = React.useState<JobFormValue>(initial ?? emptyJob);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(Boolean(id));
  const toast = useToast();
  const router = useRouter();

  const set = <K extends keyof JobFormValue>(k: K, v: JobFormValue[K]) => setValue((s) => ({ ...s, [k]: v }));
  const num = (s: string) => (s.trim() === "" ? null : Math.max(0, Math.round(Number(s))));

  function setTitle(v: LocalizedString) {
    setValue((s) => ({ ...s, title: v, slug: slugTouched ? s.slug : slugify(v.en) }));
  }

  async function save() {
    setSaving(true);
    const res = await upsertJob(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setErrors({});
      if (!id && res.data?.id) router.push(`/admin/jobs/${res.data.id}`);
      else router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldsForm fields={titleFields} value={{ title: value.title }} onChange={(v) => setTitle(v.title as LocalizedString)} urduEnabled={urduEnabled} />
                {errors["title.en"] ? <p className="mt-1 text-xs font-medium text-red-600">{errors["title.en"]}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="URL slug" error={errors.slug} help={`/jobs/${value.slug || "…"}`}>
                  <Input
                    value={value.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                    placeholder="auto-generated from title"
                  />
                </Field>
                <Field label="Company / client" error={errors.company} help="Leave blank to keep the employer confidential.">
                  <Input value={value.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Al Rajhi Construction" />
                </Field>
                <Field label="Department / category" error={errors.department} help="Used for the 'browse by department' chips.">
                  <Input value={value.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g. Construction, IT, Healthcare" list="job-departments" />
                  <datalist id="job-departments">
                    {["Construction", "Healthcare", "IT & Software", "Hospitality", "Drivers", "Engineering", "Accounts & Finance", "Sales & Marketing", "Security", "Domestic", "Oil & Gas", "Teaching"].map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Job type" error={errors.type} required>
                  <Select value={value.type} onChange={(e) => set("type", e.target.value)}>
                    {JOB_TYPES.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Location (city)" error={errors.location} required>
                  <Input value={value.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Lahore or Riyadh" />
                </Field>
                <Field label="Country" error={errors.country} required>
                  <Input value={value.country} onChange={(e) => set("country", e.target.value)} list="job-countries" />
                  <datalist id="job-countries">
                    {JOB_COUNTRIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pay & requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Salary min (PKR)" error={errors.salaryMin} help={value.salaryMin != null ? formatPKR(value.salaryMin) : undefined}>
                  <Input type="number" min={0} value={value.salaryMin ?? ""} onChange={(e) => set("salaryMin", num(e.target.value))} />
                </Field>
                <Field label="Salary max (PKR)" error={errors.salaryMax} help={value.salaryMax != null ? formatPKR(value.salaryMax) : undefined}>
                  <Input type="number" min={0} value={value.salaryMax ?? ""} onChange={(e) => set("salaryMax", num(e.target.value))} />
                </Field>
                <Field label="Salary text (overrides)" error={errors.salaryText} help="e.g. SAR 2,500 + food & accommodation">
                  <Input value={value.salaryText} onChange={(e) => set("salaryText", e.target.value)} />
                </Field>
                <Field label="Experience" error={errors.experience}>
                  <Select value={value.experience} onChange={(e) => set("experience", e.target.value)}>
                    <option value="">Not specified</option>
                    {EXPERIENCE_LEVELS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Vacancies" error={errors.vacancies}>
                  <Input type="number" min={1} max={9999} value={value.vacancies} onChange={(e) => set("vacancies", Math.max(1, Math.round(Number(e.target.value) || 1)))} />
                </Field>
                <Field label="Application deadline" error={errors.deadline} help="Leave blank for open-ended.">
                  <Input type="date" value={value.deadline} onChange={(e) => set("deadline", e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldsForm fields={descriptionFields} value={{ description: value.description }} onChange={(v) => set("description", v.description as LocalizedString)} urduEnabled={urduEnabled} />
              <FieldsForm fields={requirementFields} value={{ requirements: value.requirements }} onChange={(v) => set("requirements", v.requirements as LocalizedString)} urduEnabled={urduEnabled} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Switch checked={value.isActive} onChange={(v) => set("isActive", v)} label="Live on website" />
              <Switch checked={value.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured (shown on home page)" />
              <p className="text-xs text-slate-500">Expired deadlines automatically hide the job from the public list and block new applications.</p>
            </CardContent>
          </Card>
          {id ? (
            <Card>
              <CardHeader>
                <CardTitle>Danger zone</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionButton variant="outline" className="w-full text-red-600" confirm="Delete this job? Applications will be kept but unlinked." action={() => deleteJob(id)} redirectTo="/admin/jobs">
                  <Trash2 /> Delete job
                </ActionButton>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/jobs")}>
          Cancel
        </Button>
        <Button type="button" onClick={save} loading={saving}>
          {id ? "Save changes" : "Post job"}
        </Button>
      </div>
    </div>
  );
}
