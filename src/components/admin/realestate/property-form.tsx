"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Switch } from "@/components/ui/input";
import { FieldsForm } from "@/components/admin/section-editor";
import { ImagesField } from "@/components/admin/uploader";
import { ActionButton } from "@/components/admin/action-button";
import { useToast } from "@/components/ui/toast";
import { f } from "@/templates/fields";
import type { LocalizedString } from "@/lib/i18n";
import { cn, formatPKR, slugify } from "@/lib/utils";
import { deleteProperty, upsertProperty } from "@/modules/realestate/actions";
import {
  AREA_UNITS,
  AREA_UNIT_LABELS,
  COMMON_FEATURES,
  PK_CITIES,
  PROPERTY_IMAGES_FOLDER,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PURPOSES,
  PURPOSE_LABELS,
  type AreaUnit,
  type PropertyType,
  type Purpose,
} from "@/modules/realestate/constants";
import { emptyProperty, type PropertyFormValue } from "@/modules/realestate/schema";

const titleFields = [f.localized("title", "Listing title")];
const descriptionFields = [f.richtext("description", "Description")];

export interface AgentOption {
  id: string;
  name: string;
  role: string;
}

export function PropertyForm({ id, initial, urduEnabled, agents }: { id?: string; initial?: PropertyFormValue; urduEnabled: boolean; agents: AgentOption[] }) {
  const [value, setValue] = React.useState<PropertyFormValue>(initial ?? emptyProperty);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(Boolean(id));
  const [customFeature, setCustomFeature] = React.useState("");
  const toast = useToast();
  const router = useRouter();

  const set = <K extends keyof PropertyFormValue>(k: K, v: PropertyFormValue[K]) => setValue((s) => ({ ...s, [k]: v }));
  const intOrNull = (s: string) => (s.trim() === "" ? null : Math.max(0, Math.round(Number(s) || 0)));
  const isPlot = value.type === "PLOT";

  function setTitle(v: LocalizedString) {
    setValue((s) => ({ ...s, title: v, slug: slugTouched ? s.slug : slugify(v.en) }));
  }
  function setPurpose(p: Purpose) {
    setValue((s) => ({ ...s, purpose: p, priceUnit: p === "RENT" ? "MONTHLY" : "TOTAL" }));
  }
  function toggleFeature(x: string) {
    setValue((s) => ({ ...s, features: s.features.includes(x) ? s.features.filter((y) => y !== x) : [...s.features, x] }));
  }
  function addCustomFeature() {
    const x = customFeature.trim();
    if (!x || value.features.some((y) => y.toLowerCase() === x.toLowerCase()) || value.features.length >= 40) return;
    set("features", [...value.features, x]);
    setCustomFeature("");
  }

  async function save() {
    setSaving(true);
    const res = await upsertProperty(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setErrors({});
      if (!id && res.data?.id) router.push(`/admin/properties/${res.data.id}`);
      else router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  const customFeatures = value.features.filter((x) => !COMMON_FEATURES.includes(x));

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
                <p className="mt-1 text-xs text-slate-500">e.g. “10 Marla House for Sale in DHA Phase 6” or “2 Bed Flat for Rent in Bahria Town”.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="URL slug" error={errors.slug} help={`/properties/${value.slug || "…"}`}>
                  <Input
                    value={value.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                    placeholder="auto-generated from title"
                  />
                </Field>
                <div>
                  <Label>Purpose</Label>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
                    {PURPOSES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPurpose(p)}
                        aria-pressed={value.purpose === p}
                        className={cn("rounded-md px-4 py-1.5 text-sm font-medium transition", value.purpose === p ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100")}
                      >
                        {PURPOSE_LABELS[p].en}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Property type" error={errors.type} required>
                  <Select value={value.type} onChange={(e) => set("type", e.target.value as PropertyType)}>
                    {PROPERTY_TYPES.map((x) => (
                      <option key={x} value={x}>
                        {PROPERTY_TYPE_LABELS[x].en}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={value.purpose === "RENT" ? "Rent (PKR)" : "Price (PKR)"} error={errors.price} required help={value.price ? `${formatPKR(value.price, { compact: true })}${value.priceUnit === "MONTHLY" ? " / month" : ""}` : "Enter the full amount in rupees, e.g. 25000000 for 2.5 Crore."}>
                  <Input type="number" min={0} step={value.purpose === "RENT" ? 1000 : 100000} value={value.price || ""} onChange={(e) => set("price", Math.max(0, Math.round(Number(e.target.value) || 0)))} />
                </Field>
                <Field label="Price unit" error={errors.priceUnit}>
                  <Select value={value.priceUnit} onChange={(e) => set("priceUnit", e.target.value as PropertyFormValue["priceUnit"])}>
                    <option value="TOTAL">Total</option>
                    <option value="MONTHLY">Per month</option>
                  </Select>
                </Field>
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <Field label="Area" error={errors.areaValue}>
                    <Input type="number" min={0} step="0.5" value={value.areaValue ?? ""} onChange={(e) => set("areaValue", e.target.value.trim() === "" ? null : Math.max(0, Number(e.target.value) || 0))} placeholder="e.g. 10" />
                  </Field>
                  <Field label="Unit" error={errors.areaUnit}>
                    <Select value={value.areaUnit} onChange={(e) => set("areaUnit", e.target.value as AreaUnit)}>
                      {AREA_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {AREA_UNIT_LABELS[u].en}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {!isPlot ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Bedrooms" error={errors.bedrooms}>
                      <Input type="number" min={0} max={50} value={value.bedrooms ?? ""} onChange={(e) => set("bedrooms", intOrNull(e.target.value))} />
                    </Field>
                    <Field label="Bathrooms" error={errors.bathrooms}>
                      <Input type="number" min={0} max={50} value={value.bathrooms ?? ""} onChange={(e) => set("bathrooms", intOrNull(e.target.value))} />
                    </Field>
                  </div>
                ) : null}
                <Field label="City" error={errors.city} required>
                  <Input value={value.city} onChange={(e) => set("city", e.target.value)} list="prop-cities" placeholder="Lahore" />
                  <datalist id="prop-cities">
                    {PK_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Location / society" error={errors.location} required help="Shown on the card, e.g. DHA Phase 6, Block K">
                  <Input value={value.location} onChange={(e) => set("location", e.target.value)} placeholder="DHA Phase 6, Block K" />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagesField label="Property photos" value={value.images} onChange={(v) => set("images", v)} folder={PROPERTY_IMAGES_FOLDER} max={20} />
              {errors.images ? <p className="mt-1 text-xs font-medium text-red-600">{errors.images}</p> : null}
              <p className="mt-2 text-xs text-slate-500">First image is the cover. Add the front elevation first, then rooms, lawn and street view.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description & features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldsForm fields={descriptionFields} value={{ description: value.description }} onChange={(v) => set("description", v.description as LocalizedString)} urduEnabled={urduEnabled} />
              <div>
                <Label>
                  Features <span className="text-xs font-normal text-slate-400">({value.features.length})</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_FEATURES.map((x) => {
                    const on = value.features.includes(x);
                    return (
                      <button
                        key={x}
                        type="button"
                        onClick={() => toggleFeature(x)}
                        aria-pressed={on}
                        className={cn("rounded-full border px-3 py-1 text-xs font-medium transition", on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand-400")}
                      >
                        {x}
                      </button>
                    );
                  })}
                  {customFeatures.map((x) => (
                    <span key={x} className="inline-flex items-center gap-1 rounded-full border border-brand-600 bg-brand-600 px-3 py-1 text-xs font-medium text-white">
                      {x}
                      <button type="button" onClick={() => toggleFeature(x)} aria-label={`Remove ${x}`} className="rounded-full hover:bg-white/20">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex max-w-sm gap-2">
                  <Input
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomFeature();
                      }
                    }}
                    maxLength={60}
                    placeholder="Add another feature…"
                  />
                  <Button type="button" variant="outline" onClick={addCustomFeature} disabled={!customFeature.trim()}>
                    <Plus /> Add
                  </Button>
                </div>
                {errors.features ? <p className="mt-1 text-xs font-medium text-red-600">{errors.features}</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media & map</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Video URL" error={errors.videoUrl} help="YouTube links are embedded automatically.">
                <Input value={value.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=…" />
              </Field>
              <Field label="Google Maps URL" error={errors.mapUrl} help="Paste an embed URL (Share → Embed a map) to show the map inline; other links open in a new tab.">
                <Input value={value.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} placeholder="https://www.google.com/maps/embed?pb=…" />
              </Field>
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
              <CardTitle>Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Listed by" error={errors.agentId} help={agents.length ? "Shown with call / WhatsApp buttons on the listing." : "Add agents under Team to assign them here."}>
                <Select value={value.agentId} onChange={(e) => set("agentId", e.target.value)}>
                  <option value="">Office (default contact)</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.role ? ` — ${a.role}` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>
          {id ? (
            <Card>
              <CardHeader>
                <CardTitle>Danger zone</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionButton variant="outline" className="w-full text-red-600" confirm="Delete this listing permanently?" action={() => deleteProperty(id)} redirectTo="/admin/properties">
                  <Trash2 /> Delete listing
                </ActionButton>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/properties")}>
          Cancel
        </Button>
        <Button type="button" onClick={save} loading={saving}>
          {id ? "Save changes" : "Publish listing"}
        </Button>
      </div>
    </div>
  );
}
