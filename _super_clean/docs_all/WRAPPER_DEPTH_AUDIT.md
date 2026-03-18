# Audit 4 — Wrapper Depth + Container Stack

**Purpose:** Map nesting depth of structural wrappers from page root to atoms; which layers add divs, which inject layout props; average and max depth; where multiple wrappers control the same dimension. Read-only analysis.

---

## 1. Layers (Top-Down)

### 1.1 page.tsx

**File:** `src/app/page.tsx`

- **PreviewStage** — Wraps all experiences; adds 1 wrapper (PreviewStage root).
- **Shell** — WebsiteShell, AppShell, or LearningShell (see below).
- **Content branch (website):** `content` = `<div ref={contentRef} style={{ width: "100%", minHeight: "100vh", … paddingRight: contentPaddingRight }}>{wrappedContent}</div>`. **wrappedContent** = for website, a `<div data-section-background-pattern style={{ display: "flex", flexDirection: "column", … }}>{jsonContent}</div>`; for app/learning, jsonContent only. So website: 2 divs (content div + section-background-pattern div) before jsonContent; app: 1 div (content div with paddingRight) before jsonContent; learning: 1 div (content div) before jsonContent.
- **Overlay** — Optional overlay node (no extra structural div count for typical section path).

**Structural divs added by page.tsx before JsonRenderer output:** 1 (contentRef div) + 1 (website-only section-background-pattern div) = **2 for website**; **1 for app/learning**.

### 1.2 Shell

**WebsiteShell** (`src/06_Data/site-skin/shells/WebsiteShell.tsx`):
- 1 root div (className site-container)
- 1 main (site-container-inner)
- **Total: 2** structural wrappers. Injects: minHeight, background, paddingTop/Bottom (var(--spacing-6), var(--spacing-16)).

**AppShell** (`src/06_Data/site-skin/shells/AppShell.tsx`):
- 1 root grid div
- 1 aside (nav)
- 1 grid div (rows: auto 1fr auto)
- 1 header div (sticky)
- 1 content grid div (primary + optional sidebar)
- 1 section (primary) + optional aside (sidebar)
- **Total: 6** structural wrappers. Injects: padding (12, 8, 16), gap (16), grid layout.

**LearningShell** (`src/06_Data/site-skin/shells/LearningShell.tsx`):
- Typically 1 root + header + main + footer; **~4** structural wrappers. Injects padding (e.g. "16px 16px", "32px 16px 40px").

### 1.3 ExperienceRenderer

**File:** `src/03_Runtime/engine/core/ExperienceRenderer.tsx`

- **rendererContent** = `<GlobalAppSkin><JsonRenderer … /></GlobalAppSkin>`. So 1 wrapper (GlobalAppSkin) around JsonRenderer.
- **Experience-specific wrapper:**
  - **Website:** return `<div style={websiteWrapperStyle}>{rendererContent}</div>` — but that path is not taken for website (see lines 127–145: app and learning return early; website falls through to default return). So website: no extra experience div in current code (default return wraps in PreviewStage + Shell + content div).
  - **App:** 1 outer div (data-experience="app") + 1 div (appWrapperStyle) around rendererContent. **+2 divs.** Injects: minHeight, background, padding (var(--spacing-4)).
  - **Learning:** 1 outer div (data-experience="learning") + 1 progress bar div (with inner div for bar fill) + 1 div (learningWrapperStyle) + 1 footer div (step controls). **+4 divs.** Injects: padding (var(--spacing-8)), margin, maxWidth.

So: **GlobalAppSkin (1)** + **JsonRenderer**; then for app +2, for learning +4 experience divs.

### 1.4 GlobalAppSkin

**File:** `src/04_Presentation/shells/GlobalAppSkin.tsx`

- 1 root div (ref rootRef, flex column)
- 1 content div (ref contentRef, flex: 1, overflow auto)
- 1 fixed bottom nav div (with nav + inner flex div)
- **Total: 3** structural wrappers. Injects: flex, overflow, padding: 0; nav uses Tailwind (px-2, gap-2.5, etc.).

### 1.5 JsonRenderer

**File:** `src/03_Runtime/engine/core/json-renderer.tsx`

- **renderNode** recursion: For each node, renders `<Component ... />` (e.g. SectionCompound). MaybeDebugWrapper is optional (dev). So **1 wrapper per node** = the component’s root (SectionCompound does not add its own div; it returns LayoutMoleculeRenderer or children).
- For a **section** node: Component = SectionCompound → which returns LayoutMoleculeRenderer (or fragment). So section adds 0 extra div at Section level; LayoutMoleculeRenderer adds all section structure.

### 1.6 SectionCompound

**File:** `src/04_Presentation/components/molecules/section.compound.tsx`

