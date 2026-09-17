import { CATEGORIES, type CategoryKey } from "@/lib/categories";

/**
 * Built-in "feature guide" article for every business category. These are always
 * present on the super site blog (in addition to posts written in the super admin).
 */
export interface Guide {
  slug: "feature-guide";
  title: string;
  intro: string;
  features: string[];
  sections: { heading: string; body: string[] }[];
  faq: { q: string; a: string }[];
}

const common = {
  admin: {
    heading: "Your admin panel, in plain language",
    body: [
      "Every website comes with an admin panel at yourdomain.com/admin. Log in with the username and password you receive, and you can change every text and image on the site, in English and (optionally) Urdu.",
      "Sections such as the hero banner, about, testimonials or FAQ can be switched on or off with one toggle, reordered, or reset to the template's default content. Nothing you do can break the design.",
      "You can add staff accounts with limited access, see an activity log of every change, and upload images to your own media library. Your files and data are completely separate from every other website on the platform.",
    ],
  },
  contact: {
    heading: "Leads, WhatsApp and notifications",
    body: [
      "Every enquiry form lands in the Leads inbox with the visitor's phone number, so you can call or WhatsApp with one tap. Mark leads as contacted, in progress or closed, and add private notes.",
      "A floating WhatsApp button appears on every page with your business number. Optional email notifications alert you the moment an order or enquiry arrives.",
    ],
  },
  language: {
    heading: "English and Urdu",
    body: [
      "Enable Urdu from Settings and a language toggle appears on your website. The layout flips to right-to-left automatically with a proper Nastaliq font. Every text field in the admin gets an Urdu box beside the English one, so you can translate at your own pace. Anything left blank simply shows in English.",
    ],
  },
};

