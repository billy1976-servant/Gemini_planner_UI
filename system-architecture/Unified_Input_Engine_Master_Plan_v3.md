# Unified Input Engine — Master Plan v3

**Purpose:** Stronger simplicity, faster build path, deeper unification, clearer user impact. Builds on v2. Adds personal calibration, progressive intelligence, personal output shaping, and a strict simplicity audit. Architecture and analysis only — no implementation.

**Guiding philosophy:** One organism. Work mostly in the background. Reduce phone usage and decisions. Turn raw perception into life clarity. Grow smarter quietly over time. Simpler, faster, more unified, more human, more invisible.

---

## 1. Mental Model Upgrade from v2

### What v2 established

- **Inputs → Snapshots → Interpretation → Tools.** One snapshot type, one log, one read API. Calibration and fusion as interpretation over the log. Tools = descriptors + views.
- Organism metaphor (eyes, hands, feet, ears, skin, brain). Cross-connection of sources. Power multipliers (one calibration, one fusion, one tool contract).
- Build order: Core → Capture → Interpretation → Tool templating.

### What v3 adds

| Dimension | v2 | v3 |
|-----------|----|----|
| **Calibration** | Device-based; single store and pass. | **Personal:** user- and device-specific over time; learns patterns; same single store, no new pipelines. |
| **Intelligence** | Interpretation = calibration + fusion. | **Progressive:** Tier 1 instant baseline → Tier 2 optional guided improvement → Tier 3 passive refinement. Precision grows without extra UI. |
| **Output** | Tools = views over snapshot + interpretation. | **Personal output shaping:** Same tools, different “lenses” per user context (e.g. construction vs fitness vs quiet). Descriptor layer only. |
| **Unification** | Five layers (capture, log, interpretation, tools, existing). | **Five ones:** One perception engine, one snapshot model, one interpretation layer, one personalization layer, one tool descriptor system. Everything else = views. |
| **Build speed** | Core first, then capture, then interpretation. | **Faster sequencing:** Minimal viable core; first 3 tools as soon as capture exists; personalization and progressive tiers as optional layers on top. |
| **User impact** | One engine, infinite perspectives. | **Life simplification:** Fewer decisions, less screen time, clarity from one place; system improves in background. |

### Core v3 thesis

The system is **one perception engine** that (1) captures once, (2) interprets once (with device + personal calibration and fusion), (3) personalizes output once per user/context, and (4) exposes many tools as **views** over that single pipeline. Intelligence and accuracy improve over time **without** new pipelines or new apps — via the same log and the same interpretation layer, with optional personalization and progressive refinement.

---

## 2. Personal Calibration Layer

### Model

- **Device calibration** (v2): Per-sensor offsets; raw → adjusted; one store, one pass. Unchanged.
- **Personal calibration (new):** Over time, the system learns **per user (and per device)**:
  - **Movement:** Typical hold angle, rest pose, walking vs still. Reduces false “not level” when the user holds the phone slightly off.
  - **Usage:** When and how often tools are used; which sources matter most. Informs sampling and which interpretations to prioritize.
  - **Environment:** Recurring locations, typical noise/light; “at home” vs “jobsite” vs “outdoors.” Context for interpretation (e.g. jobsite → higher precision for level).
  - **Device handling:** How stable the user holds the device; typical motion noise. Improves filtering and confidence.

Personal calibration is **not** a separate pipeline. It is **additional data in the same calibration store**: e.g. `deviceOffsets` (existing) + `userProfile` (learned). The same **interpretation layer** that applies device offsets also applies user-specific adjustments (e.g. “this user’s rest orientation is X; treat readings relative to X”). Learning runs over the **same snapshot log** already being written; no new capture path.

### How this increases accuracy

- **Level:** User’s “natural hold” is learned; “level” is reported relative to that, reducing “wobble” when the user isn’t perfectly still.
- **Motion / steps:** Gait and phone-carry pattern improve step and motion interpretation without asking the user to “calibrate steps.”
- **Audio:** Typical ambient noise and voice level improve “is this loud?” and voice tools.
- **Presence / location:** Recurring places improve “at home / at work” and reduce spurious “entered/left” events.

Accuracy improves because interpretation has **context**: not only “what the sensor read” but “for this user, in this context, this reading usually means X.”

### How it stays simple architecturally

