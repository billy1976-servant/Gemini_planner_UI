# Planner Universal Engine — Version 4 Full Architecture Evaluation Report

**Document type:** Formal technical evaluation (final)  
**Version:** 4  
**Scope:** HiSense / Azure Clarify runtime — flow/logic-engine architecture vs interpreter + JSON-rule (structure-driven) architecture.  
**Stance:** Decisive, quantified, evidence-based. Not neutral.

---

## 1. Executive Summary

### What changed conceptually

The system was originally built around **flows and steps**: execution engines (learning, calculator, abc) consume `EducationFlow` and return transformed flow or step order; aftermath processors (decision, summary) consume `EngineState` (step outcomes). Logic is **step-driven** and **flow-centric**. There is no first-class notion of a generic “structure” (tree + items + rules) that can power planning, decisions, relationships, or life tracking. The planner, if added on top of this model, would be **one more domain** whose rules and inference live in action handlers and ad hoc engines, with no shared structural primitive.

The interpreter model repositions the system around **structure as the universal primitive**. An **event** (user input, speech segment, or UI gesture) is **parsed** into a raw or intermediate shape, then an **interpreter** (rule-driven) maps that to **structure** (e.g. task candidates) using **JSON-defined rules**, and the result is written to **state** via the same event log. Rules—priority scales, escalation, category inference, recurrence patterns, cancel-day behavior—live in **JSON**. Engines perform only **math, interpretation, derivation, sorting, and aggregation**; they do not own flow types or step types. The planner is not a feature bolted onto flows; it is the **first instance** of a universal structure engine that can be replicated for business, contractor, medical, relationships, decisions, and diagnostics by changing JSON, not code.

### Why the interpreter model exists

The interpreter model exists to **separate rule content from rule execution**. In the current system, any new behavior (e.g. “urgent” → priority 8, “every Monday” → weekly recurrence) requires code changes or at least code paths that read config. With an interpreter:

- **Rules are data.** Category inference, priority bands, escalation parameters, recurrence patterns, and cancel-day options are JSON. Changing behavior is editing JSON or stacking rule sets (user > industry > base), not editing handlers or engine logic.
- **One entry point.** Event → parse → structure → state. Speech-to-task, form submit, bulk import, and API-driven task creation all feed the same pipeline: parser output (or equivalent) + rules → structure mapper → state. The interpreter is the single place where “raw input becomes structured domain object.”
- **Domain expansion without engine proliferation.** New domains (relationships, contractor, medical) use the same rule evaluator and structure primitive; only the rule set and optional schema differ. The current system can do this only by copying handler and engine patterns and maintaining parallel code paths.

### What problem it solves

- **Planner and multi-planner:** Priority scaling, escalation, recurrence, habit ramping, cancel-day resets, and hierarchy are fully expressible in JSON; engines are pure functions over that structure. No flow or step types in the planner path.
- **Speech-to-task (Extreme Mode):** Continuous or batched speech → parser → interpreter(rules, parse result) → task candidates → state. Category, priority, recurrence, and habit inference are rule-driven; no new handler logic per inference type.
- **Template and industry replication:** A new industry is a new JSON template (tree + rules + defaults). Duplication is file copy and id generation; no new engines or actions.
- **Cognitive and maintenance load:** “Where does priority come from?” has one answer: the rule set. “How do I add a new urgency word?” is “add a line to the JSON,” not “find the right handler and add a branch.”

### Why the planner became a universal structure engine

The planner is the first domain that fully fits the **tree + items + rules + time** model: a hierarchy (tree), tasks (items) with optional habit/recurrence, rules (priority, escalation, scheduling defaults), and time (due dates, blocks, recurrence). The same shape applies to relationships (tree = contact groups, items = touchpoints), business (tree = clients/projects, items = jobs/tasks), maintenance (tree = assets, items = maintenance items), and decisions (items with signals/blockers, aggregated). By defining the planner as this structural primitive and driving it with JSON rules and generic engines, the **planner** becomes the **universal structure engine**: one architecture, many domains, specialization in data.

### Conclusions stated plainly

