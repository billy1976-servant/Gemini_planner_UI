/**
 * Sync loader for organ variant JSON.
 * Variants are imported at build time; add new organs here.
 */

import headerDefault from "./header/variants/default.json";
import headerStickySplit from "./header/variants/sticky-split.json";
import headerTransparent from "./header/variants/transparent.json";
import headerMinimal from "./header/variants/minimal.json";
import headerCentered from "./header/variants/centered.json";
import headerFullWidth from "./header/variants/full-width.json";
import headerMegaReady from "./header/variants/mega-ready.json";
import headerShrinkOnScroll from "./header/variants/shrink-on-scroll.json";
import headerWithAnnouncement from "./header/variants/with-announcement.json";
import headerCompact from "./header/variants/compact.json";
import headerLogoCenter from "./header/variants/logo-center.json";
import headerNavLeft from "./header/variants/nav-left.json";

import heroCentered from "./hero/variants/centered.json";
import heroImageBg from "./hero/variants/image-bg.json";
import heroSplitLeft from "./hero/variants/split-left.json";
import heroSplitRight from "./hero/variants/split-right.json";
import heroFullScreen from "./hero/variants/full-screen.json";
import heroShort from "./hero/variants/short.json";
import heroWithCta from "./hero/variants/with-cta.json";
import heroVideoReady from "./hero/variants/video-ready.json";
import heroRightAligned from "./hero/variants/right-aligned.json";

import navDefault from "./nav/variants/default.json";
import navDropdown from "./nav/variants/dropdown.json";
import navMobileCollapse from "./nav/variants/mobile-collapse.json";
import navCenteredLinks from "./nav/variants/centered-links.json";

import footerMultiColumn from "./footer/variants/multi-column.json";
import footerMinimal from "./footer/variants/minimal.json";
import footerWithNewsletter from "./footer/variants/with-newsletter.json";
import footerCentered from "./footer/variants/centered.json";
import footerDense from "./footer/variants/dense.json";

import contentTextOnly from "./content-section/variants/text-only.json";
import contentMediaLeft from "./content-section/variants/media-left.json";
import contentMediaRight from "./content-section/variants/media-right.json";
import contentZigzag from "./content-section/variants/zigzag.json";

import features2Col from "./features-grid/variants/2-col.json";
import features3Col from "./features-grid/variants/3-col.json";
import features4Col from "./features-grid/variants/4-col.json";
import featuresRepeater from "./features-grid/variants/repeater.json";

import galleryGrid2 from "./gallery/variants/grid-2.json";
import galleryGrid3 from "./gallery/variants/grid-3.json";
import galleryGrid4 from "./gallery/variants/grid-4.json";
import galleryCarouselReady from "./gallery/variants/carousel-ready.json";

import testimonialsGrid3 from "./testimonials/variants/grid-3.json";
import testimonialsGrid2 from "./testimonials/variants/grid-2.json";
import testimonialsSingleFeatured from "./testimonials/variants/single-featured.json";
import testimonialsCarouselReady from "./testimonials/variants/carousel-ready.json";

import pricing2Tier from "./pricing/variants/2-tier.json";
import pricing3Tier from "./pricing/variants/3-tier.json";
import pricing4Tier from "./pricing/variants/4-tier.json";
import pricingHighlighted from "./pricing/variants/highlighted.json";
import pricingMinimal from "./pricing/variants/minimal.json";

import faqAccordion from "./faq/variants/accordion.json";
import faqList from "./faq/variants/list.json";
import faqTwoColumn from "./faq/variants/two-column.json";

import ctaBanner from "./cta/variants/banner.json";
import ctaStrip from "./cta/variants/strip.json";
import ctaSplit from "./cta/variants/split.json";
import ctaFullWidth from "./cta/variants/full-width.json";

const asRecord = (x: unknown) => x as Record<string, unknown>;

