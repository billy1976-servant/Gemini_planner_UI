# Extreme Mode Task Input — Architecture Comparison & Implementation Strategy (Version 4)

**Document type:** Full technical report — architecture comparison, parser system, rules formalization, and Extreme Mode spec  
**Version:** 4  
**Scope:** Azure Clarify runtime (HiSense); speech/stream onboarding → parser → structured task creation; JSON-first structural system.  
**Bias:** Evidence-based; Final Summary is decisive.

---

## 1. Architecture Assessment

### 1.A — Current System

**Logic engine structure**

- Execution engines (learning, calculator, abc) consume `EducationFlow` and return transformed flow or step order. Aftermath processors (decision, summary) consume `EngineState` (step outcomes, signals, blockers).
- Engines are registered by id; invoked by actions or flow routing. No generic “task” or “structure” engine; no planner-specific engines in code today.
- Contract: handlers receive `(action, state)`; they may call `dispatchState`. Action registry is extend-only ([`action-registry.ts`](src/05_Logic/logic/runtime/action-registry.ts)); lookup by action name; no JSON-driven action discovery.

**Task onboarding flow**

- No task creation path exists. Planner would use one state key (e.g. `values.planner`). Add-task would be a new action (e.g. `planner:addTask`) whose handler reads state, optionally calls engines, merges new task into `planner.tasks`, dispatches `state.update` with key `planner`.

**Parser integration**

- No speech or NL parser in codebase. Diagnostics use capture → input-log → interpret for sensors ([`interpret.ts`](src/09_Integrations/interpret.ts)); `getLatestInterpreted(sensorId)` returns display-safe sensor value. No equivalent “interpret speech” or “parse stream to structure” layer. Parser would be a new integration: stream in → parsed segments or structured candidates out.

**State update pattern**

- Single path: `dispatchState(intent, payload)`. Log append; then `deriveState(log)` recomputes state. Supported intents: `state:currentView`, `journal.set`/`journal.add`, `state.update`, `layout.override`, `scan.*`, `interaction.record` ([`state-resolver.ts`](src/03_Runtime/state/state-resolver.ts)). Task creation would use `state.update` with key `planner` and value = full planner slice (or a new intent e.g. `planner.appendTask` if added to resolver).

**Rule execution model**

- Rules are not first-class. Flow-router evaluates routing rules (when signals/blockers/opportunities, then skip/goto/repeat) over flow + outcomes. No generic rule evaluator; no JSON rule set that drives task inference (category, priority, recurrence, habit). Any rule logic would live inside action handlers or new engines.

**Task creation path (current)**

- Hypothetical: UI or external trigger emits action `planner:addTask` with params (title, categoryId?, priority?, …). Handler in registry reads `getState().values.planner`, builds task object, appends to tasks, dispatches `state.update` with key `planner`. Parser would sit outside: parser output → payload to same action. No structural inference (category/priority/recurrence) unless handler or a dedicated engine implements it.

---

### 1.B — Alternative Structure-Driven Model

**Interpreter / event-driven parsing**

- Event flow: raw input (e.g. stream chunk or transcript segment) → parse event → interpreter maps event to structure using JSON-defined rules → derived structure (task candidates) → state write. Parser emits “events”; interpreter does not hard-code task shape—it uses a rule set (e.g. keyword → category, phrase pattern → recurrence) defined in JSON or in a config slice of state.

**JSON-defined rules + structure**

- Rules live in JSON: e.g. category inference (keywords → categoryId), priority inference (urgency words → priority band), recurrence/habit patterns. A generic “rule evaluator” or “structure mapper” takes (rules, parse result, context) and returns structured fields. Same pattern as V3 plan: structure and rules in JSON; engine only evaluates.

**State-stack reconstruction**

- Unchanged. Same event log and `deriveState(log)`. No second state model. Optional: parser could append “parse” or “input” intents to the log for replay/debug; or parser output is ephemeral and only the resulting `state.update` is logged.

**Engine simplification potential**

- Task-related logic becomes pure engines: (config, state slice, parse result) → task candidate or delta. Category inference, priority inference, recurrence/habit detection can be small functions that take rules from JSON. No flow or step types; no UI. Actions orchestrate: call parser, call inference engines with JSON rules, then dispatch state.

**Stream-to-structure mapping**

- Stream → parser → list of segments or one incremental result. Mapping layer: segments + JSON rules → task candidates (title, categoryId?, priority?, recurringType?, habit?). Batch: multiple segments → multiple candidates; one action could accept a batch and write N tasks in one state update. Partial phrases: parser may emit partials; rules can define “confidence threshold” or “commit on boundary”; state write can be deferred until commit.

---

## 2. Extreme Mode Task Input Module — Per-Architecture Handling