- **One store:** Calibration store holds both device and user-derived params. No “personal calibration store” separate from “device calibration store.”
- **One pass:** Interpretation reads from one store (device + user) and applies one pass: raw snapshot → device adjustment → user adjustment → calibrated output. No second interpretation path.
- **Learning = derivation:** “Learning” is a **reader** of the snapshot log (and optionally state). It writes **only** into the calibration store (user profile). So: log → learning process → calibration store → interpretation reads calibration store. Same append-only log; no new append path for “personal data.”
- **No new pipelines:** Capture unchanged. Snapshot format unchanged. Tools still query “calibrated” view; they don’t know whether calibration is device-only or device + user.

### How it avoids new pipelines

- Personalization does not add a new “user data pipeline.” It adds **keys and values** to the existing calibration store and **optional logic** in the interpretation layer (e.g. “if userProfile exists, apply user-specific offset”). Learning is a **batch or background job** over the existing log; it does not stream new data types. Tools and UI do not change; they still ask for “calibrated” and get a single answer.

---

## 3. Progressive Intelligence Model

### Three-tier perception structure

| Tier | Name | Behavior | User friction | Precision |
|------|------|----------|----------------|-----------|
| **1** | **Instant baseline** | Works immediately. Minimal or no calibration. Uses device defaults and, if available, any existing user profile. | None. User opens tool and gets a usable answer. | Good enough for “is it level?” / “how many steps?” / “where am I?” |
| **2** | **Guided improvement** | Optional, rare prompts: “Allow a few more samples to improve accuracy”; “Hold device in 2–3 positions for better calibration.” User can dismiss. | Low. One-time or occasional. | Better. Reduces systematic error (e.g. level bias, step undercount). |
| **3** | **Passive refinement** | System improves confidence and user profile over time using snapshots already being captured. No prompts. No extra UI. | None. Invisible. | Best. Accuracy and personalization improve as more data accumulates. |

### How tiers work together

- **Tier 1 is always on.** Every tool works from first use. No “calibrate before use” gate. Interpretation uses device calibration + any existing user profile; if none, it uses defaults.
- **Tier 2 is optional and sparse.** Triggered only when (a) confidence is below a threshold and (b) the system infers that a small amount of guided input would help (e.g. “we need 5 samples in different orientations”). Shown as a soft prompt; user can ignore. Result: better device or user calibration; Tier 1 and Tier 3 then use it.
- **Tier 3 runs in the background.** As the user uses the app, snapshots keep appending to the log. A learning process (scheduled or on-demand) reads recent snapshots, updates the user profile in the calibration store, and possibly device calibration. Tools never “ask” for Tier 3; they just read the calibrated view, which gets better over time.

### How this increases precision without increasing complexity

- **One interpretation path:** All three tiers feed the **same** calibrated view. Tools don’t branch on “tier.” They read “calibrated”; the interpretation layer decides whether that comes from defaults (Tier 1), guided-improvement results (Tier 2), or passive refinement (Tier 3).
- **No tier-specific pipelines:** Tier 2 is “optionally ask user for a few samples” and write results into the same calibration store. Tier 3 is “read log, compute profile, write calibration store.” Same store, same pass.
- **Progressive by default:** New user gets Tier 1. If they never opt in to Tier 2 and never use the app much, they still have a working tool. If they use the app, Tier 3 quietly improves things. Complexity is in the **interpretation and learning logic**, not in the number of paths tools or the user must understand.

---

## 4. Personal Output Shaping

### Concept

**Same tools, different “lenses” by user context.** The same Level tool, the same step tracker, the same audio tool — but **output and emphasis** adapt to who the user is and how they use the system.

Examples:

- **Construction user** → Level tuned for jobsite precision (e.g. finer angles, tolerance display, “plumb” semantics). Other tools available but not emphasized.
- **Non-construction user** → Level in “is it straight?” mode: simple yes/no or coarse indicator; minimal numbers.
- **Fitness user** → Motion and step tools emphasized; Level and audio de-emphasized in default view.
- **Quiet / minimal user** → Audio tools minimized or hidden by default; emphasis on visual and motion tools.

### Design: descriptor layer only

- **Not new apps.** Same app, same engine, same tools. No “Construction Level App” vs “Consumer Level App.”
- **Not new engines.** Same perception engine, same snapshot model, same interpretation layer. No separate “construction interpretation” pipeline.
- **Lens = descriptor + view variant.** A “lens” is:
  - A **context label** (e.g. `construction`, `fitness`, `minimal`, `default`) that can be inferred or set (e.g. from usage, from one-time choice, or from screen/template).
  - A **mapping** from (tool id, context) → (view variant, optional interpretation params). E.g. Level + `construction` → precision view + strict tolerance; Level + `default` → simple view + loose tolerance.
