import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PrintButton } from "@/components/admin/ecommerce/print-button";
import { orderLabel } from "@/modules/ecommerce/pricing";
import { formatDate, formatPKR } from "@/lib/utils";

/** Clean invoice / packing slip. Everything outside #invoice is hidden when printing. */
export default async function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireTenantAdmin(), params]);
  const order = await db.order.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { items: true } });
  if (!order) notFound();
  const label = orderLabel(ctx.settings.commerce.orderPrefix, order.number);
  const contact = ctx.settings.contact;

  return (
    <>
      <style>{`@media print { body * { visibility: hidden; } #invoice, #invoice * { visibility: visible; } #invoice { position: absolute; inset: 0; margin: 0; padding: 24px; max-width: none; box-shadow: none; border: 0; } }`}</style>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">Invoice preview</p>
        <PrintButton label="Print invoice" />
      </div>
      <div id="invoice" className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-900 shadow-sm">
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            {ctx.settings.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="mb-2 h-10 w-auto object-contain" />
            ) : null}
            <h1 className="text-xl font-bold">{ctx.tenant.name}</h1>
            <p className="whitespace-pre-line text-slate-600">
              {[contact.address, contact.city].filter(Boolean).join(", ")}
              {contact.phone ? `\n${contact.phone}` : ""}
              {contact.email ? `\n${contact.email}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Invoice / Packing slip</p>
            <p className="text-2xl font-bold">{label}</p>
            <p className="text-slate-600">{formatDate(order.createdAt, true)}</p>
            <p className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{order.status}</p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deliver to</p>
            <p className="mt-1 font-semibold">{order.customerName}</p>
            <p>{order.customerPhone}</p>
            {order.customerEmail ? <p>{order.customerEmail}</p> : null}
            <p className="mt-1 whitespace-pre-line">
              {order.address}
              {"\n"}
              {order.city}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
            <p className="mt-1 font-semibold">Cash on Delivery</p>
            <p>
              Amount to collect: <strong>{formatPKR(order.total)}</strong>
            </p>
            {order.notes ? (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer notes</p>
                <p>{order.notes}</p>
              </>
            ) : null}
            {order.giftMessage ? (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Gift message</p>
                <p className="italic">“{order.giftMessage}”</p>
              </>
            ) : null}
          </div>
        </div>

        <table className="w-full border-t border-slate-200">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2">
                  <p className="font-medium">{i.name}</p>
                  {i.variantName ? <p className="text-xs text-slate-500">{i.variantName}</p> : null}
                </td>
                <td className="py-2 text-right">{formatPKR(i.unitPrice)}</td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right font-medium">{formatPKR(i.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200">
            <tr>
              <td colSpan={3} className="pt-3 text-right text-slate-500">
                Subtotal
              </td>
              <td className="pt-3 text-right">{formatPKR(order.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="py-1 text-right text-slate-500">
                Shipping
              </td>
              <td className="py-1 text-right">{formatPKR(order.shipping)}</td>
            </tr>
            {order.discount ? (
              <tr>
                <td colSpan={3} className="py-1 text-right text-slate-500">
                  Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                </td>
                <td className="py-1 text-right">-{formatPKR(order.discount)}</td>
              </tr>
            ) : null}
            <tr className="text-lg font-bold">
              <td colSpan={3} className="pt-2 text-right">
                Total
              </td>
              <td className="pt-2 text-right">{formatPKR(order.total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          Thank you for shopping with {ctx.tenant.name}. {contact.whatsapp ? `WhatsApp: ${contact.whatsapp}` : contact.phone ? `Phone: ${contact.phone}` : ""}
        </p>
      </div>
    </>
  );
}