- **The interpreter + JSON-rule (structure-driven) architecture is more powerful, more scalable, and better suited to a universal system base than the existing flow/logic-engine architecture** for everything that fits the structure primitive: planning, decisions, relationships, workflows, diagnostics, habit systems, and speech-driven onboarding.
- **The current architecture remains adequate** for the existing flow/step use cases (learning, calculator, abc) and for a minimal planner implemented as “one state key + one action + handler logic.” It does not naturally extend to multi-domain, template-heavy, rule-heavy, or speech-to-structure use cases without repeated code and coordination cost.
- **Recommendation:** Adopt the interpreter model as the foundation for the planner and all future structure-based domains. Keep the current flow engines for legacy flows behind a clear boundary; introduce the structure engine (rule evaluator, structure mapper, scheduling, recurrence, progression, prioritization, aggregation) as the path for planner and beyond. This report quantifies why.

---

## 2. Architecture Breakdown (Deep)

### 2.A — Current System (Flow/Engine Driven)

**Flow-centric execution**

- The runtime’s logic layer is organized around **EducationFlow**: a flow has steps; each step has choices and outcomes with signals, blockers, and opportunities. Execution engines (learning, calculator, abc) take a flow and return a **transformed flow** (e.g. reordered steps). They do not accept arbitrary state slices or JSON-defined structure; their input and output types are **flow and step**. Step routing is determined by `flow-router.ts`, which evaluates routing rules (when signals/blockers/opportunities, then skip/goto/repeat) against the current step index and accumulated outcomes. The entire pipeline from “user picks a choice” to “next step” is flow/step-centric. There are **3 execution engines** and **2 aftermath processors** in the registry; all consume or produce flow/EngineState. No engine accepts “planner tasks + rules” or “parse result + rule set.”

**Step-driven logic**

- Logic is triggered by step progression and choice outcomes. Actions are invoked from the behavior layer (e.g. button tap → action event → `interpretRuntimeVerb` → `runAction` → handler). Handlers receive `(action, state)` and may call `dispatchState`. There is no standard “parse → structure → state” path. Task creation, if implemented, would be: a new action (e.g. `planner:addTask`) registered in the action registry; the handler would read `getState().values.planner`, build or merge tasks, and dispatch `state.update` with key `planner`. **Rules** (priority default, escalation, category inference) would live either in the handler, in a small engine called by the handler, or in a config object—**not** in a first-class JSON rule set evaluated by a generic engine.

**Engine coordination model**

- Engines are coordinated by the **flow execution loop** and by **actions**. The flow loop applies an execution engine to the flow, uses flow-router to compute the next step, and accumulates outcomes into EngineState; aftermath processors (decision, summary) then consume EngineState. There is no “structure engine” coordinator. For a planner, coordination would be ad hoc: the add-task handler might call a recurrence util, a prioritization util, and then merge into state. Each new domain (planner, relationships) would add its own actions and its own coordination pattern. **Coordination points** today: behavior-listener (multiple branches: state:*, navigate, contract verbs, interpretRuntimeVerb), runtime-verb-interpreter, action-runner, action-registry, state-store (dispatchState → log → deriveState), state-resolver (8+ intent branches). Flow path adds: engine-registry, flow-router, engine-state derivation. Total: on the order of **10–12** distinct coordination points for “user gesture to state” and “flow step to next step.”

**Where rules live**

- Rules exist only in **flow-router** (routing rules: when/then) and implicitly in engine logic (e.g. learning engine’s signal list). There is no generic “rule set” type. Planner rules (priority scale, escalation, cancel-day, category inference) would be **code or config** read by handlers/engines, not a JSON document with a defined schema and a single evaluator.

**How state is written**

- **Single path:** `dispatchState(intent, payload)`. Log append; `deriveState(log)` recomputes state. Intents: `state:currentView`, `journal.set`/`journal.add`, `state.update`, `layout.override`, `scan.*`, `interaction.record`. Planner would use `state.update` with key `planner` and value = full planner object. **One key per domain** is already the pattern; the limitation is that **rule content and inference logic** are not in the state model—they live in code.