- **Personalization layer** (see §5) holds: (1) calibration store (device + user), (2) **output shaping rules**: which context applies, and which view/params each tool gets. Tools don’t implement “construction mode”; they receive **already-shaped** params and view name from the descriptor system.

### How it stays simple

- **One tool descriptor system.** A tool still has one descriptor (sources, interpretation, view). The descriptor system **resolves** (tool, context) → (concrete view, params) using the personalization layer. So the tool is still “one descriptor”; the system adds a **resolution step** that picks view variant and params by context.
- **Views are variants, not new tools.** “Level precision” and “Level simple” are two **view variants** of the same Level tool (same sources, same interpretation; different UI and maybe different tolerance in interpretation params). No duplication of tool logic.
- **Context can be simple.** Start with a single “context” (e.g. default) or a small set (default, construction, fitness, minimal). Inferred from usage over time (Tier 3) or from one-time user choice. No complex “persona” engine required.

---

## 5. Deeper Unification Model

### Five ones

The system reduces to **five core elements**. Everything else is **views** (including UI, screens, and tool UIs).

| One | What it is | What it is not |
|-----|------------|----------------|
| **One perception engine** | Single capture path: capability-gated sources → one snapshot format → one log. One place that “perceives.” | Not multiple apps or multiple capture pipelines. |
| **One snapshot model** | One type `{ t, source, payload, meta? }`; one append-only log; one read API. | Not “sensor log” vs “state log” for input; one input timeline. |
| **One interpretation layer** | One place that turns raw snapshots into calibrated and fused meaning. Device calibration + personal calibration + fusion recipes. Tier 1/2/3 all feed this. | Not per-tool calibration or per-tool fusion. |
| **One personalization layer** | One place that holds: (1) user/device calibration (learning output), (2) output-shaping rules (context → view variant + params). Tools and System7 read from “interpretation + personalization,” not from raw. | Not per-tool or per-app personalization stores. |
| **One tool descriptor system** | One format and one runtime: descriptor = sources + interpretation refs + view (or view variant). Runtime resolves (descriptor + context) → (snapshot + interpretation + view). | Not separate “tool engines” or separate descriptor formats per tool. |

### Everything else = views

- **Screens, layouts, tool UIs:** Views over the same engine. JSON-driven screens and tool views are different **presentations** of the same pipeline.
- **System7 channels:** Views over the same log + interpretation (channel = “read sources X with interpretation Y”).
- **Exports, reports, diagnostics:** Views (read from log + interpretation; format for export or debug).
- **“Level,” “Steps,” “Location,” “Decibel”:** Tools are views: same engine, same log, same interpretation; different descriptor (sources + view) and possibly different lens (context → view variant).

This is **maximum simplification**: one pipeline, one interpretation, one personalization, one descriptor system; **N** views.

---

## 6. Faster Build Strategy

### Recalculated time estimates

| Milestone | v2 estimate | v3 estimate | Notes |
|-----------|-------------|-------------|--------|
| **Foundation (core)** | Weeks | **1–2 weeks** | Minimal: snapshot type, log, read API only. No tools, no interpretation. |
| **Capture** | After core | **+1–2 weeks** | Wire existing sources into snapshot format and log; fix async. First “working” pipeline: data flows in. |
| **First 3 tools** | After capture + interpretation | **+1–2 weeks after capture** | Don’t wait for full interpretation. First 3 tools can use **raw or minimal calibration** (device defaults). Tool = descriptor + view; interpretation = “latest snapshot” or “latest + device offset only.” Proves “one engine, many views” immediately. |
| **Interpretation (calibration + fusion)** | After capture | **+2–3 weeks** | Full device calibration + one or two fusion recipes. Enables better accuracy and more tools. |
| **10+ tools** | Weeks after interpretation | **+2–4 weeks after interpretation** | Each new tool = descriptor + view. No new pipelines. 10 tools ≈ 10 descriptors + views. |
| **Personalization (personal calibration + output shaping)** | Not in v2 | **+2–3 weeks** (can be parallel or after first tools) | Learning over log → calibration store; context → view variant. Optional for MVP; can ship first tools without it. |
| **Progressive intelligence (Tier 2 + 3)** | Not in v2 | **+1–2 weeks** (thin layer on top) | Tier 2 = optional prompts + write to calibration. Tier 3 = background job over log → calibration. No new pipeline. |

