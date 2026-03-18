# Full Organ V1 Compliance Audit

**Authority:** `src/02_Contracts_Reports/build_protocol/BUILD_PROTOCOL (ORGAN)_V1.md`, `src/02_Contracts_Reports/contracts/allowed-molecules.ts`. This audit does not reinterpret, summarize, or improve the protocol; it reports compliance against it.

---

## 1. Authority

- **Build Protocol:** [BUILD_PROTOCOL (ORGAN)_V1.md](../src/02_Contracts_Reports/build_protocol/BUILD_PROTOCOL%20(ORGAN)_V1.md)
- **Molecule set:** [allowed-molecules.ts](../src/02_Contracts_Reports/contracts/allowed-molecules.ts) — closed set of 12 types.

---

## 2. Inventory

### A) All TSX organs (`src/04_Presentation/components/organs/**/*.tsx`)

**Canonical 21 (tsx-organs/):**

| # | Organ |
|---|-------|
| 1 | BoardColumnOrgan.tsx |
| 2 | ColumnStripOrgan.tsx |
| 3 | DetailContentOrgan.tsx |
| 4 | EditorContentOrgan.tsx |
| 5 | FilterBarOrgan.tsx |
| 6 | GalleryGridOrgan.tsx |
| 7 | GridLayoutOrgan.tsx |
| 8 | LightboxOrgan.tsx |
| 9 | ListContentOrgan.tsx |
| 10 | ModalOrgan.tsx |
| 11 | PaginationBarOrgan.tsx |
| 12 | SelectionBarOrgan.tsx |
| 13 | SidebarOrgan.tsx |
| 14 | SplitPaneOrgan.tsx |
| 15 | TimelineLaneOrgan.tsx |
| 16 | TimelineLaneStripOrgan.tsx |
| 17 | TimelineRulerOrgan.tsx |
| 18 | ToolbarOrgan.tsx |
| 19 | WidgetCellOrgan.tsx |
| 20 | WizardStepContentOrgan.tsx |
| 21 | WizardStepStripOrgan.tsx |

**Additional organs (same directory):**

| # | Path |
|---|------|
| 22 | OrganPanel.tsx |
| 23 | tsx/website/NodeRegistry.tsx |
| 24 | tsx/website/NodeRenderer.tsx |
| 25 | tsx/website/DevNodePanel.tsx |
| 26 | tsx/website/WebsiteTemplate.tsx |

### B) All TSX organisms (`src/04_Presentation/components/organisms/**/*.tsx`)

| # | Organism |
|---|----------|
| 1 | tsx-organisms/BoardOrganism.tsx |
| 2 | tsx-organisms/DashboardOrganism.tsx |
| 3 | tsx-organisms/DetailOrganism.tsx |
| 4 | tsx-organisms/EditorOrganism.tsx |
| 5 | tsx-organisms/GalleryOrganism.tsx |
| 6 | tsx-organisms/ListOrganism.tsx |
| 7 | tsx-organisms/TimelineOrganism.tsx |
| 8 | tsx-organisms/WizardOrganism.tsx |

### C) Molecule compounds (must match the 12)

**Allowed 12 (from allowed-molecules.ts):** `section`, `button`, `card`, `avatar`, `chip`, `field`, `footer`, `list`, `modal`, `stepper`, `toast`, `toolbar`.

**Implemented in** `src/04_Presentation/components/molecules/`: Section, Button, Card, Avatar, Chip, Field, Footer, List, Modal, Stepper, Toast, Toolbar (via index.ts / compound files).

**Extra compound (not in the 12):** `BeforeAfterSlider.tsx` in molecules/ — not in allowed set. Not referenced by any organ or organism in this audit; if referenced in future, would be HARD VIOLATION (STEP 6).

---

## 3. Violations table

Format: **File path | Violation type | Line number(s) | Protocol rule | Severity**

### 3.1 Organs (tsx-organs)

