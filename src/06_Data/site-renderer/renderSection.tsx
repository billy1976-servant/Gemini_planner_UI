/**
 * renderSection
 *
 * Maps section.type to visual component via section-registry.
 * Pure function - no side effects, no hardcoded content.
 */

import React from "react";
import { getSectionRenderer } from "@/lib/site-renderer/section-registry";
import type { SectionModel } from "@/lib/site-compiler/compileSiteToScreenModel";
import type { ProductModel } from "@/lib/site-compiler/compileSiteToScreenModel";

interface RenderSectionProps {
  section: SectionModel;
  products?: ProductModel[];
}

export default function renderSection({
  section,
  products = [],
}: RenderSectionProps): React.ReactElement | null {
  const renderer = getSectionRenderer(section.type);
  return renderer(section, products);
}
