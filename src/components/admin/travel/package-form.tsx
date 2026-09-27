"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Switch } from "@/components/ui/input";
import { FieldsForm } from "@/components/admin/section-editor";
import { ImagesField } from "@/components/admin/uploader";
import { ActionButton } from "@/components/admin/action-button";
import { useToast } from "@/components/ui/toast";
import { f } from "@/templates/fields";
import type { LocalizedString } from "@/lib/i18n";
import { formatPKR, slugify } from "@/lib/utils";
import { deletePackage, upsertPackage } from "@/modules/travel/actions";
import { PACKAGE_IMAGES_FOLDER, PACKAGE_KINDS, PACKAGE_KIND_LABELS, POPULAR_DESTINATIONS, type PackageKind } from "@/modules/travel/constants";
import { emptyPackage, type ItineraryItem, type PackageFormValue } from "@/modules/travel/schema";
import { LocalizedListEditor } from "./localized-list-editor";
import { DateListEditor } from "./date-list-editor";

const titleFields = [f.localized("title", "Package title")];
const summaryFields = [f.richtext("summary", "Overview")];
const itineraryFields = [
  f.repeater("itinerary", "Itinerary", [f.number("day", "Day", { min: 1, max: 365 }), f.localized("title", "Title"), f.richtext("description", "Details")], {
    itemLabel: "day",
    max: 60,
  }),
];

const INCLUSION_SUGGESTIONS = ["Return air ticket", "Visa processing", "Hotel accommodation", "Daily breakfast", "Airport transfers", "Ziyarat in Makkah & Madinah", "Travel insurance", "Tour guide", "All transport", "Ihram & Zamzam"];
const EXCLUSION_SUGGESTIONS = ["Personal expenses", "Lunch & dinner", "Optional tours", "Tips", "Anything not mentioned in inclusions", "Excess baggage"];

export function PackageForm({ id, initial, urduEnabled }: { id?: string; initial?: PackageFormValue; urduEnabled: boolean }) {
  const [value, setValue] = React.useState<PackageFormValue>(initial ?? emptyPackage);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(Boolean(id));
  const toast = useToast();
  const router = useRouter();

  const set = <K extends keyof PackageFormValue>(k: K, v: PackageFormValue[K]) => setValue((s) => ({ ...s, [k]: v }));
  const int = (s: string, min: number) => Math.max(min, Math.round(Number(s) || 0));

  function setTitle(v: LocalizedString) {
    setValue((s) => ({ ...s, title: v, slug: slugTouched ? s.slug : slugify(v.en) }));
  }

  async function save() {
    setSaving(true);
    const res = await upsertPackage(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setErrors({});
      if (!id && res.data?.id) router.push(`/admin/packages/${res.data.id}`);
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
                <Field label="URL slug" error={errors.slug} help={`/packages/${value.slug || "…"}`}>
                  <Input
                    value={value.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                    placeholder="auto-generated from title"
                  />
                </Field>
                <Field label="Package type" error={errors.kind} required>
                  <Select value={value.kind} onChange={(e) => set("kind", e.target.value as PackageKind)}>
                    {PACKAGE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {PACKAGE_KIND_LABELS[k].en}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Destination" error={errors.destination} required>
                  <Input value={value.destination} onChange={(e) => set("destination", e.target.value)} list="pkg-destinations" placeholder="e.g. Makkah & Madinah, Hunza, Dubai" />
                  <datalist id="pkg-destinations">
                    {POPULAR_DESTINATIONS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Days" error={errors.days} required>
                    <Input type="number" min={1} max={365} value={value.days} onChange={(e) => set("days", int(e.target.value, 1))} />
                  </Field>
                  <Field label="Nights" error={errors.nights} required>
                    <Input type="number" min={0} max={365} value={value.nights} onChange={(e) => set("nights", int(e.target.value, 0))} />
                  </Field>
                </div>
                <Field label="Price (PKR)" error={errors.price} required help={value.price ? formatPKR(value.price) : "Starting price shown on the card."}>
                  <Input type="number" min={0} step={500} value={value.price} onChange={(e) => set("price", int(e.target.value, 0))} />
                </Field>
                <Field label="Price note" error={errors.priceNote} help="e.g. per person, double sharing">
                  <Input value={value.priceNote} onChange={(e) => set("priceNote", e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagesField label="Package photos" value={value.images} onChange={(v) => set("images", v)} folder={PACKAGE_IMAGES_FOLDER} max={12} />
              {errors.images ? <p className="mt-1 text-xs font-medium text-red-600">{errors.images}</p> : null}
              <p className="mt-2 text-xs text-slate-500">First image is the cover. Landscape photos (4:3) look best.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldsForm fields={summaryFields} value={{ summary: value.summary }} onChange={(v) => set("summary", v.summary as LocalizedString)} urduEnabled={urduEnabled} />
              <FieldsForm fields={itineraryFields} value={{ itinerary: value.itinerary }} onChange={(v) => set("itinerary", v.itinerary as ItineraryItem[])} urduEnabled={urduEnabled} />
              <LocalizedListEditor label="Inclusions" value={value.inclusions} onChange={(v) => set("inclusions", v)} urduEnabled={urduEnabled} placeholder="e.g. Return air ticket" suggestions={INCLUSION_SUGGESTIONS} />
              <LocalizedListEditor label="Exclusions" value={value.exclusions} onChange={(v) => set("exclusions", v)} urduEnabled={urduEnabled} placeholder="e.g. Personal expenses" suggestions={EXCLUSION_SUGGESTIONS} />
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Departures</CardTitle>
            </CardHeader>
            <CardContent>
              <DateListEditor label="Departure dates" value={value.departures} onChange={(v) => set("departures", v)} help="Past dates are hidden on the website automatically." />
              {errors.departures ? <p className="mt-1 text-xs font-medium text-red-600">{errors.departures}</p> : null}
            </CardContent>
          </Card>
          {id ? (
            <Card>
              <CardHeader>
                <CardTitle>Danger zone</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionButton variant="outline" className="w-full text-red-600" confirm="Delete this package? Booking requests will be kept but unlinked." action={() => deletePackage(id)} redirectTo="/admin/packages">
                  <Trash2 /> Delete package
                </ActionButton>
              </CardContent>
            </Card>
          ) : null}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <Label className="mb-1">Tip</Label>
            Write the overview in plain text; a blank line starts a new paragraph and lines starting with “- ” become bullets.
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/packages")}>
          Cancel
        </Button>
        <Button type="button" onClick={save} loading={saving}>
          {id ? "Save changes" : "Create package"}
        </Button>
      </div>
    </div>
  );
}