const VARIANTS: Record<string, Record<string, unknown>> = {
  header: {
    default: asRecord(headerDefault),
    "sticky-split": asRecord(headerStickySplit),
    transparent: asRecord(headerTransparent),
    minimal: asRecord(headerMinimal),
    centered: asRecord(headerCentered),
    "full-width": asRecord(headerFullWidth),
    "mega-ready": asRecord(headerMegaReady),
    "shrink-on-scroll": asRecord(headerShrinkOnScroll),
    "with-announcement": asRecord(headerWithAnnouncement),
    compact: asRecord(headerCompact),
    "logo-center": asRecord(headerLogoCenter),
    "nav-left": asRecord(headerNavLeft),
  },
  hero: {
    default: asRecord(heroCentered),
    centered: asRecord(heroCentered),
    "image-bg": asRecord(heroImageBg),
    "split-left": asRecord(heroSplitLeft),
    "split-right": asRecord(heroSplitRight),
    "full-screen": asRecord(heroFullScreen),
    short: asRecord(heroShort),
    "with-cta": asRecord(heroWithCta),
    "video-ready": asRecord(heroVideoReady),
    "right-aligned": asRecord(heroRightAligned),
  },
  nav: {
    default: asRecord(navDefault),
    dropdown: asRecord(navDropdown),
    "mobile-collapse": asRecord(navMobileCollapse),
    "centered-links": asRecord(navCenteredLinks),
  },
  footer: {
    default: asRecord(footerMultiColumn),
    "multi-column": asRecord(footerMultiColumn),
    minimal: asRecord(footerMinimal),
    "with-newsletter": asRecord(footerWithNewsletter),
    centered: asRecord(footerCentered),
    dense: asRecord(footerDense),
  },
  "content-section": {
    default: asRecord(contentTextOnly),
    "text-only": asRecord(contentTextOnly),
    "media-left": asRecord(contentMediaLeft),
    "media-right": asRecord(contentMediaRight),
    zigzag: asRecord(contentZigzag),
  },
  "features-grid": {
    default: asRecord(features3Col),
    "2-col": asRecord(features2Col),
    "3-col": asRecord(features3Col),
    "4-col": asRecord(features4Col),
    repeater: asRecord(featuresRepeater),
  },
  gallery: {
    default: asRecord(galleryGrid3),
    "grid-2": asRecord(galleryGrid2),
    "grid-3": asRecord(galleryGrid3),
    "grid-4": asRecord(galleryGrid4),
    "carousel-ready": asRecord(galleryCarouselReady),
  },
  testimonials: {
    default: asRecord(testimonialsGrid3),
    "grid-3": asRecord(testimonialsGrid3),
    "grid-2": asRecord(testimonialsGrid2),
    "single-featured": asRecord(testimonialsSingleFeatured),
    "carousel-ready": asRecord(testimonialsCarouselReady),
  },
  pricing: {
    default: asRecord(pricing3Tier),
    "2-tier": asRecord(pricing2Tier),
    "3-tier": asRecord(pricing3Tier),
    "4-tier": asRecord(pricing4Tier),
    highlighted: asRecord(pricingHighlighted),
    minimal: asRecord(pricingMinimal),
  },
  faq: {
    default: asRecord(faqAccordion),
    accordion: asRecord(faqAccordion),
    list: asRecord(faqList),
    "two-column": asRecord(faqTwoColumn),
  },
  cta: {
    default: asRecord(ctaBanner),
    banner: asRecord(ctaBanner),
    strip: asRecord(ctaStrip),
    split: asRecord(ctaSplit),
    "full-width": asRecord(ctaFullWidth),
  },
};

/**
 * Load organ variant by id. Returns the variant root node (compound tree root) or null if not found.
 */
export function loadOrganVariant(organId: string, variantId: string): unknown {
  const normalizedOrgan = (organId ?? "").toLowerCase().trim();
  const normalizedVariant = (variantId ?? "default").toLowerCase().trim();
  const organVariants = VARIANTS[normalizedOrgan];
  if (!organVariants) return null;
  const variant = organVariants[normalizedVariant] ?? organVariants["default"];
  return variant ?? null;
}