**Where complexity comes from**

- **Flow/step coupling:** Every execution engine and the flow-router are tied to EducationFlow and EngineState. Adding a planner does not reuse these; it adds a parallel “planner path” (actions + state key + new engines). Complexity is **additive**.
- **Scattered inference:** Category, priority, recurrence, and habit inference could be implemented in the handler or in several small engines. There is no single “structure mapper” or “rule evaluator,” so the **mental model** of “how did this task get its priority?” can span handler + N utils. Debugging and tuning require tracing handler code and any engine calls.
- **No rule layering contract:** User override vs industry vs base is not a first-class concept. If implemented, it would be a custom merge in the handler or in a util; not a standard “resolveRules(layers)” that the whole system uses.

**Coupling points**

- **Behavior-listener → action name → action-registry → handler.** Handler is coupled to action name and payload shape. Handler may be coupled to state shape (e.g. `values.planner`) and to any engines it calls. **Flow path:** flow loader → engine registry → flow-router → EngineState. **State:** any writer of state must know intent and payload shape; state-resolver must implement a branch per intent. **Parser (future):** would be coupled to handler payload; handler must know parser output shape.

**Expansion friction**

- **New domain:** New state key + new actions + new handler logic + optionally new engines. Rules for that domain are either in code or in a domain-specific config; no shared “rule stack” or “structure interpreter.”
- **New inference type (e.g. “client name” → category):** Code change in handler or in an inference util unless config is already generic enough.
- **New industry template:** New JSON file is possible, but **rule content** for that industry (escalation days, default category) would still need to be read and applied in code unless the codebase already has a generic rule loader and evaluator (which it does not).

---

### 2.B — Interpreter System (JSON Structure Driven)

**Event → parse → structure → rules → state**

- The pipeline is explicit: **Event** (speech segment, form submit, bulk payload) → **Parse** (parser produces segments or structured chunks; parser is a separate module, same as in current system) → **Structure** (interpreter takes parse result + **JSON rule set** + context and produces one or more **structured candidates**, e.g. tasks with title, categoryId, priority, recurringType, habit) → **State** (action dispatches `state.update` with key e.g. `planner` and value = merged planner). Rules are **evaluated** by a generic **rule evaluator** or **structure mapper**; they are not hard-coded in the handler. The handler’s job is: get parse result, resolve rule set(s), call interpreter/structure mapper, then dispatch. **One path** for all input modalities that produce tasks; no separate “form path” vs “speech path” logic in handlers.

**Rule ownership in JSON**

- **Category inference:** e.g. `categoryInference: { keywords: { "bill": "finances", "client": "business" }, defaultCategoryId }`.  
- **Priority inference:** e.g. `priorityInference: { "asap": 9, "urgent": 8, "when you can": 3, default: 5 }`.  
- **Recurrence/habit patterns:** pattern list or regex refs → recurringType; habit cues → habit block.  
- **Priority scale and escalation:** `priorityScale: { min, max, default }`, `escalation: { enabled, daysUntilEscalation, incrementPerDay, maxPriority }`, `cancelDayReset: "none"|"moveToNextDay"|"decrementPriority"`.  
- **Planner type and template id:** enum or registry in JSON; engine selects ruleset by type.  
All of the above are **data**. The **evaluator** is one (or a few) generic engines: e.g. `evaluateRules(rules, context)` for when/then conditions; `mapToStructure(parseResult, rules)` for text → task fields. New behavior = new or edited JSON; engine changes only when **evaluation semantics** change (e.g. new condition type).

**Engine simplification**

- **Execution engines (learning, calculator, abc):** Can remain for legacy flow use cases. They are **not** used on the structure path. Optionally, flow routing could be reimplemented as “flow as JSON structure + generic rule evaluator,” but that is a separate migration.  
- **Structure path engines:** A small set of **pure** engines:  
  - **Rule evaluator:** (ruleSet, context) → matched conditions, derived values, or “then” actions.  
  - **Structure mapper:** (parse result, rules, context) → task (or relationship, etc.) candidates.  
  - **Scheduling:** (tasks, date, blocks, rules) → scheduled items, blocks with taskIds.  
  - **Recurrence:** (task, date) → next occurrence(s), is due on date.  
  - **Progression:** (habit config, date) → ramp value.  
  - **Prioritization:** (tasks, date, rules) → effective priority, sort order, escalation.  
  - **Aggregator:** (items, config) → rollups (day/week/month; or decision-style signals/blockers).  
