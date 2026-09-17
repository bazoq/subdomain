import Link from "next/link";
import { Trash2, UserRound } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { TeamFormButton } from "@/components/admin/shared/team-form";
import { deleteTeamMember, toggleTeamMember, type TeamMemberInput } from "@/modules/shared/team-actions";
import { asLocalized, asSocials } from "@/modules/shared/content-types";

function labels(key: string) {
  if (key === "law") return { plural: "Attorneys", singular: "attorney", suggestions: ["Civil", "Criminal", "Family", "Property", "Corporate", "Tax", "Immigration", "Labour", "Banking"] };
  if (key === "gym") return { plural: "Trainers", singular: "trainer", suggestions: ["Weight loss", "Bodybuilding", "CrossFit", "Yoga", "Cardio", "Nutrition", "Ladies fitness"] };
  if (key === "realestate") return { plural: "Agents", singular: "agent", suggestions: ["Residential", "Commercial", "Plots", "Rentals", "DHA", "Bahria Town"] };
  return { plural: "Team", singular: "team member", suggestions: [] as string[] };
}

export default async function TeamAdminPage() {
  const ctx = await requireTenantAdmin();
  const l = labels(ctx.category.key);
  const urdu = ctx.settings.languages.urduEnabled;
  const rows = await db.teamMember.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const add = <TeamFormButton urduEnabled={urdu} entityLabel={l.singular} specialtySuggestions={l.suggestions} />;
  return (
    <>
      <PageHeader title={l.plural} description={`Profiles shown on your website at /team.`} actions={add} />
      {rows.length === 0 ? (
        <EmptyState icon={<UserRound />} title={`No ${l.plural.toLowerCase()} yet`} description="Add people with a photo, role and short bio to build trust." action={add} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Specialties</TH>
              <TH>Contact</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const initial: TeamMemberInput = {
                name: r.name,
                slug: r.slug,
                role: asLocalized(r.role),
                bio: asLocalized(r.bio),
                imageUrl: r.imageUrl ?? "",
                phone: r.phone ?? "",
                email: r.email ?? "",
                socials: asSocials(r.socials),
                specialties: r.specialties,
                isActive: r.isActive,
                sortOrder: r.sortOrder,
              };
              return (
                <TR key={r.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.imageUrl} alt="" className="size-10 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-500">{r.name.charAt(0)}</span>
                      )}
                      <div>
                        <Link href={`/team/${r.slug}`} target="_blank" className="font-medium text-slate-900 hover:underline">
                          {r.name}
                        </Link>
                        <p className="text-xs text-slate-500">{initial.role.en}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {r.specialties.slice(0, 3).map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                      {r.specialties.length > 3 ? <span className="text-xs text-slate-400">+{r.specialties.length - 3}</span> : null}
                    </div>
                  </TD>
                  <TD className="text-xs text-slate-600">
                    {r.phone ? <p dir="ltr">{r.phone}</p> : null}
                    {r.email ? <p>{r.email}</p> : null}
                  </TD>
                  <TD>
                    <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Visible" : "Hidden"}</Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <ActionButton size="sm" variant="ghost" action={() => toggleTeamMember(r.id, !r.isActive)}>
                        {r.isActive ? "Hide" : "Show"}
                      </ActionButton>
                      <TeamFormButton id={r.id} initial={initial} urduEnabled={urdu} entityLabel={l.singular} specialtySuggestions={l.suggestions} variant="outline" />
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm={`Remove ${r.name}?`} action={() => deleteTeamMember(r.id)}>
                        <Trash2 />
                      </ActionButton>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
