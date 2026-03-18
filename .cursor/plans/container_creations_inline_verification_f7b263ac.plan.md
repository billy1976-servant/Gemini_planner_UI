---
name: Container Creations Inline Verification
overview: Add small inline verification inputs (numeric, select, checkbox) inside existing checklist step content, with validation and minimal state, without changing layout or typography.
todos: []
isProject: false
---

# Container Creations Landing — Inline Verification Plan

## 1. Current checklist flow (from config)

Screens from [ContainerCreationsLanding-2.json](src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding-2.json):


| Step ID              | Step label            | Layout          | Content summary                   |
| -------------------- | --------------------- | --------------- | --------------------------------- |
| intro                | Intro                 | hero            | Badge + CTA                       |
| structural-fit       | Verify Container Type | stamped         | Paragraphs + checklist            |
| ventilation          | Measure Roof Opening  | twoCol          | "Measure your roof rib height..." |
| continue             | Verify Vent Fit       | twoCol          | 12″ vent, airflow/moisture        |
| why-we-lead          | Calculate Airflow     | twoCol          | Cut once / upgrade light          |
| choose-vent          | Choose Vent Size      | twoColImageLeft | Testimonial + CTA                 |
| final-recommendation | Final Recommendation  | textOnly        | Summary placeholder               |


Rendering is in [ContainerCreationsLanding-2.tsx](src/01_App/(live) Business/Container_Creations/ContainerCreationsLanding-2.tsx): `renderContentBlocks()`, and per-layout content in `renderScreen()` (e.g. twoCol filters `content` by `type === "paragraph"`). No form state or inputs exist today.

---

## 2. Which steps get inline inputs


| Step                     | Inline element       | Input type                                 | Validation / behavior                                                                       |
| ------------------------ | -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **structural-fit**       | Container length     | **Select** (20ft / 40ft)                   | No validation; value stored for later steps and final recommendation.                       |
| **ventilation**          | Roof rib height      | **Numeric input** (inches)                 | Validate within ±0.5" of expected range (e.g. 1.5–2.5"); show ✓ valid / ⚠ warning inline.   |
| **continue**             | Confirm vent fit     | **Checkbox** (optional)                    | "I've verified the 12″ vent fits my roof" — no validation; can be used in final summary.    |
| **why-we-lead**          | Airflow / vent count | **Numeric input** (CFM or number of vents) | Updates a single line of recommendation text (e.g. "We recommend 2 vents for your setup."). |
| **choose-vent**          | Confirm size         | **Checkbox** (optional)                    | "I'll order the recommended size" — reinforces CTA; optional.                               |
| **final-recommendation** | None                 | —                                          | Read-only summary driven by state (roof rib, container size, airflow, recommended vent).    |
| **intro**                | None                 | —                                          | No verification.                                                                            |


---

## 3. Where each input appears in the UI

