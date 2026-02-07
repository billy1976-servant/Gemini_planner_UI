import type { SiteSkinDocument, SiteSkinNode } from "@/lib/site-skin/siteSkin.types";

type BlueprintScreen = {
  id?: string;
  type?: string;
  children?: any[];
  [key: string]: any;
};

function inferRoleFromNode(node: any, index: number): string {
  const t = String(node?.type ?? "").toLowerCase();
  if (t === "footer") return "footer";
  if (t === "toolbar") return "header";
  if (t === "section") return "content";
  if (t === "card" && index === 0) return "hero";
  return "content";
}

/**
 * Blueprint → SiteSkinDocument (layout-first)
 *
 * This is a compatibility adapter for the existing blueprint compiler output shape:
 * - screen -> sections -> children nodes
 *
 * Output is content-only `nodes[]` with inferred roles, ready for layout-engine composition.
 */
export function compileSkinFromBlueprintScreen(args: {
  screen: BlueprintScreen;
  domain?: string;
  pageId?: string;
}): SiteSkinDocument {
  const { screen } = args;
  const domain = args.domain ?? "apps-json";
  const pageId = args.pageId ?? (typeof screen.id === "string" ? screen.id : "screen");

  const sections = Array.isArray(screen.children) ? screen.children : [];
  const nodes: SiteSkinNode[] = [];

  // Flatten section children into role-tagged nodes
  sections.forEach((section: any) => {
    const children = Array.isArray(section?.children) ? section.children : [];
    children.forEach((n: any, i: number) => {
      nodes.push({
        ...(n as any),
        role: n?.role ?? inferRoleFromNode(n, i),
      } as any);
    });
  });

  return {
    meta: {
      domain,
      pageId,
      version: 1,
      generatedAt: new Date().toISOString(),
    },
    nodes,
  };
}

