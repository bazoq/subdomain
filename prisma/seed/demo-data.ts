/**
 * Realistic Pakistani sample data for demo tenants, per business category.
 * `seedCategoryData` is idempotent: each block is skipped when the tenant
 * already has rows in that table. Images are Unsplash URLs (no uploads).
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { CategoryKey } from "@/lib/categories";
import { ls, type LocalizedString } from "@/lib/i18n";

type Db = PrismaClient | Prisma.TransactionClient;
const J = <T,>(v: T) => v as unknown as Prisma.InputJsonValue;
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

/* ------------------------------------------------------------------ */
/* image pools                                                          */
/* ------------------------------------------------------------------ */
const IMG = {
  pizza: ["1513104890138-7c749659a591", "1565299624946-b28f40a0ae38", "1574071318508-1cdbab80d002", "1571997478779-2adcbbe9ab2f", "1548369937-47519962c11a", "1594007654729-407eedc4be65"],
  bakery: ["1578985545062-69928b1d9587", "1509440159596-0249088772ff", "1486427944299-d1955d23e34d", "1558961363-fa8fdf82db35", "1587668178277-295251f900ce", "1555507036-ab1f4038808a"],
  clothing: ["1489987707025-afc232f7ea0f", "1521572163474-6864f9cf17ab", "1515886657613-9f3515b0c78f", "1434389677669-e08b4cac3105", "1445205170230-053b83016050", "1539533018447-63fcce2678e3"],
  shoes: ["1542291026-7eec264c27ff", "1549298916-b41d501d3772", "1600185365926-3a2ce3cdb9eb", "1595950653106-6c9ebd614d3a", "1560769629-975ec94e6a86", "1608231387042-66d1773070a5"],
  kitchen: ["1556911220-bff31c812dba", "1585515320310-259814833e62", "1556910103-1c02745aae4d", "1495195134817-aeb325a55b65", "1600585152220-90363fe7e115", "1590794056226-79ef3a8147e1"],
  electronics: ["1511707171634-5f897ff02aa9", "1496181133206-80ce9b88a853", "1505740420928-5e560c06d30e", "1523275335684-37898b6baf30", "1546868871-7041f2a55e12", "1593642632823-8f785ba67e45"],
  sports: ["1531415074968-036ba1b575da", "1579952363873-27f3bade9f55", "1461896836934-ffe607ba8211", "1517649763962-0c623066013b", "1571019613454-1cb2f99b2d8b", "1534438327276-14e5300c3a48"],
  gifts: ["1513201099705-a9746e1e201f", "1549465220-1a8b9238cd48", "1512909006721-3d6018887383", "1607344645866-009c320b63e0", "1490750967868-88aa4486c946", "1544816155-12df9643f363"],
  blades: ["1593618998160-e34014e67546", "1566454419580-1c9d2e0e7d78", "1616628188859-7a11abb6fcc9", "1544233726-9f1d2b27be8b", "1591195853828-11db59a44f6b", "1590779033100-9f60a05a013d"],
  medical: ["1584308666744-24d5c474f2ae", "1471864190281-a93a3070b6de", "1587854692152-cbe660dbde88", "1576602976047-174e57a47881", "1550572017-edd951b55104", "1628771065518-0d82f1938462"],
  office: ["1521791136064-7986c2920216", "1497215728101-856f4ea42174", "1497366216548-37526070297c", "1552664730-d307ca884978", "1454165804606-c3d57bc86b40", "1556761175-b413da4baf72"],
  travel: ["1591604129939-f1efa4d9f7fa", "1589553416260-f586c8f1514f", "1464822759023-fed622ff2c3b", "1506905925346-21bda4d32df4", "1512453979798-5ea266f8880c", "1596422846543-75c6fc197f07", "1469854523086-cc02fe5d8800", "1488646953014-85cb44e25828"],
  realestate: ["1564013799919-ab600027ffc6", "1568605114967-8130f3a36994", "1570129477492-45c003edd2be", "1580587771525-78b9dba3b914", "1512917774080-9991f1c4c750", "1502672260266-1c1ef2d93688", "1522708323590-d24dbb6b0267", "1600596542815-ffad4c1539a9", "1600607687939-ce8a6c25118c", "1600585154340-be6161a56a0c"],
  gym: ["1534438327276-14e5300c3a48", "1571019613454-1cb2f99b2d8b", "1517836357463-d25dfeac3438", "1549060279-7e168fcee0c2", "1571902943202-507ec2618e8f", "1540497077202-7c8a3999166f"],
  law: ["1589829545856-d10d557cf95f", "1505664194779-8beaceb93744", "1521791055366-0d553872125f", "1450101499163-c8848c66ca85", "1479142506502-19b3a3b7ff33", "1436450412740-6b988f486c6b"],
  printing: ["1586953208448-b95a79798f07", "1497366216548-37526070297c", "1562654501-a0ccc0fc3fb1", "1572044162444-ad60f2d9d4a9", "1606836576983-8b458e75221d", "1503694978374-8a2fa686963a"],
  people: ["1507003211169-0a1dd7228f2d", "1500648767791-00dcc994a43e", "1494790108377-be9c29b29330", "1573496359142-b8d87734a5a2", "1472099645785-5658abf4ff4e", "1438761681033-6461ffad8d80", "1519085360753-af0119f7cbe7", "1560250097-0b93528c311a"],
};

/* ------------------------------------------------------------------ */
/* ecommerce                                                            */
/* ------------------------------------------------------------------ */

type ProductSeed = {
  name: string;
  ur?: string;
  price: number;
  compare?: number;
  cat: number; // index into categories
  img: number; // index into image pool
  tags?: string[];
  attributes?: Record<string, unknown>;
  variants?: { options: Record<string, string>; price?: number; stock?: number }[];
  medical?: { requiresPrescription: boolean; genericName: string; manufacturer: string; dosageForm: string; strength: string };
  featured?: boolean;
};

type EcommerceSeed = { categories: [string, string][]; pool: string[]; products: ProductSeed[] };

const sizes = ["S", "M", "L", "XL"];
const colours = ["Black", "Navy", "Maroon"];
const clothingVariants = () => sizes.flatMap((s) => colours.map((c) => ({ options: { Size: s, Color: c }, stock: 8 })));
const shoeVariants = (extra = 0) => [39, 40, 41, 42, 43, 44, 45].map((n) => ({ options: { Size: String(n) }, stock: n >= 41 && n <= 43 ? 12 : 5, ...(n >= 44 ? { price: extra } : {}) }));

