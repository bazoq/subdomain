import { notFound } from "next/navigation";
import { CalendarDays, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { ClassFormButton } from "@/modules/gym/admin/class-form";
import { deleteClass, toggleClass, type ClassInput } from "@/modules/gym/actions";
import { WEEKDAYS } from "@/modules/gym/constants";
import { getClasses, getTrainers } from "@/modules/gym/queries";
import { asLocalized } from "@/modules/shared/content-types";
import { cn } from "@/lib/utils";

export default async function ClassesAdminPage() {
  const ctx = await requireTenantAdmin();
  if (!ctx.category.modules.includes("gym")) notFound();
  const urdu = ctx.settings.languages.urduEnabled;
  const [rows, trainers] = await Promise.all([getClasses(ctx.tenant.id, { includeInactive: true }), getTrainers(ctx.tenant.id)]);
  const trainerOpts = trainers.map((t) => ({ id: t.id, name: t.name }));
  const add = <ClassFormButton urduEnabled={urdu} trainers={trainerOpts} />;
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <>
      <PageHeader title="Class schedule" description="Weekly timetable shown at /classes. Assign a trainer from your Trainers list." actions={add} />
      {trainers.length === 0 ? <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">Tip: add trainers under Business › Trainers to assign them to classes.</p> : null}
      {rows.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="No classes yet" description="Add your daily classes – yoga, CrossFit, Zumba, ladies-only sessions – with times and trainers." action={add} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {order.map((d) => {
            const list = rows.filter((r) => r.dayOfWeek === d);
            return (
              <section key={d} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                  <h2 className="text-sm font-semibold text-slate-900">{WEEKDAYS[d]}</h2>
                  <span className="text-xs text-slate-400">{list.length}</span>
                </header>
                <ul className="divide-y divide-slate-100">
                  {list.length === 0 ? <li className="px-4 py-6 text-center text-xs text-slate-400">No classes</li> : null}
                  {list.map((r) => {
                    const initial: ClassInput = { name: asLocalized(r.name), trainerId: r.trainerId ?? "", dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime, capacity: r.capacity ?? "", level: r.level ?? "", isActive: r.isActive };
                    return (
                      <li key={r.id} className={cn("px-4 py-3", !r.isActive && "bg-slate-50/70 opacity-70")}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{initial.name.en}</p>
                            <p className="text-xs text-slate-500" dir="ltr">
                              {r.startTime} – {r.endTime}
                            </p>
                            <p className="mt-0.5 flex flex-wrap gap-1 text-xs text-slate-500">
                              {r.trainer ? <span>{r.trainer.name}</span> : null}
                              {r.level ? <Badge>{r.level}</Badge> : null}
                              {r.capacity ? <span>· {r.capacity} spots</span> : null}
                            </p>
                          </div>
                          {!r.isActive ? <Badge>Hidden</Badge> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <ClassFormButton id={r.id} initial={initial} urduEnabled={urdu} trainers={trainerOpts} variant="outline" />
                          <ActionButton size="sm" variant="ghost" action={() => toggleClass(r.id, !r.isActive)}>
                            {r.isActive ? "Hide" : "Show"}
                          </ActionButton>
                          <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this class?" action={() => deleteClass(r.id)}>
                            <Trash2 />
                          </ActionButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