| File | Violation type | Line(s) | Protocol rule | Severity |
|------|----------------|---------|---------------|----------|
| tsx-organs/BoardColumnOrgan.tsx | inline style={{}} | 11-18, 21, 24, 27 | STEP 8, Lock | HARD |
| tsx-organs/BoardColumnOrgan.tsx | raw &lt;div&gt; | 8-9, 21, 24, 27 | Organs composed of contract molecules | HARD |
| tsx-organs/BoardColumnOrgan.tsx | hex color | 18 | Palette system-driven only | HARD |
| tsx-organs/BoardColumnOrgan.tsx | layout hardcoding | 11-18, 21, 24, 27 | No layout inference; layout from layout-definitions | HARD |
| tsx-organs/BoardColumnOrgan.tsx | px/rem literals | 21, 24, 27 | Layout from layout system | SOFT |
| tsx-organs/BoardColumnOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 — only 12 molecules | HARD |
| tsx-organs/ColumnStripOrgan.tsx | inline style={{}} | 20-27, 22, 27, 32-33 | STEP 8, Lock | HARD |
| tsx-organs/ColumnStripOrgan.tsx | raw &lt;div&gt; | 17, 22, 25, 27 | Organs composed of contract molecules | HARD |
| tsx-organs/ColumnStripOrgan.tsx | layout hardcoding | 20-27, 22, 27, 32-33 | No layout inference | HARD |
| tsx-organs/ColumnStripOrgan.tsx | px/rem literals | 22, 32-33 | Layout from layout system | SOFT |
| tsx-organs/ColumnStripOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/DetailContentOrgan.tsx | inline style={{}} | 12, 14 | STEP 8, Lock | HARD |
| tsx-organs/DetailContentOrgan.tsx | raw &lt;div&gt; | 9, 14 | Organs composed of contract molecules | HARD |
| tsx-organs/DetailContentOrgan.tsx | layout hardcoding | 12, 14 | No layout inference | HARD |
| tsx-organs/DetailContentOrgan.tsx | px/rem literals | 14 | Layout from layout system | SOFT |
| tsx-organs/DetailContentOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/EditorContentOrgan.tsx | inline style={{}} | 11-16, 13, 16 | STEP 8, Lock | HARD |
| tsx-organs/EditorContentOrgan.tsx | raw &lt;div&gt; | 8, 13, 16 | Organs composed of contract molecules | HARD |
| tsx-organs/EditorContentOrgan.tsx | layout hardcoding | 11-16, 13, 16 | No layout inference | HARD |
| tsx-organs/EditorContentOrgan.tsx | px/rem literals | 13, 16 | Layout from layout system | SOFT |
| tsx-organs/EditorContentOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/FilterBarOrgan.tsx | inline style={{}} | 11 | STEP 8, Lock | HARD |
| tsx-organs/FilterBarOrgan.tsx | raw &lt;div&gt; | 8, 13 | Organs composed of contract molecules | HARD |
| tsx-organs/FilterBarOrgan.tsx | layout hardcoding | 11 | No layout inference | HARD |
| tsx-organs/FilterBarOrgan.tsx | px/rem literals | 11 | Layout from layout system | SOFT |
| tsx-organs/FilterBarOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/GalleryGridOrgan.tsx | inline style={{}} | 12-19, 14, 19, 24-26 | STEP 8, Lock | HARD |
| tsx-organs/GalleryGridOrgan.tsx | raw &lt;div&gt; | 9, 14, 17, 19 | Organs composed of contract molecules | HARD |
| tsx-organs/GalleryGridOrgan.tsx | layout hardcoding | 12-19, 14, 19, 24-26 | No layout inference | HARD |
| tsx-organs/GalleryGridOrgan.tsx | px/rem literals | 14, 24-26 | Layout from layout system | SOFT |
| tsx-organs/GalleryGridOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/GridLayoutOrgan.tsx | inline style={{}} | 11-18, 13, 18, 21-23 | STEP 8, Lock | HARD |
| tsx-organs/GridLayoutOrgan.tsx | raw &lt;div&gt; | 8, 13, 16, 18 | Organs composed of contract molecules | HARD |
| tsx-organs/GridLayoutOrgan.tsx | layout hardcoding | 11-18, 13, 18, 21-23 | No layout inference | HARD |
| tsx-organs/GridLayoutOrgan.tsx | px/rem literals | 13, 21-23 | Layout from layout system | SOFT |
| tsx-organs/GridLayoutOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/LightboxOrgan.tsx | inline style={{}} | 13-21, 21, 24 | STEP 8, Lock | HARD |
| tsx-organs/LightboxOrgan.tsx | raw &lt;div&gt; | 8, 21, 24 | Organs composed of contract molecules | HARD |
| tsx-organs/LightboxOrgan.tsx | layout hardcoding | 13-21, 21, 24 | No layout inference | HARD |
| tsx-organs/LightboxOrgan.tsx | px/rem literals | 24 | Layout from layout system | SOFT |
| tsx-organs/LightboxOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/ListContentOrgan.tsx | inline style={{}} | 12-17, 14, 17 | STEP 8, Lock | HARD |
| tsx-organs/ListContentOrgan.tsx | raw &lt;div&gt; | 9, 14, 17 | Organs composed of contract molecules | HARD |
| tsx-organs/ListContentOrgan.tsx | layout hardcoding | 12-17, 14, 17 | No layout inference | HARD |
| tsx-organs/ListContentOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/ModalOrgan.tsx | inline style={{}} | 13-21, 21 | STEP 8, Lock | HARD |
| tsx-organs/ModalOrgan.tsx | raw &lt;div&gt; | 8, 21, 24 | Organs composed of contract molecules | HARD |
| tsx-organs/ModalOrgan.tsx | layout hardcoding | 13-21, 21 | No layout inference | HARD |
| tsx-organs/ModalOrgan.tsx | px/rem literals | 15, 21 | Layout from layout system | SOFT |
| tsx-organs/ModalOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/PaginationBarOrgan.tsx | inline style={{}} | 11 | STEP 8, Lock | HARD |
| tsx-organs/PaginationBarOrgan.tsx | raw &lt;div&gt; | 8, 13-14 | Organs composed of contract molecules | HARD |
| tsx-organs/PaginationBarOrgan.tsx | layout hardcoding | 11 | No layout inference | HARD |
| tsx-organs/PaginationBarOrgan.tsx | px/rem literals | 11 | Layout from layout system | SOFT |
| tsx-organs/PaginationBarOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/SelectionBarOrgan.tsx | inline style={{}} | 11 | STEP 8, Lock | HARD |
| tsx-organs/SelectionBarOrgan.tsx | raw &lt;div&gt; | 8, 13-14 | Organs composed of contract molecules | HARD |
| tsx-organs/SelectionBarOrgan.tsx | layout hardcoding | 11 | No layout inference | HARD |
| tsx-organs/SelectionBarOrgan.tsx | px/rem literals | 11 | Layout from layout system | SOFT |
| tsx-organs/SelectionBarOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/SidebarOrgan.tsx | inline style={{}} | 11 | STEP 8, Lock | HARD |
| tsx-organs/SidebarOrgan.tsx | raw &lt;div&gt; | 8, 13 | Organs composed of contract molecules | HARD |
| tsx-organs/SidebarOrgan.tsx | layout hardcoding | 11 | No layout inference | HARD |
| tsx-organs/SidebarOrgan.tsx | px/rem literals | 11 | Layout from layout system | SOFT |
| tsx-organs/SidebarOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/SplitPaneOrgan.tsx | inline style={{}} | 11, 13, 16 | STEP 8, Lock | HARD |
| tsx-organs/SplitPaneOrgan.tsx | raw &lt;div&gt; | 8, 13, 16 | Organs composed of contract molecules | HARD |
| tsx-organs/SplitPaneOrgan.tsx | layout hardcoding | 11, 13, 16 | No layout inference | HARD |
| tsx-organs/SplitPaneOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/TimelineLaneOrgan.tsx | inline style={{}} | 11-17, 20, 23 | STEP 8, Lock | HARD |
| tsx-organs/TimelineLaneOrgan.tsx | raw &lt;div&gt; | 8, 20, 23 | Organs composed of contract molecules | HARD |
| tsx-organs/TimelineLaneOrgan.tsx | hex color | 17 | Palette system-driven only | HARD |
| tsx-organs/TimelineLaneOrgan.tsx | layout hardcoding | 11-17, 20, 23 | No layout inference | HARD |
| tsx-organs/TimelineLaneOrgan.tsx | px/rem literals | 16, 20 | Layout from layout system | SOFT |
| tsx-organs/TimelineLaneOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/TimelineLaneStripOrgan.tsx | inline style={{}} | 16, 18, 23 | STEP 8, Lock | HARD |
| tsx-organs/TimelineLaneStripOrgan.tsx | raw &lt;div&gt; | 13, 18, 21, 23 | Organs composed of contract molecules | HARD |
| tsx-organs/TimelineLaneStripOrgan.tsx | layout hardcoding | 16, 18, 23 | No layout inference | HARD |
| tsx-organs/TimelineLaneStripOrgan.tsx | px/rem literals | 18, 23 | Layout from layout system | SOFT |
| tsx-organs/TimelineLaneStripOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/TimelineRulerOrgan.tsx | inline style={{}} | 11 | STEP 8, Lock | HARD |
| tsx-organs/TimelineRulerOrgan.tsx | raw &lt;div&gt; | 8, 13 | Organs composed of contract molecules | HARD |
| tsx-organs/TimelineRulerOrgan.tsx | hex color | 11 | Palette system-driven only | HARD |
| tsx-organs/TimelineRulerOrgan.tsx | layout hardcoding | 11 | No layout inference | HARD |
| tsx-organs/TimelineRulerOrgan.tsx | px/rem literals | 11 | Layout from layout system | SOFT |
| tsx-organs/TimelineRulerOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/ToolbarOrgan.tsx | inline style={{}} | 11, 13, 16, 19 | STEP 8, Lock | HARD |
| tsx-organs/ToolbarOrgan.tsx | raw &lt;div&gt;, &lt;header&gt; | 8-9, 13, 16, 19 | Organs composed of contract molecules | HARD |
| tsx-organs/ToolbarOrgan.tsx | layout hardcoding | 11, 13, 16, 19 | No layout inference | HARD |
| tsx-organs/ToolbarOrgan.tsx | px/rem literals | 11 | Layout from layout system | SOFT |
| tsx-organs/ToolbarOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/WidgetCellOrgan.tsx | inline style={{}} | 11-16 | STEP 8, Lock | HARD |
| tsx-organs/WidgetCellOrgan.tsx | raw &lt;div&gt; | 8, 19 | Organs composed of contract molecules | HARD |
| tsx-organs/WidgetCellOrgan.tsx | hex color | 15 | Palette system-driven only | HARD |
| tsx-organs/WidgetCellOrgan.tsx | layout hardcoding | 11-16 | No layout inference | HARD |
| tsx-organs/WidgetCellOrgan.tsx | px/rem literals | 14, 16 | Layout from layout system | SOFT |
| tsx-organs/WidgetCellOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/WizardStepContentOrgan.tsx | inline style={{}} | 11 | STEP 8, Lock | HARD |
| tsx-organs/WizardStepContentOrgan.tsx | raw &lt;div&gt; | 8, 13 | Organs composed of contract molecules | HARD |
| tsx-organs/WizardStepContentOrgan.tsx | layout hardcoding | 11 | No layout inference | HARD |
| tsx-organs/WizardStepContentOrgan.tsx | px/rem literals | 11 | Layout from layout system | SOFT |
| tsx-organs/WizardStepContentOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx-organs/WizardStepStripOrgan.tsx | inline style={{}} | 11, 18, 21 | STEP 8, Lock | HARD |
| tsx-organs/WizardStepStripOrgan.tsx | raw &lt;div&gt; | 8, 18, 21 | Organs composed of contract molecules | HARD |
| tsx-organs/WizardStepStripOrgan.tsx | hex color | 15 | Palette system-driven only | HARD |
| tsx-organs/WizardStepStripOrgan.tsx | layout hardcoding | 11, 18, 21 | No layout inference | HARD |
| tsx-organs/WizardStepStripOrgan.tsx | px/rem literals | 18, 21 | Layout from layout system | SOFT |
| tsx-organs/WizardStepStripOrgan.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |

### 3.2 OrganPanel.tsx

| File | Violation type | Line(s) | Protocol rule | Severity |
|------|----------------|---------|---------------|----------|
| OrganPanel.tsx | inline style={{}} | 56-71, 72-76, 78-84, 87-95, 216, 263, 266-267, 273, 290, 296, 503, 523, 531, 601, 621, 644 | STEP 8, Lock | HARD |
| OrganPanel.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt;, &lt;p&gt;, &lt;label&gt; | multiple | Organs composed of contract molecules | HARD |
| OrganPanel.tsx | hex colors | 65, 96, 277-278, 300-301, 535-536 | Palette system-driven only | HARD |
| OrganPanel.tsx | layout hardcoding | 56-95, 266, 290, 523, 531 | No layout inference | HARD |
| OrganPanel.tsx | px/rem literals | 71, 94-95, 98, 274-275, 281, 298, 395, 533 | Layout from layout system | SOFT |
| OrganPanel.tsx | engine logic in TSX (useState) | 3, 121-124 | No engine logic in TSX | HARD |
| OrganPanel.tsx | direct state mutation (.push) | 162, 168, 180, 186 | — | HARD |
| OrganPanel.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |

### 3.3 Website organs (tsx/website)

| File | Violation type | Line(s) | Protocol rule | Severity |
|------|----------------|---------|---------------|----------|
| tsx/website/NodeRegistry.tsx | inline style={{}} | 10, 20, 30, 40, 44, 55, 64, 68, 77, 87, 105, 126, 135, 141, 161, 176, 184, 193, 202-203 | STEP 8, Lock | HARD |
| tsx/website/NodeRegistry.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt; | multiple | Organs composed of contract molecules | HARD |
| tsx/website/NodeRegistry.tsx | layout hardcoding | multiple | No layout inference | HARD |
| tsx/website/NodeRegistry.tsx | px/rem literals | 15, 20, 35, 40, 44, 58, 64, 81, 88, 91, 110, 114, 130, 135, 142, 145, 164, 167, 179, 186-187, 196, 198-199, 203 | Layout from layout system | SOFT |
| tsx/website/NodeRegistry.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx/website/NodeRenderer.tsx | (no inline styles; delegates to NodeRegistry components) | — | — | — |
| tsx/website/DevNodePanel.tsx | inline style={{}} | 17, 38, 46, 58-60, 64, 69-75, 80, 95 | STEP 8, Lock | HARD |
| tsx/website/DevNodePanel.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt; | 17, 38, 46, 58-60, 62, 74-76, 80, 91 | Organs composed of contract molecules | HARD |
| tsx/website/DevNodePanel.tsx | hex colors | 17, 59, 69, 71, 74 | Palette system-driven only | HARD |
| tsx/website/DevNodePanel.tsx | layout hardcoding | 58-60, 64, 69-75, 80 | No layout inference | HARD |
| tsx/website/DevNodePanel.tsx | engine logic in TSX (useState) | 3, 23 | No engine logic in TSX | HARD |
| tsx/website/DevNodePanel.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |
| tsx/website/WebsiteTemplate.tsx | inline style={{}} | 44 | STEP 8, Lock | HARD |
| tsx/website/WebsiteTemplate.tsx | raw &lt;div&gt; | 39, 44 | Organs composed of contract molecules | HARD |
| tsx/website/WebsiteTemplate.tsx | layout hardcoding | 44 | No layout inference | HARD |
| tsx/website/WebsiteTemplate.tsx | uses only 12 molecules? | entire | STEP 6; Step 8 | HARD |