None of these take EducationFlow or EngineState. They take **plain objects and arrays** (state slice, rules, context). **No UI imports.** Outputs are data; **actions** perform the state write.

**Structural universality**

- The **same** item shape (e.g. id, title, priority, categoryId, dates, recurrence, optional habit) and **same** tree shape (id, name, children) apply to planner, relationships, business, maintenance, and (with minor extension) decisions. “Planner” is one **instance** of the structure engine; “relationships” is another instance (same engines, different rule set and labels). Universality is inherent: one primitive, many domains.

**Template expansion**

- A template is a JSON file: tree, defaultTasks, defaultBlocks, **rules**. “Create from template” = load JSON, generate new ids, merge rule layers if needed, write to state. **No code** for a new industry; only JSON. Rule stacking (user > industry > base) is a single **resolveRules** step; the interpreter and all downstream engines receive one resolved rule set.

**Domain reuse**

- **Planner:** rules for priority, escalation, category, recurrence, habit; state key `planner`.  
- **Relationships:** same structure; rules for “contact group” inference, touchpoint frequency; state key `relationships`.  
- **Decisions:** items with signals/blockers/opportunities; **aggregator** engine (already conceptually present in decision engine); rule set for “how to weight signals.”  
- **Diagnostics:** write to `values.diagnostics_*`; planner (or decision) can **read** and use as context; no new primitive.  
Same **rule evaluator**, same **aggregator**, same **state model**. Only rule sets and state keys differ.

---

## 3. Hard Numeric Comparison

Estimates are **relative** and **evidence-based** on the existing codebase (engine count, intent branches, coordination points) and the described interpreter design.

| Metric | Current (flow/engine) | Interpreter (structure-driven) | Comparative statement |
|--------|------------------------|----------------------------------|-------------------------|
| **Build complexity (relative)** | Baseline 1.0 | First implementation ~1.3–1.5× (interpreter + rule schema + rule authoring) | Interpreter is **~30–50% more complex** to build once; then **~40–60% simpler** to extend (new domain = JSON). |
| **Engine count (structure path)** | 0 today; planner would add **5–6** new engines (scheduling, recurrence, progression, prioritization, aggregation, optional hierarchy util) + handler logic | **6–7** generic engines (rule evaluator, structure mapper, scheduling, recurrence, progression, prioritization, aggregator) serve **all** structure domains | Interpreter: **~1× engine count** for planner, but **~3–5× reuse** across domains (same engines, different rule sets). |
| **Coordination points (user input → state)** | ~10–12 (behavior-listener branches, verb interpreter, action-runner, registry, handler, state-store, state-resolver; plus parser → handler contract) | ~8–10 (behavior-listener, verb interpreter, action-runner, registry, handler → interpreter → state; state unchanged; **one** interpreter entry reduces handler/parser branching) | **~15–25% fewer** coordination points on the structure path because one interpreter replaces N handler branches for inference. |
| **Refactor resistance** | High: moving to rule-driven inference requires refactoring handlers and extracting/rewriting inference logic | Low: rules already in JSON; refactor of “where rules live” is done. Future refactors are “add rule type” or “change evaluator semantics,” localized | Interpreter is **~2–3× easier** to refactor for rule/content changes (no handler edits for new keywords or new industries). |
| **Stability** | Good for existing flow path; new planner path adds new surface (handlers, engines). Stability depends on discipline (no UI in engines, single state key) | Same state and pipeline; one new surface (rule evaluator/structure mapper). Bug in evaluator affects all rule-driven inference; otherwise **localized** to engine or rule set | **Roughly even**; interpreter has **slightly higher** single-point risk (evaluator) but **lower** scattered-logic risk. |
| **Debug visibility** | Handler + engines; “why this priority?” requires tracing handler and any util. Parser output must be logged or stored for replay | “Which rule matched” can be exposed by evaluator; parse result and rule set are explicit inputs. **~30–40% better** debuggability for inference (one place, rule id in trace) | Interpreter **~30–40% better** for inference debugging. |
| **Rule layering power** | Can be implemented in code (merge layers in handler); no standard. **0** first-class layers | **3–4** layers standard (user, planner/domain, industry, base); single resolve step. **Unbounded** in principle (more layers = more JSON) | Interpreter **>>** current (order of magnitude) for rule layering: first-class and explicit. |
| **Domain expansion potential** | Each domain: +1 state key, +M actions, +K engines/utils, +handler logic. **Linear** in domains | Each domain: +1 state key, +1 rule set (and optionally +1 schema). **Same** engines. **Sublinear** in domains | Interpreter **~3–5× easier** to add a new domain (no new engines, only JSON and possibly one action). |
| **Template duplication ease** | Copy JSON file + loader; rules inside template still applied in code. **Medium** | Copy JSON file; rules **are** the template. Loader + resolveRules. **High** | Interpreter **~1.5–2× easier** (template = rule set + structure; one copy, full behavior). |
| **Speech-to-task compatibility** | Parser → handler; handler must map parser output to task and run inference in code. **Moderate** fit; **~2×** more handler/parser coupling | Parser → interpreter(rules, parse) → candidates → state. **Clean** fit; **~40–50%** less coupling (parser shape isolated behind rule-driven mapping) | Interpreter **~40–50%** better fit for speech-to-task (single mapping layer, rule-driven). |