### 2.1 Spoken/streamed task ingestion

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Continuous speech input** | New: stream source (mic/API) → buffer. Action or middleware consumes buffer; no built-in stream contract. Handler receives “final” or “chunk” payload; batching is handler responsibility. | Same stream source. Interpreter layer subscribes to stream; emits parse events. Rule set can define “commit on silence” or “commit on phrase boundary.” No change to state model. |
| **Rapid task batching** | Handler accepts array of task payloads; single `state.update` with key `planner` and merged tasks. Implementation in one action. | Interpreter emits batch of structured candidates; one “task batch” event; one state intent (e.g. `planner.batchTasks` or single `state.update` with merged planner). Rules define how to merge (e.g. default category). |
| **Partial phrases** | No standard. Handler could accept a “draft” key in state (e.g. `planner_draft`) and later “commit” to tasks. Ad hoc. | JSON rules can define draft vs commit (e.g. confidence, boundary). Interpreter writes draft to state or holds in ephemeral buffer until commit; then single write to `planner.tasks`. |

### 2.2 Parsing into structured tasks

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Parser output → task shape** | Parser (new module) returns a shape; action handler maps that shape to internal task schema. Mapping is in code unless handler reads a “mapping config” from state/JSON. | Mapping is rule-driven: JSON defines how parser output fields map to task fields (e.g. “title” ← segment.text, “recurringType” ← inferred from rules). Reduces handler code; same parser. |
| **Incremental structuring** | Handler can accept partial task and fill defaults from state or config. No standard for “partial → complete” pipeline. | Rules can define required vs optional; “complete” when required set is present. Interpreter can emit partials; state write only when complete or when “commit partial” rule allows. |

### 2.3 Category inference

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Source of rules** | In code: e.g. keyword → categoryId map in handler or in a small engine. | In JSON: e.g. `categoryInference: { keywords: { "bill": "finances", "client": "business" }, defaultCategoryId }`. Generic engine evaluates; returns categoryId. |
| **Hierarchy placement** | Handler or engine resolves categoryId against planner tree (must exist in tree). Same capability in both. | Same; tree in state. Engine can be generic: (tree, inferredId) → validate or coerce to nearest valid node. |

