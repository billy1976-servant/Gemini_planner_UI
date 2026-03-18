---
name: Organ V1 Compliance Scan
overview: Scan organs/ and organisms/ for BUILD_PROTOCOL (ORGAN)_V1.md hard violations only; produce docs/TRUE_ORGAN_V1_COMPLIANCE_SCAN.md with per-file, per-line violations and summary counts. No code changes.
todos: []
isProject: false
---

# TRUE ORGAN V1 Compliance Scan Plan

## Scope

- **Protocol:** [BUILD_PROTOCOL (ORGAN)_V1.md](src/02_Contracts_Reports/build_protocol/BUILD_PROTOCOL (ORGAN)_V1.md)
- **Paths:** `src/04_Presentation/components/organs/`, `src/04_Presentation/components/organisms/`
- **Action:** Scan only; no modifications.

## Violation Rules (from user)

1. Raw HTML primitives: `<div`, `<span`, `<button`, `<input`, `<textarea`, `<ul`, `<li`, `<header`, `<aside`, `<footer`
2. Inline handlers: `onClick=`, `onChange=`, `onSubmit=`, `onMouse`, `onKey`
3. Inline styles: `style={{`, `style=`
4. Hex colors: `#` (hex color codes)
5. px/rem literals: `px`, `rem` (in style values)
6. Direct state: `setState(`, `useState(`, `useReducer(`, `dispatch(`
7. Direct palette: `var(--color`, `var(--spacing`

## Scan Results Summary

### Organisms

- **All organism TSX files:** No matches for any of the 7 violation patterns. Organisms directory is **FULLY COMPLIANT**.

### Organs

Violations found in **4 files** under `organs/`:


| File                            | Raw HTML | Inline handlers | Inline styles | Hex | px/rem        | State | var(--color/--spacing) |
| ------------------------------- | -------- | --------------- | ------------- | --- | ------------- | ----- | ---------------------- |
| OrganPanel.tsx                  | Yes      | Yes             | Yes           | No  | Yes (px)      | Yes   | Yes                    |
| tsx/website/NodeRegistry.tsx    | Yes      | No              | Yes           | No  | Yes (px, rem) | No    | Yes                    |
| tsx/website/DevNodePanel.tsx    | Yes      | Yes             | Yes           | Yes | Yes (px)      | Yes   | Yes                    |
| tsx/website/WebsiteTemplate.tsx | Yes      | No              | Yes           | No  | No            | No    | No (only style spread) |


---

## Report Content for docs/TRUE_ORGAN_V1_COMPLIANCE_SCAN.md

The following is the exact content to be written to **docs/TRUE_ORGAN_V1_COMPLIANCE_SCAN.md** when the plan is executed.

---

