// =====================================================
// MOLECULE LAYOUT RESOLVER (JSON-DRIVEN, PURE, SAFE)
// =====================================================
import layoutColumn from "@/lib/layout/definitions-molecule/layout-column.json";
import layoutRow from "@/lib/layout/definitions-molecule/layout-row.json";
import layoutStacked from "@/lib/layout/definitions-molecule/layout-stacked.json";
import layoutGrid from "@/lib/layout/definitions-molecule/layout-grid.json";


// =====================================================
// TYPES (LOCKED)
// =====================================================
export type LayoutFlow = "column" | "row" | "stacked" | "grid";


type LayoutDefinition = {
  layout: {
    flow: LayoutFlow;
    params?: Record<string, any>;
    responsive?: {
      breakpoint: number;
      flow: LayoutFlow;
      params?: Record<string, any>;
    };
  };
  defaults?: Record<string, any>;
  presets?: Record<string, Record<string, any>>;
};


// =====================================================
// 🔒 GLOBAL LAYOUT REGISTRY (JSON → HARD CAST)
// =====================================================
const LAYOUT_DEFINITIONS: Record<LayoutFlow, LayoutDefinition> = {
  column: layoutColumn as LayoutDefinition,
  row: layoutRow as LayoutDefinition,
  stacked: layoutStacked as LayoutDefinition,
  grid: layoutGrid as LayoutDefinition,
};


// =====================================================
// LOG-ONCE GUARD (DEV ONLY)
// =====================================================
const LOGGED = new Set<string>();
function logOnce(key: string, ...args: any[]) {
  if (LOGGED.has(key)) return;
  LOGGED.add(key);
  console.log("[molecule-layout-resolver]", ...args);
}


// =====================================================
// FLOW → ATOM PARAM TRANSLATION
// 🔑 FIX IS HERE (GRID COLUMNS)
// =====================================================
function translateFlow(flow: LayoutFlow, params: Record<string, any>) {
  switch (flow) {
    case "column":
      return {
        display: "flex",
        direction: "column",
        ...params,
      };


    case "row":
      return {
        display: "flex",
        direction: "row",
        ...params,
      };


    case "stacked":
      return {
        display: "flex",
        direction: "column",
        ...params,
      };


    case "grid": {
      const { columns, ...rest } = params ?? {};
      return {
        display: "grid",
        ...(columns
          ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
          : {}),
        ...rest,
      };
    }


    default:
      return {};
  }
}


// =====================================================
// 📱 RESPONSIVE RESOLUTION (UNCHANGED — AS REQUESTED)
// =====================================================
function resolveResponsive(layout: LayoutDefinition["layout"]) {
  if (!layout.responsive) return layout;
  if (typeof window === "undefined") return layout;


  const { breakpoint, flow, params } = layout.responsive;


  if (window.innerWidth <= breakpoint) {
    return {
      ...layout,
      flow,
      params: {
        ...(layout.params ?? {}),
        ...(params ?? {}),
      },
    };
  }


  return layout;
}


// =====================================================
// 🔑 PUBLIC RESOLVER (SINGLE ENTRY POINT)
// =====================================================
export function resolveMoleculeLayout(
  flow?: string,
  preset?: string | null,
  params?: Record<string, any>
): Record<string, any> {
  if (!flow) return params ?? {};


  const normalized = flow.toLowerCase() as LayoutFlow;
  const def = LAYOUT_DEFINITIONS[normalized];


  if (!def) {
    logOnce(`unknown:${flow}`, "❌ Unknown layout flow:", flow);
    return params ?? {};
  }


  const resolvedLayout = resolveResponsive(def.layout);


  const presetParams =
    preset && def.presets ? def.presets[preset] ?? {} : {};

  // Merge all params BEFORE calling translateFlow so it can process columns/gap from passed params
  // This ensures translateFlow sees the full merged params, not just definition params
  const mergedParams = {
    ...(def.defaults ?? {}),
    ...(resolvedLayout.params ?? {}),
    ...presetParams,
    ...(params ?? {}),
  };

  const translated = translateFlow(
    resolvedLayout.flow,
    mergedParams
  );

  // Return translated result (which includes display, gridTemplateColumns, etc.)
  // mergedParams are already included in translated via translateFlow
  return translated;
}


// =====================================================
// DEBUG HELPER (READ-ONLY)
// =====================================================
export function getLayoutDefinition(flow?: string) {
  if (!flow) return null;
  return (
    LAYOUT_DEFINITIONS[flow.toLowerCase() as LayoutFlow]?.layout ?? null
  );
}


export default resolveMoleculeLayout;

