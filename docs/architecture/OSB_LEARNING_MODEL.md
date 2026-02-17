# OSB Learning Model (Non-AI, HI-Based)

**Document type:** Design only. Describes how the system gets smarter over time using frequency, repetition, domains used, and behavior patterns—without AI. No implementation.

---

## 1. Principle: Human-Intelligence (HI) Learning

**No ML, no external AI.** Learning = observable patterns in existing state and behavior:

- **Frequency** — How often the user routes to Journal vs Task vs Track vs Note.
- **Repetition** — Which tracks (think/repent/ask/conform/keep) or categories appear repeatedly.
- **Domains used** — Which parts of state are written to (journal tracks, structure categories, notes).
- **Behavior patterns** — Time of day, currentView before capture, sequence of actions (e.g. often Journal after viewing a track screen).

All inputs are already available: state-resolver output (journal, values, currentView), interaction.record payloads (type, target), and state event log (intents). No new sensors; no new engines.

---

## 2. Data Sources (Read-Only from Existing State)

| Source | Content | Use for learning |
|--------|---------|-------------------|
| **derived.journal** | Tracks (think, repent, ask, conform, keep, default) and keys (e.g. entry). | Which tracks have content; relative activity per track. |
| **derived.values.structure** | structure.items (tasks), categories, maybe calendar view. | How much the user plans; which categories recur. |
| **derived.values** | Any key (osb_draft, notes, etc.). | Presence of notes, drafts, future custom keys. |
| **derived.currentView** | Current screen or flow. | Context at capture time (e.g. on track screen → track likely). |
| **derived.interactions** | Append-only list of interaction.record payloads. | Last N actions (tap, navigate, etc.); not all events are interaction.record, but those that are give a signal. |
| **State event log** | Intents (journal.add, state.update, etc.). | Counts per intent; recent intents. |

**Constraint:** Learning logic must not mutate state except to write a **hint** object (e.g. state.update("osb_hints", ...)) so that the suggestion layer can read it. No new state intents; use state.update only for hints.

---

## 3. What to Learn (V1 Minimal)

**Output: a small "hints" object** stored in state (e.g. values.osb_hints). Suggestion logic reads it to bias suggestions. Shape is internal; no contract change.

Example fields (all optional):

- **routeWeights** — e.g. { journal: 0.4, task: 0.3, track: 0.2, note: 0.1 } from recent N captures. Used to order or highlight chips.
- **trackWeights** — e.g. { think: 0.5, repent: 0.2, ask: 0.2, conform: 0.05, keep: 0.05 } from journal track activity. When suggesting Track, prefer higher-weight track.
- **recentRoutes** — Last 5–10 route choices (journal/task/track/note/plan/relationship). Optional: "last time user chose X after similar intent" for same-session bias.
- **domainActivity** — Simple counts: journal writes, structure adds, note writes over a window (e.g. last 7 days or last 50 events). Normalize to ratios for routeWeights.

No personal identity, no profiles in V1; only aggregate counts and ratios derived from existing state.

---

## 4. When to Compute Hints

**Options:**

1. **On demand** — When OSB modal opens or when user focuses the input, run a pure function `computeOsbHints(getState())` that returns the hints object; optionally write it to state.update("osb_hints", ...) so the next open is fast, or keep it in memory for the session.
2. **After each capture** — When user accepts a suggestion and the system dispatches journal.add / structure:addFromText / state.update, run a lightweight "learning pass" that updates counts (e.g. in memory or in a small structure under values) and then writes osb_hints. No new intent; just a function called from the OSB component after dispatch.
3. **Periodic** — Not required for V1; could be a background tick that recomputes hints from state. Adds complexity; defer.

**Recommendation:** (2) After each capture. The OSB component (or a thin helper it calls) runs `computeOsbHints(getState())` after a successful save, then `dispatchState("state.update", { key: "osb_hints", value: hints })`. No new engine; no new events. Optionally (1) also on modal open so hints are fresh even if no capture happened yet this session.

---

## 5. How Suggestion Logic Uses Hints

- **Route order / emphasis:** Sort or highlight suggestion chips by routeWeights (e.g. show "Journal" first if journal weight is highest).
- **Track default:** When suggesting Track, pre-select the track with highest trackWeights (e.g. "TRACK: Think" if think dominates).
- **Optional "Same as last time":** If recentRoutes and current parser intent match a recent pattern, show a chip like "Same as last time (Journal)" for one-tap.

No change to parser or to routing contracts; hints only influence the **presentation and default selection** of suggestions.

---

## 6. Personal Context (V1 Minimal, No Profiles)

The task asked for inferring "personal vs work, relationships, planning vs reflection, spiritual vs practical" using only state history, recent usage, and parser intent.

**Without building profiles:**

- **Personal vs work** — Infer from keywords in draft (e.g. "work", "meeting", "boss" → work; "family", "kids" → personal) and optionally from categoryInference in structure rules if categories are labeled. Store at most as a tag in hints (e.g. lastCaptureDomain: "work") for next suggestion; no user profile.
- **Relationships** — Infer from keywords (who, call, meet, name) and from route choice (e.g. user often picks "Relationship" or Note when such keywords appear). Hints can include relationshipWeight to boost "Relationship" chip.
- **Planning vs reflection** — Parser intent (task vs note) plus structure activity (many items → planning mode). Bias Plan/Task when structure is active, Journal/Track when journal activity is recent.
- **Spiritual vs practical** — Track usage (think/repent/ask/conform/keep) is spiritual; task/structure is practical. Hints from trackWeights and routeWeights already capture this; no separate "spiritual" flag unless we add a keyword pass for spiritual terms and store a simple ratio.

All of the above are **heuristic only**, implemented in the same thin layer that computes suggestions and hints. No new engines; no identity or profile store in V1.

---

## 7. Boundaries

- **No AI:** No models, no API calls, no embeddings. Only counters, ratios, and keyword matches.
- **No new intents:** Learning writes only via state.update (e.g. osb_hints). State-resolver unchanged.
- **No new engines:** Learning is a pure function (or a few) that reads getState() and returns a hints object; optional write back via state.update. Can live next to the suggestion logic in the same module.
- **Privacy:** Hints are derived from state already in memory; no export of raw history required for V1. If state is persisted, hints may be persisted too; document that osb_hints is derived and can be cleared.

---

## 8. Summary

- **Learning = hints from state:** Frequency and recency of journal adds, structure adds, track usage, currentView, and (optionally) interaction.record.
- **Output:** values.osb_hints (routeWeights, trackWeights, recentRoutes, etc.) for suggestion layer to read.
- **When:** On each capture and optionally on OSB open; pure function computeOsbHints(getState()) then state.update.
- **Use:** Bias chip order, default track, optional "Same as last time" suggestion.
- **Personal context:** Infer personal/work, relationship, planning/reflection, spiritual/practical via keywords and existing state only; no profiles.

This document is design only. No code has been modified.
