/**
 * LAYOUT INVESTIGATION: Validate screen JSON files for layout field presence
 * Scans all screen JSON files and reports on layout field integrity
 */

type SectionInfo = {
  path: string;
  id?: string;
  role?: string;
  layout?: string;
  hasLayout: boolean;
};

type ScreenValidation = {
  file: string;
  screenId?: string;
  sections: SectionInfo[];
  allSectionsHaveLayout: boolean;
  duplicateIds: string[];
  uniqueLayouts: string[];
};

/**
 * Extract all sections from a JSON node recursively
 */
function extractSections(node: any, path: string = "root"): SectionInfo[] {
  const results: SectionInfo[] = [];
  
  if (!node || typeof node !== "object") {
    return results;
  }
  
  const nodeType = (node.type ?? "").toLowerCase();
  if (nodeType === "section") {
    results.push({
      path,
      id: node.id,
      role: node.role,
      layout: typeof node.layout === "string" ? node.layout : undefined,
      hasLayout: typeof node.layout === "string" && node.layout.trim() !== "",
    });
  }
  
  if (Array.isArray(node.children)) {
    node.children.forEach((child: any, idx: number) => {
      results.push(...extractSections(child, `${path}.children[${idx}]`));
    });
  }
  
  return results;
}

/**
 * Validate a single screen JSON file
 */
export function validateScreenJson(filePath: string, jsonData: any): ScreenValidation {
  const renderRoot = jsonData?.root ?? jsonData?.screen ?? jsonData?.node ?? jsonData;
  const sections = extractSections(renderRoot);
  
  const sectionIds = sections.map(s => s.id).filter(Boolean) as string[];
  const duplicateIds = sectionIds.filter((id, idx) => sectionIds.indexOf(id) !== idx);
  
  const uniqueLayouts = [...new Set(sections.map(s => s.layout).filter(Boolean))] as string[];
  const allSectionsHaveLayout = sections.length > 0 && sections.every(s => s.hasLayout);
  
  return {
    file: filePath,
    screenId: renderRoot?.id,
    sections,
    allSectionsHaveLayout,
    duplicateIds: [...new Set(duplicateIds)],
    uniqueLayouts,
  };
}

/**
 * Log validation results in development mode
 */
export function logScreenJsonValidation(validation: ScreenValidation): void {
  if (process.env.NODE_ENV !== "development") return;
  
  console.log("[LAYOUT INVESTIGATION] Screen JSON Validation", {
    file: validation.file,
    screenId: validation.screenId ?? "(none)",
    totalSections: validation.sections.length,
    allSectionsHaveLayout: validation.allSectionsHaveLayout,
    sectionsWithoutLayout: validation.sections.filter(s => !s.hasLayout).map(s => ({
      path: s.path,
      id: s.id ?? "(none)",
      role: s.role ?? "(none)",
    })),
    duplicateIds: validation.duplicateIds.length > 0 ? validation.duplicateIds : "(none)",
    uniqueLayouts: validation.uniqueLayouts,
    layoutDistribution: validation.sections.reduce((acc, s) => {
      const layout = s.layout ?? "(missing)";
      acc[layout] = (acc[layout] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  });
}
