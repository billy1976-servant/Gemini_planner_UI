// =====================================================
// SCREEN LAYOUT RESOLVER (SCREEN-ONLY, LOCKED)
// =====================================================


// Screen layout definitions ONLY
import row from "@/layout/definitions-screen/row.json";
import column from "@/layout/definitions-screen/column.json";
import grid from "@/layout/definitions-screen/grid.json";
import stack from "@/layout/definitions-screen/stack.json";
import page from "@/layout/definitions-screen/page.json";


/**
 * Screen layout registry
 *
 * RULES (LOCKED):
 * - This file handles SCREEN layouts ONLY
 * - NO molecule layouts allowed here
 * - Molecule layouts are resolved by molecule-layout-resolver.ts
 * - layout.type selects ONLY from this registry
 */
const SCREEN_LAYOUT_DEFINITIONS: Record<
  string,
  {
    defaults?: Record<string, any>;
    presets?: Record<string, Record<string, any>>;
    layout?: any;
  }
> = {
  row,
  column,
  grid,
  stack,
  page,
};


/**
 * Resolve screen layout params:
 * defaults → preset → explicit params
 */
export function resolveScreenLayout(
  type?: string,
  preset?: string | null,
  params?: Record<string, any>
): Record<string, any> {
  if (!type) return params ?? {};


  const def = SCREEN_LAYOUT_DEFINITIONS[type];
  if (!def) {
    console.warn(`[screen-layout-resolver] Unknown screen layout type: ${type}`);
    return params ?? {};
  }


  const defaults = def.defaults ?? {};
  const presetParams =
    preset && def.presets ? def.presets[preset] ?? {} : {};


  return {
    ...defaults,
    ...presetParams,
    ...(params ?? {}),
  };
}


/**
 * Resolve full screen layout definition (used by renderer)
 */
export function getScreenLayoutDefinition(type?: string) {
  if (!type) return null;
  return SCREEN_LAYOUT_DEFINITIONS[type]?.layout ?? null;
}


export default resolveScreenLayout;