### Time savings vs old method

- **Old way:** First tool (e.g. Level) ≈ weeks (custom wiring, UI, maybe custom calibration). Next 10 tools ≈ months (per-tool logic, different patterns). 50+ ≈ long, with refactor risk.
- **v3 way:** Foundation + capture ≈ 3–4 weeks. First 3 tools ≈ 1–2 weeks after that (≈ 5–6 weeks total to “three working tools”). Interpretation ≈ +2–3 weeks. Next 7 tools to reach 10 ≈ 1–2 weeks. **Rough total to 10 tools: ~8–11 weeks** vs months in the old model. 50+ tools remains linear in descriptors once interpretation and personalization are stable.

### What unlocks power fastest

1. **Core + capture first.** Without a single log and capture path, nothing else compounds. This is the non-negotiable foundation.
2. **First 3 tools on raw/minimal calibration.** Proves the “one engine, many views” model and delivers user value quickly. Interpretation can be “latest snapshot” or “latest + device offset” only; full calibration and fusion can follow.
3. **Tool descriptor system and one view binding.** Once this exists, every new tool is additive (descriptor + view). This is the **fastest multiplier** after capture.
4. **Interpretation (calibration + fusion)** next. Unlocks accuracy and more tool categories (e.g. presence, pattern). Can be done in parallel with adding more tools that use “basic” interpretation.
5. **Personalization and progressive tiers** after or in parallel. They improve experience and accuracy but are not required for “first working tools.” Ship when the base pipeline is stable.

### What can be postponed

- **Full fusion recipes:** Start with one (e.g. presence or “level + still”). Add more as needed.
- **Personal calibration learning:** Can ship with device calibration only; add user-profile learning when core and tools are stable.
- **Tier 2 guided prompts:** Can ship Tier 1 + Tier 3 only (instant baseline + passive refinement); add optional prompts later.
- **Rich output shaping:** Can ship with one context (default); add construction/fitness/minimal lenses when usage justifies it.
- **Continuous / multi-angle sampling:** Optional (see §8). Not required for first tools.

### What is truly required first

- **Snapshot type + log + read API** (core).
- **Capture:** All allowed sources → snapshot → append. So the engine “perceives” and stores.
- **At least one tool as descriptor + view** (to validate the contract and deliver value).

After that, order is flexible: more tools vs interpretation vs personalization can be balanced by product need; the architecture supports any order.

---

## 7. Continuous Snapshot Strategy (Optional Layer)

### Concepts

- **Multi-angle sampling:** For sources that benefit from multiple orientations (e.g. level), capture can take several samples in quick succession or prompt the user for 2–3 poses (Tier 2). These are multiple snapshots (same source, same t or close t); interpretation can merge them into one “best” or “confidence-weighted” reading.
- **Multi-moment sampling:** Over time, the same source is sampled repeatedly (already true with continuous or interval-based capture). Interpretation can use “last N” or “window [t0, t1]” to reduce noise (e.g. average, median, or variance-based confidence).
- **Confidence growth:** Each snapshot or fused result can carry a **confidence** (e.g. from variance, from number of samples, or from user-profile match). Tools can show or use confidence (e.g. “level: 0.2° ± 0.1” or “low confidence — hold steadier”). Over time, more data and personal calibration increase confidence (Tier 3).

### How this improves accuracy

- **Multi-angle:** Reduces one-off bias (e.g. level calibration from one hold). A few samples improve device/user calibration.
- **Multi-moment:** Smooths noise; reduces jitter in UI; improves step counting and motion-based tools.
- **Confidence:** User and system know when to trust the reading; guides Tier 2 (“allow a few more samples”) and Tier 3 (passive refinement targets low-confidence cases).

### How to keep it lightweight

- **Same log.** Multi-angle and multi-moment are just “more snapshots” in the same log (same type, same API). No new event type.
- **Interpretation-only.** “Merge N snapshots” and “compute confidence” happen in the interpretation layer when a tool or channel asks for “calibrated” or “fused.” Capture stays dumb: append only.
- **Optional.** First tools can use “latest snapshot” only. Multi-moment and confidence can be added to interpretation later; tools that don’t need them ignore confidence.

### How to keep it optional

