import type { FoodOrder, FoodOrderItem } from "@/generated/prisma/client";
import { parseItemModifiers, parseTimeline, type FoodOrderDto, type FoodOrderItemDto } from "./types";

/** Prisma FoodOrder (+items) → serialisable DTO for client components. */
export function toFoodOrderItemDto(i: FoodOrderItem): FoodOrderItemDto {
  return {
    id: i.id,
    name: i.name,
    sizeName: i.sizeName,
    modifiers: parseItemModifiers(i.modifiers),
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    total: i.total,
    note: i.note,
  };
}

export function toFoodOrderDto(o: FoodOrder & { items: FoodOrderItem[] }): FoodOrderDto {
  return {
    id: o.id,
    number: o.number,
    type: o.type,
    status: o.status,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    address: o.address,
    area: o.area,
    tableNumber: o.tableNumber,
    notes: o.notes,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    discount: o.discount,
    total: o.total,
    paymentMethod: o.paymentMethod,
    scheduledFor: o.scheduledFor ? o.scheduledFor.toISOString() : null,
    estimatedMins: o.estimatedMins,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    timeline: parseTimeline(o.timeline),
    items: o.items.map(toFoodOrderItemDto),
  };
}