- No extra div; returns either `<LayoutMoleculeRenderer layout={effectiveDef} …>{children}</LayoutMoleculeRenderer>` or `<>{children}</>` when no layout. **Adds divs: N (0).**

### 1.7 LayoutMoleculeRenderer

**File:** `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`

**Non-split path (column/row/grid, no split):**
- 1 outer div (data-section-id, combinedOuterStyle) — container
- 1 SurfaceAtom (adds 1 div)
- 1 inner wrapper (nonSplitWrapper style) containing either CollectionAtom (1 div), SequenceAtom (1 div), or raw div with resolved style
- **Total: 1 (container) + 1 (SurfaceAtom) + 1 (inner) = 3** structural divs from LayoutMoleculeRenderer for non-split.

**Split path:**
- 1 outer div (container)
- 1 SurfaceAtom (1 div)
- innerContent = 1 splitLayoutStyle div containing:
  - 2 wrapper divs (splitMediaWrapper, splitContentWrapper)
  - contentColumn = 1 div (contentColumnStyle)
  - mediaColumn = 1 div (mediaColumnStyle); inside it optionally 1 mediaImageWrapper div + img
- So: 1 container + 1 SurfaceAtom + 1 split div + 2 (media/content wrappers) + 1 contentColumn + 1 mediaColumn + 1 mediaImageWrapper = **8** divs (or 7 if no media image wrapper).
- **Total: 8** structural divs for split path.

**Layout molecules (lib-layout/molecules):** column-layout, row-layout, grid-layout, stack-layout, page-layout are used by the registry for **screen-level** layout (e.g. site-renderer, GeneratedSiteViewer). They are **not** used in the JsonRenderer → Section → LayoutMoleculeRenderer path. **Section path uses atoms only** (CollectionAtom, SequenceAtom, SurfaceAtom, etc.).

### 1.8 Atoms

- **SurfaceAtom:** 1 div (style from params).
- **CollectionAtom:** 1 div (grid or flex).
- **SequenceAtom:** 1 div (flex).
- **TextAtom, MediaAtom:** 1 element each.

Compounds (card, list, button, etc.) typically wrap in SurfaceAtom + inner structure (e.g. card = SurfaceAtom + divs for media, title, body). So a **card** adds 1 SurfaceAtom div + 1–2 inner divs.

---

## 2. Depth Counts

### 2.1 Average wrapper depth (typical section, website experience)

From **page root** to **first content node** inside a section (e.g. first text or media inside the section’s inner layout):

1. PreviewStage (1)
2. WebsiteShell root (2)
3. WebsiteShell main (3)
4. page.tsx content div (4)
5. page.tsx section-background-pattern div (5)
6. ExperienceRenderer: default return does not add experience div for website; so next is GlobalAppSkin root (6)
7. GlobalAppSkin content div (7)
8. JsonRenderer root (no extra div; next is first section’s component) → SectionCompound → LayoutMoleculeRenderer container (8)
9. LayoutMoleculeRenderer SurfaceAtom (9)
10. LayoutMoleculeRenderer inner (nonSplitWrapper) (10)
11. CollectionAtom or SequenceAtom (11)
12. First child of section (e.g. card) → card compound root (12)
13. Card SurfaceAtom or inner (13)
14. First atom inside card (e.g. TextAtom) (14)

**Formula (website, non-split section, section with one card):**  
PreviewStage(1) + WebsiteShell(2) + page content(2) + GlobalAppSkin(2) + LayoutMoleculeRenderer(3) + Collection/Sequence(1) + card(2) + first atom(1) = **14** layers to first content node inside first card. To first content node inside section (before card): 11 (through CollectionAtom/SequenceAtom, then first child is card wrapper). So **average wrapper depth to first section content** ≈ **11**; **to first leaf content inside a card** ≈ **14**.

### 2.2 Max wrapper depth (section with split layout + repeater card)

1. PreviewStage
2. Shell (WebsiteShell 2 divs)
3. page content div
4. page section-background-pattern div
5. GlobalAppSkin root
6. GlobalAppSkin content
7. JsonRenderer (section node)
8. LayoutMoleculeRenderer container
9. SurfaceAtom
10. split layout div
11. split content wrapper div
12. content column div (or media column)
13. media column div (or content column)
14. media image wrapper div (if image)
15. CollectionAtom/SequenceAtom for inner list of blocks (if any)
16. Card (repeater item)
17. Card SurfaceAtom
18. Card inner (e.g. media + text block)
19. TextAtom or MediaAtom

**Max depth:** **19** (to a leaf atom inside a card inside a split section with media). Without repeater card, to first content inside split: container(8) + SurfaceAtom(9) + split(10) + contentColumn(11) + inner content (e.g. CollectionAtom)(12) = **12** to first child of section inner.

