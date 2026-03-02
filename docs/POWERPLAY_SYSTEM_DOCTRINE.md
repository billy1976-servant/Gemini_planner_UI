# Power Play System Doctrine

This document defines the core philosophy of the Power Play system. It is permanent doctrine: architecture and implementation must align with it.

---

## What the system is not

- **The system is not analytics.** It does not exist to analyze data for its own sake.
- **The system is not reporting.** It does not exist to produce static reports.
- **The system is not visualization.** It does not exist to chart or display data alone.

---

## What the system is

**The system is a closed-loop execution engine.**

The loop:

1. **Onboarding intent** — Business and goals are captured.
2. **Strategy selection** — A Power Play (JSON) is chosen.
3. **Engine aggregation** — Existing engines aggregate signals; no modification of aggregation for strategy.
4. **Segment scoring** — Segments are scored using the selected strategy.
5. **Action plan** — Decisions are produced: Cut / Scale / Reallocate.
6. **Execution** — Actions are applied (e.g. Google Ads mutation).
7. **Performance feedback** — Results feed back into the loop.
8. **Strategy re-evaluation** — Strategy is re-evaluated in light of feedback.

---

## Invariants

- **All engines remain pure.** No side effects; inputs in, outputs out. Strategy never bends engine contracts.
- **All strategies are JSON-driven.** No hardcoded play logic in engines. Strategy lives in config.
- **All execution decisions must be explainable.** Every cut, scale, or reallocation can be traced to strategy and data.
- **All output must visibly render.** Nothing is silent or hidden. The Decision Console shows what the system decided and why.

---

## Layering (never invert)

- **Never modify ingestion or aggregation to support strategy.** Ingestion and aggregation are stable. Strategy must sit on top of them.
- **Strategy must sit on top of engines.** Engines compute; strategy config defines how those outputs are interpreted and turned into actions.
- **Execution must sit on top of strategy.** Execution (e.g. Google Ads changes) consumes the action plan produced by strategy + engines.

---

## Primary control surface

**The Decision Console is the primary control surface.** It is where strategy is selected, where segment scoring and action plans are visible, and where the operator confirms and drives execution. All material outputs of the Power Play system must be visible there.

---

*Doctrine established. Architecture and features must conform.*
