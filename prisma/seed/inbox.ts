/**
 * Inbound sample data for demo tenants: what a real business sees in its admin after a week online —
 * leads, orders, food orders, reservations, job applications, bookings and a couple of legal pages.
 * Every block is idempotent (skipped when the tenant already has rows in that table). Amounts are
 * integer PKR, phones are normalised +92 mobiles, names/cities are Pakistani.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { CategoryKey } from "@/lib/categories";
import { ls, t, type LocalizedString } from "@/lib/i18n";

type Db = PrismaClient | Prisma.TransactionClient;
const J = <T,>(v: T) => v as unknown as Prisma.InputJsonValue;
const daysAgo = (d: number, hour = 11) => new Date(Date.now() - d * 86_400_000 - (24 - hour) * 3_600_000);
const daysAhead = (d: number, hour = 20) => {
  const x = new Date(Date.now() + d * 86_400_000);
  x.setHours(hour, 0, 0, 0);
  return x;
};
const name = (v: unknown) => t(v as LocalizedString, "en");

const PEOPLE = [
  { name: "Ahmed Raza", phone: "+923001112233", email: "ahmed.raza@gmail.com", city: "Lahore", address: "House 12, Street 4, DHA Phase 5" },
  { name: "Fatima Noor", phone: "+923214445566", email: "fatima.noor@outlook.com", city: "Karachi", address: "Flat 302, Clifton Block 2" },
  { name: "Bilal Hussain", phone: "+923337778899", email: "bilal.h@yahoo.com", city: "Islamabad", address: "House 7, Street 22, F-10/2" },
  { name: "Ayesha Khan", phone: "+923451231234", email: "ayesha.khan@gmail.com", city: "Faisalabad", address: "P-45, Peoples Colony No. 1" },
  { name: "Usman Tariq", phone: "+923129876543", email: "usman.tariq@gmail.com", city: "Rawalpindi", address: "House 3, Lane 9, Bahria Town Phase 4" },
  { name: "Sana Javed", phone: "+923045556677", email: "sana.javed@gmail.com", city: "Multan", address: "House 21, Gulgasht Colony" },
];

/* ------------------------------------------------------------------ */
/* leads (every category) + legal pages                                 */
/* ------------------------------------------------------------------ */

type LeadSeed = { formKey: string; subject?: string; message: string; data?: Record<string, unknown>; status?: "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED" };

