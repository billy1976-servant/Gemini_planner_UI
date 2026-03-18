// src/ux/engine/apply-ux-styles.ts
// ---------------------------------------------------------------
// TEMPORARY STUB
// This file only provides minimal global UX defaults (spacing/alignment).
// It will be fully replaced once the full UX token system is built.
// ---------------------------------------------------------------


export function applyUXStyles(
    type: string,
    props: Record<string, any> = {}
  ): Record<string, any> {
    return {
      ...props,
      // Future UX tokens will override these
      margin: props.margin ?? 0,
      padding: props.padding ?? 0,
      align: props.align ?? "start",
      density: props.density ?? "normal",
    };
  }
  
  
  