- **Feature flag or interpretation mode:** “Simple” = latest snapshot, device offset only. “Enhanced” = multi-moment window + confidence + optional multi-angle. Tools or capability can choose which mode.
- **No UI requirement:** Confidence can be used only for internal refinement (Tier 3) and for optional Tier 2 prompts; UI can stay “one number” or “level bar” without showing confidence unless desired.
- **Incremental:** Ship capture + simple interpretation first; add multi-moment and confidence in a later iteration. No big-bang “continuous strategy” required for v1.

---

## 8. Simplicity Audit

For each proposed layer, four questions: Does it **reduce** complexity? Build time? UI clutter? User effort? If it fails, it should be removed or deferred.

| Layer / concept | Reduces complexity? | Reduces build time? | Reduces UI clutter? | Reduces user effort? | Verdict |
|-----------------|---------------------|---------------------|---------------------|----------------------|---------|
| **One snapshot model** | Yes. One type, one log, one API. | Yes. One path to build and test. | Yes. No per-tool data UIs. | Yes. One place data lives. | **Keep.** |
| **One interpretation layer** | Yes. One place for calibration and fusion. | Yes. Build once, reuse for all tools. | Yes. No per-tool “calibration” screens. | Yes. User doesn’t manage interpretation. | **Keep.** |
| **One tool descriptor system** | Yes. One format, one runtime. | Yes. New tool = descriptor + view. | Yes. Tools are views, not separate UIs. | Yes. Fewer “apps” to learn. | **Keep.** |
| **Personal calibration** | Yes, if same store and same pass. | Yes. One learning path, all tools benefit. | Yes. No “calibrate per tool.” | Yes. System adapts without user action. | **Keep** (implement as same store + pass). |
| **Progressive intelligence (3 tiers)** | Yes. One path; tiers are modes of same interpretation. | Yes. No separate “advanced” pipeline. | Yes. Tier 2 rare; Tier 3 invisible. | Yes. Works immediately; improves quietly. | **Keep.** |
| **Personal output shaping** | Yes, if descriptor-only (context → view variant). | Yes. No new apps or engines. | Yes. One app, right lens for context. | Yes. Fewer irrelevant options. | **Keep.** |
| **One personalization layer** | Yes. One place for calibration + shaping. | Yes. One layer to build and maintain. | Yes. No scattered “settings.” | Yes. One place system “learns.” | **Keep.** |
| **Continuous / multi-moment / confidence** | Yes, if interpretation-only and optional. | Defer. Not required for first tools. | Yes. Can stay invisible. | Yes. Better accuracy with no extra steps. | **Keep as optional;** defer to after first tools. |
| **Multiple fusion recipes** | Yes. One engine, many recipes. | Yes. New behavior = new recipe. | Yes. No new screens per recipe. | Yes. Richer meaning, same UI pattern. | **Keep.** |
| **Separate “user calibration” pipeline** | No. Two pipelines. | No. Two systems to build. | Maybe. | Maybe. | **Reject.** Personal calibration must use same store and pass. |
| **Tier 2 as mandatory “calibrate now”** | No. Adds a required step. | N/A. | No. Extra screen. | No. More user effort. | **Reject.** Tier 2 must be optional and rare. |
| **New app per context (e.g. “Construction Level”)** | No. More apps. | No. More codebases. | No. More icons and choices. | No. More decisions. | **Reject.** Use lenses (descriptor + view variant) instead. |

### Summary

- **Keep:** Single snapshot model, single interpretation layer, single tool descriptor system, personal calibration (unified store + pass), progressive intelligence (3 tiers), personal output shaping (descriptor layer), single personalization layer, optional continuous/multi-moment/confidence, fusion recipes.
- **Reject or defer:** Separate user-calibration pipeline, mandatory Tier 2, new app per context. Continuous strategy: keep as optional and defer until after first tools.

---

## 9. Time Estimate Revision and Impact Analysis

### Revised time estimates (summary)

- **Foundation (core):** 1–2 weeks.  
- **Capture:** +1–2 weeks.  
- **First 3 tools (raw/minimal interpretation):** +1–2 weeks after capture.  
- **Interpretation (calibration + fusion):** +2–3 weeks.  
- **10+ tools:** +2–4 weeks after interpretation (descriptor + view per tool).  
- **Personalization (personal calibration + output shaping):** +2–3 weeks (can overlap).  
- **Progressive intelligence (Tier 2 + 3):** +1–2 weeks (thin layer).  

**To first 3 working tools:** ~5–6 weeks. **To 10+ tools with interpretation and optional personalization:** ~10–14 weeks. **vs old way:** Meaningful reduction (months → ~2.5–3.5 months for 10 tools, with linear scaling beyond).