function leadsFor(key: CategoryKey): LeadSeed[] {
  const contact = (message: string): LeadSeed => ({ formKey: "contact", message });
  switch (key) {
    case "printing":
      return [
        { formKey: "quote", subject: "Business cards 500 pcs", message: "Need 500 matte business cards, double sided, spot UV on logo. Design ready in PDF.", data: { service: "Business Cards", quantity: 500, deadline: "1 week" } },
        { formKey: "quote", subject: "Flex banners for shop opening", message: "3 banners 10x4 ft with eyelets, opening on Saturday.", data: { service: "Banners & Standees", quantity: 3 }, status: "CONTACTED" },
        contact("Do you deliver printed material to Karachi?"),
      ];
    case "law":
      return [
        { formKey: "consultation", subject: "Property dispute – Johar Town", message: "My uncle has occupied our inherited house; need advice on partition suit.", data: { practiceArea: "Property & Civil Litigation", preferredTime: "Evening" } },
        { formKey: "consultation", subject: "Khula case", message: "Looking for a female lawyer for a khula case in Lahore family court.", data: { practiceArea: "Family Law" }, status: "IN_PROGRESS" },
        contact("What are your consultation fees for overseas Pakistanis?"),
      ];
    case "gym":
      return [
        { formKey: "trial", subject: "Free trial", message: "Interested in morning batch, 6–7 am. Weight loss goal.", data: { goal: "Weight loss", preferredTime: "Morning" } },
        { formKey: "trial", subject: "Ladies timing", message: "Do you have separate ladies timings? Want to join with my sister.", data: { goal: "General fitness" }, status: "CONTACTED" },
        contact("Is there a student discount on the quarterly plan?"),
      ];
    case "realestate":
      return [
        { formKey: "property_inquiry", subject: "5 marla house DHA", message: "Is the 5 marla house in DHA Phase 6 still available? Can we visit this weekend?", data: { purpose: "SALE", budget: 35000000 } },
        { formKey: "property_inquiry", subject: "Rental apartment Clifton", message: "Need a 2-bed apartment for rent in Clifton, family, budget 80k.", data: { purpose: "RENT", budget: 80000 }, status: "CONTACTED" },
        contact("Do you deal in Bahria Town Karachi plots?"),
      ];
    case "recruiting":
      return [
        { formKey: "employer_request", subject: "Need 20 welders for Saudi Arabia", message: "Construction company in Dammam needs 20 certified welders, 2-year contract.", data: { company: "Al-Rashid Contracting", positions: 20, country: "Saudi Arabia" } },
        { formKey: "employer_request", subject: "Accountant – Lahore office", message: "Mid-level accountant with QuickBooks experience, salary 80–100k.", data: { company: "Pak Textiles Ltd", positions: 1, country: "Pakistan" }, status: "IN_PROGRESS" },
        contact("What is your processing time for UAE visas?"),
      ];
    case "travel":
      return [
        { formKey: "quote", subject: "Umrah for 4 in Ramadan", message: "Family of 4, 15 days, hotel near Haram. Please share Ramadan packages.", data: { destination: "Umrah", travellers: 4 } },
        contact("Do you arrange Turkey visit visas?"),
        contact("Hunza 5-day trip for a group of 12 students — group discount?"),
      ];
    case "bakery":
      return [
        { formKey: "custom_cake", subject: "3-tier wedding cake", message: "Wedding on the 28th, 3-tier vanilla with fresh flowers, 60 guests.", data: { flavour: "Vanilla", servings: 60, date: "28th" } },
        { formKey: "custom_cake", subject: "Birthday cake – Spiderman", message: "2 kg chocolate cake, Spiderman theme, name 'Hamza', for Friday.", data: { flavour: "Chocolate", weightKg: 2 }, status: "CONTACTED" },
        contact("Do you deliver to Johar Town before 9 am?"),
      ];
    case "medical":
      return [contact("Do you have Insulin Glargine in stock? Need it urgently."), contact("Can I upload a prescription and get delivery today in Gulberg?"), contact("Do you offer monthly refills for blood pressure medicines?")];
    case "pizza":
      return [contact("Do you cater for office parties (40 people)?"), contact("Is the Gulberg branch open till 2 am on weekends?")];
    default:
      return [contact("Do you offer cash on delivery in Peshawar?"), contact("Is there a warranty / exchange policy?"), contact("Bulk order for corporate gifts — 50 pieces, can you quote?")];
  }
}

async function seedLeads(db: Db, tenantId: string, key: CategoryKey) {
  if ((await db.lead.count({ where: { tenantId } })) > 0) return;
  const leads = leadsFor(key);
  await db.lead.createMany({
    data: leads.map((l, i) => {
      const p = PEOPLE[i % PEOPLE.length];
      return {
        tenantId,
        formKey: l.formKey,
        name: p.name,
        phone: p.phone,
        email: p.email,
        subject: l.subject ?? null,
        message: l.message,
        data: J({ city: p.city, ...(l.data ?? {}) }),
        status: l.status ?? "NEW",
        source: i === 0 ? "whatsapp" : "website",
        createdAt: daysAgo(i * 2, 10 + i),
      };
    }),
  });
}

async function seedPages(db: Db, tenantId: string, businessName: string) {
  if ((await db.sitePage.count({ where: { tenantId } })) > 0) return;
  const pages = [
    {
      slug: "privacy-policy",
      title: ls("Privacy Policy", "پرائیویسی پالیسی"),
      content: ls(
        `${businessName} collects only the information needed to serve you: your name, phone number, delivery address and order details. We never sell your data. Phone numbers are used for order confirmation and WhatsApp updates only. You may ask us to delete your data at any time by contacting us.`,
        `${businessName} صرف وہ معلومات جمع کرتا ہے جو آپ کی خدمت کے لیے ضروری ہیں: نام، فون نمبر، پتہ اور آرڈر کی تفصیلات۔ ہم آپ کا ڈیٹا کبھی فروخت نہیں کرتے۔`,
      ),
    },
    {
      slug: "terms",
      title: ls("Terms & Conditions", "شرائط و ضوابط"),
      content: ls(
        `All prices are in Pakistani Rupees (PKR) and include applicable taxes unless stated otherwise. Cash on delivery orders must be paid in full to the rider. Exchanges are accepted within 7 days for unused items with original packaging. Delivery times are estimates and may vary by city.`,
        `تمام قیمتیں پاکستانی روپے میں ہیں۔ کیش آن ڈیلیوری آرڈرز کی مکمل ادائیگی رائیڈر کو کی جائے۔ غیر استعمال شدہ اشیاء 7 دن کے اندر تبدیل کی جا سکتی ہیں۔`,
      ),
    },
  ];
  await db.sitePage.createMany({
    data: pages.map((p, i) => ({ tenantId, slug: p.slug, title: J(p.title), content: J(p.content), enabled: true, showInNav: false, sortOrder: i, seo: J({}) })),
  });
}

