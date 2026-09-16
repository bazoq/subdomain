import type { NavGroup } from "@/components/admin/admin-shell";
import type { BusinessCategory, ModuleKey } from "@/lib/categories";

/** Sidebar navigation for a tenant admin, derived from the category's modules. */
export function tenantNav(category: BusinessCategory, counts: Partial<Record<string, number>> = {}): NavGroup[] {
  const has = (m: ModuleKey) => category.modules.includes(m);
  const groups: NavGroup[] = [
    {
      items: [{ label: "Dashboard", href: "/admin", icon: "LayoutDashboard" }],
    },
  ];

  const business: NavGroup = { title: "Business", items: [] };
  if (has("ecommerce")) {
    business.items.push(
      { label: "Orders", href: "/admin/orders", icon: "ShoppingBag", badge: counts.orders },
      {
        label: "Products",
        href: "/admin/products",
        icon: "Package",
        children: [
          { label: "All products", href: "/admin/products" },
          { label: "Categories", href: "/admin/products/categories" },
        ],
      },
      { label: "Customers", href: "/admin/customers", icon: "Users" },
      { label: "Coupons", href: "/admin/coupons", icon: "TicketPercent" },
      { label: "Shipping", href: "/admin/shipping", icon: "Truck" },
    );
  }
  if (has("medical")) business.items.push({ label: "Prescriptions", href: "/admin/prescriptions", icon: "FileHeart", badge: counts.prescriptions });
  if (has("restaurant")) {
    business.items.push(
      { label: "Live orders", href: "/admin/kitchen", icon: "ChefHat", badge: counts.foodOrders },
      { label: "Order history", href: "/admin/food-orders", icon: "History" },
      {
        label: "Menu",
        href: "/admin/menu",
        icon: "UtensilsCrossed",
        children: [
          { label: "Items", href: "/admin/menu" },
          { label: "Categories", href: "/admin/menu/categories" },
          { label: "Add-ons & modifiers", href: "/admin/menu/modifiers" },
        ],
      },
      { label: "Delivery zones", href: "/admin/delivery-zones", icon: "MapPinned" },
      { label: "Reservations", href: "/admin/reservations", icon: "CalendarCheck", badge: counts.reservations },
      { label: "Customers", href: "/admin/customers", icon: "Users" },
    );
  }
  if (has("recruiting")) {
    business.items.push(
      { label: "Jobs", href: "/admin/jobs", icon: "Briefcase" },
      { label: "Applications", href: "/admin/applications", icon: "FileUser", badge: counts.applications },
    );
  }
  if (has("travel")) {
    business.items.push(
      { label: "Packages", href: "/admin/packages", icon: "Plane" },
      { label: "Bookings", href: "/admin/bookings", icon: "CalendarCheck", badge: counts.bookings },
    );
  }
  if (has("realestate")) business.items.push({ label: "Properties", href: "/admin/properties", icon: "Building2" });
  if (has("gym")) {
    business.items.push(
      { label: "Membership plans", href: "/admin/plans", icon: "CreditCard" },
      { label: "Class schedule", href: "/admin/classes", icon: "CalendarDays" },
    );
  }
  if (has("services")) {
    const label =
      category.key === "law" ? "Practice areas" : category.key === "printing" ? "Printing services" : category.key === "travel" ? "Visa & other services" : "Services";
    business.items.push({ label, href: "/admin/services", icon: "Layers" });
  }
  if (has("team")) {
    const label = category.key === "law" ? "Attorneys" : category.key === "gym" ? "Trainers" : category.key === "realestate" ? "Agents" : "Team";
    business.items.push({ label, href: "/admin/team", icon: "UserRound" });
  }
  business.items.push({ label: "Leads & messages", href: "/admin/leads", icon: "Inbox", badge: counts.leads });
  groups.push(business);

  groups.push({
    title: "Website",
    items: [
      { label: "Page sections", href: "/admin/content", icon: "LayoutTemplate" },
      { label: "Pages", href: "/admin/pages", icon: "FileText" },
      { label: "Testimonials", href: "/admin/testimonials", icon: "MessageSquareQuote" },
      { label: "FAQ", href: "/admin/faq", icon: "CircleHelp" },
      { label: "Gallery", href: "/admin/gallery", icon: "Images" },
      { label: "Blog / news", href: "/admin/posts", icon: "Newspaper" },
      { label: "Media library", href: "/admin/media", icon: "FolderOpen" },
    ],
  });

  groups.push({
    title: "Settings",
    items: [
      { label: "Settings", href: "/admin/settings", icon: "Settings" },
      { label: "Users", href: "/admin/users", icon: "ShieldCheck" },
      { label: "Activity log", href: "/admin/activity", icon: "ScrollText" },
    ],
  });
  return groups;
}

export const superNav: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/super", icon: "LayoutDashboard" }] },
  {
    title: "Platform",
    items: [
      { label: "Websites (tenants)", href: "/super/tenants", icon: "Globe" },
      { label: "Templates", href: "/super/templates", icon: "LayoutTemplate" },
      { label: "Blog", href: "/super/blog", icon: "Newspaper" },
      { label: "Leads", href: "/super/leads", icon: "Inbox" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Super users", href: "/super/users", icon: "ShieldCheck" },
      { label: "Audit log", href: "/super/audit", icon: "ScrollText" },
    ],
  },
];