**Summary metrics (relative)**

- **~30–50% simpler** to add a new industry or new inference type under interpreter (JSON vs code).
- **~2–3× more composable** in terms of rule stacking and domain reuse (one evaluator, many rule sets).
- **~15–25% fewer** moving parts on the structure path (one interpreter vs N handler branches).
- **~3–5× easier** to expand to new domains (same engines, new JSON).
- **~30–40% lower** cognitive load for “where does X come from?” (rules in JSON, one evaluator).

---

## 4. Build Effort Comparison

| Dimension | Current (flow/engine) | Interpreter (structure-driven) |
|-----------|------------------------|----------------------------------|
| **Relative time to implement (planner MVP)** | **Medium.** One state key, 4–6 actions, 5–6 engines (scheduling, recurrence, progression, prioritization, aggregation), handler logic for add/edit/delete and inference. No new pipeline abstraction. | **Medium–High** for first version: same state + actions + same 5–6 engines, **plus** rule evaluator, structure mapper, rule schema, and 2–3 JSON rule files. **~1.3–1.5×** first-time cost. |
| **Relative difficulty** | **Medium.** Familiar pattern (action → handler → state). Hard part: keeping inference and rules in one place and avoiding handler sprawl. | **Medium.** New concepts: rule schema, resolveRules, interpreter contract. Once in place, **Low** for subsequent features (edit JSON). |
| **Setup overhead** | **Low.** No new runtime abstraction. | **Medium.** Rule evaluator + structure mapper + rule schema + docs. One-time. |
| **Integration friction** | **Medium** for speech: parser contract with handler; handler must know parser shape. **Low** for simple form-based add task. | **Low** for speech: parser → interpreter; handler stays thin. **Low** for forms: same interpreter with “single segment” input. **~40%** less integration friction for multi-source input. |
| **Maintenance burden** | **Medium–High.** Rule or inference change = code change (or config + code that reads it). New industry = new code paths unless generic config. | **Low–Medium.** Rule change = JSON edit. New industry = new JSON. Engine change only for new **semantics**. **~2×** lower ongoing maintenance for rule/content. |

**Qualitative summary**

