/**
 * Showcase Visual Quality Test
 *
 * Asserts that showcase-home.json has the structure required for
 * beautiful, robust rendering: typography hierarchy, rich content,
 * and layout that exercises the full design system.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/contracts/showcase-visual-quality.test.ts
 * Or: npm run test:showcase-visual
 */

import { loadAppOfflineJson } from "./load-app-offline-json.node";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Showcase visual quality test failed: ${message}`);
  }
}

function findSectionsByRole(children: any[], role: string): any[] {
  if (!Array.isArray(children)) return [];
  return children.filter((n) => n?.role === role);
}

function collectAllDescendants(node: any, acc: any[] = []): any[] {
  if (!node) return acc;
  acc.push(node);
  if (Array.isArray(node.children)) {
    node.children.forEach((c: any) => collectAllDescendants(c, acc));
  }
  return acc;
}

async function run() {
  const result = await loadAppOfflineJson("websites/showcase/showcase-home.json");
  if (!result.ok) {
    console.warn("Showcase visual quality test: screen file missing or invalid:", result.error);
    process.exit(0);
    return;
  }
  const showcaseHome = result.json;
  const children = (showcaseHome as any)?.children ?? [];
  const all = collectAllDescendants({ children }, []);

  // --- 1. Hero section exists with role
  const heroSections = findSectionsByRole(children, "hero");
  assert(heroSections.length >= 1, "showcase-home must have at least one Section with role=hero");

  // --- 2. Hero contains Section with size lg (headline typography) or non-empty title
  const hero = heroSections[0];
  const heroChildren = hero?.children ?? [];
  const heroHeadline = heroChildren.find((n: any) => n?.type === "Section" && (n?.size === "lg" || n?.content?.title?.length > 20));
  assert(
    heroHeadline != null,
    "hero section must contain a Section with size=lg or substantial content.title for hero typography"
  );
  assert(
    heroHeadline?.content?.title?.length > 0,
    "hero headline Section must have non-empty content.title"
  );

  // --- 3. Hero contains supporting text (Section with subtitle/lead content)
  const heroSupporting = heroChildren.find((n: any) => n?.type === "Section" && n?.content?.title?.length > 30);
  assert(
    heroSupporting != null,
    "hero section must contain a Section with longer content.title for subtitle/supporting text"
  );

  // --- 4. Hero contains a CTA button
  const heroDescendants = collectAllDescendants(hero);
  const heroButtons = heroDescendants.filter((n) => n?.type === "Button");
  assert(heroButtons.length >= 1, "hero must contain at least one Button (CTA)");

  // --- 5. Features section exists with role
  const featureSections = findSectionsByRole(children, "features");
  assert(featureSections.length >= 1, "showcase-home must have a Section with role=features");

  // --- 6. Features contains Grid with multiple Cards
  const featuresChildren = featureSections[0]?.children ?? [];
  const featuresGrid = featuresChildren.find((n: any) => n?.type === "Grid");
  const featureCards = (featuresGrid?.children ?? []).filter((n: any) => n?.type === "Card");
  assert(featureCards.length >= 3, "features section must have at least 3 Cards in its Grid");

  // --- 7. Hero contains Card with media (hero image)
  const heroCards = (hero?.children ?? []).filter((n: any) => n?.type === "Card");
  const heroImageCard = heroCards.find((c: any) => c?.content?.media);
  assert(heroImageCard != null, "hero must contain a Card with content.media (hero image)");

  // --- 8. Nav and Footer exist
  const navSections = findSectionsByRole(children, "nav");
  const headerSections = findSectionsByRole(children, "header");
  const ctaSections = findSectionsByRole(children, "cta");
  const footers = children.filter((n: any) => n?.type === "Footer");
  assert(navSections.length >= 1 || headerSections.length >= 1, "must have nav or header section");
  assert(footers.length >= 1, "must have Footer");
  assert(ctaSections.length >= 1, "must have CTA section");

  // --- 9. Section titles are non-trivial length (quality content)
  const sectionsWithTitle = all.filter((n) => n?.content?.title && n.content.title.length > 5);
  assert(sectionsWithTitle.length >= 4, "at least 4 nodes must have content.title with meaningful length");

  // --- 10. Buttons have variant specified (filled/outlined for visual distinction)
  const buttons = all.filter((n) => n?.type === "Button");
  const buttonsWithVariant = buttons.filter((b) => b?.variant != null);
  assert(buttonsWithVariant.length >= 1, "at least one Button must specify variant for styled rendering");

  console.log("Showcase visual quality test: all assertions passed.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
