/**
 * Shell quick icons visibility diagnostic (plan: shell_icons_visibility_diagnostic).
 * Run in browser to determine why inline SVG icons appear empty/blank.
 * No architecture changes — investigation and report only.
 *
 * The ShellQuickIcons strip is implemented in GlobalAppSkin.tsx (BottomNavOnly),
 * not in a separate ShellQuickIcons.tsx file. The strip has data-molecule="ShellQuickIcons";
 * each icon is a button with data-shell-icon and a single child <svg>.
 */

const LOG_PREFIX = "[ShellIconsDiag]";

function step1ConfirmMount(): {
  wrapperPresent: boolean;
  width: number;
  height: number;
  inViewport: boolean;
  overflowChain: Array<{ tag: string; overflow: string }>;
} {
  const el = document.querySelector('[data-molecule="ShellQuickIcons"]');
  if (!el) {
    console.log(`${LOG_PREFIX} Step 1: Wrapper NOT present`);
    return { wrapperPresent: false, width: 0, height: 0, inViewport: false, overflowChain: [] };
  }
  const r = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  const inViewport = r.bottom <= window.innerHeight && r.top >= 0;
  const overflowChain: Array<{ tag: string; overflow: string }> = [];
  let p: Element | null = el.parentElement;
  while (p && p !== document.body) {
    const ps = window.getComputedStyle(p);
    if (ps.overflow !== "visible" || ps.overflowX !== "visible" || ps.overflowY !== "visible") {
      overflowChain.push({
        tag: p.tagName,
        overflow: `${ps.overflow} / ${ps.overflowX} / ${ps.overflowY}`,
      });
    }
    p = p.parentElement;
  }
  console.log(`${LOG_PREFIX} Step 1 — Mount:`, {
    wrapperPresent: true,
    width: r.width,
    height: r.height,
    rect: r,
    inViewport,
    overflowChain,
  });
  return {
    wrapperPresent: true,
    width: r.width,
    height: r.height,
    inViewport,
    overflowChain,
  };
}

function step2InspectButtons(): Array<{
  name: string;
  width: number;
  height: number;
  opacity: string;
  visibility: string;
  display: string;
  zIndex: string;
  pointerEvents: string;
  overflowChain: Array<{ tag: string; overflow: string }>;
}> {
  const buttons = document.querySelectorAll("[data-shell-icon]");
  const results: Array<{
    name: string;
    width: number;
    height: number;
    opacity: string;
    visibility: string;
    display: string;
    zIndex: string;
    pointerEvents: string;
    overflowChain: Array<{ tag: string; overflow: string }>;
  }> = [];
  buttons.forEach((btn, i) => {
    const r = btn.getBoundingClientRect();
    const cs = window.getComputedStyle(btn);
    const overflowChain: Array<{ tag: string; overflow: string }> = [];
    let p: Element | null = btn.parentElement;
    while (p && p !== document.body) {
      const ps = window.getComputedStyle(p);
      if (ps.overflow !== "visible" || ps.overflowX !== "visible" || ps.overflowY !== "visible") {
        overflowChain.push({ tag: p.tagName, overflow: ps.overflow });
      }
      p = p.parentElement;
    }
    const name = btn.getAttribute("data-shell-icon") ?? `button-${i}`;
    results.push({
      name,
      width: r.width,
      height: r.height,
      opacity: cs.opacity,
      visibility: cs.visibility,
      display: cs.display,
      zIndex: cs.zIndex,
      pointerEvents: cs.pointerEvents,
      overflowChain,
    });
  });
  console.log(`${LOG_PREFIX} Step 2 — Buttons:`, results);
  return results;
}