const G: Record<CategoryKey, Omit<Guide, "slug">> = {
  kitchen: {
    title: "Everything a kitchen accessories store needs online",
    intro: "From non-stick sets to crockery and small appliances, a kitchen store has many products, many sizes and price-sensitive buyers. Our kitchen templates are built as complete online stores with cash on delivery, not just brochures.",
    features: ["Product catalogue with categories and sub-categories", "Variants (sizes, colours, set counts) with stock per variant", "Cash on delivery checkout with city-based shipping fees", "Coupons and promo strip", "Order tracking by order number", "Featured and newest product sections", "WhatsApp order button on every product"],
    sections: [
      { heading: "Catalogue built for volume", body: ["Add unlimited products with multiple images, a compare-at price for sales, SKU and stock. Group them in categories such as Cookware, Crockery, Storage or Appliances. Mark best-sellers as featured so they appear on the home page automatically."] },
      { heading: "Checkout the Pakistani way", body: ["Customers add to cart, enter name, mobile number, city and address, and place the order with cash on delivery. Shipping fees are set per zone (for example Lahore Rs 150, rest of Punjab Rs 250, nationwide Rs 350) with an optional free-shipping threshold.", "Each order gets a number, appears instantly in your admin, and customers can track its status (pending, confirmed, shipped, delivered) on the website."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [
      { q: "Can I accept card payments?", a: "Phase one is cash on delivery only, which is what most Pakistani customers prefer. Card and wallet payments can be added later without changing the design." },
      { q: "Do I need to know how to code?", a: "No. Products, prices, images and every section are managed from the admin panel." },
    ],
  },
  clothing: {
    title: "A complete online store for clothing brands",
    intro: "Lawn, pret, unstitched, menswear or kids: clothing brands live on variants and visuals. These templates pair fashion-grade layouts with a real store engine.",
    features: ["Size and colour variants with per-variant stock and price", "Lookbook gallery", "Collection banners and 'shop by category' showcase", "Sale badges with compare-at pricing", "Cash on delivery checkout with shipping zones", "Coupons for launches and Eid sales", "Order tracking"],
    sections: [
      { heading: "Variants that match how you sell", body: ["Create a product once, then define options such as Size (S, M, L, XL) and Colour. The store generates every combination with its own stock and optional price. Customers pick their size on the product page and see instantly whether it is available."] },
      { heading: "Visual first", body: ["Large product galleries, a lookbook section fed by your gallery album, and collection banners for new drops. Each template has its own typography and palette, from luxury editorial to streetwear."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [
      { q: "Can I show 'Sold out' sizes?", a: "Yes. Sizes with zero stock are shown but disabled, so customers know what is coming back." },
      { q: "Can I run an Eid sale?", a: "Set compare-at prices for a sale badge, create a coupon code, and turn on the promo strip in one minute." },
    ],
  },
  shoes: {
    title: "Shoe brand websites with size-perfect ordering",
    intro: "Footwear sells by size. These templates handle EU/UK sizes as variants, show what is in stock, and make exchanges easy to explain.",
    features: ["Size variants with stock per size", "Size guide messaging", "Collections showcase (men, women, kids)", "Cash on delivery with shipping zones", "Coupons and promo strip", "Order tracking", "WhatsApp order button"],
    sections: [
      { heading: "Sizes as first-class data", body: ["Enter sizes 39 to 45 once and track each one separately. Bulk-update stock from the admin, mark a size as unavailable, or set a different price for larger sizes."] },
      { heading: "Designed for footwear", body: ["From sneaker-store energy to handmade leather warmth, each template frames the product differently while keeping the same reliable store underneath."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can customers exchange sizes?", a: "The store records the order and phone number; your exchange policy is shown on the product page and handled through the leads inbox or WhatsApp." }],
  },
  gifts: {
    title: "Gift shop websites that sell by occasion",
    intro: "Gift shoppers browse by occasion and budget and often need same-day delivery. These templates put occasions front and centre and add a gift message at checkout.",
    features: ["Occasion-based collections (Birthday, Eid, Wedding, Anniversary)", "Gift message field at checkout", "Same-day delivery messaging", "Cash on delivery", "Coupons", "Order tracking", "Corporate / bulk enquiry form"],
    sections: [
      { heading: "Occasion collections", body: ["Tag products with occasions and the home page shows tiles for each one. A customer looking for a birthday gift lands on exactly the right products."] },
      { heading: "Gift messages and delivery", body: ["At checkout the customer can add a card message and choose a delivery city. You see the message on the order so it is printed and packed correctly."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can I take bulk corporate orders?", a: "Yes, a corporate gifting banner with an enquiry form is included and lands in your leads inbox." }],
  },
  blades: {
    title: "Websites for sword and knife makers",
    intro: "Wazirabad's craft deserves a catalogue that looks as serious as the steel. These templates tell the forging story, present specs clearly and take orders with age confirmation.",
    features: ["Craftsmanship story section with process steps", "Specifications table (steel, blade length, handle)", "Age confirmation at checkout", "Custom order enquiry form", "Cash on delivery within Pakistan", "Export-ready catalogue pages", "Order tracking"],
    sections: [
      { heading: "Specs that buyers expect", body: ["Each product carries attributes such as steel type, blade length, overall length, handle material and weight, rendered as a clean table. Collectors and chefs compare with confidence."] },
      { heading: "Responsible selling", body: ["An age confirmation checkbox is required at checkout when enabled in settings, and legal notes can be added to the footer."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can international customers enquire?", a: "Yes. The custom order form and WhatsApp button work worldwide; shipping quotes are handled through the leads inbox." }],
  },
  sports: {
    title: "Sports store websites from cricket to gym gear",
    intro: "Cricket bats, footballs, fitness equipment and sportswear: a sports store sells across brands and sizes. These templates combine brand strips, category showcases and a full store.",
    features: ["Brand strip and category showcase", "Variants (sizes) with stock", "Cash on delivery with shipping zones", "Coupons and deals", "Team kit / bulk enquiry form", "Order tracking", "WhatsApp order button"],
    sections: [
      { heading: "Catalogue by sport and brand", body: ["Categories such as Cricket, Football, Fitness and Apparel, plus tags for brands, let customers filter quickly. Featured products appear on the home page."] },
      { heading: "Team and academy orders", body: ["A banner for custom team kits with an enquiry form captures bulk orders from schools and clubs."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can I show products from Sialkot manufacturers under their brands?", a: "Yes. Add a brand attribute or tag and use the brands strip on the home page." }],
  },
  electronics: {
    title: "Electronics store websites with specs and warranty",
    intro: "Buyers of mobiles, laptops and appliances compare specifications and want warranty clarity. These templates present specs as tables, show warranty badges and take cash-on-delivery orders.",
    features: ["Specifications table per product", "Warranty and brand badges", "Compare-at pricing and deals", "Categories and brand filters", "Cash on delivery with shipping zones", "Order tracking", "Solar / installation enquiry forms"],
    sections: [
      { heading: "Specs done right", body: ["Add any number of specification rows (RAM, storage, display, battery) per product. They render as a tidy table on the product page and key specs show on the card."] },
      { heading: "Trust signals", body: ["Official warranty badges, brand strip and a clear returns note reassure buyers making bigger purchases."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can I sell solar packages?", a: "Yes. The HomeVolt template includes a solar and inverter lead form; any template can add the same banner." }],
  },
  medical: {
    title: "Online pharmacy websites with prescription upload",
    intro: "A medical store online must handle prescriptions responsibly and make reordering effortless. These templates add prescription upload, pharmacist verification and prescription-required products to a full store.",
    features: ["Prescription upload (photo or PDF) stored privately", "Prescription-required flag on products", "Pharmacist verification queue in admin", "Generic name, manufacturer, strength and dosage form", "Search by brand or generic name", "Cash on delivery home delivery", "Order tracking"],
    sections: [
      { heading: "Prescriptions handled properly", body: ["Customers upload a photo of the prescription either from the home page or during checkout when a prescription-required item is in the cart. Files are stored privately; only your staff can open them from the admin.", "The Prescriptions page in admin lets a pharmacist verify or reject each upload and attach it to the order."] },
      { heading: "Product data for medicines", body: ["Each product carries generic name, manufacturer, strength and dosage form, so customers can search 'paracetamol' and find every brand you stock."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Are prescription images public?", a: "No. They are stored as private files and served only through short-lived links to logged-in staff of your store." }],
  },
  pizza: {
    title: "Pizza shop websites with full online ordering",
    intro: "A pizza shop needs sizes, toppings, deals, delivery zones and a kitchen that sees orders the moment they arrive. These templates are complete ordering systems, not menus with a phone number.",
    features: ["Menu with sizes (Small to Family) and modifier groups (toppings, crust)", "Delivery, pickup and dine-in order types", "Delivery zones with fees, minimum order and ETA", "Live kitchen order board with sound alerts", "Order status tracking for customers", "Deals and combos section", "Opening hours with open-now badge", "Printable kitchen tickets"],
    sections: [
      { heading: "Ordering that matches your menu", body: ["Every item can have sizes with their own prices and modifier groups such as Extra toppings (choose up to 3) or Crust (choose one). The customizer enforces your rules and shows a live price.", "Customers choose delivery or pickup, pick their area for the delivery fee, and pay cash on delivery. Orders can also be scheduled for later."] },
      { heading: "The kitchen board", body: ["The Live orders screen shows new orders in columns: New, Accepted, Preparing, Ready, Out for delivery. Staff tap to move orders forward; a sound plays when a new order arrives; a timer turns red when an order is late. A pause switch stops online orders when the kitchen is overloaded."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [
      { q: "Can customers see the status of their order?", a: "Yes. After ordering they get a tracking page that updates automatically as your kitchen moves the order forward." },
      { q: "Can I turn off delivery at night?", a: "Opening hours and the 'accepting orders' switch control when orders are accepted; pickup and delivery can be enabled separately." },
    ],
  },
  bakery: {
    title: "Bakery websites with online orders and custom cakes",
    intro: "Bakeries sell daily items and made-to-order cakes. These templates combine an ordering menu with a custom cake request form that captures flavour, size, date and a reference photo.",
    features: ["Online ordering with sizes and weights (per pound, per piece)", "Custom cake request form with reference photo upload", "Pickup and delivery with time selection", "Live order board and kitchen tickets", "Order status tracking", "Opening hours and open-now badge", "Bulk and event order enquiries"],
    sections: [
      { heading: "Custom cakes without phone tag", body: ["The custom cake form asks for occasion, flavour, weight, servings, date needed, the message on the cake and a reference picture. It lands in your leads inbox with everything you need to quote."] },
      { heading: "Daily orders", body: ["Breads, pastries and ready cakes are ordered from the menu with pickup or delivery, paid in cash on delivery, and tracked by the customer."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can I stop same-day cake orders?", a: "Yes. Set a lead time in the custom cake section text and manage requests from the inbox; menu items can be paused individually." }],
  },
  recruiting: {
    title: "Recruiting agency websites with a job board and CV pipeline",
    intro: "A recruiting agency lives on vacancies and candidates. These templates include a searchable job board, online applications with CV upload, an employer request form and a pipeline to manage candidates.",
    features: ["Job board with keyword, location, country and type filters", "Online application with CV upload (stored privately)", "Candidate pipeline: received, shortlisted, interview, offered, hired", "Employer staff-request form", "Industries and process sections", "Services (visa processing, medical, training)", "Team profiles"],
    sections: [
      { heading: "Post jobs in minutes", body: ["Create a job with title, company, location, country, salary, requirements and deadline. Mark it featured to show it on the home page. Close it when filled."] },
      { heading: "Applications you can manage", body: ["Each application shows the candidate's details and CV download. Move candidates through stages, add notes, and call or WhatsApp them from the same screen."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Are CVs public?", a: "No. CVs are private files visible only to logged-in staff of your agency." }],
  },
  travel: {
    title: "Travel agency websites for Umrah, tours and visas",
    intro: "From Umrah groups to Hunza tours and visa consultancy, travel agencies sell packages with itineraries and dates. These templates present packages beautifully and capture booking requests.",
    features: ["Package catalogue by type (Umrah, Hajj, tours, honeymoon, corporate, visa)", "Itinerary day by day, inclusions and exclusions", "Departure dates and per-person pricing", "Booking request form per package", "Destinations showcase", "Visa, ticketing and hotel services", "Gallery of past tours"],
    sections: [
      { heading: "Packages that answer every question", body: ["Each package has a gallery, summary, day-by-day itinerary, inclusions, exclusions and upcoming departures. Customers send a booking request with travellers and preferred date."] },
      { heading: "Umrah made clear", body: ["A dedicated Umrah highlight section and package tiers (economy, standard, premium) help families compare quickly."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can I take payments online?", a: "Bookings are requests; you confirm and collect payment as you do today. Online payments can be added later." }],
  },
  realestate: {
    title: "Real estate agent websites with searchable listings",
    intro: "Buyers search by area, type, price and bedrooms. These templates provide filterable property listings with Pakistani units (marla, kanal), agent profiles and per-property enquiries.",
    features: ["Listings for sale and rent with photos and video", "Filters by purpose, type, city, price, bedrooms", "Marla, kanal, sq ft and sq yd units", "Popular areas showcase", "Agent profiles", "Inquiry form per property", "Map embed per listing"],
    sections: [
      { heading: "Listings that look professional", body: ["Add a property with purpose (sale or rent), type (house, flat, plot, commercial), price in crore/lac display, area with unit, bedrooms, bathrooms, features and a gallery. Assign an agent and it appears on the listing."] },
      { heading: "Enquiries with context", body: ["Every enquiry records which property it came from, so you know exactly what the caller wants."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can I show plots and files?", a: "Yes. Choose the plot type and marla or kanal units; the Plot Point template is designed around societies and investment." }],
  },
  gym: {
    title: "Gym websites with plans, timetable and trial bookings",
    intro: "Gyms convert visitors with clear plans, a timetable and an easy trial booking. These templates include all three plus trainer profiles and a transformations gallery.",
    features: ["Membership plans with popular highlight", "Weekly class timetable by day", "Trainer profiles", "Free trial / join form", "Transformations gallery", "BMI calculator", "Opening hours with ladies timings"],
    sections: [
      { heading: "Plans and classes", body: ["Create monthly, quarterly or yearly plans with feature lists. Add classes with day, time, trainer, level and capacity; the timetable shows today's classes first."] },
      { heading: "Turning visitors into members", body: ["The join form captures goal and preferred plan and lands in your inbox; the BMI calculator keeps visitors engaged."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Can I show separate ladies timings?", a: "Yes. Add ladies classes to the timetable and mention timings in the hours section." }],
  },
  law: {
    title: "Law firm websites with practice areas and consultations",
    intro: "Clients look for the right practice area and a credible advocate. These templates present practice areas, attorney profiles and case results, and book consultations confidentially.",
    features: ["Practice areas with detail pages", "Attorney profiles with specialties", "Consultation booking form", "Case results and stats", "Process and why-us sections", "Confidential contact", "Urdu support for clients"],
    sections: [
      { heading: "Show expertise clearly", body: ["Each practice area (civil, criminal, family, property, corporate) has its own page with a summary and details. Attorneys list bar credentials and specialties."] },
      { heading: "Consultations that convert", body: ["The consultation form asks for practice area, case type and preferred date, and lands privately in your inbox."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "Is client information secure?", a: "Form submissions are stored per firm in an isolated database and visible only to your logged-in users." }],
  },
  printing: {
    title: "Printing shop websites with quotes and file upload",
    intro: "Printing customers need a price, a proof and a deadline. These templates take quote requests with design files, show services with starting prices and estimate costs instantly.",
    features: ["Quote request form with up to three design files", "Services with starting prices and quantity tiers", "Instant price estimator", "Portfolio gallery", "Process section (upload, approve, print)", "Brands and testimonials", "Turnaround messaging"],
    sections: [
      { heading: "Quotes with files attached", body: ["Customers choose a service, quantity, size, paper and finishing, attach PDF/AI/PSD files and send. Files are stored privately and downloadable from the lead."] },
      { heading: "Transparent pricing", body: ["Set 'from' prices and quantity tiers on each service; the estimator on the site calculates a ballpark before the customer even asks."] },
      common.admin,
      common.contact,
      common.language,
    ],
    faq: [{ q: "What file types can customers upload?", a: "PDF, AI, PSD, ZIP, JPG and PNG up to 25 MB each." }],
  },
};

export function getGuide(category: CategoryKey | string): Guide {
  const g = G[category as CategoryKey] ?? G.kitchen;
  return { slug: "feature-guide", ...g };
}

export function allGuides() {
  return CATEGORIES.map((c) => ({ category: c, guide: getGuide(c.key) }));
}