```markdown
# TRUE ORGAN V1 Compliance Scan

**Protocol:** BUILD_PROTOCOL (ORGAN)_V1.md  
**Scope:** `src/04_Presentation/components/organs/`, `src/04_Presentation/components/organisms/`  
**Scan type:** Hard violations only. No code modified.

---

## Violations (by file, line, type, snippet, classification)

### src/04_Presentation/components/organs/OrganPanel.tsx

| Line | Violation type | Code snippet | Classification |
|------|----------------|--------------|----------------|
| 3 | Direct state (useState) | `import React, { useState, useRef, useEffect }` | ORGAN |
| 65 | Direct palette | `background: "var(--color-surface-1)"` | ORGAN |
| 67 | Direct palette | `padding: "var(--spacing-5)"` | ORGAN |
| 77 | Direct palette | `marginBottom: "var(--spacing-4)"` | ORGAN |
| 78 | Direct palette | `color: "var(--color-text-primary)"` | ORGAN |
| 82 | Direct palette | `marginBottom: "var(--spacing-4)"` | ORGAN |
| 87 | Direct palette | `marginBottom: "var(--spacing-2)"` | ORGAN |
| 88 | Direct palette | `color: "var(--color-text-secondary)"` | ORGAN |
| 93 | Direct palette | `padding: "var(--spacing-2) var(--spacing-3)"` | ORGAN |
| 95 | px literal / Direct palette | `border: "1px solid var(--color-border)"` | ORGAN |
| 96 | Direct palette | `background: "var(--color-surface-1)"` | ORGAN |
| 121 | Direct state (useState) | `const [layoutViewMode, setLayoutViewMode] = useState<...>` | ORGAN |
| 122 | Direct state (useState) | `const [layoutMode, setLayoutMode] = useState<...>` | ORGAN |
| 124 | Direct state (useState) | `const [layoutPickerModeBySection, setLayoutPickerModeBySection] = useState<...>` | ORGAN |
| 129 | Direct state (setState) | `setLayoutPickerModeBySection((prev) => ...)` | ORGAN |
| 214 | Raw HTML (aside), Inline style | `<aside style={PANEL_STYLE} data-organ-panel>` | ORGAN |
| 215 | Raw HTML (div), Inline style | `<div style={TITLE_STYLE}>Layout</div>` | ORGAN |
| 216 | Raw HTML (div implicit via p), Inline style, Direct palette | `<p style={{ color: "var(--color-text-secondary)", margin: 0 }}>` | ORGAN |
| 261 | Raw HTML (aside), Inline style | `<aside ref={...} style={PANEL_STYLE} data-organ-panel>` | ORGAN |
| 262 | Raw HTML (div), Inline style | `<div style={TITLE_STYLE}>Layout controls</div>` | ORGAN |
| 263 | Inline style, Direct palette | `<p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--spacing-4)", ... }}>` | ORGAN |
| 266 | Raw HTML (div), Inline style, Direct palette | `<div style={{ marginBottom: "var(--spacing-4)", ... }}>` | ORGAN |
| 267 | Raw HTML (span), Inline style, Direct palette | `<span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>` | ORGAN |
| 269 | Raw HTML (button) | `<button` | ORGAN |
| 272 | Inline handler (onClick) | `onClick={() => setLayoutViewMode(mode)}` | ORGAN |
| 273-284 | Inline style, px literal, Direct palette | `style={{ padding: "6px 12px", borderRadius: "8px", ... "var(--color-primary)" }}` | ORGAN |
| 290 | Raw HTML (div), Inline style, px, Direct palette | `<div style={{ ... "1px solid var(--color-border)", ... }}>` | ORGAN |
| 292 | Raw HTML (button) | `<button` | ORGAN |
| 295 | Inline handler (onClick) | `onClick={() => setLayoutMode(mode)}` | ORGAN |
| 296-306 | Inline style, px literal, Direct palette | `style={{ padding: "8px 12px", ... "var(--color-primary)" }}` | ORGAN |
| 393-395 | Direct palette, px | `paddingTop: "var(--spacing-3)", borderBottom: "1px solid var(--color-border)"` | ORGAN |
| 502 | Raw HTML (div), Inline style | `<div key={sectionKey} style={rowBlockStyle}>` | ORGAN |
| 503 | Raw HTML (div), Inline style, Direct palette | `<div style={{ ...LABEL_STYLE, fontWeight: 600 }}>` | ORGAN |
| 512 | Inline handler (onChange) | `onChange={(id) => fireOrganChange(sectionKey, id)}` | ORGAN |
| 523 | Raw HTML (div), Inline style, Direct palette, px | `<div style={{ marginBottom: "var(--spacing-2)", ... "1px solid var(--color-border)" }}>` | ORGAN |
| 527 | Raw HTML (button) | `<button` | ORGAN |
| 530 | Inline handler (onClick) | `onClick={() => setLayoutPickerMode(sectionKey, mode)}` | ORGAN |
| 531-540 | Inline style, px literal, Direct palette | `style={{ padding: "6px 10px", ... "var(--color-primary)" }}` | ORGAN |
| 553 | Inline handler (onChange) | `onChange={(id) => fireSectionChange(sectionKey, id)}` | ORGAN |
| 563 | Inline handler (onChange) | `onChange={(id) => fireCardChange(sectionKey, id)}` | ORGAN |
| 575 | Inline handler (onChange) | `onChange={(id) => fireSectionChange(sectionKey, id)}` | ORGAN |
| 585 | Inline handler (onChange) | `onChange={(id) => fireCardChange(sectionKey, id)}` | ORGAN |
| 601 | Inline style, Direct palette | `<label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-1)" }}>` | ORGAN |
| 607 | Inline handler (onChange) | `onChange={(e) => fireOrganChange(sectionKey, e.target.value)}` | ORGAN |
| 608 | Inline style | `style={SELECT_STYLE}` | ORGAN |
| 621 | Inline style, Direct palette | `<label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-2)" }}>` | ORGAN |
| 627 | Inline handler (onChange) | `onChange={(e) => { ... fireSectionChange(sectionKey, value); }}` | ORGAN |
| 631 | Inline style | `style={SELECT_STYLE}` | ORGAN |
| 644 | Inline style, Direct palette | `<label style={{ ...LABEL_STYLE, marginTop: "var(--spacing-2)" }}>` | ORGAN |
| 650 | Inline handler (onChange) | `onChange={(e) => fireCardChange(sectionKey, e.target.value)}` | ORGAN |
| 651 | Inline style | `style={SELECT_STYLE}` | ORGAN |