function step3InspectSvgs(): Array<{
  rectWidth: number;
  rectHeight: number;
  viewBox: string | null;
  fill: string;
  stroke: string;
  computedColor: string;
  parentRectWidth: number;
  parentRectHeight: number;
  flexShrink: string;
  overflow: string;
}> {
  const svgs = document.querySelectorAll("[data-shell-icon] svg");
  const results: Array<{
    rectWidth: number;
    rectHeight: number;
    viewBox: string | null;
    fill: string;
    stroke: string;
    computedColor: string;
    parentRectWidth: number;
    parentRectHeight: number;
    flexShrink: string;
    overflow: string;
  }> = [];
  svgs.forEach((svg, i) => {
    const r = svg.getBoundingClientRect();
    const cs = window.getComputedStyle(svg);
    const parent = svg.parentElement;
    const pcs = parent ? window.getComputedStyle(parent) : null;
    const pr = parent ? parent.getBoundingClientRect() : { width: 0, height: 0 };
    results.push({
      rectWidth: r.width,
      rectHeight: r.height,
      viewBox: svg.getAttribute("viewBox"),
      fill: svg.getAttribute("fill") || cs.fill,
      stroke: svg.getAttribute("stroke") || cs.stroke,
      computedColor: cs.color,
      parentRectWidth: pr.width,
      parentRectHeight: pr.height,
      flexShrink: pcs?.flexShrink ?? "n/a",
      overflow: cs.overflow,
    });
  });
  console.log(`${LOG_PREFIX} Step 3 — SVGs:`, results);
  return results;
}

function step4ZIndexStacking(): {
  stripZIndex: string;
  navZIndex: string;
  stripRect: DOMRect;
  navRect: DOMRect;
  overlap: boolean;
} {
  const strip = document.querySelector('[data-molecule="ShellQuickIcons"]');
  const nav = document.querySelector('[data-molecule="BottomNavOverlay"]');
  const defaultResult = {
    stripZIndex: "n/a",
    navZIndex: "n/a",
    stripRect: new DOMRect(0, 0, 0, 0),
    navRect: new DOMRect(0, 0, 0, 0),
    overlap: false,
  };
  if (!strip || !nav) {
    console.log(`${LOG_PREFIX} Step 4: strip or nav missing`, { strip: !!strip, nav: !!nav });
    return defaultResult;
  }
  const sr = strip.getBoundingClientRect();
  const nr = nav.getBoundingClientRect();
  const scs = window.getComputedStyle(strip);
  const ncs = window.getComputedStyle(nav);
  const overlap = sr.bottom > nr.top && sr.top < nr.bottom;
  const out = {
    stripZIndex: scs.zIndex,
    navZIndex: ncs.zIndex,
    stripRect: sr,
    navRect: nr,
    overlap,
  };
  console.log(`${LOG_PREFIX} Step 4 — Z-index & overlap:`, out);
  return out;
}

function step5VisibilityProbe(): boolean {
  const svgs = document.querySelectorAll("[data-shell-icon] svg");
  let applied = false;
  svgs.forEach((s) => {
    (s as HTMLElement).style.outline = "2px solid red";
    (s as HTMLElement).style.background = "yellow";
    (s as HTMLElement).style.width = "24px";
    (s as HTMLElement).style.height = "24px";
    applied = true;
  });
  console.log(
    `${LOG_PREFIX} Step 5 — Visibility probe applied (outline + yellow bg). Check viewport; outlines visible = layout/sizing OK.`
  );
  return applied;
}

function step6CompareWithFab(): {
  fabPosition: string;
  fabZIndex: string;
  shellPosition: string;
  shellZIndex: string;
  fabParentMolecule: string | null;
  shellParentMolecule: string | null;
} {
  const fab = document.querySelector("[data-play-fab]");
  const firstShell = document.querySelector("[data-shell-icon]");
  const empty = {
    fabPosition: "n/a",
    fabZIndex: "n/a",
    shellPosition: "n/a",
    shellZIndex: "n/a",
    fabParentMolecule: null as string | null,
    shellParentMolecule: null as string | null,
  };
  if (!fab && !firstShell) {
    console.log(`${LOG_PREFIX} Step 6: FAB and shell button not found`);
    return empty;
  }
  const fcs = fab ? window.getComputedStyle(fab) : null;
  const scs = firstShell ? window.getComputedStyle(firstShell) : null;
  const out = {
    fabPosition: fcs?.position ?? "n/a",
    fabZIndex: fcs?.zIndex ?? "n/a",
    shellPosition: scs?.position ?? "n/a",
    shellZIndex: scs?.zIndex ?? "n/a",
    fabParentMolecule: fab?.parentElement?.closest("[data-molecule]")?.getAttribute("data-molecule") ?? null,
    shellParentMolecule: firstShell?.closest("[data-molecule]")?.getAttribute("data-molecule") ?? null,
  };
  console.log(`${LOG_PREFIX} Step 6 — FAB vs Shell:`, out);
  return out;
}

