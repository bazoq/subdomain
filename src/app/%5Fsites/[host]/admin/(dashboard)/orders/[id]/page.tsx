import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, MessageCircle, Phone, Printer } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusForm } from "@/components/admin/ecommerce/order-status-form";
import { asTimeline } from "@/modules/ecommerce/mappers";
import { orderToken } from "@/modules/ecommerce/order-token";
import { orderLabel } from "@/modules/ecommerce/pricing";
import { formatDate, formatPKR, whatsappLink } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireTenantAdmin(), params]);
  const order = await db.order.findFirst({
    where: { id, tenantId: ctx.tenant.id },
    include: { items: { include: { product: { select: { slug: true } } } }, prescription: true, customer: { select: { id: true, _count: { select: { orders: true } } } } },
  });
  if (!order) notFound();
  const label = orderLabel(ctx.settings.commerce.orderPrefix, order.number);
  const timeline = asTimeline(order.timeline).reverse();
  const trackingUrl = `https://${ctx.host}/order/${order.number}?t=${orderToken("shop", ctx.tenant.id, order.number)}`;
  const waMsg = `Assalam o Alaikum ${order.customerName}, this is ${ctx.tenant.name} regarding your order ${label} (${formatPKR(order.total)}). Track it here: ${trackingUrl}`;

  return (
    <>
      <PageHeader
        title={`Order ${label}`}
        description={`Placed ${formatDate(order.createdAt, true)} · ${order.paymentMethod}`}
        backHref="/admin/orders"
        actions={
          <>
            <StatusBadge status={order.status} />
            <Link href={`/admin/orders/${order.id}/print`} target="_blank">
              <Button variant="outline">
                <Printer /> Print invoice
              </Button>
            </Link>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-2">Product</th>
                    <th className="px-5 py-2 text-right">Unit</th>
                    <th className="px-5 py-2 text-right">Qty</th>
                    <th className="px-5 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                            {i.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div>
                            {i.product ? (
                              <Link href={`/admin/products/${i.productId}`} className="font-medium text-slate-900 hover:underline">
                                {i.name}
                              </Link>
                            ) : (
                              <p className="font-medium text-slate-900">{i.name}</p>
                            )}
                            {i.variantName ? <p className="text-xs text-slate-500">{i.variantName}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">{formatPKR(i.unitPrice)}</td>
                      <td className="px-5 py-3 text-right">{i.quantity}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatPKR(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="text-sm">
                  <tr>
                    <td colSpan={3} className="px-5 pt-3 text-right text-slate-500">
                      Subtotal
                    </td>
                    <td className="px-5 pt-3 text-right">{formatPKR(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-5 py-1 text-right text-slate-500">
                      Shipping
                    </td>
                    <td className="px-5 py-1 text-right">{formatPKR(order.shipping)}</td>
                  </tr>
                  {order.discount ? (
                    <tr className="text-emerald-700">
                      <td colSpan={3} className="px-5 py-1 text-right">
                        Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                      </td>
                      <td className="px-5 py-1 text-right">-{formatPKR(order.discount)}</td>
                    </tr>
                  ) : null}
                  <tr className="text-base font-bold">
                    <td colSpan={3} className="px-5 py-3 text-right">
                      Total (COD)
                    </td>
                    <td className="px-5 py-3 text-right">{formatPKR(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? <p className="text-sm text-slate-500">No updates yet.</p> : null}
              <ol className="space-y-4">
                {timeline.map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-600" />
                    <div>
                      <StatusBadge status={e.status} />
                      {e.note ? <p className="mt-1 text-slate-700">{e.note}</p> : null}
                      <p className="text-xs text-slate-400">{e.at ? formatDate(e.at, true) : ""}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusForm orderId={order.id} current={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-slate-900">
                {order.customer ? (
                  <Link href={`/admin/customers/${order.customer.id}`} className="hover:underline">
                    {order.customerName}
                  </Link>
                ) : (
                  order.customerName
                )}
                {order.customer && order.customer._count.orders > 1 ? <span className="ml-2 text-xs font-normal text-slate-500">{order.customer._count.orders} orders</span> : null}
              </p>
              <p>{order.customerPhone}</p>
              {order.customerEmail ? <p className="text-slate-600">{order.customerEmail}</p> : null}
              <p className="whitespace-pre-line pt-1 text-slate-700">
                {order.address}
                {"\n"}
                {order.city}
              </p>
              {order.notes ? <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">Note: {order.notes}</p> : null}
              {order.giftMessage ? <p className="rounded-md bg-pink-50 p-2 text-xs italic text-pink-900">Gift message: “{order.giftMessage}”</p> : null}
              {order.ageConfirmed ? <p className="text-xs text-slate-500">Age (18+) confirmed at checkout.</p> : null}
              <div className="flex gap-2 pt-2">
                <a href={`tel:${order.customerPhone}`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50">
                  <Phone className="size-3.5" /> Call
                </a>
                <a href={whatsappLink(order.customerPhone, waMsg)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:brightness-95">
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>

          {order.prescription ? (
            <Card>
              <CardHeader>
                <CardTitle>Prescription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <StatusBadge status={order.prescription.status} />
                  <Link href="/admin/prescriptions" className="text-xs text-brand-600 hover:underline">
                    Manage
                  </Link>
                </div>
                <a href={`/api/media/${order.prescription.mediaId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50">
                  <Download className="size-3.5" /> Download prescription
                </a>
              </CardContent>
            </Card>
          ) : null}

          <p className="break-all text-xs text-slate-400">
            IP {order.ip ?? "—"} · Customer tracking link:{" "}
            <a href={trackingUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
              {trackingUrl}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