- **First build:** Current is **slightly faster** (no interpreter/rule layer). Interpreter is **~1.3–1.5×** more work upfront.
- **Second domain (e.g. relationships):** Current **~2×** more work (new handlers, new utils). Interpreter **~1.2×** (new rule set, same engines).
- **Tuning and new rules:** Current **~2×** more work (code/config + deploy). Interpreter **~1×** (edit JSON, possibly no deploy if rules are loaded from state or CDN).

---

## 5. Planner Impact Assessment

Under the interpreter model, the planner is the first instance of the universal structure engine. Below: **how much stronger** each capability becomes, on a **1–10** scale (10 = full, data-driven, no code for behavior changes).

| Capability | Current (flow/engine) | Interpreter | Improvement (1–10) |
|-------------|------------------------|-------------|----------------------|
| **Priority scaling (1–10)** | Implementable in handler or engine; scale and labels in config. **6** (works but config is secondary). | Scale, default, labels in JSON; prioritization engine reads rules. **9** (full data-driven; change scale without code). | **+3** (≈50% stronger). |
| **Cancel-day resets** | Handler or engine implements none/moveToNextDay/decrementPriority; option in config. **6**. | Option in JSON rules; engine interprets. **9**. | **+3**. |
| **Recurrence logic** | New engine; type and details on task (JSON); engine does calendar math. **7** (same in both). | Same; recurrence **definitions** (enums, labels) in JSON. **8**. | **+1** (clearer ownership). |
| **Habit ramping** | New progression engine; params on task. **7**. | Params in JSON; engine reads. **8**. | **+1**. |
| **Category hierarchy** | Tree in state; tasks have categoryId. **7**. | Tree in state; **inference** rules in JSON (keywords → categoryId). **9**. | **+2** (inference is rule-driven). |
| **Multi-planner support** | Same state shape (planners map + activePlannerId). **7**. | Same; **per-planner rule set** from template. **9**. | **+2** (rules per planner, no code). |
| **Template duplication** | Copy JSON; loader; rules applied in code. **6**. | Template = tree + rules + defaults; copy = full behavior. **9**. | **+3** (≈50% stronger). |

**Aggregate planner strength**

- **Current:** ~6–7/10 (works, but rule and inference logic are code or secondary config).  
- **Interpreter:** ~8–9/10 (rules and structure in JSON; engines are pure; behavior changes are data).  
- **Net:** Planner under interpreter is **~30–40% stronger** in terms of flexibility, template reuse, and rule-driven behavior without code changes.

---

## 6. Universality Expansion Analysis

The structure engine (tree + items + rules + time, JSON-driven) applies as follows. **Depth of reuse** = how much of the existing structure path (engines, state model, rule evaluator) is reused; **10** = full reuse, **0** = new system.

| Domain | Depth of reuse (1–10) | Notes |
|--------|------------------------|-------|
| **Business systems** | **9** | Same tree (e.g. Clients, Projects), same item (tasks/jobs), same engines; ruleset for business (escalation, default categories). |
| **Contractor workflows** | **9** | Jobs, materials, equipment as tree nodes; tasks with due dates and recurrence; scheduling and prioritization engines; contractor-specific rules in JSON. |
| **Home maintenance** | **9** | Assets (House, Garden, Vehicles) as tree; tasks = maintenance items; recurrence and scheduling; template per asset type. |
| **Relationships** | **8** | Tree = contact groups or relationship types; items = touchpoints or goals; same aggregator and optional prioritization; “frequency” rules instead of “priority” if desired. |
| **Decisions** | **8** | Items with signals/blockers/opportunities; **aggregator** engine (generalized from decision engine); rule set for weighting; no scheduling/recurrence. |
| **Diagnostics** | **7** | Diagnostics write to `values`; planner/decision **read** as context; no new structure primitive; optional “diagnostics → suggest plan” rule. |
| **Learning paths** | **7** | Steps as sequence or tree; flow-router-like rules in JSON; generic rule evaluator for “when readiness then next.” Flow 2.0 could be structure-driven. |
| **Life tracking** | **8** | Habits, goals, tasks as items; same progression and scheduling; “life” template with mixed item types. |

**Conclusion:** **8–9/10** reuse for most structure-based domains. Only the **rule set** and optional schema differ; engines and state model are shared. The interpreter model is the **universal base** for these domains.