function step7Report(
  s1: ReturnType<typeof step1ConfirmMount>,
  s2: ReturnType<typeof step2InspectButtons>,
  s3: ReturnType<typeof step3InspectSvgs>,
  s4: ReturnType<typeof step4ZIndexStacking>,
  s6: ReturnType<typeof step6CompareWithFab>
): void {
  const buttonsRendering = s2.length === 4 && s2.every((b) => b.width > 0 && b.height > 0);
  const svgPresent = s3.length === 4;
  const svgSizeZero = s3.some((s) => s.rectWidth === 0 || s.rectHeight === 0);
  const clipped = s1.overflowChain.length > 0 || s2.some((b) => b.overflowChain.length > 0);
  const behindLayer =
    s4.overlap && parseInt(s4.stripZIndex, 10) < parseInt(s4.navZIndex, 10)
      ? "BottomNavOverlay (higher z-index)"
      : s4.overlap
        ? "Overlap but strip z-index >= nav"
        : "No overlap";
  let exactRule = "";
  let fileAndLine = "";
  if (s4.overlap && parseInt(s4.stripZIndex, 10) < parseInt(s4.navZIndex, 10)) {
    exactRule = "z-index 55 (ShellQuickIcons) < 60 (BottomNavOverlay); strip drawn behind nav bar.";
    fileAndLine = "ShellQuickIcons.tsx STRIP_STYLE_BASE zIndex: 55; layout.tsx BottomNavOverlay zIndex: 60";
  } else if (svgSizeZero) {
    exactRule = "One or more SVGs have 0×0 computed size (layout/sizing).";
    fileAndLine = "ShellQuickIcons.tsx icon wrapper or SVG dimensions";
  } else if (clipped) {
    exactRule = "Ancestor overflow non-visible or contain/clip.";
    fileAndLine = "Check overflow chain (see Step 1/2 logs)";
  }
  const table = [
    ["1) Are buttons rendering?", `${buttonsRendering} (rect: ${s2.map((b) => `${b.width}×${b.height}`).join(", ") || "n/a"}`],
    ["2) Are SVG nodes present?", `${svgPresent} (count: ${s3.length})`],
    ["3) Are they size 0?", `${svgSizeZero} (widths: ${s3.map((s) => s.rectWidth).join(", ")}, heights: ${s3.map((s) => s.rectHeight).join(", ")})`],
    ["4) Are they clipped?", `${clipped} ${s1.overflowChain.length ? `(wrapper chain: ${s1.overflowChain.map((o) => o.tag).join(" ")})` : ""}`],
    ["5) Are they behind another layer?", behindLayer],
    ["6) Exact CSS rule causing invisibility", exactRule || "(see steps above)"],
    ["7) File + line where it originates", fileAndLine || "(see steps above)"],
  ];
  console.log(`${LOG_PREFIX} Step 7 — Final report:`);
  console.table(table);
}

/**
 * Run the full shell icons visibility diagnostic (Steps 1–7).
 * Call from browser context (e.g. after ShellQuickIcons has mounted).
 * Optionally pass true to apply Step 5 visibility probe (red outline + yellow bg on SVGs).
 */
export function runShellIconsVisibilityDiagnostic(applyProbe = true): void {
  if (typeof document === "undefined") {
    console.warn(`${LOG_PREFIX} Run in browser only.`);
    return;
  }
  console.group(`${LOG_PREFIX} Shell quick icons visibility diagnostic`);
  const s1 = step1ConfirmMount();
  const s2 = step2InspectButtons();
  const s3 = step3InspectSvgs();
  const s4 = step4ZIndexStacking();
  if (applyProbe) step5VisibilityProbe();
  const s6 = step6CompareWithFab();
  step7Report(s1, s2, s3, s4, s6);
  console.groupEnd();
}