### 2.3 Which layers add structural divs

| Layer | Adds div(s) | Count |
|-------|-------------|--------|
| PreviewStage | Y | 1 |
| WebsiteShell | Y | 2 |
| AppShell | Y | 6 |
| LearningShell | Y | ~4 |
| page.tsx (content + wrappedContent) | Y | 1–2 |
| ExperienceRenderer (app/learning wrapper) | Y | 2 (app) or 4 (learning) |
| GlobalAppSkin | Y | 3 |
| JsonRenderer (per node) | Y (component root) | 1 per node |
| SectionCompound | N | 0 |
| LayoutMoleculeRenderer | Y | 3 (non-split) or 8 (split) |
| Layout molecules (column/row/grid TSX) | Not used in section path | 0 |
| SurfaceAtom, CollectionAtom, SequenceAtom | Y | 1 each |
| Card / other compounds | Y | 1–2+ |

### 2.4 Which wrappers inject layout props

| Wrapper | Layout-related props injected |
|---------|-------------------------------|
| page.tsx | gap (website: via wrappedContent flex column); paddingRight (contentPaddingRight); width, minHeight, overflowY |
| WebsiteShell | paddingTop/Bottom (var(--spacing-6), var(--spacing-16)); minHeight, width, overflowX |
| AppShell | padding (12, 8, 16); gap 16; grid columns/rows; minWidth |
| LearningShell | padding (e.g. "32px 16px 40px"); maxWidth, margin |
| ExperienceRenderer | padding (var(--spacing-4) app, var(--spacing-8) learning); maxWidth (learning); flex column, minHeight |
| GlobalAppSkin | flex, overflow, padding 0; nav Tailwind (px-2, gap, py-1) |
| LayoutMoleculeRenderer | display, boxSizing, maxWidth, marginLeft/Right, paddingLeft/Right (contentInsetX); SurfaceAtom params; inner display, gap, padding, gridTemplateColumns, flex direction |
| CollectionAtom / SequenceAtom | display, gap, padding, gridTemplateColumns, alignItems, justifyContent |
| Section/card compounds | Pass-through or SurfaceAtom params (padding, background, radius, shadow) |

### 2.5 Where multiple wrappers control the same dimension

| Dimension | Layers that set it |
|-----------|--------------------|
| **Horizontal padding** | layout.tsx (app-content 0 or phone 12px); WebsiteShell (main has no L/R in JSON—site-theme can set); AppShell (aside 12, header 8, content grid 16, sidebar 12); LearningShell (16px L/R in main); ExperienceRenderer (padding L/R in app/learning wrapper); LayoutMoleculeRenderer (contentInsetX → paddingLeft/Right on container); section params (padding in moleculeLayout.params); SurfaceAtom (padding from params). So **6+** potential sources. |
| **Vertical padding** | WebsiteShell (paddingTop/Bottom); AppShell (paddingTop/Bottom on header and content grid); LearningShell (main padding); ExperienceRenderer (paddingTop/Bottom); LayoutMoleculeRenderer (padding in moleculeLayout.params, then stripped on combinedOuterStyle); section/card params. **5+** sources. |
| **Gap (vertical between sections)** | page.tsx wrappedContent (flex column, no explicit gap in snippet—gap may be on contentRef or elsewhere); ExperienceRenderer (no gap on wrapper); LayoutMoleculeRenderer inner (gap from moleculeLayout.params); CollectionAtom/SequenceAtom (gap from params). **2–3** sources for section-inner vs page-level gap. |
| **Max-width / container width** | LayoutMoleculeRenderer (containerWidth → maxWidth, container.maxWidth); LearningShell (maxWidth on wrapper); Shells (site-container-inner can have max-width in CSS). **2–3** sources. |

---

## 3. Summary Metrics

| Metric | Value |
|--------|--------|
| **Average wrapper depth** (to first content node inside a typical section, website) | ~11 |
| **Average wrapper depth** (to first leaf inside first card in section) | ~14 |
| **Max wrapper depth** (split section + repeater card to leaf atom) | 19 |
| **Layers that add structural divs** | 12+ (PreviewStage, Shell, page, ExperienceRenderer, GlobalAppSkin, JsonRenderer node, LayoutMoleculeRenderer, atoms, compounds) |
| **Layers that inject layout props** | page, Shell, ExperienceRenderer, GlobalAppSkin, LayoutMoleculeRenderer, Collection/Sequence, atoms (style from params) |
| **Dimensions with multiple controlling wrappers** | Horizontal padding (6+), vertical padding (5+), gap (2–3), max-width (2–3) |