### src/04_Presentation/components/organs/tsx/website/NodeRegistry.tsx

| Line | Violation type | Code snippet | Classification |
|------|----------------|--------------|----------------|
| 9 | Raw HTML (header) | `<header` | ORGAN |
| 10-18 | Inline style, Direct palette, rem | `style={{ padding: "var(--spacing-md, 1rem)", ... "var(--color-border)" }}` | ORGAN |
| 20 | Raw HTML (span), Inline style, Direct palette, rem | `<span style={{ fontSize: "var(--text-lg, 1.25rem)", ... "var(--color-text-primary)" }}>` | ORGAN |
| 35-37 | Inline style, Direct palette, rem | `padding: "var(--spacing-xl, 2rem)", ... "var(--color-text-primary)"` | ORGAN |
| 40 | Inline style, rem | `fontSize: "var(--text-2xl, 1.5rem)"` | ORGAN |
| 44 | Inline style, Direct palette, rem | `fontSize: "var(--text-md, 1rem)", ... "var(--spacing-sm, 0.5rem)"` | ORGAN |
| 55-60 | Inline style, Direct palette, rem | `padding: "var(--spacing-md, 1rem)", ... "var(--color-text-primary)"` | ORGAN |
| 64 | Inline style, Direct palette, rem | `fontSize: "var(--text-xl, 1.25rem)", margin: "0 0 var(--spacing-sm, 0.5rem)"` | ORGAN |
| 68 | Raw HTML (div), Inline style, Direct palette | `<div style={{ color: "var(--color-text-secondary)" }}>` | ORGAN |
| 77-91 | Inline style, Direct palette, rem, px | `padding: "var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem)", borderRadius: "var(--radius-md, 0.5rem)"` | ORGAN |
| 104 | Raw HTML (footer) | `<footer` | ORGAN |
| 105-114 | Inline style, Direct palette, rem, px | `padding: "var(--spacing-md, 1rem)", borderTop: "1px solid var(--color-border)", fontSize: "var(--text-sm, 0.875rem)"` | ORGAN |
| 126-135 | Inline style, Direct palette, rem | (style block with var(--spacing-*), var(--color-*), 1.25rem) | ORGAN |
| 141-145 | Inline style, Direct palette, rem | (style block) | ORGAN |
| 161-167 | Inline style, Direct palette, rem | (style block) | ORGAN |
| 176-184 | Inline style, Direct palette, rem | (style block) | ORGAN |
| 183 | Raw HTML (div) | `<div` | ORGAN |
| 184-199 | Inline style, px, rem, Direct palette | `gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--spacing-md, 1rem)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md, 0.5rem)"` | ORGAN |
| 191 | Raw HTML (div) | `<div` | ORGAN |
| 202 | Raw HTML (span), Inline style, Direct palette | `<span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>` | ORGAN |
| 203 | Raw HTML (span), Inline style, Direct palette, rem | `<span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm, 0.875rem)" }}>` | ORGAN |