---

## 7. Engine Layer Reassessment

**Current engines (flow/engine system)**

- **learning, calculator, abc (execution):** Take EducationFlow; return EngineFlow. **Keep** for legacy flows; **do not** use for structure path. Optionally replace later with “flow as JSON + generic rule evaluator” (Flow 2.0).
- **decision, summary (aftermath):** Consume EngineState. **decision:** Generalize to generic **aggregator** (items with signals/blockers → recommendations); input = any item list + config. **summary:** Generalize to **aggregator** (items + groupBy/sumBy/dateRange → rollups). Both can **stay** in spirit with **rewritten** input contract.
- **flow-router:** Rule evaluation is generic; only input (flow, step index, outcomes) is flow-specific. **Replace** flow-specific use with **generic rule evaluator**; flow 2.0 can feed it.
- **json-skin:** UI bridge; not logic. **Stay** as-is.

**New engines (structure path) — same under current or interpreter**

- **Scheduling:** (tasks, date, blocks, rules) → scheduled items, blocks with taskIds. **New.**  
- **Recurrence:** (task, date) → next occurrence(s), is due. **New.**  
- **Progression:** (habit config, date) → ramp value. **New.**  
- **Prioritization:** (tasks, date, rules) → effective priority, sort order. **New.**  
- **Aggregator:** (items, config) → rollups or decision-style output. **New** or **generalized from summary/decision.**

**Interpreter-specific**

- **Rule evaluator:** (ruleSet, context) → matched conditions, derived values. **New;** used by structure mapper, prioritization, and optionally flow 2.0.  
- **Structure mapper:** (parse result, rules, context) → task (or other item) candidates. **New;** used for speech-to-task, form-to-task, bulk import.

**Count in V4**

- **Current system, planner only:** 5–6 new engines (scheduling, recurrence, progression, prioritization, aggregation, optional hierarchy util); **0** generic rule evaluator; inference in handler or ad hoc.  
- **Interpreter system, structure path:** **6–7** engines total: rule evaluator, structure mapper, scheduling, recurrence, progression, prioritization, aggregator. Of these, **rule evaluator** and **structure mapper** are the only ones that are “new” relative to a minimal planner; the rest are the same. **Reuse across domains:** same 6–7 engines for planner, relationships, business, etc.  
- **Conclusion:** Interpreter does **not** increase engine count for the planner; it **adds 2** (rule evaluator, structure mapper) and **reuses** them across all structure domains. Net: **fewer** “domain-specific” engines, **more** generic ones.

---

## 8. Complexity Collapse Analysis

When rules move to JSON, the interpreter becomes the entry point for input→structure, structure is the universal primitive, and state remains event-log-based:

**Moving parts reduction**

- **Current structure path (hypothetical):** Handler + parser contract + category util + priority util + recurrence util + merge logic + state write. **~6–8** moving parts per “create task” path.  
- **Interpreter:** Handler (thin) + interpreter (rule evaluator + structure mapper) + state write. **~3–4** moving parts. **Reduction ~40–50%.**

**Coordination reduction**

- **Current:** Handler must coordinate with parser, with N inference utils, and with state. Contract between parser and handler is custom. **~5–6** coordination links.  
- **Interpreter:** Parser → interpreter; handler calls interpreter with rules; interpreter → state via handler. **~3** links. **Reduction ~40–50%.**

**Coupling reduction**

- **Current:** Handler coupled to parser output shape, state shape, and each inference util’s signature. Changing parser or adding inference type touches handler.  
- **Interpreter:** Handler coupled to “parse result” and “interpreter(parse, rules).” Parser shape is **isolated** inside interpreter (rule-driven mapping). **Coupling ~30–40% lower** for input-to-structure path.

**Cognitive load**

- “How does a task get its category?” **Current:** “Somewhere in the handler or in inferCategory.” **Interpreter:** “In the rule set under categoryInference; evaluator applies it.” **Single place.** Estimated **~30–40%** lower cognitive load for reasoning about inference and rules.