- **structural-fit**: After the last checklist block, before the step nav buttons. One line: label "Container length" → small select [20ft | 40ft]. Same card/section (`cc-stamped-section`).
- **ventilation**: In the left column (`cc-text`), immediately after the paragraph "Measure your roof rib height so we can recommend the right adapter." Add one line: "Roof rib height (in.):" → small number input → inline message (✓ valid / ⚠ outside 1.5–2.5").
- **continue**: After the paragraph in `cc-text`, one line: checkbox + "I've verified the 12″ vent fits my roof." (optional).
- **why-we-lead**: After the third paragraph ("Upgrade light while you're there."), one line: "Vents needed:" or "Airflow (CFM):" → small number input → dynamic line: "We recommend X vent(s) for your setup."
- **choose-vent**: After the testimonial block, one line: optional checkbox "I'll order the recommended size" and/or display: "Recommended: 12″ vent (from your inputs)."
- **final-recommendation**: Replace or augment the placeholder paragraph with a short summary built from state (container length, roof rib result, recommended vent count/size). No new layout section.

All inputs live inside existing content sections (same cards, same `cc-two-col` / `cc-stamped-section`), not in a separate calculator panel.

---

## 4. Component architecture

### 4.1 Reusable inline verification controls

Introduce **small, presentational components** that match the existing design system (borders, radius, font from [landing-theme.css](src/app/landing/landing-theme.css)):

- `**InlineNumberInput`**: Label (optional) + `<input type="number">` + inline validation message (✓ green / ⚠ warning). Props: `value`, `onChange`, `min`, `max`, `step`, `placeholder`, `validate(value) => { valid: boolean; message?: string }`, `ariaLabel`.
- `**InlineSelect`**: Label + `<select>` with options. Props: `value`, `onChange`, `options: { value: string; label: string }[]`, `ariaLabel`.
- `**InlineCheckbox**`: Label + `<input type="checkbox">`. Props: `checked`, `onChange`, `label`, `id`, `ariaLabel`.

Styling: re-use `--landing-radius` (8px), `--landing-steel-border` / `#e2e8f0` for light steps, same font family/size as surrounding text (e.g. 0.9375rem–1rem). Keep controls compact (e.g. input width ~4–5rem for numbers, select ~6rem).

### 4.2 Where components live

- **Option A (recommended)**: Colocate in the same file as the landing page, e.g. above `ContainerCreationsLanding2`, so no new files and no design-system coupling outside this feature.
- **Option B**: If you prefer reuse, add `src/01_App/(live) Business/Container_Creations/InlineVerification.tsx` (or under `04_Presentation/components`) and import into the landing TSX.

### 4.3 Wiring inputs into the flow

- **No new content block types in JSON** for the minimal version: keep the existing config schema. Which step shows which control is determined by `screen.id` in the TSX.
- **Injection points**: In `renderScreen()`, for each layout branch that renders `screen.content`, add **after** the existing content (paragraphs/checklist) a conditional block that, when `screen.id` matches, renders the appropriate inline control(s) and passes `value`/`onChange` from parent state.

Example (conceptual) for `ventilation` in the twoCol branch:

```tsx
{/* existing paragraphs */}
{screen.content.filter(...).map(...)}
{screen.id === "ventilation" && (
  <div className="cc-inline-verify" style={{ marginTop: 12 }}>
    <InlineNumberInput value={stepInputs.roofRibInches} onChange={...} validate={...} />
  </div>
)}
{!isVentilation && renderButtons(screen, true)}
```

Similarly, in the stamped layout, after the checklist block, add the container-length select when `screen.id === "structural-fit"`.

---

## 5. Minimal state handling

- **Single state object** in `ContainerCreationsLanding2`:

```ts
type StepInputs = {
  containerLength: "20ft" | "40ft" | null;
  roofRibInches: number | null;
  ventFitVerified: boolean;
  airflowVents: number | null;   // or airflowCfM
  orderSizeConfirmed: boolean;
};
const [stepInputs, setStepInputs] = useState<StepInputs>({ ... });
```

- **Updaters**: Simple `setStepInputs(prev => ({ ...prev, containerLength: "40ft" }))` etc. No context needed unless you later split the component.
- **Derived values**: In the same component, compute:
  - Roof rib validation: e.g. valid if `roofRibInches != null && roofRibInches >= 1.5 && roofRibInches <= 2.5`.
  - Recommended vent count/size: simple rule from `containerLength` + `airflowVents` (e.g. default 1–2 vents, 12″).
- **Final recommendation screen**: Content is dynamic: from `stepInputs` build a short summary string (e.g. "Container: 40ft. Roof rib: 2″. We recommend 2× 12″ vents.") and render it in the existing `content` area (e.g. by replacing or supplementing the placeholder paragraph when `screen.id === "final-recommendation"`).

---

## 6. Validation rules (concrete)

- **Roof rib (ventilation)**: Accept decimal. Valid range e.g. 1.5–2.5 inches; show ✓ "Within range" or ⚠ "Typical range is 1.5–2.5 in. Confirm your measurement."
- **Container size**: No validation; optional default "20ft" if you want a preselection.
- **Airflow / vents (why-we-lead)**: Optional min/max (e.g. 1–10); if out of range, show warning but still update recommendation text.
- **Checkboxes**: No validation; used only for summary or UX reinforcement.

---

## 7. Design system alignment (no new layout)

- Use existing CSS variables: `--landing-radius`, `--landing-steel-border`, `--landing-steel-fg` for dark steps; for light steps (ventilation, structural-fit) use `#1a1d23`, `#e2e8f0` already used in `.measure-step-active` / `.landing-step-stamped`.
- Inline message: small font (0.875rem), success color #16a34a (already used for checklist checkmarks), warning #b45309 or similar (no red per theme).
- No new sections, no large forms: one row per input (label + control + message), margin-top ~8–12px from preceding content.

---

## 8. Implementation order

1. **State and types**: Add `StepInputs` type and `stepInputs` state in the landing TSX.
2. **Inline components**: Add `InlineNumberInput`, `InlineSelect`, `InlineCheckbox` (same file or small module) with landing-themed styles.
3. **structural-fit**: In stamped layout, after checklist, render container length select; wire to `stepInputs.containerLength`.
4. **ventilation**: In twoCol, after paragraph, render roof rib number input + validation message; wire to `stepInputs.roofRibInches`.
5. **continue**: In twoCol, add checkbox for vent fit verified; wire to `stepInputs.ventFitVerified`.
6. **why-we-lead**: In twoCol, add vents/CFM input and dynamic recommendation line; wire to `stepInputs.airflowVents` and derived text.
7. **choose-vent**: Add optional checkbox and/or display of recommended size from state; wire to `stepInputs.orderSizeConfirmed`.
8. **final-recommendation**: Build summary from `stepInputs` and render in place of placeholder text.
9. **CSS**: Add a small `.cc-inline-verify` (or equivalent) block in landing-theme.css only if needed for spacing; keep input/select styles minimal and aligned with existing buttons/inputs.

---

## 9. Out of scope (per requirements)

- No redesign of UI or typography.
- No new layout sections or large forms.
- No separate "calculator" section — all inputs inline in existing content.
- No JSON schema change in the minimal version (optional later: add `verification` block type to config for new steps).

This gives a step-by-step UI plan, a clear component split, and minimal state strategy for inline verification across the Container Creations checklist flow.