### 3.4 Organisms (tsx-organisms)

| File | Violation type | Line(s) | Protocol rule | Severity |
|------|----------------|---------|---------------|----------|
| ListOrganism.tsx | inline style={{}} | 27, 31-32, 40, 65, 95-97, 122, 137 | STEP 8, Lock | HARD |
| ListOrganism.tsx | raw &lt;ul&gt;, &lt;li&gt;, &lt;span&gt;, &lt;button&gt;, &lt;div&gt; | 27-65, 95-97, 121-137 | Structure from blueprint; no raw primitives | HARD |
| ListOrganism.tsx | hex colors | 33, 65 | Palette system-driven only | HARD |
| ListOrganism.tsx | layout hardcoding | 27, 31-32, 40, 65, 95-97, 122, 137 | No layout inference | HARD |
| ListOrganism.tsx | px/rem literals | 31-32, 65, 137 | Layout from layout system | SOFT |
| BoardOrganism.tsx | inline style={{}} | 45, 47, 68, 78, 89 | STEP 8, Lock | HARD |
| BoardOrganism.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt; | 45-47, 62-66, 76, 86, 113 | Structure from blueprint | HARD |
| BoardOrganism.tsx | hex color | 71 | Palette system-driven only | HARD |
| BoardOrganism.tsx | layout hardcoding | 45, 47, 68, 78, 89 | No layout inference | HARD |
| BoardOrganism.tsx | px/rem literals | 78, 89 | Layout from layout system | SOFT |
| DashboardOrganism.tsx | inline style={{}} | 45, 58, 75 | STEP 8, Lock | HARD |
| DashboardOrganism.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt; | 27, 45, 58-60, 75 | Structure from blueprint | HARD |
| DashboardOrganism.tsx | hex color | 75 | Palette system-driven only | HARD |
| DashboardOrganism.tsx | layout hardcoding | 45, 58, 75 | No layout inference | HARD |
| DashboardOrganism.tsx | px/rem literals | 75 | Layout from layout system | SOFT |
| DetailOrganism.tsx | inline style={{}} | 34, 40, 53, 72 | STEP 8, Lock | HARD |
| DetailOrganism.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt; | 34-35, 40-42, 53, 64, 72, 76, 84, 86 | Structure from blueprint | HARD |
| DetailOrganism.tsx | hex colors | 56 | Palette system-driven only | HARD |
| DetailOrganism.tsx | layout hardcoding | 34, 40, 53, 72 | No layout inference | HARD |
| DetailOrganism.tsx | px/rem literals | 72 | Layout from layout system | SOFT |
| EditorOrganism.tsx | inline style={{}} | 30, 46, 55, 57 | STEP 8, Lock | HARD |
| EditorOrganism.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt; | 30-31, 39, 46, 55, 57 | Structure from blueprint | HARD |
| EditorOrganism.tsx | hex color | 55 | Palette system-driven only | HARD |
| EditorOrganism.tsx | layout hardcoding | 30, 46, 55, 57 | No layout inference | HARD |
| EditorOrganism.tsx | px/rem literals | 46, 55 | Layout from layout system | SOFT |
| GalleryOrganism.tsx | inline style={{}} | 38, 40, 52, 70, 81, 135, 166 | STEP 8, Lock | HARD |
| GalleryOrganism.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt; | 38-40, 51-52, 59, 70, 80-82, 95, 108, 122, 134, 148, 155, 157, 161 | Structure from blueprint | HARD |
| GalleryOrganism.tsx | hex color | 72 | Palette system-driven only | HARD |
| GalleryOrganism.tsx | layout hardcoding | 38, 40, 52, 70, 81, 135, 166 | No layout inference | HARD |
| GalleryOrganism.tsx | px/rem literals | 81 | Layout from layout system | SOFT |
| TimelineOrganism.tsx | inline style={{}} | 35, 37, 60 | STEP 8, Lock | HARD |
| TimelineOrganism.tsx | raw &lt;div&gt;, &lt;span&gt; | 35-37, 40, 54-56, 79, 81 | Structure from blueprint | HARD |
| TimelineOrganism.tsx | hex color | 62 | Palette system-driven only | HARD |
| TimelineOrganism.tsx | layout hardcoding | 35, 37, 60 | No layout inference | HARD |
| WizardOrganism.tsx | inline style={{}} | 49, 60, 90 | STEP 8, Lock | HARD |
| WizardOrganism.tsx | raw &lt;div&gt;, &lt;span&gt;, &lt;button&gt; | 43-45, 49-50, 55, 60-61, 68, 75, 90 | Structure from blueprint | HARD |
| WizardOrganism.tsx | layout hardcoding | 49, 60, 90 | No layout inference | HARD |
| WizardOrganism.tsx | px/rem literals | 90 | Layout from layout system | SOFT |