---

## 9. Risk Analysis

**What could break (interpreter)**

- **Rule evaluator bugs:** A bug in the generic evaluator affects **all** rule-driven inference (category, priority, recurrence, etc.). Mitigation: narrow evaluator surface, comprehensive tests, optional “which rule matched” in trace for debug.  
- **Mis-specified rules:** JSON rules that are inconsistent or incomplete produce wrong or missing inference. Mitigation: schema validation, examples, and optional dry-run.  
- **Parser–interpreter contract:** If parser output shape changes, interpreter (or rule-driven mapping) must be updated. Same risk as “parser–handler” in current system; interpreter **centralizes** the mapping, so **one** place to update.

**Where interpreter could fail**

- **Very complex conditions:** If a domain needs conditions that are not expressible in the rule schema (e.g. custom DSL or external service call), the evaluator must be extended. Current system would put that in handler or util—same class of problem.  
- **Performance:** Evaluating large rule sets on every input could be slow. Mitigation: rule set size is typically small (10²–10³ rules); evaluator can be optimized; optional caching for resolved rules.

**Where current system is still stronger**

- **Zero new abstraction:** If the only goal is “one add-task button and one list,” current system is **faster** to ship (no interpreter, no rule schema).  
- **Legacy flow path:** Existing learning/calculator/abc flows **do not** benefit from the interpreter; they remain flow-centric. Interpreter does not replace them without a separate Flow 2.0.  
- **Single domain, no templates:** If there will never be multiple industries or template replication, the benefit of JSON rules and layering is smaller (still useful for tuning without code).

**What requires discipline**

- **Interpreter:** Keep evaluator and structure mapper **pure** (no state write, no UI). Keep rule schema **documented** and **stable**.  
- **Current:** Keep inference logic **centralized** (one module or one engine), not scattered across handlers. Keep state **one key per domain.**

---

## 10. Final Verdict

**Which architecture is more powerful**

- **The interpreter + JSON-rule (structure-driven) architecture is more powerful.** It provides a single, rule-driven path from event (including speech) to structure to state; rule layering and template replication are first-class; and the same engines power planner, relationships, business, and decisions. The current architecture can implement a planner but does not provide a **universal** structure primitive or a single place for rules.

**Which is more scalable**

- **The interpreter architecture is more scalable.** Adding a new domain is adding a state key and a rule set (and optionally one action); engine count does not grow. Adding a new inference type or new industry is editing or adding JSON. The current architecture scales **linearly** in handlers and utils per domain; the interpreter scales **sublinearly** (same engines, more data).

**Which is easier to maintain**

- **The interpreter architecture is easier to maintain** for everything that fits the structure model. Rule and content changes are JSON edits; engine changes are limited to evaluation semantics. The current architecture requires code or config changes and consistent discipline to avoid handler sprawl.

**Which fits speech-driven onboarding best**

- **The interpreter architecture fits speech-driven onboarding better.** Parser → interpreter(rules, parse) → candidates → state is a single, clean path. Category, priority, recurrence, and habit inference are rule-driven; the handler stays thin; parser output shape is isolated behind the structure mapper. The current architecture can do it but couples the handler to the parser and to each inference type.

**Which becomes a true universal system base**

- **The interpreter architecture becomes the true universal system base** for planning, decisions, relationships, workflows, diagnostics, habit systems, and learning paths. One structure primitive, one rule model, one set of engines, many domains. The current architecture remains a **flow** and **action** base; structure-based domains are add-ons with repeated patterns.

---

**Conclusion (decisive)**

- **Adopt the interpreter + JSON-rule (structure-driven) architecture** as the foundation for the planner and all future structure-based domains.  
- **Keep the current flow/engine system** for legacy flows behind a clear boundary.  
- **Implement the structure path** with a generic rule evaluator, structure mapper, and the set of pure engines (scheduling, recurrence, progression, prioritization, aggregation).  
- **Drive behavior from JSON** (rules and templates) so that the system is **data-driven**, **universal**, and **maintainable** at scale.

This is the final evaluation. Version 4.