### 2.4 Priority inference

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Logic location** | In handler or prioritization engine; urgency words → number. | In JSON: e.g. `priorityInference: { "asap": 9, "urgent": 8, "when you can": 3 }; default from rules. Engine is generic: (text, rules) → priority. |

### 2.5 Recurrence and habit detection

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Detection** | Handler or new engine: regex or patterns → recurringType + details. Patterns in code or in config object. | JSON: pattern list or regex refs → recurringType; habit cues → habit block. Engine: (text, rules) → { recurringType?, recurringDetails?, habit? }. |
| **Rule ownership** | Same capability; config can be in JSON file. Difference is whether “evaluation” is a generic engine or inline in handler. | Explicit: rules in JSON; evaluation in one small engine. |

### 2.6 Hierarchy placement

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Placement** | categoryId from inference or payload; must be valid node in tree. Handler or util validates. | Same. Optional: JSON rule “defaultCategoryPath” (e.g. ["Home", "Inbox"]) resolved against tree to get categoryId. |

### 2.7 Rule application

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Where rules run** | In action handler or in engines called by handler. Rule set can be read from state/JSON but application is imperative. | In a dedicated rule/structure engine: (rules, parse result, context) → structured task candidate. Layering (user > industry > base) can be implemented in either; alternative makes “stack of rule sets” a first-class input to the engine. |

### 2.8 State write pattern

| Concern | Current system | Alternative structure-driven |
|--------|----------------|-------------------------------|
| **Write** | `dispatchState("state.update", { key: "planner", value: nextPlanner })`. Single key; full slice replace. Or new intent e.g. `planner.appendTask` if added to state-resolver. | Same. No difference in state model. Alternative may introduce more intents (e.g. `planner.batchTasks`) for traceability; both can achieve same final state. |

---

## 3. Side-by-Side Comparison

| Dimension | Current system | Alternative structure-driven |
|-----------|----------------|-------------------------------|
| **Implementation complexity** | Moderate: new action(s), new parser integration, inference logic in handler or ad hoc engines. Mapping and rules can be in code or in a config object. | Moderate: same parser; additional layer (interpreter/rule evaluator) and JSON rule authoring. Fewer ad hoc branches in handler if inference is centralized in one engine. |
| **Structural clarity** | Actions and engines own the “shape” of logic. Task creation path is clear (action → state update); inference logic is wherever the team puts it. | Clear split: JSON owns rules and mapping; engine owns evaluation; action owns orchestration and dispatch. Easier to point to “where category comes from” (rule set). |
| **Stability** | Depends on discipline: handler and engines must stay pure of UI and avoid hidden dependencies. Registry and state contract are stable. | Same stability of state and registry. Rule evaluator is one more surface; bugs in evaluator affect all rule-driven inference. |
| **Scalability** | Add more actions and engines per domain. No inherent limit. | Same. Adding new inference types = new rule sets in JSON + possibly new engine inputs; no new action needed for new rule content. |
| **Expandability across domains** | New domain = new state key + new actions + new engines. Rules can be copied or shared via config. | New domain = new state key + same rule evaluator with domain-specific JSON rules. Template replication is copy of JSON. |
| **Duplication ability (template replication)** | Templates as JSON files; loader or action copies into state. Same in both. | Same. Alternative may standardize “template” as rule set + default structure, making replication a single copy of one config. |
| **Rule layering capability** | Can be implemented in code: merge user/industry/base in handler or in a resolveRules util. | Natural fit: rule evaluator receives ordered list of rule sets; merge or override in one place. JSON expresses layers explicitly. |
| **State traceability** | Full: every write is an intent in the log. Task creation is one or more intents. | Full: same log. If alternative adds more granular intents (e.g. parse.commit, task.infer), trace is finer-grained; optional. |
| **Debug visibility** | Actions and PipelineDebugStore; state snapshots. Parser output would need to be logged or stored in state for debug. | Same. Rule evaluation can expose “which rule matched” in dev; parse events can be logged or stored for replay. |
| **Parser integration simplicity** | Parser is a black box; action receives its output. Simple. Handler must know parser output shape. | Parser same. Interpreter sits between parser and state; one more integration point. If interpreter is “rules + mapper,” parser contract can stay minimal (e.g. segments with text + confidence). |
| **Cognitive load of system design** | Lower for “just add an action”: one handler, one state key. Higher if inference and rules are spread across handlers and engines. | Slightly higher: rule authoring and interpreter contract. Lower for “where do I add a new inference?”: add JSON rules and possibly extend engine input. |
| **Risk surface** | New code in handler and possibly new engines; parser dependency. | New code in rule evaluator and interpreter; parser + JSON rule dependency; risk of mis-specified rules. |
| **Maintenance burden** | Changes to inference logic = code change unless config-driven. | Changes to inference logic = JSON change when rules are in JSON; engine changes only when evaluation semantics change. |

---

## 4. Implementation Plan (Dual Track)

### 4.1 Track A — Current Architecture

**Required components**

- **Parser module:** Speech/stream → segments or structured output (e.g. text, confidence, boundaries). No dependency on state; callable from action or from a bridge.
- **Action(s):** e.g. `planner:addTask`, `planner:addTasksFromStream`. Registered in action-registry. Handler: get state, get parser result (from payload or from a store), build task(s), merge into `values.planner`, dispatch `state.update`.
- **Inference logic:** Either inside handler or in small pure functions (e.g. `inferCategory(text, tree, rules)`, `inferPriority(text, rules)`). Rules can be read from `state.values.planner.rules` or from a static JSON file.
- **State contract:** `values.planner` = { tree, tasks, blocksByDate, rules }. Single key update. No new intents in state-resolver unless team adds e.g. `planner.appendTask` for finer traceability.

**Integration points**

- Behavior listener: no change; trigger is “action” event with name e.g. `planner:addTasksFromStream` and params (e.g. streamSessionId, or inline parsed segments). Or trigger from external (e.g. Azure speech callback) that dispatches same action.
- Parser: called before action (e.g. in a wrapper or in the trigger path) or inside action; output passed as params. No parser in behavior-listener.
- State: only `state.update` with key `planner`.

**Rule flow**

- Handler reads rules from state or config. Applies inference in code or via small engines. Resulting task(s) merged into planner; dispatch.

**Engine dependencies**

- Optional: scheduling, recurrence, prioritization (from V2/V3 plan) for post-insert behavior. For “just create task,” no engine required. If inference is in engines, handler calls them with (parse result, rules, state slice).

**Parser wiring**

- Parser runs outside or inside action. If stream is real-time: stream → buffer → on “commit” or timer, parser runs → action invoked with parser output. Single wire: parser output → action params.

**Testing approach**

- Unit: inference functions or engines with mock rules and parse output. Action handler with mock state and dispatch spy. Integration: trigger action with canned parser output; assert state update.

**Relative effort profile**

- Initial build: one action, one parser integration, inference in handler or a few functions. Rule changes require code or config edit. No new runtime abstraction.
- Build friction: low if team is comfortable putting logic in handlers; medium if inference grows and team wants it config-only.
- Coordination complexity: low; action registry and state are existing. Parser team and app team agree on payload shape.
- Iteration speed: fast for small changes in one handler; slower if inference logic is scattered.
- Refactor surface: if later moving to rule-driven inference, handler and any inline logic must be replaced or wrapped by a rule evaluator.

---

### 4.2 Track B — Alternative Structure-Driven Model

**Required components**

- **Parser module:** Same as Track A. Unchanged.
- **Structure interpreter:** Input: parser output + JSON rule set(s) + optional context (e.g. current planner tree). Output: one or more task candidates (with optional confidence). No state write; pure.
- **Rule set(s):** JSON: category inference, priority inference, recurrence/habit patterns, mapping from parser fields to task fields. Loaded from file or from state (e.g. `planner.rules` or `planner.inputRules`).
- **Action(s):** e.g. `planner:addTasksFromStream`. Handler: get parser output (from params or store), get rule set(s), call structure interpreter, get task candidates, optionally validate/merge with existing (e.g. default category), dispatch `state.update` with key `planner`.
- **State contract:** Same as Track A. Optional: new intent `planner.batchTasks` in state-resolver for append-only task list (reduces handler merge logic); or keep single `state.update` with full slice.

**Integration points**

- Same trigger as Track A. Interpreter is called inside action before dispatch. Rule sets loaded at start of handler or via a small “resolveRules(plannerType)” that merges base + industry + user.
- No change to behavior-listener or verb interpreter.

**Rule flow**

- Resolve rule stack (user > industry > base). Pass to interpreter. Interpreter evaluates category, priority, recurrence, habit from text + rules; builds task candidate(s). Handler may apply defaults (e.g. categoryId if missing) and write state.

**Engine dependencies**

- One generic “structure mapper” or “task inference” engine: (parse result, rules, context) → task candidates. Optional: same scheduling/recurrence/prioritization engines for downstream behavior.

**Parser wiring**

- Same as Track A. Parser output → handler → interpreter(parserOutput, rules) → candidates → state update.

**Testing approach**

- Unit: interpreter with various rule sets and parse outputs. Action with mock rules and parser output. JSON rule sets can be tested by swapping files. Integration: same as Track A.

**Relative effort profile**

- Initial build: parser + interpreter + rule authoring + action. More upfront abstraction; rule authoring is a new discipline.
- Build friction: medium (interpreter and rule schema); lower for later “add a new inference” (edit JSON).
- Coordination complexity: same parser contract; additional contract for “rule set shape” and interpreter I/O.
- Iteration speed: slower for first version; faster for iterative rule tuning and new domains (JSON only).
- Refactor surface: if reverting to “all in handler,” interpreter can be inlined; rule sets become dead config. Low risk to state or pipeline.

---

## 5. Onboarding Stream Engine Fit

| Capability | Current system | Alternative structure-driven |
|------------|----------------|-------------------------------|
| **Real-time task stream ingestion** | Stream → buffer → parser → action with batch. No built-in “stream engine”; implementation in integration layer. | Same stream path. Interpreter can be designed for incremental input (partial → complete) by rule; no architectural advantage. |
| **Bulk spoken planning sessions** | One batch of segments → one action call → one state update with N tasks. Fits. | Same. Rule set can define “batch defaults” (e.g. same category for all in session). |
| **Automatic task splitting** | Parser or handler: one segment = one task, or N segments = one task by rule. Logic in code. | Rules can define split (e.g. “one task per sentence” or “merge until keyword X”). Interpreter applies; same outcome. |
| **Structural mapping** | Handler maps parser output to task schema. | JSON defines mapping; interpreter applies. Clearer ownership. |
| **Priority assignment** | In handler or engine from rules. | In JSON rules; generic engine. |
| **Cross-domain placement** | categoryId and tree determine placement; same in both. | Same; rules can reference different trees per domain if multi-planner. |
| **Template matching** | Template = initial structure; no “match stream to template” in current code. Could be added in either. | Rule set can be template-specific; “match” = use template’s rule set for inference. |

**Conclusion (evidence):** Both support onboarding stream use cases. Alternative centralizes “how we go from text to structure” in rules + interpreter; current centralizes it in handler + optional engines. Neither has a built-in stream engine; both need the same parser and state write.

---

## 6. System Power & Duplication Potential

| Dimension | Current system | Alternative structure-driven |
|-----------|----------------|-------------------------------|
| **Replication across industries** | New industry = new template JSON (tree, default tasks, rules) + same actions. Rules in template can be copied into state. | Same. Rule sets are JSON; copy template = copy rule set. Slight edge: “industry” is explicitly a rule layer. |
| **Multi-domain reuse** | Same state key pattern (e.g. `relationships`); same action pattern. Inference logic can be shared as util or engine. | Same. Generic interpreter can take domain-specific rule set; one engine, many domains. |
| **Template stacking** | Merge at load time (e.g. base + industry). Manual or util. | Natural: ordered rule sets; merge in resolver or in interpreter. |
| **Rule inheritance** | Can implement with “extends” in JSON and merge in code. | Same; interpreter or loader resolves extends. |
| **Expansion into planning, decisions, relationships, workflows, diagnostics, habit systems** | Each domain: state key + actions + engines. Rules in config or state. | Each domain: state key + same rule evaluator pattern + domain JSON rules. Decisions/aggregation already have a similar pattern (generic aggregate over items); structure-driven extends that to “input” side. |

**Conclusion (evidence):** Both support expansion. Alternative makes “rules in JSON” and “one evaluator” the default for input-side inference; current can achieve the same with discipline and shared utils.

---

## 7. Build Efficiency Analysis

| Dimension | Current system | Alternative structure-driven |
|-----------|----------------|-------------------------------|
| **Setup overhead** | Lower: no new interpreter or rule schema. Parser + action + inference code. | Higher: interpreter, rule schema, and rule authoring pattern. |
| **Moving parts** | Fewer: parser, action(s), optional engines. | More: parser, interpreter, rule set(s), action(s). |
| **Required infrastructure** | Same state and pipeline. Parser and optionally a “stream session” store. | Same + rule loader (file or state). |
| **Engine density** | Inference can be one engine or scattered. Current engines (learning, calculator, decision) unchanged. | One clear “task inference” or “structure mapper” engine; other engines unchanged. |
| **State model weight** | No change. One key per domain. | No change. Optional extra key for “input rules” or rules live inside planner. |
| **Refactor resistance** | Adding rule-driven inference later = refactor handler and possibly extract engine. | Removing rule-driven = inline interpreter or simplify to fixed rules; rule sets can be deprecated. |
| **Long-term adaptability** | New inference types = new code or new config shape. | New inference types = new rule set content; engine may need new “hooks” for new field types. |

**Conclusion (evidence):** Current has lower setup and fewer parts; alternative has more structure and slightly higher upfront cost, with potential for lower cost of change when only rules change.

---

## 8. Final Section — Neutral Technical Conclusion

**Structural friction**

- **Current:** Minimal new surface: one action, one state key, inference in handler or a small engine. Friction appears when inference rules grow and team wants to avoid code changes for every rule tweak.
- **Alternative:** One additional abstraction (interpreter + rule set). Friction appears in designing the rule schema and interpreter contract; once in place, rule-only changes avoid code.

**Easier to reason about**

- **Current:** “Task creation = this action, this handler.” Straightforward. Inference logic location can be opaque if spread across handler and several utils.
- **Alternative:** “Task creation = action → interpreter(rules, parse) → state.” Clear data flow. Rule authoring and “what rule produced this value” require understanding the rule format.

**Composability**

- **Current:** Actions and engines are already composable. New domains add new actions and state keys. Inference can be composed (e.g. category then priority) in handler or in a pipeline of small engines.
- **Alternative:** Rule evaluator is a single composable unit; rule sets compose by layering. Same composability at the “domain” level; better composability at the “rule content” level (stack layers without code).

**Speech-to-task parsing integration**

- **Current:** Parser → action params → handler → state. Simple. Parser is decoupled; handler must know parser output shape.
- **Alternative:** Parser → action params → interpreter(rules, parse) → state. One more step. Integration is equally clean; interpreter isolates “parser shape” from “task shape” via rules, which can reduce handler coupling to parser.

**Broader system expansion**

- **Current:** Expansion is add state key + actions + engines. Works. Rule-driven behavior is opt-in (config in code or in JSON).
- **Alternative:** Expansion is add state key + rule set(s) + same interpreter pattern. Aligns with V3 “JSON as system brain” and “generic engines.” Slightly better fit for multi-domain, template-heavy, and “non-developer rule editing” goals.

**Summary**

- Neither architecture blocks the Extreme Mode task input module. Both support: stream ingestion, parsing, inference (category, priority, recurrence, habit), hierarchy placement, and state write.
- Current architecture minimizes new concepts and is sufficient for a first version; inference can stay in handler or small engines with rules in config.
- Alternative architecture adds an explicit interpreter and JSON rule layer, aligning with a JSON-first, rule-driven evolution and potentially lowering the cost of rule and domain changes over time.
- The choice is a trade-off between lower upfront complexity (current) and clearer rule ownership and expansion path (alternative), not a binary “winner.”

---

## 9. Task Parser System

This section describes the full **stream → parse → structure** pipeline and how parsed tasks map into `state.values.planner`. The pipeline is shared by both architectures; the difference is where inference rules live (code vs JSON) and whether a dedicated structure interpreter sits between parser output and state.

### 9.1 Pipeline overview

```
Stream (speech/text) → Ingestion → Sentence splitting → Intent detection →
Task extraction → Category inference → Priority inference → Recurrence detection →
Habit detection → Hierarchy placement → Batching / partial updates → state.values.planner
```

- **Ingestion:** Raw audio stream (e.g. Azure Speech SDK, Web Speech API) or text buffer. Output: continuous or chunked transcript segments with optional confidence and timestamps. No state write at this stage.
- **Sentence splitting:** Segments are split into sentence-like units (period, newline, pause threshold, or NLU boundary). Output: list of `{ text, startOffset?, endOffset?, confidence? }`. Rules can define splitters: e.g. "one task per sentence," or "split on 'and then' / 'also'."
- **Intent detection:** Each unit is classified as task-creating vs other (e.g. question, command, discard). Rules: phrase patterns or keywords that indicate "this is a task" (e.g. "add," "remind me," "I need to," "todo"). Output: filtered list of task-relevant segments.
- **Task extraction:** From each segment, extract a **task candidate**: at minimum `title` (cleaned text); optionally due date, time, or relative date from NER or rules. Output: `{ title, dueDate?, time?, rawText }`.
- **Category inference:** Apply category rules (keywords → categoryId, or path in tree). Input: task candidate + `planner.tree` + rule set `categoryInference`. Output: `categoryId` (must exist in tree) or default from rules.
- **Priority inference (1–10):** Apply priority rules (urgency phrases → number). Input: segment text + rule set `priorityInference`. Output: `priority` in [1, 10]; default from rules (e.g. 5).
- **Recurrence detection:** Pattern match or regex for "every day/week/month," "on Mondays," etc. Input: text + `recurrencePatterns` rules. Output: `recurringType`, `recurringDetails`.
- **Habit detection:** Pattern match for "daily habit," "track X," "every morning." Input: text + `habitPatterns` rules. Output: optional `habit: { startValue, targetValue?, durationDays?, timeSlots?, activeDays? }`.
- **Hierarchy placement:** Resolve `categoryId` against `planner.tree`; if invalid, coerce to default node (e.g. "Inbox") from rules. Output: final `categoryId`.
- **Batching + partial updates:** Multiple candidates can be committed as one batch. Partial updates: optional draft state (e.g. `values.planner_draft`) for uncommitted segments; on "commit" or boundary rule, merge draft into `planner.tasks` and clear draft. Batch write: single `state.update` with key `planner` and value = current planner with `tasks` = existing tasks concatenated with new task objects (each with id, title, priority, categoryId, recurringType?, habit?, dueDate?, createdAt, updatedAt).

### 9.2 Mapping parsed tasks into state.values.planner

- **State shape:** `state.values.planner` = `{ tree, tasks, blocksByDate, rules, activePlannerId? }` (single planner) or `{ planners: { [id]: { tree, tasks, blocksByDate, rules } }, activePlannerId }` (multi-planner).
- **Write:** After the pipeline produces one or more task candidates, the action handler:
  1. Reads `getState().values.planner` (or `planner.planners[activePlannerId]`).
  2. For each candidate, builds a full task object: id (generate), title, priority, categoryId, recurringType?, recurringDetails?, habit?, dueDate?, log: [], lastCompleted: null, createdAt: now, updatedAt: now.
  3. Sets `nextPlanner.tasks = current.tasks.concat(newTasks)` (or equivalent for multi-planner).
  4. Dispatches `dispatchState("state.update", { key: "planner", value: nextPlanner })`.
- **Intent option:** Alternatively, state-resolver can support an intent e.g. `planner.appendTasks` with payload `{ tasks: [...] }` so that derivation appends to `planner.tasks` without the handler merging the full slice. Either way, the **log** contains one (or more) state intents and the derived state holds the updated planner with new tasks.

---

## 10. Priority Rule Engine

Explicit rules for the priority system (not high-level concepts). These rules are expressed in JSON and interpreted by the prioritization engine.

### 10.1 1–10 scale model

- **Rule:** `priorityScale: { min: 1, max: 10, default: 5 }`. Stored priority on every task must be in [min, max]. If absent from input or inference, use `default`. Display labels (e.g. 1 = "Low", 10 = "Urgent") can be in `priorityScale.labels: { "1": "Low", ... }`.
- **Engine:** Clamp any inferred or user-set priority to [min, max]; assign default when missing.

### 10.2 Escalation logic

- **Rule:** `escalation: { enabled: boolean, daysUntilEscalation: number, incrementPerDay: number, maxPriority: number }`. When `enabled` and task has `dueDate` in the past: `effectivePriority = min(maxPriority, task.priority + (daysOverdue * incrementPerDay))`, where `daysOverdue = floor((today - dueDate) / 86400000)` (or calendar days). `daysUntilEscalation` can mean "start escalating after this many days past due" (then same formula with delayed start).
- **Engine:** For each task, compute effective priority for display and sort; do not mutate stored `task.priority` unless a separate "apply escalation" action exists.

### 10.3 Overdue amplification

- **Rule:** Same as escalation; optionally a separate `overdueAmplification: { factor?: number, cap?: number }` for a different curve (e.g. exponential). Default: linear with `incrementPerDay`. Engine applies one formula per rules.

### 10.4 Cancel-day behavior

- **Rule:** `cancelDayReset: "none" | "moveToNextDay" | "decrementPriority"`.
  - **none:** No automatic change when user cancels a day (or marks task skipped for that day).
  - **moveToNextDay:** Reschedule due date to the next calendar day (or next occurrence for recurring).
  - **decrementPriority:** Decrease stored `task.priority` by 1 (or by `cancelDayReset.decrementBy` if present), clamped to min.
- **Engine:** Invoked by action e.g. `planner:cancelDay` with payload `{ date, taskIds? }`; applies the chosen behavior and returns updated task list; handler dispatches state.

### 10.5 Recurring task priority carryover

- **Rule:** `recurringEscalation: boolean`. When true, if a recurring task was due on date D and not completed, the **next** occurrence can receive a higher priority: e.g. `nextPriority = min(max, currentPriority + 1)`.
- **Engine:** When computing "next occurrence" or building the day list, if `recurringEscalation` and task was missed on previous occurrence, apply carryover once per recurrence cycle (definition of "cycle" from recurrence engine).

### 10.6 Habit ramp interaction with priority

- **Rule:** `habitAsTask: boolean`. When true, habit tasks are included in the same task list and sorted by the same priority/date logic. Habit-specific fields (timeSlots, activeDays) are used by scheduling for "due today"; priority is used for order within the list. No separate "habit priority" unless a rule adds it (e.g. "habits always at priority 5").
- **Engine:** Scheduling and prioritization engines treat tasks with `habit` block as tasks; progression engine uses `habit` for ramp value only.

### 10.7 Sorting order logic

- **Rule:** `sortOrder: "priorityDesc" | "priorityAsc" | "dueDateFirst" | "categoryThenPriority"` (or equivalent). Default: higher effective priority first, then by due date ascending, then by category order (tree order).
- **Engine:** `sortTasks(tasks, rules, date)` returns ordered list using effective priority (after escalation), then due date, then categoryId order from tree.

### 10.8 Rule override layers (base → template → planner → user)

- **Order:** base (system default) → template (industry/template file) → planner (per-planner rules in state) → user (user overrides in state or session).
- **Merge:** Later layer overwrites earlier for same key; optional `$merge: true` on a key to merge arrays (e.g. priorityInference keywords). Result: single effective ruleset per planner. Engine receives resolved rules from `resolveRules(base, template, planner, user)`.

---

## 11. Structure Interpreter Rules

How JSON rulesets apply in the structure-driven (interpreter) model.

### 11.1 Hierarchy mapping

- **Rule set:** `tree` is in state or in template JSON. `categoryInference` rules map keywords or phrases to `categoryId` (must be a node id in the tree). Optional `defaultCategoryPath: ["Home", "Inbox"]` resolved by walking the tree by name to get `categoryId`.
- **Interpreter:** Given parse result (segment text), evaluate `categoryInference` (keyword match or path resolution); validate `categoryId` against tree; if invalid, use default from rules.

### 11.2 Template matching

- **Rule set:** Each template (e.g. personal, contractor) has a `rules` object. When "Create from template" is used, that template's rules become the planner's rule set (or the "template" layer in the stack). When processing input in the context of that planner, the interpreter loads the planner's effective rules (after resolveRules).
- **Matching:** "Match stream to template" = use the active planner's template rules for inference (category, priority, recurrence). No separate "match" step; the active planner's rules are already template-derived.

### 11.3 Category auto-placement

- **Rule set:** `categoryInference: { keywords: { "bill": "cat-finances", "client": "cat-business" }, defaultCategoryId: "cat-inbox" }`. Optional regex or phrase list.
- **Interpreter:** For each task candidate, run keyword/phrase match against segment text; first match wins; else assign `defaultCategoryId`. Result is `categoryId` for the task.

### 11.4 Rule inheritance

- **Rule set:** Template JSON can include `"extends": "base"` or `"extends": "personal"`. Loader or `resolveRules` loads the extended set first, then applies the current set (override). No engine change; merge at load/resolve time.
- **Interpreter:** Receives already-resolved rules; no inheritance logic inside interpreter.

### 11.5 Rule stacking

- **Layers:** base → template → planner → user. Each layer is a JSON object. `resolveRules` merges in order; later keys overwrite earlier; optional array merge for specific keys.
- **Interpreter:** Single rules object in; no stacking inside interpreter. Stacking is a preprocessing step before calling the interpreter or prioritization engine.

---

## 12. Full Rule Table (Rules Catalog)

Concrete rules catalog by category. All are JSON-configurable; engines interpret them.

| Rule ID | Category | Rule (JSON key path) | Description |
|--------|----------|----------------------|-------------|
| PR-1 | priority | `priorityScale.min` | Minimum allowed priority (e.g. 1). |
| PR-2 | priority | `priorityScale.max` | Maximum allowed priority (e.g. 10). |
| PR-3 | priority | `priorityScale.default` | Default when not inferred or set. |
| PR-4 | priority | `priorityInference` | Map phrase → number (e.g. "asap" → 9). |
| PR-5 | priority | `escalation.enabled` | Whether to apply escalation for overdue tasks. |
| PR-6 | priority | `escalation.daysUntilEscalation` | Days past due before escalation starts (optional). |
| PR-7 | priority | `escalation.incrementPerDay` | Priority increase per day overdue. |
| PR-8 | priority | `escalation.maxPriority` | Cap for effective priority. |
| PR-9 | priority | `sortOrder` | Sort order: priorityDesc, dueDateFirst, etc. |
| SC-1 | scheduling | `defaultBlocks` | Default day template (blocks with start/end). |
| SC-2 | scheduling | `businessHours` | { start, end } for default slot bounds. |
| SC-3 | scheduling | `slotDurationMinutes` | Default slot length. |
| RC-1 | recurrence | `recurringTypes` | Enum: daily, weekly, monthly, off, custom. |
| RC-2 | recurrence | `recurrencePatterns` | Phrase or regex → recurringType + details. |
| RC-3 | recurrence | `recurringEscalation` | Whether to carry over priority to next occurrence. |
| PG-1 | progression | `habit.startValue`, `targetValue`, `durationDays` | Ramp parameters. |
| PG-2 | progression | `habit.timeSlots`, `activeDays` | When habit is due (scheduling). |
| ES-1 | escalation | Same as PR-5–PR-8. | (See priority.) |
| RS-1 | reset | `cancelDayReset` | none, moveToNextDay, or decrementPriority. |
| RS-2 | reset | `cancelDayReset.decrementBy` | Optional amount for decrementPriority. |
| PL-1 | placement | `categoryInference` | Keywords/path → categoryId. |
| PL-2 | placement | `defaultCategoryId` or `defaultCategoryPath` | Default when inference fails. |
| PL-3 | placement | `tree` | Hierarchy; categoryId must reference a node. |

---

## 13. Side-by-Side Numeric Assessment

Scored comparison (A = Current flow/engine, B = Interpreter/structure-driven). Scale 1–10 unless noted (10 = best).

| Criterion | A (Current) | B (Interpreter) | Notes |
|-----------|-------------|------------------|-------|
| **Implementation effort** | 6 | 5 | B has more upfront (interpreter + rule schema); A has more per-feature handler/inference code. |
| **Architectural simplicity** | 7 | 6 | A has fewer concepts (no interpreter); B has clearer separation (rules vs engine). |
| **Composability** | 5 | 8 | B: rule layers and one interpreter compose; A: ad hoc composition in handlers. |
| **Stability** | 6 | 6 | Both depend on discipline; B has single-point risk (evaluator). |
| **Parser integration fit** | 5 | 8 | B: parser → interpreter(rules) → state is a clean contract; A: handler must know parser shape and inference. |
| **Expansion power** | 5 | 9 | B: new domain = new rule set; A: new domain = new handlers/engines. |
| **Duplication/template power** | 6 | 9 | B: template = rules + structure; copy = full behavior. A: template copy + code applies rules. |
| **Long-term maintainability** | 5 | 8 | B: rule changes = JSON; A: rule changes = code or config + code. |

**Aggregate (average of 8 criteria):** A ≈ 5.75, B ≈ 7.4. B scores higher on composability, parser fit, expansion, duplication, and maintainability; A scores slightly higher on initial simplicity and implementation effort.

---

## 14. Extreme Mode Module — Full Technical Spec

Full technical specification for the Extreme Mode task input module (streaming task intake, auto-splitting, automatic hierarchy placement, rule assignment, priority assignment, state write flow).

### 14.1 Streaming task intake

- **Input:** Continuous audio stream (e.g. Azure Speech SDK continuous recognition) or buffered text stream.
- **Output:** Stream of segments (interim and final). Each segment: `{ text, isFinal?, confidence?, startOffset?, endOffset? }`.
- **Contract:** Parser module exposes a callback or observable: `onSegment(segment)`. Consumer (action trigger or bridge) buffers segments until commit boundary (see below). No state write in parser.

### 14.2 Auto-splitting multi-task sentences

- **Rule:** `sentenceSplit: { boundaries: [".", "!", "?", " and ", " also ", " then ", " and then "], oneTaskPerSegment: true }`. Or: one task per sentence; sentences split by boundary list.
- **Behavior:** After intent detection (task-relevant segments), each segment is optionally split further by boundaries into sub-segments; each sub-segment produces one task candidate. So "Call mom. Pay bills. Exercise." → three candidates.

### 14.3 Automatic hierarchy placement

- **Input:** Task candidate + `planner.tree` + resolved `categoryInference` and `defaultCategoryId` (or `defaultCategoryPath`).
- **Process:** Run keyword/phrase match from rules against candidate title (and optionally raw segment). First match → categoryId. If no match or categoryId not in tree, use default. Validate categoryId exists in tree; else coerce to root or default node.
- **Output:** Each task candidate has `categoryId` set.

### 14.4 Automatic rule assignment

- **Effective rules:** Resolved stack (base → template → planner → user) for the active planner. All inference (category, priority, recurrence, habit) uses this single ruleset.
- **Assignment:** No "assign rule" step; the ruleset is applied by the structure interpreter (or by handler + engines in current architecture). Result: every task gets categoryId, priority, optional recurrence, optional habit from rules.

### 14.5 Automatic priority assignment

- **Input:** Segment text + `priorityInference` map (phrase → 1–10).
- **Process:** Match segment text (or title) against phrases; first match wins; else use `priorityScale.default`. Clamp to [min, max].
- **Output:** Each task candidate has `priority` set.

### 14.6 State write flow

1. **Commit boundary:** On "commit" (e.g. user silence timeout, explicit commit, or end of batch), take all buffered task candidates.
2. **Enrich:** For each candidate, ensure id (generate), createdAt, updatedAt; optional dueDate from NER or rules.
3. **Merge:** Read current `getState().values.planner` (or active planner slice). `nextTasks = current.tasks.concat(candidates)`.
4. **Dispatch:** `dispatchState("state.update", { key: "planner", value: { ...currentPlanner, tasks: nextTasks } })`.
5. **Optional draft:** If "partial updates" are enabled, write candidates to `values.planner_draft` first; on commit, merge draft into planner and clear draft (two state updates or one intent that does both).

---

## 15. Final Summary

- **Structurally simpler:** The **current (flow/engine)** architecture is structurally simpler in the sense of fewer concepts: no structure interpreter, no formal rule schema, no rule stack. One action, one state key, inference in handler or utils. The **interpreter** architecture adds one abstraction (interpreter + rules) and is simpler in the sense of a single, consistent path from input to structure (event → parse → structure → state) and a single place for rule content (JSON).

- **More powerful:** The **interpreter (structure-driven)** architecture is more powerful: rule layering, template-as-rules, one engine set for all structure domains, and data-driven behavior changes without code. The current architecture can achieve similar behavior with more code and coordination.

- **Parser logic integration:** The **interpreter** architecture integrates parser logic more cleanly: parser output is the only input to the interpreter; the interpreter (with JSON rules) produces task candidates; the handler only orchestrates and writes state. Parser shape is isolated behind the interpreter. The current architecture ties the handler directly to parser output and to each inference type, which is more coupled.

- **More future-proof:** The **interpreter** architecture is more future-proof for a JSON-first, multi-domain, template-heavy product: new industries and new inference types are JSON and data, not new code paths. The current architecture remains future-proof for the existing flow/step use cases but requires ongoing code changes for every new rule or domain that fits the structure model.

**Conclusion:** For the Extreme Mode task input module and for any system that treats the planner as a universal structure engine, the **interpreter + JSON-rule (structure-driven)** architecture is the recommended foundation: cleaner parser integration, greater power and flexibility, and better long-term maintainability and expansion, at the cost of one additional abstraction (the interpreter and rule schema).

---

*Document generated from codebase analysis. No code or runtime was modified. Paths refer to HiSense repository. Version 4 — full technical report.*