### Impact analysis: user life simplification

| Goal | How v3 achieves it |
|------|--------------------|
| **Reduce phone usage** | One app, one engine. Tools are views; no switching between “Level app,” “Steps app,” etc. Fewer apps to open and manage. |
| **Reduce decisions** | No “which app?” No “calibrate now?” (Tier 1 works; Tier 2 optional and rare). Output shaping presents the right lens; user doesn’t choose “construction mode” unless they want to. |
| **Turn raw perception into life clarity** | One place that sees (camera, motion, location, audio, etc.) and one place that turns that into meaning (interpretation + personalization). User gets “is it level?”, “how many steps?”, “where was I?”, “how loud?” from the same organism. |
| **Grow smarter quietly** | Tier 3 passive refinement and personal calibration improve accuracy and relevance over time. No extra prompts or screens. User effort decreases as the system adapts. |
| **Feel like one organism** | One perception engine, one snapshot model, one interpretation layer, one personalization layer, one tool descriptor system. Everything else = views. Mental model: “my device perceives once and shows me many ways to see.” |
| **Work mostly in the background** | Capture and learning run without constant user attention. Tools are “ask when you need”; the rest is automatic. |
| **Simpler, faster, more unified, more human, more invisible** | Fewer concepts (five ones). Faster to first tools and to 10+. One pipeline. Human-centric (personal calibration, output shaping, progressive tiers). Invisible where possible (Tier 3, optional Tier 2, lenses). |

---

## 10. Final Structure and Build Order (v3)

### Layered model (v3)

```
┌─────────────────────────────────────────────────────────────────┐
│  VIEWS                                                            │
│  Tool UIs, screens, System7 channels, exports — all views        │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│  ONE TOOL DESCRIPTOR SYSTEM                                       │
│  (tool, context) → sources + interpretation + view variant        │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│  ONE PERSONALIZATION LAYER                                        │
│  Calibration (device + user) + output shaping (context → lens)   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│  ONE INTERPRETATION LAYER                                         │
│  Calibration pass + fusion recipes; Tier 1/2/3 feed same output   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│  ONE SNAPSHOT MODEL                                               │
│  One type, one log, one read API                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│  ONE PERCEPTION ENGINE                                            │
│  Capability-gated capture → snapshot → append to log              │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│  EXISTING (unchanged)                                             │
│  Capability, sensor gates, state-store, System7, JSON pipeline   │
└─────────────────────────────────────────────────────────────────┘
```

### Build order (v3)

1. **Core** — Snapshot type, log, read API.  
2. **Capture** — Wire sources to snapshot and log.  
3. **First 3 tools** — Descriptor + view; use raw or minimal (device-only) interpretation. Proves value and contract.  
4. **Interpretation** — Device calibration + one fusion recipe.  
5. **Tool descriptor system** — Formal descriptor format and runtime (context → view variant can start as “default” only).  
6. **More tools** — Scale to 10+ via descriptors + views.  
7. **Personalization** — Personal calibration (learning over log → calibration store) + output shaping (context → lens).  
8. **Progressive intelligence** — Tier 2 (optional prompts) + Tier 3 (passive refinement).  
9. **Optional** — Continuous / multi-moment / confidence in interpretation; more fusion recipes; more lenses.  

### What to build first

**Core, then capture, then first 3 tools.** This delivers “one engine, three views” and validates the snapshot model and descriptor concept with minimal interpretation. Interpretation and personalization can follow without redoing the foundation.

### What unlocks the most power

**Tool descriptor system + interpretation.** Once “tool = descriptor + view” and “interpretation = calibration + fusion” are in place, every new tool and every new recipe multiplies value with minimal new build. Personalization and progressive tiers then make the same tools **better** for each user without new pipelines.

---

## Document status

- **Builds on:** Unified Input Engine — Master Plan v2 (and v1 Compatibility & Architecture Plan).  
- **v3 adds:** Personal calibration layer, progressive intelligence (3 tiers), personal output shaping, deeper unification (five ones), faster build strategy, continuous snapshot strategy (optional), simplicity audit, revised time estimates, and user-life impact analysis.  
- **Scope:** Architecture and analysis only; no implementation, no code, no file changes.  
- **Next step:** Use v3 to prioritize implementation (when authorized): core → capture → first 3 tools → interpretation → descriptor system → scale and personalization.