### src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx

| Line | Violation type | Code snippet | Classification |
|------|----------------|--------------|----------------|
| 17 | Raw HTML (div), Inline style, Hex color | `<div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>` | ORGAN |
| 23 | Direct state (useState) | `const [mounted, setMounted] = useState(false);` | ORGAN |
| 38 | Raw HTML (div), Inline style, Hex color | `<div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>` | ORGAN |
| 46 | Raw HTML (div), Inline style, Hex color | `<div style={{ fontSize: 14, color: "var(--color-text-secondary, #5f6368)" }}>` | ORGAN |
| 58 | Raw HTML (div), Inline style | `<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>` | ORGAN |
| 59 | Raw HTML (div), Inline style, Hex color | `<div style={{ fontSize: 12, ... color: "var(--color-text-primary, #202124)" }}>` | ORGAN |
| 60 | Raw HTML (div), Inline style | `<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>` | ORGAN |
| 62 | Raw HTML (div) | `<div` | ORGAN |
| 64-72 | Inline style, px, Hex color, Direct palette | `style={{ ... padding: "8px 10px", background: "var(--color-surface-1, #f1f3f4)", border: "1px solid var(--color-border, #dadce0)" }}` | ORGAN |
| 74 | Raw HTML (span), Inline style, Hex color | `<span style={{ fontSize: 13, color: "var(--color-text-primary, #202124)" }}>` | ORGAN |
| 75 | Raw HTML (div), Inline style | `<div style={{ display: "flex", gap: 4 }}>` | ORGAN |
| 76 | Raw HTML (button) | `<button` | ORGAN |
| 78 | Inline handler (onClick) | `onClick={() => handleMove(index, "up")}` | ORGAN |
| 80-86 | Inline style, px, Direct palette | `style={{ padding: "4px 8px", fontSize: 12, border: "1px solid var(--color-border)", ... }}` | ORGAN |
| 91 | Raw HTML (button) | `<button` | ORGAN |
| 93 | Inline handler (onClick) | `onClick={() => handleMove(index, "down")}` | ORGAN |
| 95-101 | Inline style, px, Direct palette | `style={{ padding: "4px 8px", ... "var(--color-border)", ... "var(--color-bg-primary)" }}` | ORGAN |

### src/04_Presentation/components/organs/tsx/website/WebsiteTemplate.tsx

| Line | Violation type | Code snippet | Classification |
|------|----------------|--------------|----------------|
| 39 | Raw HTML (div) | `<div` | ORGAN |
| 44 | Inline style | `style={{ display: "flex", flexDirection: "column", minHeight: "100%", width: "100%", ...style }}` | ORGAN |

---

## Summary counts

| Classification | Violations |
|----------------|------------|
| Violations in ORGANS | 120+ (all entries above in organs/) |
| Violations in ORGANISMS | 0 |
| Violations in SYSTEM | 0 |

**TRUE COMPLIANCE STATUS**

- **ORGANS:** NON-COMPLIANT
- **ORGANISMS:** FULLY COMPLIANT
- **Overall (organs + organisms):** PARTIALLY COMPLIANT
```

---

## Execution step

On approval, write the above report (full markdown, including the three tables of violations and the summary) to **docs/TRUE_ORGAN_V1_COMPLIANCE_SCAN.md**. Use the exact structure: violations grouped by file path, then line-level rows with Violation type, Code snippet, and Classification (ORGAN only in this scan; ORGANISM and SYSTEM have 0 violations).