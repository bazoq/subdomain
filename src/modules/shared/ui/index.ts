/**
 * Shared public UI kit consumed by every template. All blocks are theme-agnostic
 * (t-* utilities) and take `ctx: SiteContext`. Server blocks fetch their own data.
 *
 * Client pieces (Carousel, FaqAccordion, GalleryGrid, HeaderNav, AnnouncementBarClient)
 * are also exported for templates that want to pass their own data.
 */
export { TestimonialsBlock } from "./testimonials-block";
export { TestimonialsCarousel, TestimonialCard, type TestimonialItem } from "./testimonials-carousel";
export { FaqBlock } from "./faq-block";
export { FaqAccordion, type FaqEntry } from "./faq-accordion";
export { GalleryBlock } from "./gallery-block";
export { GalleryGrid, type GalleryImage } from "./gallery-grid";
export { TeamBlock, TeamCard } from "./team-block";
export { ServicesBlock, ServiceCard, servicePriceLabel } from "./services-block";
export { PostsBlock, PostCard } from "./posts-block";
export { HoursTable } from "./hours-table";
export { ContactInfo, contactItems } from "./contact-info";
export { MapEmbed, safeMapUrl } from "./map-embed";
export { ContactBlock } from "./contact-block";
export { AnnouncementBar } from "./announcement-bar";
export { AnnouncementBarClient } from "./announcement-bar-client";
export { StatsBlock, FeaturesBlock, ProcessBlock, CtaBlock, AboutBlock, BrandsMarquee, PromoStrip, sectionData } from "./section-blocks";
export { PageHero } from "./page-hero";
export { SiteFooter } from "./site-footer";
export { SiteHeader } from "./site-header";
export { HeaderNav, type HeaderNavItem } from "./header-nav";
export { SocialLinks } from "./social-links";
export { Breadcrumbs, type Crumb } from "./breadcrumbs";
export { PublicPagination } from "./pagination";
