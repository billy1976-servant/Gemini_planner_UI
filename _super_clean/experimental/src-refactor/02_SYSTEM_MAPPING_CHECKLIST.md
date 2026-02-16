# 02 — System Mapping Checklist

**Purpose:** Convert the master architecture into a validation checklist. Use for analysis and stability checks before and during refactor. Answer each item with YES / NO / N/A and note exceptions.

---

## 1. Pipeline order

| # | Check | Expected |
|---|--------|----------|
| 1.1 | Does the system follow **JSON → Engines → State → Layout → Renderer → UI** (DOM)? | YES: primary path is JSON screen → document prep (engines) → state init/update → layout resolution (in renderer) → JsonRenderer → DOM. |
| 1.2 | Is screen load the first runtime step (after route)? | YES: loadScreen(path) then root resolution, then document prep. |
| 1.3 | Is layout resolution applied per-node in the renderer (not before page.tsx)? | YES: applyProfileToNode in JsonRenderer; overrides and profile passed from page. |
| 1.4 | Is behavior (user gesture → event → handler) after render? | YES: CustomEvents from DOM → behavior-listener → dispatchState / navigate / runBehavior / interpretRuntimeVerb. |
| 1.5 | Is state update the single write path for app state? | YES: dispatchState → log → deriveState → persist (except state.update) → notify. |

---

## 2. Engines

| # | Check | Expected |
|---|--------|----------|
| 2.1 | Are engines **small** (single concern per engine)? | YES: assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen, applyProfileToNode, renderNode, runBehavior, interpretRuntimeVerb, etc. each have a focused role. |
| 2.2 | Are engines **single-responsibility**? | YES: No engine both resolves layout and mutates state; no engine writes to another domain’s store. |
| 2.3 | Are engines **composable** (output of one feeds next)? | YES: Document prep order assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen; action branch state:* > navigate > contract verbs > interpretRuntimeVerb. |
| 2.4 | Is there a single primary renderer for the JSON path? | YES: JsonRenderer. Others (renderFromSchema, SiteSkin, etc.) are SECONDARY or DEAD. |
| 2.5 | Is there a single runtime-verb-interpreter on the main path? | YES: logic/runtime only; engine/runtime must not be used on main path. |
| 2.6 | Is there a single content-resolution entrypoint? | YES: One content-resolver; no duplicate logic/content vs content. |

---

## 3. Persistence

| # | Check | Expected |
|---|--------|----------|
| 3.1 | Is persistence **event-based** (log of intents + payloads)? | YES: log: StateEvent[]; each entry has intent and payload. |
| 3.2 | Is persistence **append-only**? | YES: log.push only; no in-place mutation of past events. |
| 3.3 | Is state **reconstructable** from the log? | YES: state = deriveState(log); pure function; same log ⇒ same DerivedState. |
| 3.4 | Is there a single persistence format for app state? | YES: localStorage key in state-store; stored shape = event log; no second app-state store. |
| 3.5 | Is high-frequency update (e.g. state.update) excluded from persist? | YES: intent === "state.update" skips persist(). |

---

## 4. State

| # | Check | Expected |
|---|--------|----------|
| 4.1 | Is state **minimal** (only derived keys: currentView, journal, values, layoutByScreen, scans, interactions)? | YES: No extra derived keys without contract. |
| 4.2 | Is state **session-bound** (rehydrate on boot; no server-side state store)? | YES: rehydrate on bootstrap from localStorage; client-side only. |
| 4.3 | Is state **replaceable** (full state derivable from log; no hidden mutable globals)? | YES: deriveState(log) produces full snapshot; no other source of truth for app state. |
| 4.4 | Do layout/profile and override stores remain separate from state-store? | YES: layout-store, section-layout-preset-store, organ-internal-layout-store are not part of state-store log/deriveState. |
| 4.5 | Are all state write surfaces bounded and documented? | Target: STATE_MUTATION_SURFACE_MAP complete; no new dispatchState without contract. |

---

## 5. Layout

| # | Check | Expected |
|---|--------|----------|
| 5.1 | Is layout **JSON-driven** where explicit? | YES: node.layout (explicit) is a valid source; section params stripped of layout keys; layout id from override → node.layout → template default. |
| 5.2 | Is layout **engine-informed** (resolver uses profile, template, override stores)? | YES: applyProfileToNode uses getDefaultSectionLayoutId(templateId), sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides. |
| 5.3 | Does layout domain avoid writing to state/behavior/logic? | YES: Layout does not call dispatchState, runBehavior, or interpretRuntimeVerb. |
| 5.4 | When resolver returns null, does Section render div only (no invented layout ID)? | YES: resolveLayout(layout) → null ⇒ div wrapper only. |
| 5.5 | Are layout allowedTypes and node types from registry or JSON (not hardcoded)? | Target: Phase 2; no hardcoded Set in layout-store or collapse-layout-nodes. |

---

## 6. Contracts and authority

| # | Check | Expected |
|---|--------|----------|
| 6.1 | Authority ladder: override → explicit → suggestion [reserved] → template default → undefined? | YES: applyProfileToNode implements this order. |
| 6.2 | Blueprint boundary: no layout in params, no screen IDs, no layout primitives in screen tree? | YES: Compiler output and runtime contract; collapseLayoutNodes in dev. |
| 6.3 | Scripts boundary: no script under src/scripts/ imported by app/engine/state/layout at runtime? | YES: grep confirms no such import. |
| 6.4 | Registry single source (type → component)? | YES: registry.tsx only; no competing maps. |

---

## How to use this checklist

- Run before starting refactor: establish baseline (which items are YES/NO/N/A).
- Run after each phase: ensure no regression; update target items as work completes.
- Use N/A only where the check does not apply to the codebase (document reason).
- Any NO must be tracked (gap list or refactor stage) and resolved or explicitly accepted with doc update.