const ECOM: Partial<Record<CategoryKey, EcommerceSeed>> = {
  kitchen: {
    categories: [["Cookware|برتن", "cookware"], ["Kitchen Tools|کچن ٹولز", "tools"], ["Appliances|آلات", "appliances"]],
    pool: IMG.kitchen,
    products: [
      { name: "Non-Stick Frying Pan 28cm", ur: "نان اسٹک فرائنگ پین", price: 2450, compare: 2990, cat: 0, img: 0, tags: ["bestseller"], featured: true, attributes: { brand: "Prestige", material: "Aluminium, non-stick coating" } },
      { name: "Pressure Cooker 7 Litre", ur: "پریشر ککر 7 لیٹر", price: 6800, compare: 7500, cat: 0, img: 1, attributes: { brand: "Sonex", material: "Aluminium" } },
      { name: "Karahi Set (3 pcs)", ur: "کڑاہی سیٹ", price: 5200, cat: 0, img: 2, attributes: { brand: "Chef", material: "Stainless steel" } },
      { name: "Stainless Steel Degchi 5 Ltr", ur: "اسٹیل دیگچی", price: 3300, cat: 0, img: 3 },
      { name: "Chef Knife Set (5 pcs)", ur: "شیف چاقو سیٹ", price: 3900, compare: 4500, cat: 1, img: 4, featured: true },
      { name: "Wooden Chopping Board", ur: "لکڑی کا چاپنگ بورڈ", price: 1250, cat: 1, img: 5 },
      { name: "Silicone Spatula Set", ur: "سلیکون اسپیچولا سیٹ", price: 950, cat: 1, img: 0 },
      { name: "Roti Maker Tawa", ur: "روٹی تَوا", price: 1800, cat: 1, img: 1, tags: ["new"] },
      { name: "Electric Kettle 1.8L", ur: "الیکٹرک کیتلی", price: 4200, compare: 4800, cat: 2, img: 2, featured: true, attributes: { brand: "Westpoint", warranty: "1 year" } },
      { name: "Hand Blender 400W", ur: "ہینڈ بلینڈر", price: 5600, cat: 2, img: 3, attributes: { brand: "Anex", warranty: "1 year" } },
      { name: "Sandwich Maker", ur: "سینڈوچ میکر", price: 3800, cat: 2, img: 4 },
      { name: "Air Fryer 5.5L Digital", ur: "ایئر فرائر", price: 18500, compare: 21000, cat: 2, img: 5, tags: ["bestseller"], attributes: { brand: "Dawlance", warranty: "2 years" } },
    ],
  },
  clothing: {
    categories: [["Women's Lawn|خواتین لان", "womens-lawn"], ["Men's Kurta & Shalwar|مردانہ کرتا", "mens"], ["Kids|بچے", "kids"]],
    pool: IMG.clothing,
    products: [
      { name: "3-Piece Printed Lawn Suit – Gulbahar", ur: "3 پیس پرنٹڈ لان سوٹ", price: 4850, compare: 5500, cat: 0, img: 0, tags: ["bestseller"], featured: true, variants: [{ options: { Type: "Unstitched" } }, { options: { Type: "Stitched M" } }, { options: { Type: "Stitched L" } }] },
      { name: "Embroidered Chiffon Dupatta Suit", ur: "کڑھائی شفون سوٹ", price: 7900, cat: 0, img: 1, featured: true },
      { name: "Pret Kurti – Sky Blue", ur: "پریٹ کرتی", price: 2750, cat: 0, img: 2, variants: clothingVariants() },
      { name: "Cotton Trouser – White", ur: "کاٹن ٹراؤزر", price: 1650, cat: 0, img: 3, variants: sizes.map((s) => ({ options: { Size: s }, stock: 10 })) },
      { name: "Men's Wash & Wear Kurta – Off White", ur: "مردانہ کرتا", price: 3200, compare: 3800, cat: 1, img: 4, featured: true, variants: clothingVariants() },
      { name: "Kameez Shalwar Boski – Black", ur: "بوسکی کمیض شلوار", price: 5500, cat: 1, img: 5, variants: sizes.map((s) => ({ options: { Size: s }, stock: 6 })) },
      { name: "Waistcoat – Charcoal", ur: "واسکٹ", price: 4200, cat: 1, img: 0, variants: sizes.map((s) => ({ options: { Size: s }, stock: 4 })) },
      { name: "Men's Polo Shirt", ur: "پولو شرٹ", price: 1950, cat: 1, img: 1, tags: ["new"], variants: clothingVariants() },
      { name: "Girls Frock – Pink Floral", ur: "بچیوں کا فراک", price: 2400, cat: 2, img: 2, variants: ["2-3Y", "4-5Y", "6-7Y"].map((s) => ({ options: { Age: s }, stock: 8 })) },
      { name: "Boys Kurta Shalwar – Blue", ur: "لڑکوں کا کرتا شلوار", price: 2100, cat: 2, img: 3, variants: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"].map((s) => ({ options: { Age: s }, stock: 8 })) },
      { name: "Kids Hoodie", ur: "بچوں کی ہوڈی", price: 1750, cat: 2, img: 4 },
      { name: "Winter Shawl – Kashmiri", ur: "کشمیری شال", price: 3900, compare: 4600, cat: 0, img: 5 },
    ],
  },
  shoes: {
    categories: [["Men|مرد", "men"], ["Women|خواتین", "women"], ["Sports|اسپورٹس", "sports"]],
    pool: IMG.shoes,
    products: [
      { name: "Leather Formal Oxford – Brown", ur: "لیدر فارمل شوز", price: 6900, compare: 7900, cat: 0, img: 0, featured: true, variants: shoeVariants() },
      { name: "Peshawari Chappal – Tan", ur: "پشاوری چپل", price: 3800, cat: 0, img: 1, tags: ["bestseller"], variants: shoeVariants() },
      { name: "Casual Loafers – Black", ur: "کیژول لوفرز", price: 4500, cat: 0, img: 2, variants: shoeVariants() },
      { name: "Kolhapuri Sandals", ur: "کولہاپوری سینڈل", price: 2600, cat: 0, img: 3, variants: shoeVariants() },
      { name: "Women's Khussa – Embroidered", ur: "خواتین کھسہ", price: 2950, cat: 1, img: 4, featured: true, variants: [36, 37, 38, 39, 40, 41].map((n) => ({ options: { Size: String(n) }, stock: 6 })) },
      { name: "Block Heel Sandals", ur: "بلاک ہیل سینڈل", price: 3400, cat: 1, img: 5, variants: [36, 37, 38, 39, 40].map((n) => ({ options: { Size: String(n) }, stock: 6 })) },
      { name: "Flat Pumps – Nude", ur: "فلیٹ پمپس", price: 2300, cat: 1, img: 0, variants: [36, 37, 38, 39, 40].map((n) => ({ options: { Size: String(n) }, stock: 6 })) },
      { name: "Women's Sneakers – White", ur: "خواتین اسنیکرز", price: 4100, cat: 1, img: 1, tags: ["new"] },
      { name: "Running Shoes – Air Mesh", ur: "رننگ شوز", price: 7200, compare: 8500, cat: 2, img: 2, featured: true, variants: shoeVariants() },
      { name: "Cricket Spikes", ur: "کرکٹ اسپائکس", price: 6500, cat: 2, img: 3, variants: shoeVariants() },
      { name: "Football Boots", ur: "فٹبال بوٹس", price: 5900, cat: 2, img: 4, variants: shoeVariants() },
      { name: "Gym Trainers", ur: "جم ٹرینرز", price: 4800, cat: 2, img: 5, variants: shoeVariants() },
    ],
  },
  gifts: {
    categories: [["Gift Boxes|گفٹ باکس", "boxes"], ["Flowers|پھول", "flowers"], ["Personalised|ذاتی", "personalised"]],
    pool: IMG.gifts,
    products: [
      { name: "Chocolate & Dry Fruit Box", ur: "چاکلیٹ اور ڈرائی فروٹ باکس", price: 3500, cat: 0, img: 0, featured: true, tags: ["bestseller"] },
      { name: "Eid Gift Hamper – Premium", ur: "عید گفٹ ہیمپر", price: 7500, compare: 8500, cat: 0, img: 1, featured: true },
      { name: "Birthday Surprise Box", ur: "سالگرہ سرپرائز باکس", price: 4200, cat: 0, img: 2 },
      { name: "Corporate Gift Set", ur: "کارپوریٹ گفٹ سیٹ", price: 5900, cat: 0, img: 3 },
      { name: "Red Roses Bouquet (24)", ur: "سرخ گلاب کا گلدستہ", price: 3200, cat: 1, img: 4, tags: ["bestseller"] },
      { name: "Mixed Flowers Basket", ur: "ملے جلے پھولوں کی ٹوکری", price: 4500, cat: 1, img: 5 },
      { name: "Lilies & Orchids Arrangement", ur: "للی اور آرکڈ", price: 5800, cat: 1, img: 0 },
      { name: "Anniversary Bouquet with Cake", ur: "سالگرہ گلدستہ اور کیک", price: 6900, cat: 1, img: 1, featured: true },
      { name: "Engraved Wooden Watch", ur: "کندہ لکڑی کی گھڑی", price: 4900, cat: 2, img: 2, variants: [{ options: { Engraving: "Name" } }, { options: { Engraving: "Name + Date" }, price: 5400 }] },
      { name: "Custom Photo Mug", ur: "فوٹو مگ", price: 950, cat: 2, img: 3, tags: ["new"] },
      { name: "Personalised Name Necklace", ur: "نام والا ہار", price: 2800, cat: 2, img: 4 },
      { name: "Photo Frame Collage", ur: "فوٹو فریم کولاج", price: 2200, cat: 2, img: 5 },
    ],
  },
  blades: {
    categories: [["Damascus Knives|دمشقی چاقو", "damascus"], ["Swords|تلواریں", "swords"], ["Hunting & Outdoor|شکاری", "outdoor"]],
    pool: IMG.blades,
    products: [
      { name: "Damascus Chef Knife 8\" – Rosewood Handle", ur: "دمشقی شیف چاقو", price: 12500, compare: 14500, cat: 0, img: 0, featured: true, tags: ["bestseller"], attributes: { material: "Damascus steel 256 layers", origin: "Wazirabad" } },
      { name: "Damascus Kitchen Set (3 pcs)", ur: "دمشقی کچن سیٹ", price: 24000, cat: 0, img: 1, featured: true },
      { name: "Damascus Folding Pocket Knife", ur: "دمشقی جیبی چاقو", price: 6800, cat: 0, img: 2 },
      { name: "Damascus Cleaver", ur: "دمشقی کلیور", price: 13800, cat: 0, img: 3 },
      { name: "Handmade Katana – Carbon Steel", ur: "ہاتھ سے بنی کٹانا", price: 38000, cat: 1, img: 4, featured: true, attributes: { material: "1095 carbon steel", length: "103 cm" } },
      { name: "Arabian Scimitar Replica", ur: "عربی شمشیر", price: 29000, cat: 1, img: 5 },
      { name: "Talwar – Mughal Style", ur: "مغل طرز تلوار", price: 34500, cat: 1, img: 0 },
      { name: "Decorative Wall Sword Set", ur: "ڈیکوریٹو تلوار سیٹ", price: 18500, cat: 1, img: 1 },
      { name: "Hunting Knife – Bone Handle", ur: "شکاری چاقو", price: 7900, cat: 2, img: 2 },
      { name: "Bowie Knife 12\"", ur: "بووی چاقو", price: 9200, cat: 2, img: 3 },
      { name: "Camping Axe – Damascus", ur: "کیمپنگ کلہاڑی", price: 11000, cat: 2, img: 4, tags: ["new"] },
      { name: "Leather Sheath (universal)", ur: "چمڑے کا غلاف", price: 1800, cat: 2, img: 5 },
    ],
  },
  sports: {
    categories: [["Cricket|کرکٹ", "cricket"], ["Football|فٹبال", "football"], ["Fitness|فٹنس", "fitness"]],
    pool: IMG.sports,
    products: [
      { name: "English Willow Cricket Bat – Grade 2", ur: "انگلش ولو کرکٹ بیٹ", price: 18500, compare: 21000, cat: 0, img: 0, featured: true, tags: ["bestseller"], attributes: { brand: "CA", origin: "Sialkot" } },
      { name: "Kashmir Willow Bat", ur: "کشمیر ولو بیٹ", price: 6500, cat: 0, img: 1 },
      { name: "Hard Ball (Pack of 6)", ur: "ہارڈ بال", price: 3600, cat: 0, img: 2 },
      { name: "Batting Pads & Gloves Set", ur: "بیٹنگ پیڈ اور دستانے", price: 8900, cat: 0, img: 3 },
      { name: "Match Football – Thermo Bonded", ur: "میچ فٹبال", price: 4200, cat: 1, img: 4, featured: true, attributes: { origin: "Sialkot", size: "5" } },
      { name: "Training Football (Size 4)", ur: "ٹریننگ فٹبال", price: 1900, cat: 1, img: 5 },
      { name: "Goalkeeper Gloves", ur: "گول کیپر دستانے", price: 2800, cat: 1, img: 0, variants: ["8", "9", "10"].map((s) => ({ options: { Size: s }, stock: 5 })) },
      { name: "Shin Guards", ur: "شن گارڈز", price: 1200, cat: 1, img: 1 },
      { name: "Adjustable Dumbbell Set 20kg", ur: "ڈمبل سیٹ", price: 12500, cat: 2, img: 2, featured: true },
      { name: "Yoga Mat 6mm", ur: "یوگا میٹ", price: 2200, cat: 2, img: 3, tags: ["new"] },
      { name: "Resistance Bands (5 pcs)", ur: "ریزسٹنس بینڈز", price: 1650, cat: 2, img: 4 },
      { name: "Skipping Rope – Speed", ur: "رسی کودنے کی", price: 850, cat: 2, img: 5 },
    ],
  },
  electronics: {
    categories: [["Mobiles|موبائل", "mobiles"], ["Laptops|لیپ ٹاپ", "laptops"], ["Accessories|لوازمات", "accessories"]],
    pool: IMG.electronics,
    products: [
      { name: "Samsung Galaxy A55 8/256", ur: "سام سنگ گلیکسی A55", price: 129999, compare: 139999, cat: 0, img: 0, featured: true, tags: ["bestseller"], attributes: { brand: "Samsung", warranty: "1 year official", specs: { display: "6.6\" AMOLED", ram: "8 GB", storage: "256 GB", battery: "5000 mAh" } } },
      { name: "Infinix Note 40 Pro", ur: "انفینکس نوٹ 40 پرو", price: 74999, cat: 0, img: 1, attributes: { brand: "Infinix", warranty: "1 year" } },
      { name: "Xiaomi Redmi 13C", ur: "ریڈمی 13C", price: 34999, cat: 0, img: 2, attributes: { brand: "Xiaomi", warranty: "1 year" } },
      { name: "iPhone 15 128GB (PTA approved)", ur: "آئی فون 15", price: 289999, cat: 0, img: 3, featured: true, attributes: { brand: "Apple", warranty: "1 year" } },
      { name: "HP 15 Core i5 12th Gen 8/512", ur: "ایچ پی لیپ ٹاپ", price: 184999, compare: 199999, cat: 1, img: 4, featured: true, attributes: { brand: "HP", warranty: "1 year", specs: { cpu: "Core i5-1235U", ram: "8 GB", ssd: "512 GB" } } },
      { name: "Lenovo IdeaPad Slim 3 Ryzen 5", ur: "لینووو آئیڈیا پیڈ", price: 159999, cat: 1, img: 5, attributes: { brand: "Lenovo", warranty: "1 year" } },
      { name: "MacBook Air M2 13\"", ur: "میک بک ایئر M2", price: 329999, cat: 1, img: 1, attributes: { brand: "Apple", warranty: "1 year" } },
      { name: "Dell Vostro 3520 Core i3", ur: "ڈیل ووسٹرو", price: 119999, cat: 1, img: 4, tags: ["new"] },
      { name: "Wireless Earbuds ANC", ur: "وائرلیس ایئر بڈز", price: 6999, cat: 2, img: 2, tags: ["bestseller"] },
      { name: "Smart Watch – AMOLED", ur: "سمارٹ واچ", price: 9499, cat: 2, img: 3 },
      { name: "20,000 mAh Power Bank 22.5W", ur: "پاور بینک", price: 5499, cat: 2, img: 0 },
      { name: "65W GaN Fast Charger", ur: "فاسٹ چارجر", price: 3299, cat: 2, img: 5 },
    ],
  },
  medical: {
    categories: [["Medicines|ادویات", "medicines"], ["Vitamins & Supplements|وٹامنز", "vitamins"], ["Devices & Care|آلات", "devices"]],
    pool: IMG.medical,
    products: [
      { name: "Panadol Extra Tablets (Strip of 10)", ur: "پیناڈول ایکسٹرا", price: 65, cat: 0, img: 0, tags: ["bestseller"], medical: { requiresPrescription: false, genericName: "Paracetamol + Caffeine", manufacturer: "GSK Pakistan", dosageForm: "Tablet", strength: "500mg/65mg" } },
      { name: "Augmentin 625mg (6 tablets)", ur: "آگمنٹن 625", price: 640, cat: 0, img: 1, medical: { requiresPrescription: true, genericName: "Amoxicillin + Clavulanic acid", manufacturer: "GSK Pakistan", dosageForm: "Tablet", strength: "625mg" } },
      { name: "Brufen 400mg (Strip of 10)", ur: "بروفن 400", price: 120, cat: 0, img: 2, medical: { requiresPrescription: false, genericName: "Ibuprofen", manufacturer: "Abbott", dosageForm: "Tablet", strength: "400mg" } },
      { name: "Glucophage 500mg (Strip of 10)", ur: "گلوکوفیج 500", price: 95, cat: 0, img: 3, medical: { requiresPrescription: true, genericName: "Metformin", manufacturer: "Merck", dosageForm: "Tablet", strength: "500mg" } },
      { name: "Risek 20mg Capsules (14)", ur: "رِسک 20", price: 310, cat: 0, img: 4, medical: { requiresPrescription: false, genericName: "Omeprazole", manufacturer: "Getz Pharma", dosageForm: "Capsule", strength: "20mg" } },
      { name: "Concor 5mg (Strip of 10)", ur: "کونکور 5", price: 260, cat: 0, img: 5, medical: { requiresPrescription: true, genericName: "Bisoprolol", manufacturer: "Merck", dosageForm: "Tablet", strength: "5mg" } },
      { name: "Surbex-Z (30 tablets)", ur: "سربیکس زیڈ", price: 480, cat: 1, img: 0, featured: true, medical: { requiresPrescription: false, genericName: "Multivitamin + Zinc", manufacturer: "Abbott", dosageForm: "Tablet", strength: "—" } },
      { name: "Vitamin D3 200,000 IU Injection", ur: "وٹامن ڈی 3", price: 350, cat: 1, img: 1, medical: { requiresPrescription: true, genericName: "Cholecalciferol", manufacturer: "Hilton Pharma", dosageForm: "Injection", strength: "200,000 IU" } },
      { name: "CaC-1000 Plus (10 effervescent)", ur: "کیک 1000", price: 320, cat: 1, img: 2, medical: { requiresPrescription: false, genericName: "Calcium + Vitamin C", manufacturer: "GSK", dosageForm: "Effervescent tablet", strength: "1000mg" } },
      { name: "Digital Blood Pressure Monitor", ur: "بلڈ پریشر مانیٹر", price: 4800, compare: 5500, cat: 2, img: 3, featured: true, attributes: { brand: "Omron", warranty: "2 years" } },
      { name: "Glucometer Kit with 25 Strips", ur: "گلوکومیٹر کٹ", price: 2900, cat: 2, img: 4 },
      { name: "Surgical Face Masks (Box of 50)", ur: "سرجیکل ماسک", price: 450, cat: 2, img: 5 },
    ],
  },
};

async function seedEcommerce(db: Db, tenantId: string, key: CategoryKey) {
  const seed = ECOM[key];
  if (!seed) return;
  if ((await db.product.count({ where: { tenantId } })) === 0) {
    const cats = [];
    for (const [i, [label, slug]] of seed.categories.entries()) {
      const [en, ur] = label.split("|");
      cats.push(await db.productCategory.create({ data: { tenantId, slug, name: J(ls(en, ur)), sortOrder: i, imageUrl: u(seed.pool[i % seed.pool.length]) } }));
    }
    for (const [i, p] of seed.products.entries()) {
      const slug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const product = await db.product.create({
        data: {
          tenantId,
          categoryId: cats[p.cat].id,
          slug,
          name: J(ls(p.name, p.ur)),
          shortDesc: J(ls(`${p.name} — genuine quality, delivered anywhere in Pakistan with cash on delivery.`)),
          description: J(ls(`${p.name}. Carefully checked before dispatch. 7-day easy exchange on unused items. Nationwide delivery in 2-4 working days.`)),
          price: p.price,
          comparePrice: p.compare ?? null,
          sku: `${key.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
          stock: p.variants ? 0 : 25,
          trackStock: !p.variants,
          images: [u(seed.pool[p.img % seed.pool.length]), u(seed.pool[(p.img + 1) % seed.pool.length])],
          attributes: J(p.attributes ?? {}),
          tags: p.tags ?? [],
          isFeatured: p.featured ?? false,
          sortOrder: i,
          ...(p.medical ?? {}),
        },
      });
      if (p.variants) {
        await db.productVariant.createMany({
          data: p.variants.map((v, k) => ({
            tenantId,
            productId: product.id,
            name: Object.values(v.options).join(" / "),
            options: J(v.options),
            price: v.price ?? null,
            stock: v.stock ?? 5,
            sku: `${product.sku}-${k + 1}`,
          })),
        });
      }
    }
  }
  if ((await db.shippingZone.count({ where: { tenantId } })) === 0) {
    await db.shippingZone.createMany({
      data: [
        { tenantId, name: "Lahore", cities: ["Lahore"], fee: 150, freeAbove: 3000, etaDays: "1-2", sortOrder: 0 },
        { tenantId, name: "Rest of Pakistan", cities: [], fee: 250, freeAbove: 5000, etaDays: "2-4", sortOrder: 1 },
      ],
    });
  }
  if ((await db.coupon.count({ where: { tenantId } })) === 0) {
    await db.coupon.create({ data: { tenantId, code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 1500, maxUses: 500 } });
  }
}

/* ------------------------------------------------------------------ */
/* restaurant                                                           */
/* ------------------------------------------------------------------ */

async function seedRestaurant(db: Db, tenantId: string, key: "pizza" | "bakery") {
  if ((await db.menuItem.count({ where: { tenantId } })) > 0) return;
  const pool = key === "pizza" ? IMG.pizza : IMG.bakery;
  const pizzaSizes = [
    { name: "Small", price: 0 },
    { name: "Medium", price: 500 },
    { name: "Large", price: 900 },
    { name: "Family", price: 1500 },
  ];
  const pound = (base: number) => [
    { name: "1 lb", price: 0 },
    { name: "2 lb", price: base * 0.9 },
    { name: "3 lb", price: base * 1.8 },
  ];
  const piece = (n: number, price: number) => [
    { name: `${n} pcs`, price: 0 },
    { name: `${n * 2} pcs`, price },
  ];

  const menu: { cat: [string, string, string]; items: { name: string; ur?: string; price: number; sizes?: { name: string; price: number }[]; tags?: string[]; featured?: boolean; desc: string }[] }[] =
    key === "pizza"
      ? [
          {
            cat: ["Signature Pizzas", "خصوصی پیزا", "pizzas"],
            items: [
              { name: "Chicken Tikka Pizza", ur: "چکن تکہ پیزا", price: 850, sizes: pizzaSizes, tags: ["bestseller", "spicy"], featured: true, desc: "Tandoori chicken tikka, onions, green chillies and mozzarella." },
              { name: "Chicken Fajita Pizza", ur: "چکن فاجیتا پیزا", price: 850, sizes: pizzaSizes, tags: ["bestseller"], featured: true, desc: "Fajita chicken, capsicum, onions and a creamy fajita sauce." },
              { name: "Malai Boti Pizza", ur: "ملائی بوٹی پیزا", price: 900, sizes: pizzaSizes, desc: "Creamy malai boti chunks with cheese and a hint of black pepper." },
              { name: "Beef Pepperoni", ur: "بیف پیپرونی", price: 950, sizes: pizzaSizes, desc: "Classic beef pepperoni with double mozzarella." },
              { name: "Veggie Supreme", ur: "ویجی سپریم", price: 750, sizes: pizzaSizes, tags: ["veg"], desc: "Mushrooms, olives, capsicum, onions, sweetcorn and tomatoes." },
              { name: "Crown Crust Kebab Pizza", ur: "کراؤن کرسٹ پیزا", price: 1100, sizes: pizzaSizes, tags: ["new"], desc: "Cheesy crown crust filled with seekh kebab bites." },
            ],
          },
          {
            cat: ["Sides & Starters", "سائیڈز", "sides"],
            items: [
              { name: "Garlic Bread with Cheese", ur: "گارلک بریڈ", price: 350, sizes: piece(4, 300), desc: "Toasted garlic bread topped with mozzarella." },
              { name: "Chicken Wings (Hot)", ur: "چکن ونگز", price: 550, sizes: piece(6, 480), tags: ["spicy"], desc: "Crispy wings tossed in our house hot sauce." },
              { name: "Cheesy Fries", ur: "چیزی فرائز", price: 300, desc: "Golden fries with cheese sauce and jalapeños." },
              { name: "Chicken Nuggets", ur: "چکن نگٹس", price: 420, sizes: piece(6, 380), desc: "Crunchy nuggets with garlic mayo dip." },
            ],
          },
          {
            cat: ["Pasta & Calzone", "پاستا", "pasta"],
            items: [
              { name: "Chicken Alfredo Pasta", ur: "چکن الفریڈو", price: 750, desc: "Fettuccine in a rich creamy white sauce with grilled chicken." },
              { name: "Tikka Calzone", ur: "تکہ کالزون", price: 650, desc: "Folded pizza stuffed with chicken tikka and cheese." },
            ],
          },
          {
            cat: ["Drinks & Desserts", "مشروبات", "drinks"],
            items: [
              { name: "Soft Drink 1.5 Ltr", ur: "کولڈ ڈرنک", price: 180, desc: "Pepsi / 7UP / Mirinda." },
              { name: "Molten Lava Cake", ur: "لاوا کیک", price: 380, tags: ["new"], desc: "Warm chocolate cake with a gooey centre." },
            ],
          },
        ]
      : [
          {
            cat: ["Cakes", "کیک", "cakes"],
            items: [
              { name: "Chocolate Fudge Cake", ur: "چاکلیٹ فج کیک", price: 1800, sizes: pound(1800), tags: ["bestseller"], featured: true, desc: "Moist chocolate sponge layered with rich fudge." },
              { name: "Red Velvet Cake", ur: "ریڈ ویلویٹ کیک", price: 2000, sizes: pound(2000), featured: true, desc: "Classic red velvet with cream cheese frosting." },
              { name: "Pineapple Cream Cake", ur: "پائن ایپل کیک", price: 1600, sizes: pound(1600), desc: "Light vanilla sponge with fresh pineapple and cream." },
              { name: "Black Forest Cake", ur: "بلیک فاریسٹ", price: 1900, sizes: pound(1900), desc: "Chocolate sponge, cherries and whipped cream." },
              { name: "Lotus Biscoff Cake", ur: "لوٹس کیک", price: 2400, sizes: pound(2400), tags: ["new"], desc: "Biscoff cream layers with caramelised biscuit crumb." },
            ],
          },
          {
            cat: ["Pastries & Cupcakes", "پیسٹری", "pastries"],
            items: [
              { name: "Chocolate Pastry", ur: "چاکلیٹ پیسٹری", price: 180, sizes: piece(1, 170), desc: "Single-serve chocolate slice." },
              { name: "Vanilla Cupcakes", ur: "ونیلا کپ کیک", price: 600, sizes: piece(6, 550), desc: "Box of buttercream cupcakes." },
              { name: "Cheesecake Slice", ur: "چیز کیک", price: 350, desc: "New York style baked cheesecake." },
            ],
          },
          {
            cat: ["Breads & Savouries", "بریڈ", "breads"],
            items: [
              { name: "Chicken Patties", ur: "چکن پیٹیز", price: 120, sizes: piece(1, 110), tags: ["bestseller"], desc: "Flaky puff pastry with spicy chicken filling." },
              { name: "Garlic Bread Loaf", ur: "گارلک بریڈ", price: 250, desc: "Freshly baked with garlic butter." },
              { name: "Whole Wheat Bread", ur: "براؤن بریڈ", price: 200, desc: "Baked daily, no preservatives." },
              { name: "Pizza Bun", ur: "پیزا بن", price: 150, sizes: piece(1, 140), desc: "Soft bun topped with chicken and cheese." },
            ],
          },
          {
            cat: ["Cookies & Sweets", "بسکٹ", "cookies"],
            items: [
              { name: "Chocolate Chip Cookies (250g)", ur: "چاکلیٹ چپ کوکیز", price: 450, desc: "Crunchy outside, chewy inside." },
              { name: "Nan Khatai (500g)", ur: "نان خطائی", price: 550, desc: "Traditional buttery cardamom biscuits." },
            ],
          },
        ];

  const groups = await Promise.all(
    (key === "pizza"
      ? [
          { name: ls("Extra toppings", "اضافی ٹاپنگز"), min: 0, max: 4, mods: [["Extra cheese", 150], ["Chicken", 200], ["Olives", 80], ["Jalapeños", 60], ["Mushrooms", 90]] },
          { name: ls("Crust", "کرسٹ"), min: 1, max: 1, required: true, mods: [["Classic hand-tossed", 0], ["Thin crust", 0], ["Cheese-stuffed crust", 250]] },
        ]
      : [
          { name: ls("Cake message", "کیک پیغام"), min: 0, max: 1, mods: [["Happy Birthday", 0], ["Happy Anniversary", 0], ["Custom message", 100]] },
          { name: ls("Add-ons", "ایڈ آنز"), min: 0, max: 3, mods: [["Candles", 50], ["Extra cream", 150], ["Gift box", 200]] },
        ]
    ).map(async (g, i) => {
      const group = await db.modifierGroup.create({ data: { tenantId, name: J(g.name), minSelect: g.min, maxSelect: g.max, required: g.required ?? false, sortOrder: i } });
      await db.modifier.createMany({ data: g.mods.map(([n, p], k) => ({ tenantId, groupId: group.id, name: J(ls(String(n))), price: Number(p), sortOrder: k })) });
      return group;
    }),
  );

  let img = 0;
  for (const [ci, section] of menu.entries()) {
    const cat = await db.menuCategory.create({ data: { tenantId, slug: section.cat[2], name: J(ls(section.cat[0], section.cat[1])), sortOrder: ci, imageUrl: u(pool[ci % pool.length]) } });
    for (const [ii, it] of section.items.entries()) {
      const item = await db.menuItem.create({
        data: {
          tenantId,
          categoryId: cat.id,
          slug: it.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          name: J(ls(it.name, it.ur)),
          description: J(ls(it.desc)),
          price: it.price,
          sizes: J((it.sizes ?? []).map((s) => ({ name: s.name, price: Math.round(s.price) }))),
          imageUrl: u(pool[img++ % pool.length]),
          tags: it.tags ?? [],
          isFeatured: it.featured ?? false,
          sortOrder: ii,
        },
      });
      // link modifiers to main items (pizzas / cakes)
      if (ci === 0) await db.menuItemModifierGroup.createMany({ data: groups.map((g) => ({ menuItemId: item.id, groupId: g.id })) });
    }
  }

  await db.deliveryZone.createMany({
    data: [
      { tenantId, name: "DHA", fee: 100, minOrder: 500, etaMins: 35, sortOrder: 0 },
      { tenantId, name: "Gulberg", fee: 100, minOrder: 500, etaMins: 40, sortOrder: 1 },
      { tenantId, name: "Johar Town", fee: 150, minOrder: 800, etaMins: 45, sortOrder: 2 },
      { tenantId, name: "Model Town", fee: 150, minOrder: 800, etaMins: 45, sortOrder: 3 },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* services + team (shared helpers)                                     */
/* ------------------------------------------------------------------ */

type ServiceSeed = { name: string; ur?: string; summary: string; priceFrom?: number; priceNote?: string; icon?: string; features?: unknown[]; featured?: boolean; img?: string };
async function seedServices(db: Db, tenantId: string, list: ServiceSeed[]) {
  if ((await db.service.count({ where: { tenantId } })) > 0) return;
  for (const [i, s] of list.entries()) {
    await db.service.create({
      data: {
        tenantId,
        slug: s.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        name: J(ls(s.name, s.ur)),
        summary: J(ls(s.summary)),
        description: J(ls(`${s.summary} Contact us on WhatsApp for a quick quote and turnaround time.`)),
        priceFrom: s.priceFrom ?? null,
        priceNote: s.priceNote ?? null,
        icon: s.icon ?? null,
        imageUrl: s.img ?? null,
        features: J(s.features ?? []),
        isFeatured: s.featured ?? i < 3,
        sortOrder: i,
      },
    });
  }
}

type TeamSeed = { name: string; role: string; roleUr?: string; bio: string; specialties?: string[]; img: number; phone?: string };
async function seedTeam(db: Db, tenantId: string, list: TeamSeed[]) {
  if ((await db.teamMember.count({ where: { tenantId } })) > 0) return [];
  const rows = [];
  for (const [i, m] of list.entries()) {
    rows.push(
      await db.teamMember.create({
        data: {
          tenantId,
          slug: m.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          name: m.name,
          role: J(ls(m.role, m.roleUr)),
          bio: J(ls(m.bio)),
          imageUrl: u(IMG.people[m.img % IMG.people.length], 600),
          phone: m.phone ?? null,
          specialties: m.specialties ?? [],
          sortOrder: i,
        },
      }),
    );
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* recruiting                                                           */
/* ------------------------------------------------------------------ */

async function seedRecruiting(db: Db, tenantId: string) {
  if ((await db.job.count({ where: { tenantId } })) === 0) {
    const jobs = [
      { title: "Heavy Duty Driver (HTV)", ur: "ہیوی ڈرائیور", company: "Al Futtaim Logistics", location: "Dubai", country: "UAE", type: "Overseas", min: 180000, max: 220000, exp: "3+ years GCC licence", vac: 15, feat: true },
      { title: "Electrician – Industrial", ur: "الیکٹریشن", company: "Saudi Binladin Group", location: "Riyadh", country: "Saudi Arabia", type: "Overseas", min: 150000, max: 190000, exp: "2+ years", vac: 30, feat: true },
      { title: "Registered Nurse (Female)", ur: "نرس", company: "Hamad Medical Corporation", location: "Doha", country: "Qatar", type: "Overseas", min: 350000, max: 450000, exp: "BSN + 2 years", vac: 10 },
      { title: "Welder 6G", ur: "ویلڈر", company: "Petrofac", location: "Muscat", country: "Oman", type: "Overseas", min: 140000, max: 170000, exp: "Trade test required", vac: 20 },
      { title: "Accountant", ur: "اکاؤنٹنٹ", company: "Packages Ltd", location: "Lahore", country: "Pakistan", type: "Full-time", min: 80000, max: 120000, exp: "ACCA/CA Inter, 2 years", vac: 2 },
      { title: "Sales Executive – FMCG", ur: "سیلز ایگزیکٹو", company: "National Foods", location: "Karachi", country: "Pakistan", type: "Full-time", min: 55000, max: 75000, exp: "1-3 years", vac: 5 },
      { title: "Customer Support Representative (Night)", ur: "کسٹمر سپورٹ", company: "ibex.", location: "Islamabad", country: "Pakistan", type: "Full-time", min: 60000, max: 90000, exp: "Fluent English", vac: 25, feat: true },
      { title: "Security Guard", ur: "سیکیورٹی گارڈ", company: "Emirates Group Security", location: "Abu Dhabi", country: "UAE", type: "Overseas", min: 120000, max: 140000, exp: "Ex-army preferred", vac: 50 },
    ];
    for (const [i, j] of jobs.entries()) {
      await db.job.create({
        data: {
          tenantId,
          slug: `${j.title}-${j.location}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          title: J(ls(j.title, j.ur)),
          company: j.company,
          location: j.location,
          country: j.country,
          type: j.type,
          salaryMin: j.min,
          salaryMax: j.max,
          salaryText: `PKR ${j.min.toLocaleString("en-PK")} – ${j.max.toLocaleString("en-PK")} equivalent / month`,
          experience: j.exp,
          description: J(ls(`${j.company} is hiring ${j.title} for ${j.location}. Accommodation and transport provided for overseas positions. Interviews held at our ${j.country === "Pakistan" ? "office" : "Lahore and Karachi offices"}.`)),
          requirements: J(ls("Valid passport with 2+ years validity. Relevant experience. Medical fitness (GAMCA for Gulf). Police character certificate.")),
          vacancies: j.vac,
          deadline: new Date(Date.now() + (30 + i * 5) * 86_400_000),
          isFeatured: j.feat ?? false,
        },
      });
    }
  }
  await seedServices(db, tenantId, [
    { name: "Professional CV Writing", ur: "سی وی رائٹنگ", summary: "ATS-friendly CVs written by HR professionals, delivered in 48 hours.", priceFrom: 2500, icon: "FileText" },
    { name: "Visa Processing (Gulf)", ur: "ویزا پروسیسنگ", summary: "Work visa stamping, GAMCA medical, protector and document attestation.", priceFrom: 15000, icon: "Stamp" },
    { name: "Overseas Placement", ur: "بیرون ملک ملازمت", summary: "Licensed OEP (Bureau of Emigration) placement in UAE, KSA, Qatar and Oman.", priceNote: "Fee per demand letter", icon: "Plane" },
  ]);
  await seedTeam(db, tenantId, [
    { name: "Muhammad Asif Chaudhry", role: "Managing Director", roleUr: "منیجنگ ڈائریکٹر", bio: "20 years in overseas manpower with 12,000+ placements across the Gulf.", img: 7 },
    { name: "Sana Malik", role: "HR & Placement Manager", roleUr: "ایچ آر منیجر", bio: "Screens and shortlists candidates for healthcare and corporate clients.", img: 2 },
    { name: "Bilal Ahmed", role: "Visa & Documentation Officer", roleUr: "ویزا آفیسر", bio: "Handles protector, attestation and GAMCA medical coordination.", img: 0 },
  ]);
}

/* ------------------------------------------------------------------ */
/* travel                                                               */
/* ------------------------------------------------------------------ */

async function seedTravel(db: Db, tenantId: string) {
  if ((await db.travelPackage.count({ where: { tenantId } })) === 0) {
    const it = (days: string[]) => days.map((t, i) => ({ day: i + 1, title: t.split(":")[0], description: t.split(":").slice(1).join(":").trim() }));
    const pk = [
      { title: "Umrah Economy – 14 Days", ur: "عمرہ اکانومی", dest: "Makkah & Madinah", kind: "UMRAH", days: 14, nights: 13, price: 245000, note: "per person, quad sharing", img: [0], feat: true, it: it(["Departure: Fly Lahore → Jeddah, transfer to Makkah hotel (800m from Haram).", "Makkah: Perform Umrah with our guide.", "Makkah: Ziyarat of Jabal-e-Noor, Jabal-e-Thawr, Mina, Arafat.", "Madinah: Bus transfer, hotel 300m from Masjid-e-Nabwi.", "Madinah: Ziyarat of Quba, Uhud, Qiblatain.", "Return: Fly Madinah → Lahore."]), inc: ["Return airfare", "Visa", "Hotels", "Transport", "Ziyarat"], exc: ["Meals", "Personal expenses"] },
      { title: "Umrah Premium – 10 Days (5★)", ur: "عمرہ پریمیم", dest: "Makkah & Madinah", kind: "UMRAH", days: 10, nights: 9, price: 465000, note: "per person, double sharing", img: [0], feat: true, it: it(["Departure: Direct flight, VIP transfer to Swissotel Makkah.", "Makkah: Umrah and Haram visits.", "Madinah: Anwar Al Madinah Mövenpick, 5 nights.", "Return: Direct flight home."]), inc: ["Return airfare", "Visa", "5-star hotels with breakfast", "Private transport"], exc: ["Lunch & dinner"] },
      { title: "Hunza Valley – 5 Days", ur: "ہنزہ 5 دن", dest: "Hunza, Gilgit-Baltistan", kind: "TOUR", days: 5, nights: 4, price: 38000, note: "per person, from Islamabad", img: [1, 2], feat: true, it: it(["Islamabad → Naran: Drive via Kaghan valley, night in Naran.", "Naran → Hunza: Babusar Top, Rakaposhi view point, night in Karimabad.", "Hunza: Baltit Fort, Altit Fort, Eagle's Nest sunset.", "Attabad Lake & Passu Cones: Boating, Hussaini bridge, Khunjerab optional.", "Return: Hunza → Islamabad via KKH."]), inc: ["Transport (coaster/AC)", "Hotels", "Breakfast", "Tour guide"], exc: ["Lunch, dinner", "Entry tickets"] },
      { title: "Skardu & Deosai – 7 Days", ur: "اسکردو 7 دن", dest: "Skardu, Gilgit-Baltistan", kind: "TOUR", days: 7, nights: 6, price: 62000, note: "per person, by air", img: [2, 3], it: it(["Fly Islamabad → Skardu: Check in, Shangrila Resort visit.", "Shigar: Shigar Fort, cold desert.", "Deosai Plains: Sheosar Lake, wildlife.", "Khaplu: Khaplu Palace, Chaqchan mosque.", "Upper Kachura Lake: Boating and lunch.", "Free day: Skardu bazaar.", "Return flight."]), inc: ["Airfare", "Hotels", "Jeep", "Breakfast"], exc: ["Meals", "Personal expenses"] },
      { title: "Swat & Kalam – 3 Days", ur: "سوات 3 دن", dest: "Swat, KPK", kind: "TOUR", days: 3, nights: 2, price: 18500, note: "per person, from Lahore", img: [3, 1], it: it(["Lahore → Malam Jabba: Chair lift, zip line.", "Kalam: Ushu forest, Mahodand lake jeep ride.", "Return: Fizagat park, Mingora bazaar."]), inc: ["Transport", "Hotels", "Breakfast"], exc: ["Lunch, dinner", "Jeep to Mahodand"] },
      { title: "Dubai City Break – 4 Days", ur: "دبئی 4 دن", dest: "Dubai, UAE", kind: "TOUR", days: 4, nights: 3, price: 145000, note: "per person, double sharing, incl. visa", img: [4], feat: true, it: it(["Arrival: Airport transfer, Dubai Marina dhow cruise dinner.", "City tour: Burj Khalifa (124th floor), Dubai Mall, Jumeirah mosque.", "Desert safari: Dune bashing, BBQ dinner, belly dance show.", "Departure: Shopping at Deira gold souk, airport transfer."]), inc: ["Airfare", "Visa", "4-star hotel", "Tours"], exc: ["Lunches", "Optional tours"] },
      { title: "Malaysia – Kuala Lumpur & Langkawi 6 Days", ur: "ملائیشیا 6 دن", dest: "Malaysia", kind: "HONEYMOON", days: 6, nights: 5, price: 198000, note: "per person, double sharing", img: [5], it: it(["Kuala Lumpur: Petronas Towers, KL Tower.", "Genting Highlands: Cable car & theme park.", "Fly to Langkawi: Beach hotel.", "Langkawi: Island hopping, Sky Bridge.", "Free day: Duty-free shopping.", "Return via KL."]), inc: ["Airfare", "Hotels", "Breakfast", "Transfers"], exc: ["Visa fee", "Meals"] },
      { title: "Baku, Azerbaijan – 5 Days", ur: "باکو 5 دن", dest: "Baku, Azerbaijan", kind: "TOUR", days: 5, nights: 4, price: 172000, note: "per person, double sharing, e-visa included", img: [6, 7], it: it(["Arrival: Old City walking tour, Maiden Tower.", "Gobustan: Mud volcanoes, rock art.", "Absheron: Ateshgah fire temple, Yanar Dag.", "Gabala day trip: Tufandag cable car.", "Departure."]), inc: ["Airfare", "E-visa", "Hotel", "Tours"], exc: ["Lunch, dinner"] },
    ];
    for (const [i, p] of pk.entries()) {
      await db.travelPackage.create({
        data: {
          tenantId,
          slug: p.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          title: J(ls(p.title, p.ur)),
          destination: p.dest,
          kind: p.kind,
          days: p.days,
          nights: p.nights,
          price: p.price,
          priceNote: p.note,
          images: p.img.map((k) => u(IMG.travel[k])),
          summary: J(ls(`${p.days} days / ${p.nights} nights in ${p.dest}. Hassle-free, fully guided, with 24/7 WhatsApp support.`)),
          itinerary: J(p.it),
          inclusions: J(p.inc),
          exclusions: J(p.exc),
          departures: J([1, 2, 3].map((m) => new Date(Date.now() + m * 30 * 86_400_000).toISOString().slice(0, 10))),
          isFeatured: p.feat ?? false,
          sortOrder: i,
        },
      });
    }
  }
  await seedServices(db, tenantId, [
    { name: "Visa Consultancy", ur: "ویزا کنسلٹنسی", summary: "Visit visas for UAE, Turkey, Malaysia, Schengen and UK with document guidance.", priceFrom: 5000, priceNote: "service fee, excl. embassy fee", icon: "Stamp" },
    { name: "Air Ticketing", ur: "ایئر ٹکٹنگ", summary: "Domestic and international tickets on PIA, Emirates, Qatar, Saudi and more at best fares.", icon: "Plane", priceNote: "Best fare guarantee" },
    { name: "Hotel Booking", ur: "ہوٹل بکنگ", summary: "Hotels in Makkah, Madinah, Dubai and across Pakistan with confirmed vouchers.", icon: "Hotel" },
    { name: "Travel Insurance", ur: "ٹریول انشورنس", summary: "Schengen-compliant travel insurance issued within an hour.", priceFrom: 3500, icon: "ShieldCheck" },
  ]);
  await seedTeam(db, tenantId, [
    { name: "Hafiz Naveed Iqbal", role: "Umrah Group Leader", roleUr: "عمرہ گروپ لیڈر", bio: "Has led 60+ Umrah groups and guides pilgrims through every ritual.", img: 4 },
    { name: "Ayesha Rehman", role: "Tour Consultant", roleUr: "ٹور کنسلٹنٹ", bio: "Plans northern-areas and international holidays tailored to families.", img: 2 },
  ]);
}

/* ------------------------------------------------------------------ */
/* real estate                                                          */
/* ------------------------------------------------------------------ */

async function seedRealEstate(db: Db, tenantId: string) {
  const agents = await seedTeam(db, tenantId, [
    { name: "Raja Tanveer Ahmed", role: "Senior Property Consultant", roleUr: "سینئر پراپرٹی کنسلٹنٹ", bio: "Specialises in DHA Lahore and Bahria Town plots and houses.", specialties: ["DHA Lahore", "Bahria Town", "Plots"], img: 7, phone: "+923001234567" },
    { name: "Farah Siddiqui", role: "Rental & Apartments Specialist", roleUr: "رینٹل اسپیشلسٹ", bio: "Helps families find apartments and rentals in Karachi and Islamabad.", specialties: ["Apartments", "Rentals", "Karachi"], img: 5, phone: "+923011234567" },
    { name: "Usman Khattak", role: "Commercial Property Advisor", roleUr: "کمرشل ایڈوائزر", bio: "Offices, shops and plazas in Islamabad Blue Area and F-sectors.", specialties: ["Commercial", "Islamabad"], img: 0, phone: "+923021234567" },
  ]);
  if ((await db.property.count({ where: { tenantId } })) > 0) return;
  const existingAgents = agents.length ? agents : await db.teamMember.findMany({ where: { tenantId } });
  const agentId = (i: number) => existingAgents[i % existingAgents.length]?.id ?? null;
  const props = [
    { title: "1 Kanal Brand New House – DHA Phase 6", ur: "ایک کنال گھر ڈی ایچ اے فیز 6", purpose: "SALE", type: "HOUSE", price: 95_000_000, area: 20, unit: "MARLA", bed: 5, bath: 6, city: "Lahore", loc: "DHA Phase 6, Lahore", feat: true, a: 0 },
    { title: "10 Marla House – Bahria Town Sector C", ur: "10 مرلہ گھر بحریہ ٹاؤن", purpose: "SALE", type: "HOUSE", price: 42_500_000, area: 10, unit: "MARLA", bed: 4, bath: 5, city: "Lahore", loc: "Bahria Town Sector C, Lahore", feat: true, a: 0 },
    { title: "5 Marla Plot – DHA Phase 9 Prism", ur: "5 مرلہ پلاٹ", purpose: "SALE", type: "PLOT", price: 13_500_000, area: 5, unit: "MARLA", city: "Lahore", loc: "DHA Phase 9 Prism, Block K", a: 0 },
    { title: "2-Bed Apartment for Rent – Gulberg Heights", ur: "2 بیڈ اپارٹمنٹ کرایہ", purpose: "RENT", type: "FLAT", price: 85_000, priceUnit: "MONTHLY", area: 1250, unit: "SQFT", bed: 2, bath: 2, city: "Lahore", loc: "Gulberg III, Lahore", a: 1 },
    { title: "3-Bed Apartment – Creek Vista, DHA Phase 8", ur: "3 بیڈ اپارٹمنٹ کریک وسٹا", purpose: "SALE", type: "FLAT", price: 68_000_000, area: 2400, unit: "SQFT", bed: 3, bath: 4, city: "Karachi", loc: "Creek Vista, DHA Phase 8, Karachi", feat: true, a: 1 },
    { title: "500 Sq Yd Bungalow – Clifton Block 5", ur: "500 گز بنگلہ کلفٹن", purpose: "SALE", type: "HOUSE", price: 185_000_000, area: 500, unit: "SQYD", bed: 6, bath: 7, city: "Karachi", loc: "Clifton Block 5, Karachi", a: 1 },
    { title: "Bahria Town Karachi Precinct 12 – 250 Sq Yd Plot", ur: "بحریہ ٹاؤن کراچی پلاٹ", purpose: "SALE", type: "PLOT", price: 9_800_000, area: 250, unit: "SQYD", city: "Karachi", loc: "Precinct 12, Bahria Town Karachi", a: 1 },
    { title: "1 Kanal House for Rent – F-10/3", ur: "ایک کنال گھر کرایہ ایف 10", purpose: "RENT", type: "HOUSE", price: 350_000, priceUnit: "MONTHLY", area: 20, unit: "MARLA", bed: 6, bath: 6, city: "Islamabad", loc: "F-10/3, Islamabad", a: 2 },
    { title: "Office Space 2,000 Sq Ft – Blue Area", ur: "آفس بلیو ایریا", purpose: "RENT", type: "COMMERCIAL", price: 400_000, priceUnit: "MONTHLY", area: 2000, unit: "SQFT", city: "Islamabad", loc: "Jinnah Avenue, Blue Area, Islamabad", feat: true, a: 2 },
    { title: "4 Kanal Farmhouse – Bedian Road", ur: "فارم ہاؤس بیدیاں روڈ", purpose: "SALE", type: "FARMHOUSE", price: 120_000_000, area: 4, unit: "KANAL", bed: 4, bath: 4, city: "Lahore", loc: "Bedian Road, Lahore", a: 0 },
  ];
  for (const [i, p] of props.entries()) {
    await db.property.create({
      data: {
        tenantId,
        slug: p.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        title: J(ls(p.title, p.ur)),
        purpose: p.purpose,
        type: p.type,
        price: p.price,
        priceUnit: p.priceUnit ?? "TOTAL",
        areaValue: p.area,
        areaUnit: p.unit,
        bedrooms: p.bed ?? null,
        bathrooms: p.bath ?? null,
        city: p.city,
        location: p.loc,
        description: J(ls(`${p.title}. Prime location in ${p.loc}. ${p.type === "PLOT" ? "Possession available, all dues clear, ideal for investment." : "Well-maintained with modern fittings, gas, electricity and water available. Contact us to arrange a visit."}`)),
        features: p.type === "PLOT" ? ["Corner", "Possession", "Near park"] : ["Parking", "Servant quarter", "Backup generator", "Near mosque & school"],
        images: [u(IMG.realestate[i % IMG.realestate.length]), u(IMG.realestate[(i + 3) % IMG.realestate.length]), u(IMG.realestate[(i + 6) % IMG.realestate.length])],
        agentId: agentId(p.a),
        isFeatured: p.feat ?? false,
        sortOrder: i,
      },
    });
  }
}

/* ------------------------------------------------------------------ */
/* gym                                                                  */
/* ------------------------------------------------------------------ */

async function seedGym(db: Db, tenantId: string) {
  if ((await db.membershipPlan.count({ where: { tenantId } })) === 0) {
    await db.membershipPlan.createMany({
      data: [
        { tenantId, name: J(ls("Monthly", "ماہانہ")), price: 6000, period: "MONTH", features: J(["Gym floor access", "Locker", "1 free PT session"]), sortOrder: 0 },
        { tenantId, name: J(ls("Quarterly", "سہ ماہی")), price: 15000, period: "QUARTER", features: J(["Everything in Monthly", "All group classes", "Diet plan"]), isPopular: true, sortOrder: 1 },
        { tenantId, name: J(ls("Annual", "سالانہ")), price: 48000, period: "YEAR", features: J(["Everything in Quarterly", "4 PT sessions / month", "Free gym T-shirt", "Freeze up to 30 days"]), sortOrder: 2 },
      ],
    });
  }
  const trainers = await seedTeam(db, tenantId, [
    { name: "Coach Shahzaib Khan", role: "Head Trainer – Strength", roleUr: "ہیڈ ٹرینر", bio: "Certified S&C coach, former national-level powerlifter.", specialties: ["Powerlifting", "Hypertrophy"], img: 0 },
    { name: "Hira Baig", role: "Ladies Fitness & Zumba", roleUr: "لیڈیز فٹنس", bio: "Zumba and HIIT instructor with 6 years of experience in ladies-only sessions.", specialties: ["Zumba", "HIIT", "Weight loss"], img: 2 },
    { name: "Danish Ali", role: "CrossFit & Conditioning", roleUr: "کراس فٹ", bio: "CrossFit L2 trainer, runs the morning conditioning classes.", specialties: ["CrossFit", "Conditioning"], img: 4 },
    { name: "Dr. Maria Qureshi", role: "Nutritionist", roleUr: "نیوٹریشنسٹ", bio: "Clinical nutritionist designing desi diet plans that actually work.", specialties: ["Nutrition", "Diet plans"], img: 3 },
  ]);
  if ((await db.classSchedule.count({ where: { tenantId } })) === 0) {
    const t = trainers.length ? trainers : await db.teamMember.findMany({ where: { tenantId } });
    const tid = (i: number) => t[i % Math.max(1, t.length)]?.id ?? null;
    const classes: [string, string, number, string, string, number, string][] = [
      ["Morning CrossFit", "صبح کراس فٹ", 1, "07:00", "08:00", 2, "Intermediate"],
      ["Ladies Zumba", "لیڈیز زومبا", 1, "11:00", "12:00", 1, "Beginner"],
      ["Strength Basics", "اسٹرینتھ بیسکس", 1, "18:00", "19:00", 0, "Beginner"],
      ["HIIT Burn", "ہٹ برن", 2, "07:00", "07:45", 2, "Advanced"],
      ["Ladies HIIT", "لیڈیز ہٹ", 2, "11:00", "12:00", 1, "Intermediate"],
      ["Powerlifting Club", "پاور لفٹنگ", 3, "18:00", "19:30", 0, "Advanced"],
      ["Morning CrossFit", "صبح کراس فٹ", 3, "07:00", "08:00", 2, "Intermediate"],
      ["Ladies Zumba", "لیڈیز زومبا", 4, "11:00", "12:00", 1, "Beginner"],
      ["Boxing Conditioning", "باکسنگ", 4, "19:00", "20:00", 2, "Intermediate"],
      ["Strength Basics", "اسٹرینتھ بیسکس", 5, "18:00", "19:00", 0, "Beginner"],
      ["Weekend Bootcamp", "ویک اینڈ بوٹ کیمپ", 6, "08:00", "09:30", 2, "Intermediate"],
      ["Yoga & Mobility", "یوگا", 0, "09:00", "10:00", 3, "Beginner"],
    ];
    await db.classSchedule.createMany({
      data: classes.map(([n, ur, day, s, e, tr, lvl]) => ({ tenantId, name: J(ls(n, ur)), dayOfWeek: day, startTime: s, endTime: e, trainerId: tid(tr), capacity: 20, level: lvl })),
    });
  }
  await seedServices(db, tenantId, [
    { name: "Personal Training", ur: "پرسنل ٹریننگ", summary: "1-on-1 sessions with a certified coach, customised to your goal.", priceFrom: 12000, priceNote: "per month (12 sessions)", icon: "Dumbbell" },
    { name: "Diet & Nutrition Plan", ur: "ڈائٹ پلان", summary: "Desi-friendly meal plans with monthly follow-ups from our nutritionist.", priceFrom: 4000, icon: "Apple" },
    { name: "Body Composition Analysis", ur: "باڈی اینالسس", summary: "InBody scan with a printed report and coach consultation.", priceFrom: 1500, icon: "Activity" },
  ]);
}

/* ------------------------------------------------------------------ */
/* law                                                                  */
/* ------------------------------------------------------------------ */

async function seedLaw(db: Db, tenantId: string) {
  await seedServices(db, tenantId, [
    { name: "Family Law", ur: "خاندانی قانون", summary: "Khula, divorce, child custody, maintenance and dower cases in family courts.", icon: "Users", featured: true },
    { name: "Property & Civil Litigation", ur: "پراپرٹی اور دیوانی مقدمات", summary: "Title disputes, illegal possession, partition suits and injunctions.", icon: "Building2", featured: true },
    { name: "Criminal Defence", ur: "فوجداری دفاع", summary: "Bail (pre-arrest and post-arrest), FIR quashing, trial defence in sessions and high court.", icon: "Gavel", featured: true },
    { name: "Corporate & SECP Compliance", ur: "کارپوریٹ", summary: "Company registration, shareholder agreements, contracts and annual filings.", icon: "Briefcase" },
    { name: "Overseas Pakistanis Services", ur: "بیرون ملک پاکستانی", summary: "Power of attorney, inheritance (wirasat) certificates and property matters handled remotely.", icon: "Globe" },
    { name: "Taxation & FBR Matters", ur: "ٹیکس", summary: "Income tax returns, notices, appeals before Commissioner and ATIR.", icon: "Receipt" },
  ]);
  await seedTeam(db, tenantId, [
    { name: "Barrister Ahmed Raza Kasuri", role: "Senior Partner, Advocate Supreme Court", roleUr: "سینئر پارٹنر", bio: "Barrister-at-Law (Lincoln's Inn), 25 years of constitutional and civil practice.", specialties: ["Constitutional", "Civil", "Supreme Court"], img: 7 },
    { name: "Advocate Sadia Nawaz", role: "Partner – Family Law", roleUr: "پارٹنر فیملی لاء", bio: "Leads the family law practice; known for sensitive handling of custody matters.", specialties: ["Family law", "Custody", "Khula"], img: 2 },
    { name: "Advocate Kamran Sheikh", role: "Criminal Litigation", roleUr: "فوجداری", bio: "Handles bail and trial matters in Lahore High Court and sessions courts.", specialties: ["Criminal", "Bail", "Trial"], img: 0 },
    { name: "Advocate Zainab Mir", role: "Corporate & Tax", roleUr: "کارپوریٹ اور ٹیکس", bio: "LLM (Corporate Law), advises startups and SMEs on compliance and tax.", specialties: ["Corporate", "SECP", "Tax"], img: 3 },
  ]);
}

/* ------------------------------------------------------------------ */
/* printing                                                             */
/* ------------------------------------------------------------------ */

async function seedPrinting(db: Db, tenantId: string) {
  const tiers = (base: number) => [
    { qty: 100, price: base },
    { qty: 500, price: Math.round(base * 3.5) },
    { qty: 1000, price: Math.round(base * 6) },
  ];
  await seedServices(db, tenantId, [
    { name: "Business Cards", ur: "بزنس کارڈز", summary: "Matte, glossy, spot-UV and textured cards on 300–400gsm art card.", priceFrom: 1200, priceNote: "per 100 cards", features: tiers(1200), icon: "CreditCard", img: u(IMG.printing[4]) },
    { name: "Flyers & Brochures", ur: "فلائرز", summary: "A5/A4 flyers and tri-fold brochures, single or double sided, full colour.", priceFrom: 2500, priceNote: "per 100 A5", features: tiers(2500), icon: "FileText", img: u(IMG.printing[0]) },
    { name: "Banners & Standees", ur: "بینرز", summary: "Flex and vinyl banners, roll-up standees and backdrops for events and shops.", priceFrom: 60, priceNote: "per sq ft", features: [{ qty: 1, price: 60 }, { qty: 50, price: 55 }, { qty: 200, price: 48 }], icon: "Flag", img: u(IMG.printing[1]) },
    { name: "Packaging & Boxes", ur: "پیکیجنگ", summary: "Custom printed boxes, mailer boxes and food packaging with die-cutting.", priceFrom: 45, priceNote: "per box (min 500)", features: [{ qty: 500, price: 45 }, { qty: 1000, price: 38 }, { qty: 5000, price: 29 }], icon: "Package", img: u(IMG.printing[2]) },
    { name: "Stickers & Labels", ur: "اسٹیکرز", summary: "Die-cut vinyl stickers, product labels and roll labels, waterproof options.", priceFrom: 800, priceNote: "per 100 (3\" round)", features: tiers(800), icon: "Tag", img: u(IMG.printing[3]) },
    { name: "Wedding Cards", ur: "شادی کارڈز", summary: "Elegant wedding invitations with foil, laser-cut and embossed finishes.", priceFrom: 120, priceNote: "per card (min 100)", features: [{ qty: 100, price: 12000 }, { qty: 300, price: 33000 }, { qty: 500, price: 50000 }], icon: "Heart", img: u(IMG.printing[5]) },
    { name: "Letterheads & Envelopes", ur: "لیٹر ہیڈ", summary: "Corporate stationery on premium bond paper with matching envelopes.", priceFrom: 1800, priceNote: "per 100 letterheads", features: tiers(1800), icon: "Mail", img: u(IMG.printing[0]) },
    { name: "T-Shirt Printing", ur: "ٹی شرٹ پرنٹنگ", summary: "DTF, screen and sublimation printing on cotton and dri-fit shirts, from 1 piece.", priceFrom: 950, priceNote: "per shirt", features: [{ qty: 1, price: 950 }, { qty: 25, price: 21000 }, { qty: 100, price: 75000 }], icon: "Shirt", img: u(IMG.printing[1]) },
  ]);
}

/* ------------------------------------------------------------------ */
/* shared content for every category                                    */
/* ------------------------------------------------------------------ */

const NAMES = ["Ahmed Raza", "Fatima Noor", "Bilal Hussain", "Ayesha Khan", "Usman Tariq", "Sana Javed", "Hamza Sheikh", "Maryam Iqbal"];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Sialkot"];

const REVIEW_TEXT: Record<string, [string, string][]> = {
  ecommerce: [
    ["Ordered on Monday, received on Wednesday in Multan. Packaging was excellent and product exactly as shown.", "پیر کو آرڈر کیا، بدھ کو ملتان میں مل گیا۔ پیکنگ بہترین تھی۔"],
    ["Quality is far better than what I got from other online stores. Cash on delivery made it easy.", "کوالٹی دوسرے آن لائن اسٹورز سے کہیں بہتر ہے۔"],
    ["WhatsApp support replied within minutes and helped me choose the right size.", "واٹس ایپ سپورٹ نے منٹوں میں جواب دیا۔"],
    ["Genuine product, fair price. Will definitely order again.", "اصلی پروڈکٹ، مناسب قیمت۔ دوبارہ ضرور آرڈر کروں گا۔"],
    ["Exchange process was smooth when I needed a different size.", "سائز تبدیل کرنے کا عمل بہت آسان تھا۔"],
  ],
  restaurant: [
    ["Best tikka pizza in town. Delivered hot within 30 minutes to DHA.", "شہر کا بہترین تکہ پیزا۔ 30 منٹ میں گرم ڈیلیور ہوا۔"],
    ["Ordered a custom cake for my daughter's birthday, it was beautiful and delicious.", "بیٹی کی سالگرہ کے لیے کیک بنوایا، بہت خوبصورت اور مزیدار تھا۔"],
    ["The online ordering is so convenient. Tracked my order live.", "آن لائن آرڈرنگ بہت آسان ہے۔"],
    ["Fresh every single time. Their family deal is great value.", "ہر بار تازہ۔ فیملی ڈیل بہترین ہے۔"],
    ["Friendly riders and the food is always packed properly.", "رائیڈرز خوش اخلاق اور کھانا ہمیشہ اچھی طرح پیک ہوتا ہے۔"],
  ],
  service: [
    ["Professional team, transparent pricing and they delivered on time.", "پروفیشنل ٹیم، شفاف قیمتیں اور وقت پر کام۔"],
    ["They explained everything clearly and kept me updated at every step.", "انہوں نے ہر بات واضح طور پر سمجھائی۔"],
    ["Highly recommended. Results exceeded my expectations.", "بہت سفارش کرتا ہوں۔ نتائج توقع سے بڑھ کر تھے۔"],
    ["Booked through the website and got a call back within an hour.", "ویب سائٹ سے بکنگ کی اور ایک گھنٹے میں کال آ گئی۔"],
    ["Great experience from start to finish.", "شروع سے آخر تک شاندار تجربہ۔"],
  ],
  listing: [
    ["Found exactly what I was looking for and the process was hassle-free.", "جو چاہیے تھا وہی ملا اور عمل بہت آسان تھا۔"],
    ["Honest guidance, no hidden charges. Their team handled all the paperwork.", "ایماندارانہ رہنمائی، کوئی چھپے ہوئے چارجز نہیں۔"],
    ["Quick response on WhatsApp and very knowledgeable staff.", "واٹس ایپ پر فوری جواب اور باخبر عملہ۔"],
    ["Trusted them for my family and would recommend to anyone.", "اپنی فیملی کے لیے ان پر بھروسہ کیا۔"],
    ["Excellent service and follow-up even after the deal was done.", "بہترین سروس اور بعد میں بھی فالو اپ۔"],
  ],
};

const FAQS: Record<string, [string, string, string, string][]> = {
  ecommerce: [
    ["Do you offer cash on delivery?", "کیا آپ کیش آن ڈیلیوری دیتے ہیں؟", "Yes, cash on delivery is available across Pakistan.", "جی ہاں، پورے پاکستان میں کیش آن ڈیلیوری دستیاب ہے۔"],
    ["How long does delivery take?", "ڈیلیوری میں کتنا وقت لگتا ہے؟", "1-2 days within Lahore and 2-4 working days for the rest of Pakistan.", "لاہور میں 1-2 دن اور باقی پاکستان میں 2-4 دن۔"],
    ["Can I exchange or return an item?", "کیا میں واپس یا تبدیل کر سکتا ہوں؟", "Unused items can be exchanged within 7 days of delivery.", "غیر استعمال شدہ اشیاء 7 دن کے اندر تبدیل کی جا سکتی ہیں۔"],
    ["How do I track my order?", "آرڈر کیسے ٹریک کروں؟", "Use the order number from your confirmation message on the Track Order page.", "ٹریک آرڈر پیج پر اپنا آرڈر نمبر درج کریں۔"],
    ["Are the products genuine?", "کیا مصنوعات اصلی ہیں؟", "Absolutely. We source directly from brands and authorised distributors.", "بالکل۔ ہم براہ راست برانڈز سے خریدتے ہیں۔"],
  ],
  restaurant: [
    ["Which areas do you deliver to?", "آپ کہاں ڈیلیور کرتے ہیں؟", "DHA, Gulberg, Johar Town and Model Town. Delivery fee depends on the zone.", "ڈی ایچ اے، گلبرگ، جوہر ٹاؤن اور ماڈل ٹاؤن۔"],
    ["What is the minimum order for delivery?", "کم از کم آرڈر کتنا ہے؟", "Rs 500 for nearby zones and Rs 800 for farther zones.", "قریبی علاقوں کے لیے 500 روپے۔"],
    ["Can I pay online?", "کیا آن لائن ادائیگی ممکن ہے؟", "Currently we accept cash on delivery and pickup payments at the counter.", "فی الحال کیش آن ڈیلیوری قبول کرتے ہیں۔"],
    ["Do you cater for events?", "کیا آپ ایونٹس کے لیے کیٹرنگ کرتے ہیں؟", "Yes, message us on WhatsApp with the date and headcount.", "جی ہاں، واٹس ایپ پر رابطہ کریں۔"],
    ["Is the food halal?", "کیا کھانا حلال ہے؟", "All our ingredients are 100% halal.", "تمام اجزاء 100% حلال ہیں۔"],
  ],
  service: [
    ["How do I book a consultation?", "مشاورت کیسے بک کروں؟", "Use the contact form or WhatsApp us. We confirm within one working day.", "رابطہ فارم یا واٹس ایپ استعمال کریں۔"],
    ["What are your working hours?", "اوقات کار کیا ہیں؟", "Monday to Saturday, 10am to 7pm.", "پیر تا ہفتہ، صبح 10 سے شام 7 بجے۔"],
    ["Is the first consultation free?", "کیا پہلی مشاورت مفت ہے؟", "The initial 15-minute call is free; detailed consultations are charged.", "ابتدائی 15 منٹ کی کال مفت ہے۔"],
    ["Do you offer services outside the city?", "کیا آپ شہر سے باہر بھی خدمات دیتے ہیں؟", "Yes, most services are available nationwide and online.", "جی ہاں، زیادہ تر خدمات ملک بھر میں دستیاب ہیں۔"],
    ["How do I pay?", "ادائیگی کیسے کروں؟", "Bank transfer, JazzCash/EasyPaisa or cash at the office.", "بینک ٹرانسفر، جاز کیش/ایزی پیسہ یا نقد۔"],
  ],
  listing: [
    ["How do I apply / enquire?", "درخواست کیسے دوں؟", "Open any listing and use the form; our team calls you back within 24 hours.", "کسی بھی لسٹنگ پر فارم بھریں۔"],
    ["Are your services licensed?", "کیا آپ لائسنس یافتہ ہیں؟", "Yes, we are fully registered with the relevant government authorities.", "جی ہاں، ہم متعلقہ اداروں سے رجسٹرڈ ہیں۔"],
    ["What documents do I need?", "کون سے دستاویزات درکار ہیں؟", "A valid CNIC, and for overseas matters a passport. We guide you on the rest.", "شناختی کارڈ اور بیرون ملک کے لیے پاسپورٹ۔"],
    ["Do you charge for consultation?", "کیا مشاورت کی فیس ہے؟", "Initial consultation is free of charge.", "ابتدائی مشاورت مفت ہے۔"],
    ["Can I visit your office?", "کیا میں دفتر آ سکتا ہوں؟", "Yes, Monday to Saturday 10am–6pm. Address is in the footer.", "جی ہاں، پیر تا ہفتہ 10 سے 6 بجے۔"],
  ],
};

function poolFor(key: CategoryKey): string[] {
  switch (key) {
    case "pizza":
      return IMG.pizza;
    case "bakery":
      return IMG.bakery;
    case "clothing":
      return IMG.clothing;
    case "shoes":
      return IMG.shoes;
    case "kitchen":
      return IMG.kitchen;
    case "electronics":
      return IMG.electronics;
    case "sports":
      return IMG.sports;
    case "gifts":
      return IMG.gifts;
    case "blades":
      return IMG.blades;
    case "medical":
      return IMG.medical;
    case "recruiting":
      return IMG.office;
    case "travel":
      return IMG.travel;
    case "realestate":
      return IMG.realestate;
    case "gym":
      return IMG.gym;
    case "law":
      return IMG.law;
    case "printing":
      return IMG.printing;
  }
}

async function seedShared(db: Db, tenantId: string, key: CategoryKey, kind: "ecommerce" | "restaurant" | "service" | "listing") {
  const pool = poolFor(key);
  if ((await db.testimonial.count({ where: { tenantId } })) === 0) {
    await db.testimonial.createMany({
      data: REVIEW_TEXT[kind].map(([en, ur], i) => ({ tenantId, name: NAMES[i], role: CITIES[i], text: J(ls(en, ur)), rating: i === 3 ? 4 : 5, imageUrl: u(IMG.people[i], 300), sortOrder: i })),
    });
  }
  if ((await db.faqItem.count({ where: { tenantId } })) === 0) {
    await db.faqItem.createMany({ data: FAQS[kind].map(([q, qu, a, au], i) => ({ tenantId, question: J(ls(q, qu)), answer: J(ls(a, au)), sortOrder: i })) });
  }
  if ((await db.galleryItem.count({ where: { tenantId } })) === 0) {
    await db.galleryItem.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({ tenantId, imageUrl: u(pool[i % pool.length], 1200), caption: J(ls(`Gallery ${i + 1}`)), album: "general", sortOrder: i })),
    });
  }
  if ((await db.tenantPost.count({ where: { tenantId } })) === 0) {
    const posts: [string, string, string][] = [
      ["We are now online — order from anywhere in Pakistan", "ہم اب آن لائن ہیں", "Our new website lets you browse everything we offer, place orders or enquiries in a minute and reach us on WhatsApp instantly. Cash on delivery and nationwide service available."],
      ["Ramadan & Eid offers announced", "رمضان اور عید آفرز", "Enjoy special discounts and bundles this season. Use code WELCOME10 on your first order. Offers valid while stocks last."],
    ];
    for (const [i, [t, tu, body]] of posts.entries()) {
      await db.tenantPost.create({
        data: {
          tenantId,
          slug: t
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          title: J(ls(t, tu)),
          excerpt: J(ls(body.slice(0, 120))),
          content: J(ls(body)),
          coverUrl: u(pool[(i + 2) % pool.length], 1200),
          published: true,
          publishedAt: new Date(Date.now() - (i + 1) * 7 * 86_400_000),
        },
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* entry point                                                          */
/* ------------------------------------------------------------------ */

export type LocalizedSeed = LocalizedString;

/** Seed category-specific + shared sample data for a tenant. Idempotent per table. */
export async function seedCategoryData(db: Db, tenantId: string, categoryKey: CategoryKey): Promise<void> {
  switch (categoryKey) {
    case "kitchen":
    case "clothing":
    case "shoes":
    case "gifts":
    case "blades":
    case "sports":
    case "electronics":
    case "medical":
      await seedEcommerce(db, tenantId, categoryKey);
      await seedShared(db, tenantId, categoryKey, "ecommerce");
      return;
    case "pizza":
    case "bakery":
      await seedRestaurant(db, tenantId, categoryKey);
      await seedShared(db, tenantId, categoryKey, "restaurant");
      return;
    case "recruiting":
      await seedRecruiting(db, tenantId);
      await seedShared(db, tenantId, categoryKey, "listing");
      return;
    case "travel":
      await seedTravel(db, tenantId);
      await seedShared(db, tenantId, categoryKey, "listing");
      return;
    case "realestate":
      await seedRealEstate(db, tenantId);
      await seedShared(db, tenantId, categoryKey, "listing");
      return;
    case "gym":
      await seedGym(db, tenantId);
      await seedShared(db, tenantId, categoryKey, "service");
      return;
    case "law":
      await seedLaw(db, tenantId);
      await seedShared(db, tenantId, categoryKey, "service");
      return;
    case "printing":
      await seedPrinting(db, tenantId);
      await seedShared(db, tenantId, categoryKey, "service");
      return;
  }
}
