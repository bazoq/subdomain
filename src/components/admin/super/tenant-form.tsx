"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Help } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { PasswordInput, CredentialReveal, generateClientPassword } from "@/components/admin/super/password-utils";
import { createTenant, type CreateTenantInput, type HostnameEntry } from "@/server/super/tenants-actions";
import { CATEGORIES } from "@/lib/categories";
import { slugify, cn } from "@/lib/utils";

/** Serialisable slice of TemplateMeta passed from the server page. */
export interface TemplateOption {
  id: string;
  code: number;
  category: string;
  name: string;
  tagline: string;
  style: string[];
  sectionCount: number;
}

type FormState = CreateTenantInput;

const initial: FormState = {
  name: "",
  slug: "",
  category: CATEGORIES[0].key,
  templateId: "",
  hostnames: [{ kind: "subdomain", value: "" }],
  status: "DRAFT",
  owner: { name: "", username: "", password: generateClientPassword(), email: "" },
  contact: { phone: "", whatsapp: "", email: "", city: "", address: "" },
  urduEnabled: false,
};

export function TenantForm({ templates, rootDomain }: { templates: TemplateOption[]; rootDomain: string }) {
  const [v, setV] = React.useState<FormState>(() => ({ ...initial, templateId: templates.find((t) => t.category === initial.category)?.id ?? "" }));
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [usernameTouched, setUsernameTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [tplQuery, setTplQuery] = React.useState("");
  const [created, setCreated] = React.useState<{ id: string; username: string; password: string; host: string } | null>(null);
  const toast = useToast();
  const router = useRouter();

  const templatesForCat = templates.filter((t) => t.category === v.category);
  const tq = tplQuery.trim().toLowerCase();
  const visibleTemplates = tq ? templatesForCat.filter((t) => String(t.code).includes(tq) || t.name.toLowerCase().includes(tq) || t.id.includes(tq)) : templatesForCat;
  function setCategory(category: string) {
    const first = templates.find((t) => t.category === category);
    setV({ ...v, category, templateId: first?.id ?? "" });
    setTplQuery("");
  }

  function setName(name: string) {
    const slug = slugTouched ? v.slug : slugify(name);
    const first = v.hostnames[0];
    const hostnames = first && first.kind === "subdomain" && (first.value === "" || first.value === v.slug) ? [{ ...first, value: slug }, ...v.hostnames.slice(1)] : v.hostnames;
    setV({ ...v, name, slug, hostnames });
  }

  function setHost(i: number, patch: Partial<HostnameEntry>) {
    setV({ ...v, hostnames: v.hostnames.map((h, k) => (k === i ? ({ ...h, ...patch } as HostnameEntry) : h)) });
  }

  async function submit() {
    setSaving(true);
    setErrors({});
    const res = await createTenant(v);
    setSaving(false);
    if (res.ok && res.data) {
      const first = v.hostnames[0];
      const host = first.kind === "subdomain" ? `${first.value.toLowerCase()}.${rootDomain}` : first.value.toLowerCase();
      setCreated({ id: res.data.id, username: v.owner.username.toLowerCase(), password: v.owner.password, host });
      toast.push("success", res.message ?? "Created");
    } else if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  if (created) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Website created</CardTitle>
          <CardDescription>Share these login details with the business owner. The password cannot be viewed again.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CredentialReveal
            title="Owner login"
            lines={[
              { label: "Admin URL", value: `${created.host.endsWith(".localhost") || created.host === "localhost" ? "http" : "https"}://${created.host}${created.host.endsWith(".localhost") ? ":3000" : ""}/admin` },
              { label: "Username", value: created.username },
              { label: "Password", value: created.password },
            ]}
          />
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/super/tenants/${created.id}`)}>Open website settings</Button>
            <Button variant="outline" onClick={() => router.push("/super/tenants")}>
              Back to list
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" error={errors.name} required>
            <Input value={v.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Karachi Pizza House" />
          </Field>
          <Field label="Slug" error={errors.slug} help="Internal unique id. Lowercase letters, digits, hyphens." required>
            <Input
              value={v.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setV({ ...v, slug: slugify(e.target.value) || e.target.value.toLowerCase() });
              }}
            />
          </Field>
          <Field label="Category" error={errors.category} required>
            <Select value={v.category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" error={errors.status}>
            <Select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as FormState["status"] })}>
              <option value="DRAFT">Draft (not public yet)</option>
              <option value="ACTIVE">Active (live)</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Switch checked={v.urduEnabled} onChange={(urduEnabled) => setV({ ...v, urduEnabled })} label="Enable Urdu (bilingual website)" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
          <CardDescription>Only templates built for the selected category are shown. Search by name or template code (e.g. 901).</CardDescription>
        </CardHeader>
        <CardContent>
          {errors.templateId ? <p className="mb-3 text-sm font-medium text-red-600">{errors.templateId}</p> : null}
          {templatesForCat.length > 0 ? <Input value={tplQuery} onChange={(e) => setTplQuery(e.target.value)} placeholder="Search by name or #code" className="mb-3 max-w-xs" /> : null}
          {templatesForCat.length > 0 && visibleTemplates.length === 0 ? <p className="text-sm text-slate-500">No template matches &quot;{tplQuery}&quot;.</p> : null}
          {templatesForCat.length === 0 ? (
            <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              No templates are registered for this category yet. Templates appear after <code className="rounded bg-white px-1">npm run gen:templates</code> has been run with template folders present.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTemplates.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setV({ ...v, templateId: t.id })}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    v.templateId === t.id ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      {t.name} <span className="font-mono text-xs text-brand-600">#{t.code}</span>
                    </p>
                    <span className="font-mono text-[11px] text-slate-400">{t.id}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{t.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.style.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                    <Badge tone="info">{t.sectionCount} sections</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hostnames</CardTitle>
          <CardDescription>The first hostname is the primary one. Custom domains must also be added to the Vercel project (see docs/DEPLOY.md).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {v.hostnames.map((h, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Select className="sm:w-44" value={h.kind} onChange={(e) => setHost(i, { kind: e.target.value as HostnameEntry["kind"], value: "" })}>
                <option value="subdomain">Subdomain</option>
                <option value="custom">Custom domain</option>
              </Select>
              <div className="flex-1">
                {h.kind === "subdomain" ? (
                  <div className="flex items-center">
                    <Input value={h.value} onChange={(e) => setHost(i, { value: e.target.value.toLowerCase() })} placeholder="karachi-pizza" className="rounded-r-none" />
                    <span className="flex h-10 items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">.{rootDomain}</span>
                  </div>
                ) : (
                  <Input value={h.value} onChange={(e) => setHost(i, { value: e.target.value.toLowerCase() })} placeholder="www.karachipizza.com" />
                )}
                {errors[`hostnames.${i}`] ? <p className="mt-1 text-xs font-medium text-red-600">{errors[`hostnames.${i}`]}</p> : null}
              </div>
              <div className="flex items-center gap-1">
                {i === 0 ? (
                  <Badge tone="brand">
                    <Star className="size-3" /> primary
                  </Badge>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setV({ ...v, hostnames: v.hostnames.filter((_, k) => k !== i) })}>
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {errors.hostnames ? <p className="text-xs font-medium text-red-600">{errors.hostnames}</p> : null}
          {v.hostnames.length < 10 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setV({ ...v, hostnames: [...v.hostnames, { kind: "custom", value: "" }] })}>
              <Plus /> Add hostname
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owner account</CardTitle>
          <CardDescription>The business owner signs in at /admin on their website with these details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner name" error={errors["owner.name"]} required>
            <Input
              value={v.owner.name}
              onChange={(e) => {
                const name = e.target.value;
                const username = usernameTouched ? v.owner.username : slugify(name).replace(/-/g, ".").slice(0, 40);
                setV({ ...v, owner: { ...v.owner, name, username } });
              }}
            />
          </Field>
          <Field label="Username" error={errors["owner.username"]} help="Lowercase; letters, digits, dot, dash, underscore." required>
            <Input
              value={v.owner.username}
              autoComplete="off"
              onChange={(e) => {
                setUsernameTouched(true);
                setV({ ...v, owner: { ...v.owner, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") } });
              }}
            />
          </Field>
          <Field label="Owner email (optional)" error={errors["owner.email"]}>
            <Input type="email" value={v.owner.email ?? ""} onChange={(e) => setV({ ...v, owner: { ...v.owner, email: e.target.value } })} />
          </Field>
          <Field label="Password" error={errors["owner.password"]} required>
            <PasswordInput value={v.owner.password} onChange={(password) => setV({ ...v, owner: { ...v.owner, password } })} />
            <Help>You will see this password once after creation. Share it with the owner privately.</Help>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact basics</CardTitle>
          <CardDescription>The owner can change these later under Settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" error={errors["contact.phone"]}>
            <Input value={v.contact.phone} placeholder="0300 1234567" onChange={(e) => setV({ ...v, contact: { ...v.contact, phone: e.target.value } })} />
          </Field>
          <Field label="WhatsApp" error={errors["contact.whatsapp"]}>
            <Input value={v.contact.whatsapp} placeholder="0300 1234567" onChange={(e) => setV({ ...v, contact: { ...v.contact, whatsapp: e.target.value } })} />
          </Field>
          <Field label="Email" error={errors["contact.email"]}>
            <Input type="email" value={v.contact.email} onChange={(e) => setV({ ...v, contact: { ...v.contact, email: e.target.value } })} />
          </Field>
          <Field label="City" error={errors["contact.city"]}>
            <Input value={v.contact.city} placeholder="Lahore" onChange={(e) => setV({ ...v, contact: { ...v.contact, city: e.target.value } })} />
          </Field>
          <Field label="Address" error={errors["contact.address"]} className="sm:col-span-2">
            <Input value={v.contact.address} onChange={(e) => setV({ ...v, contact: { ...v.contact, address: e.target.value } })} />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.push("/super/tenants")}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={!v.templateId}>
          Create website
        </Button>
      </div>
    </form>
  );
}
