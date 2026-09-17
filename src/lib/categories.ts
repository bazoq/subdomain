/**
 * Business categories supported by the platform. Each category decides which
 * modules a tenant gets (ecommerce, restaurant, jobs ...), the admin navigation,
 * and which template ids belong to it.
 */
export type ModuleKey =
  | "ecommerce"
  | "restaurant"
  | "medical"
  | "recruiting"
  | "travel"
  | "realestate"
  | "gym"
  | "law"
  | "printing"
  | "services"
  | "team"
  | "testimonials"
  | "faq"
  | "gallery"
  | "posts"
  | "leads";

export type CategoryKey =
  | "kitchen"
  | "printing"
  | "clothing"
  | "shoes"
  | "gifts"
  | "blades"
  | "recruiting"
  | "travel"
  | "pizza"
  | "sports"
  | "gym"
  | "bakery"
  | "law"
  | "electronics"
  | "medical"
  | "realestate";

export interface BusinessCategory {
  key: CategoryKey;
  name: string;
  nameUr: string;
  plural: string;
  description: string;
  templateCount: number;
  /** numeric series for template codes: kitchen 100 => codes 101..104 */
  series: number;
  modules: ModuleKey[];
  /** primary commercial flow used on the super site and in blogs */
  kind: "ecommerce" | "restaurant" | "service" | "listing";
  icon: string; // lucide icon name
}

const shared: ModuleKey[] = ["testimonials", "faq", "gallery", "leads", "posts"];

export const CATEGORIES: BusinessCategory[] = [
  { key: "kitchen", name: "Kitchen Accessories", nameUr: "کچن کے لوازمات", plural: "Kitchen accessory stores", description: "Cookware, crockery, appliances and kitchen tools sold online with cash on delivery.", templateCount: 4, series: 100, kind: "ecommerce", modules: ["ecommerce", ...shared], icon: "CookingPot" },
  { key: "printing", name: "Printing Shop", nameUr: "پرنٹنگ شاپ", plural: "Printing shops", description: "Business cards, flyers, banners, packaging and custom printing with online quotes and file upload.", templateCount: 4, series: 200, kind: "service", modules: ["printing", "services", ...shared], icon: "Printer" },
  { key: "clothing", name: "Clothing Brand", nameUr: "کپڑوں کا برانڈ", plural: "Clothing brands", description: "Lawn, pret, unstitched, menswear and kids fashion with size and colour variants.", templateCount: 4, series: 300, kind: "ecommerce", modules: ["ecommerce", ...shared], icon: "Shirt" },
  { key: "shoes", name: "Shoes Brand", nameUr: "جوتوں کا برانڈ", plural: "Shoe brands", description: "Footwear stores with size charts, variants and cash on delivery nationwide.", templateCount: 4, series: 400, kind: "ecommerce", modules: ["ecommerce", ...shared], icon: "Footprints" },
  { key: "gifts", name: "Gift Shop", nameUr: "گفٹ شاپ", plural: "Gift shops", description: "Gift boxes, flowers, personalised items with gift messages and occasion-based browsing.", templateCount: 4, series: 500, kind: "ecommerce", modules: ["ecommerce", ...shared], icon: "Gift" },
  { key: "blades", name: "Swords & Knives", nameUr: "تلواریں اور چاقو", plural: "Sword & knife makers", description: "Handcrafted blades, Damascus steel, custom orders and export-ready catalogues.", templateCount: 4, series: 600, kind: "ecommerce", modules: ["ecommerce", ...shared], icon: "Sword" },
  { key: "recruiting", name: "Recruiting Agency", nameUr: "ریکروٹنگ ایجنسی", plural: "Recruiting agencies", description: "Job boards, overseas employment, CV submission, employer requests and candidate pipeline.", templateCount: 10, series: 700, kind: "listing", modules: ["recruiting", "services", "team", ...shared], icon: "Briefcase" },
  { key: "travel", name: "Travel Agency", nameUr: "ٹریول ایجنسی", plural: "Travel agencies", description: "Umrah, Hajj, northern-areas tours, visa services, ticketing and package bookings.", templateCount: 10, series: 800, kind: "listing", modules: ["travel", "services", "team", ...shared], icon: "Plane" },
  { key: "pizza", name: "Pizza Shop", nameUr: "پیزا شاپ", plural: "Pizza shops", description: "Online ordering with sizes, toppings, deals, delivery zones and a live kitchen order board.", templateCount: 10, series: 900, kind: "restaurant", modules: ["restaurant", ...shared], icon: "Pizza" },
  { key: "sports", name: "Sports Store", nameUr: "اسپورٹس اسٹور", plural: "Sports stores", description: "Cricket, football, fitness gear and sportswear with a full online store.", templateCount: 5, series: 1000, kind: "ecommerce", modules: ["ecommerce", ...shared], icon: "Trophy" },
  { key: "gym", name: "Gym & Fitness", nameUr: "جم اور فٹنس", plural: "Gyms", description: "Membership plans, class timetables, trainers, transformations and trial bookings.", templateCount: 5, series: 1100, kind: "service", modules: ["gym", "team", "services", ...shared], icon: "Dumbbell" },
  { key: "bakery", name: "Bakery", nameUr: "بیکری", plural: "Bakeries", description: "Cakes, pastries and breads with online ordering, custom cake requests and pickup slots.", templateCount: 5, series: 1200, kind: "restaurant", modules: ["restaurant", ...shared], icon: "Cake" },
  { key: "law", name: "Law Firm", nameUr: "لاء فرم", plural: "Law firms", description: "Practice areas, attorneys, case consultations and client intake for firms and advocates.", templateCount: 6, series: 1300, kind: "service", modules: ["law", "services", "team", ...shared], icon: "Scale" },
  { key: "electronics", name: "Electronics Store", nameUr: "الیکٹرانکس اسٹور", plural: "Electronics stores", description: "Mobiles, laptops, appliances with specs, warranty info and cash on delivery.", templateCount: 3, series: 1400, kind: "ecommerce", modules: ["ecommerce", ...shared], icon: "Smartphone" },
  { key: "medical", name: "Medical Store", nameUr: "میڈیکل اسٹور", plural: "Medical stores / pharmacies", description: "Online pharmacy with prescription upload, generic search, and home delivery.", templateCount: 3, series: 1500, kind: "ecommerce", modules: ["ecommerce", "medical", ...shared], icon: "Pill" },
  { key: "realestate", name: "Real Estate Agent", nameUr: "رئیل اسٹیٹ ایجنٹ", plural: "Real estate agents", description: "Property listings for sale and rent, plots, filters by area and marla, agent profiles.", templateCount: 3, series: 1600, kind: "listing", modules: ["realestate", "team", "services", ...shared], icon: "Building2" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<CategoryKey, BusinessCategory>;

export function getCategory(key: string): BusinessCategory | undefined {
  return CATEGORY_MAP[key as CategoryKey];
}

export function categoryHas(key: string, mod: ModuleKey) {
  return getCategory(key)?.modules.includes(mod) ?? false;
}

/** Numeric template code, e.g. kitchen-01 -> 101, sports-03 -> 1003 */
export function templateCode(id: string): number {
  const [cat, nn] = id.split("-");
  const c = getCategory(cat);
  return (c?.series ?? 0) + Number(nn);
}

export const TOTAL_TEMPLATES = CATEGORIES.reduce((n, c) => n + c.templateCount, 0);
