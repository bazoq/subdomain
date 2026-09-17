import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PrintButton } from "@/components/admin/restaurant/print-button";
import { formatDate } from "@/lib/utils";
import { toFoodOrderDto } from "@/modules/restaurant/serialize";

/** Thermal-style 80mm kitchen / customer ticket. */
export default async function PrintTicketPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireTenantAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const row = await db.foodOrder.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { items: true } });
  if (!row) notFound();
  const o = toFoodOrderDto(row);
  const rs = (n: number) => n.toLocaleString("en-PK");
  const line = "- - - - - - - - - - - - - - - - - - - -";

  return (
    <div>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body * { visibility: hidden !important; }
          #ticket, #ticket * { visibility: visible !important; }
          #ticket { position: absolute !important; left: 0; top: 0; width: 72mm; margin: 0; box-shadow: none; border: 0; }
        }
      `}</style>
      <div className="mb-4 flex items-center gap-2 print:hidden">
        <Link href={`/admin/food-orders/${o.id}`} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to order
        </Link>
        <div className="ms-auto">
          <PrintButton auto={sp.auto === "1"} />
        </div>
      </div>

      <div id="ticket" className="mx-auto w-[302px] border border-slate-200 bg-white p-3 font-mono text-[12px] leading-tight text-black shadow-sm">
        <div className="text-center">
          <p className="text-[16px] font-bold uppercase">{ctx.tenant.name}</p>
          {ctx.settings.contact.address ? <p>{ctx.settings.contact.address}</p> : null}
          {ctx.settings.contact.phone ? <p>Tel: {ctx.settings.contact.phone}</p> : null}
        </div>
        <p className="my-1">{line}</p>
        <p className="text-center text-[20px] font-bold">ORDER #{o.number}</p>
        <p className="text-center text-[14px] font-bold uppercase">{o.type.replace("_", " ")}</p>
        <p className="my-1">{line}</p>
        <p>Placed: {formatDate(o.createdAt, true)}</p>
        {o.scheduledFor ? <p className="font-bold">SCHEDULED: {formatDate(o.scheduledFor, true)}</p> : null}
        <p>Status: {o.status.replace(/_/g, " ")}</p>
        <p className="my-1">{line}</p>
        <p className="font-bold">{o.customerName}</p>
        <p>{o.customerPhone}</p>
        {o.address ? <p className="whitespace-pre-wrap">{o.address}</p> : null}
        {o.area ? <p>Area: {o.area}</p> : null}
        {o.tableNumber ? <p className="text-[14px] font-bold">TABLE {o.tableNumber}</p> : null}
        <p className="my-1">{line}</p>
        <table className="w-full">
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id} className="align-top">
                <td className="pe-1 font-bold">{i.quantity}x</td>
                <td className="w-full">
                  <span className="font-bold">{i.name}</span>
                  {i.sizeName ? <span> ({i.sizeName})</span> : null}
                  {i.modifiers.length ? <div className="ps-2">+ {i.modifiers.map((m) => m.name).join(", ")}</div> : null}
                  {i.note ? <div className="ps-2 font-bold">** {i.note}</div> : null}
                </td>
                <td className="ps-1 text-right whitespace-nowrap">{rs(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {o.notes ? (
          <>
            <p className="my-1">{line}</p>
            <p className="font-bold">NOTE: {o.notes}</p>
          </>
        ) : null}
        <p className="my-1">{line}</p>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{rs(o.subtotal)}</span>
        </div>
        {o.deliveryFee ? (
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{rs(o.deliveryFee)}</span>
          </div>
        ) : null}
        {o.discount ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{rs(o.discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-[16px] font-bold">
          <span>TOTAL</span>
          <span>Rs {rs(o.total)}</span>
        </div>
        <p>Payment: {o.paymentMethod === "COD" ? "CASH ON DELIVERY" : o.paymentMethod}</p>
        <p className="my-1">{line}</p>
        <p className="text-center">Thank you for your order!</p>
        {ctx.settings.contact.whatsapp ? <p className="text-center">WhatsApp: {ctx.settings.contact.whatsapp}</p> : null}
      </div>
    </div>
  );
}