---

## 4. Summary counts

### By violation type

| Violation type | HARD count (files with ≥1) | SOFT count (files with ≥1) |
|----------------|----------------------------|-----------------------------|
| inline style={{}} | 33 | — |
| raw HTML primitives (div/span/button/ul/li/header/p/label) | 33 | — |
| hex colors | 12 | — |
| layout hardcoding | 33 | — |
| px/rem literals | 33 | 33 |
| uses only 12 molecules? (N) | 32 (all organs + organisms except NodeRenderer) | — |
| engine logic in TSX | 2 (OrganPanel, DevNodePanel) | — |
| direct state mutation | 1 (OrganPanel) | — |
| imports from atoms | 0 | — |

### By file (number of violation types present)

- **Canonical 21 organs:** Each has 5–6 violation types (inline styles, raw primitives, layout hardcoding, px/rem, “uses only 12 molecules” = N; 4 organs also have hex).
- **OrganPanel.tsx:** 8 types (includes engine logic, direct state mutation).
- **NodeRegistry, DevNodePanel, WebsiteTemplate:** 5–6 types each; DevNodePanel includes engine logic.
- **NodeRenderer.tsx:** No violations (delegation only).
- **All 8 organisms:** Each has 4–5 types (inline styles, raw primitives, hex where present, layout hardcoding, px/rem).

---

*End of audit. No code was changed. Next: Phase 2 — ORGAN_V1_VIOLATION_MATRIX.md.*