/* ------------------------------------------------------------------ */
/* ecommerce: customers + orders                                        */
/* ------------------------------------------------------------------ */

async function seedShopOrders(db: Db, tenantId: string) {
  if ((await db.order.count({ where: { tenantId } })) > 0) return;
  const products = await db.product.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" }, take: 6, include: { variants: { where: { isActive: true }, take: 1 } } });
  if (products.length === 0) return;

  const orders: { status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED"; person: number; items: number[]; daysAgo: number; coupon?: string; note?: string }[] = [
    { status: "DELIVERED", person: 0, items: [0, 1], daysAgo: 9, coupon: "WELCOME10" },
    { status: "SHIPPED", person: 1, items: [2], daysAgo: 3 },
    { status: "CONFIRMED", person: 2, items: [3, 4], daysAgo: 1, note: "Please call before delivery." },
    { status: "PENDING", person: 3, items: [1], daysAgo: 0 },
  ];
  const flow: Record<string, string[]> = { PENDING: ["PENDING"], CONFIRMED: ["PENDING", "CONFIRMED"], SHIPPED: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"], DELIVERED: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] };

  for (const [i, o] of orders.entries()) {
    const p = PEOPLE[o.person];
    const customer = await db.customer.upsert({
      where: { tenantId_phone: { tenantId, phone: p.phone } },
      create: { tenantId, phone: p.phone, name: p.name, email: p.email, address: p.address, city: p.city },
      update: {},
    });
    const lines = o.items.map((idx) => products[idx % products.length]).map((prod, k) => {
      const variant = prod.variants[0];
      const unitPrice = variant?.price ?? prod.price;
      const quantity = k === 0 ? 1 : 2;
      return { prod, variant, unitPrice, quantity, total: unitPrice * quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const shipping = subtotal >= 5000 ? 0 : 250;
    const discount = o.coupon ? Math.round(subtotal * 0.1) : 0;
    const created = daysAgo(o.daysAgo, 13 + i);
    const timeline = flow[o.status].map((status, k) => ({ status, at: new Date(created.getTime() + k * 6 * 3_600_000).toISOString(), note: k === 0 ? "Order placed on website" : undefined }));
    await db.order.create({
      data: {
        tenantId,
        number: 1000 + i + 1,
        customerId: customer.id,
        customerName: p.name,
        customerPhone: p.phone,
        customerEmail: p.email,
        address: p.address,
        city: p.city,
        province: p.city === "Karachi" ? "Sindh" : p.city === "Islamabad" ? "Islamabad Capital Territory" : "Punjab",
        notes: o.note ?? null,
        subtotal,
        shipping,
        discount,
        total: subtotal + shipping - discount,
        couponCode: o.coupon ?? null,
        paymentMethod: "COD",
        status: o.status,
        timeline: J(timeline),
        createdAt: created,
        items: {
          create: lines.map((l) => ({
            tenantId,
            productId: l.prod.id,
            variantId: l.variant?.id ?? null,
            name: name(l.prod.name),
            variantName: l.variant?.name ?? null,
            imageUrl: l.prod.images[0] ?? null,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            total: l.total,
          })),
        },
      },
    });
  }
}

/* ------------------------------------------------------------------ */
/* restaurant: food orders + reservations                               */
/* ------------------------------------------------------------------ */

async function seedFoodOrders(db: Db, tenantId: string, dineIn: boolean) {
  if ((await db.foodOrder.count({ where: { tenantId } })) > 0) return;
  const items = await db.menuItem.findMany({ where: { tenantId, isAvailable: true }, orderBy: { sortOrder: "asc" }, take: 6 });
  if (items.length === 0) return;
  const zone = await db.deliveryZone.findFirst({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" } });

  const orders: { status: "NEW" | "ACCEPTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "COMPLETED"; type: "DELIVERY" | "PICKUP" | "DINE_IN"; person: number; items: number[]; minutesAgo: number; table?: string }[] = [
    { status: "COMPLETED", type: "DELIVERY", person: 0, items: [0, 1], minutesAgo: 26 * 60 },
    { status: "COMPLETED", type: "PICKUP", person: 1, items: [2], minutesAgo: 22 * 60 },
    { status: "OUT_FOR_DELIVERY", type: "DELIVERY", person: 2, items: [3, 0], minutesAgo: 55 },
    { status: "PREPARING", type: dineIn ? "DINE_IN" : "PICKUP", person: 3, items: [1, 4], minutesAgo: 18, table: "T4" },
    { status: "NEW", type: "DELIVERY", person: 4, items: [2, 5], minutesAgo: 4 },
  ];
  const flow: Record<string, string[]> = { NEW: ["NEW"], ACCEPTED: ["NEW", "ACCEPTED"], PREPARING: ["NEW", "ACCEPTED", "PREPARING"], OUT_FOR_DELIVERY: ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"], COMPLETED: ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED"] };

  for (const [i, o] of orders.entries()) {
    const p = PEOPLE[o.person];
    const customer = await db.customer.upsert({
      where: { tenantId_phone: { tenantId, phone: p.phone } },
      create: { tenantId, phone: p.phone, name: p.name, address: p.address, city: p.city },
      update: {},
    });
    const lines = o.items.map((idx) => items[idx % items.length]).map((it, k) => {
      const sizes = Array.isArray(it.sizes) ? (it.sizes as { name?: string; price?: number }[]) : [];
      const size = sizes[Math.min(1, Math.max(0, sizes.length - 1))];
      const unitPrice = size?.price ?? it.price;
      const quantity = k === 0 ? 1 : 2;
      return { it, sizeName: size?.name ?? null, unitPrice, quantity, total: unitPrice * quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const deliveryFee = o.type === "DELIVERY" ? (zone?.fee ?? 100) : 0;
    const created = new Date(Date.now() - o.minutesAgo * 60_000);
    const timeline = flow[o.status].map((status, k) => ({ status, at: new Date(created.getTime() + k * 6 * 60_000).toISOString() }));
    await db.foodOrder.create({
      data: {
        tenantId,
        number: 500 + i + 1,
        customerId: customer.id,
        type: o.type,
        customerName: p.name,
        customerPhone: p.phone,
        address: o.type === "DELIVERY" ? `${p.address}, ${p.city}` : null,
        area: o.type === "DELIVERY" ? (zone?.name ?? null) : null,
        tableNumber: o.type === "DINE_IN" ? (o.table ?? null) : null,
        notes: i === 4 ? "Extra spicy, no onions." : null,
        subtotal,
        deliveryFee,
        discount: 0,
        total: subtotal + deliveryFee,
        paymentMethod: "COD",
        status: o.status,
        timeline: J(timeline),
        estimatedMins: o.type === "DELIVERY" ? (zone?.etaMins ?? 40) : 20,
        createdAt: created,
        items: {
          create: lines.map((l) => ({
            tenantId,
            menuItemId: l.it.id,
            name: name(l.it.name),
            sizeName: l.sizeName,
            modifiers: J([]),
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            total: l.total,
          })),
        },
      },
    });
  }
}

async function seedReservations(db: Db, tenantId: string) {
  if ((await db.reservation.count({ where: { tenantId } })) > 0) return;
  await db.reservation.createMany({
    data: [
      { tenantId, name: PEOPLE[5].name, phone: PEOPLE[5].phone, guests: 4, date: daysAhead(1), time: "20:00", status: "CONFIRMED", notes: "Window table if possible." },
      { tenantId, name: PEOPLE[2].name, phone: PEOPLE[2].phone, guests: 8, date: daysAhead(3), time: "21:00", status: "PENDING", notes: "Birthday — can you arrange a small cake?" },
      { tenantId, name: PEOPLE[0].name, phone: PEOPLE[0].phone, guests: 2, date: daysAgo(4), time: "19:30", status: "SEATED" },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* recruiting: applications · travel: bookings                          */
/* ------------------------------------------------------------------ */

async function seedApplications(db: Db, tenantId: string) {
  if ((await db.application.count({ where: { tenantId } })) > 0) return;
  const jobs = await db.job.findMany({ where: { tenantId, isActive: true }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true } });
  if (jobs.length === 0) return;
  const apps: { job: number; person: number; status: "RECEIVED" | "SHORTLISTED" | "INTERVIEW" | "REJECTED"; experience: string; cover: string; days: number }[] = [
    { job: 0, person: 0, status: "INTERVIEW", experience: "5 years", cover: "Worked 5 years in Dubai on similar projects, valid passport, available immediately.", days: 8 },
    { job: 0, person: 2, status: "SHORTLISTED", experience: "3 years", cover: "Diploma holder with 3 years local experience, willing to relocate.", days: 5 },
    { job: 1, person: 3, status: "RECEIVED", experience: "2 years", cover: "Fresh graduate with 2 years experience, strong English communication.", days: 2 },
    { job: 2, person: 4, status: "RECEIVED", experience: "7 years", cover: "Senior professional seeking overseas opportunity; references available.", days: 1 },
    { job: 1, person: 5, status: "REJECTED", experience: "1 year", cover: "Interested in this role; can join within a month.", days: 12 },
  ];
  await db.application.createMany({
    data: apps.map((a) => {
      const p = PEOPLE[a.person];
      return { tenantId, jobId: jobs[a.job % jobs.length].id, name: p.name, phone: p.phone, email: p.email, city: p.city, coverLetter: a.cover, experience: a.experience, data: J({ education: "Intermediate / Diploma", passport: "Valid" }), status: a.status, createdAt: daysAgo(a.days) };
    }),
  });
}

async function seedBookings(db: Db, tenantId: string) {
  if ((await db.booking.count({ where: { tenantId } })) > 0) return;
  const packages = await db.travelPackage.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" }, take: 3, select: { id: true } });
  if (packages.length === 0) return;
  await db.booking.createMany({
    data: [
      { tenantId, packageId: packages[0].id, name: PEOPLE[0].name, phone: PEOPLE[0].phone, email: PEOPLE[0].email, travellers: 4, date: daysAhead(45), message: "Family of 4, two rooms please.", status: "CONFIRMED", createdAt: daysAgo(6) },
      { tenantId, packageId: packages[1 % packages.length].id, name: PEOPLE[1].name, phone: PEOPLE[1].phone, email: PEOPLE[1].email, travellers: 2, date: daysAhead(30), message: "Honeymoon — any upgrade options?", status: "CONTACTED", createdAt: daysAgo(2) },
      { tenantId, packageId: packages[2 % packages.length].id, name: PEOPLE[4].name, phone: PEOPLE[4].phone, travellers: 12, date: daysAhead(20), message: "Group of 12 students, need group rate.", status: "NEW", createdAt: daysAgo(0) },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* entry point                                                          */
/* ------------------------------------------------------------------ */

const RESTAURANT: ReadonlySet<CategoryKey> = new Set<CategoryKey>(["pizza", "bakery"]);
const ECOMMERCE: ReadonlySet<CategoryKey> = new Set<CategoryKey>(["kitchen", "clothing", "shoes", "gifts", "blades", "sports", "electronics", "medical"]);

/** Inbound sample data for one tenant (idempotent per table). */
export async function seedInboxData(db: Db, tenantId: string, categoryKey: CategoryKey, businessName: string, opts: { dineIn?: boolean } = {}): Promise<void> {
  await seedLeads(db, tenantId, categoryKey);
  await seedPages(db, tenantId, businessName);
  if (ECOMMERCE.has(categoryKey)) await seedShopOrders(db, tenantId);
  if (RESTAURANT.has(categoryKey)) {
    await seedFoodOrders(db, tenantId, opts.dineIn ?? false);
    await seedReservations(db, tenantId);
  }
  if (categoryKey === "recruiting") await seedApplications(db, tenantId);
  if (categoryKey === "travel") await seedBookings(db, tenantId);
}
