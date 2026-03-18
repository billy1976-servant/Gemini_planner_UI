# Engine capability read pattern

Engines and callers that perform capability-dependent work should read from the capability store before proceeding. This keeps the hub as the single source of truth and avoids accidental exposure when a capability is off.

## Entry points

- **Sync (store):** `getCapabilityProfile()`, `getCapabilityLevel(domain)` from `@/03_Runtime/capability` (or `capability-store`). Use in non-React code (engines, action handlers, bridges).
- **React:** `useCapability(domain)`, `useCapabilityProfile()` from capability context. Use in components that need to hide/disable by capability.

## When to read

- **Action-gated flows:** The action runner already checks `CAPABILITY_ACTION_MAP` before invoking handlers. If your flow is triggered only by a gated action (e.g. `logic:exportPdf`), you do not need an extra read inside the handler unless you branch on level (e.g. basic vs advanced).
- **Direct engine callers:** If an engine or export/summary/decision function is ever called without going through the action runner, it should call `getCapabilityLevel(domain)` at the start and skip or return a safe result when the level is `"off"`.
- **System7 / sensors:** Channel and sensor gates are applied in the universal-engine-adapter and sensor-capability-gate; engines that only use those paths do not need to read capability themselves.

## How to read

```ts
import { getCapabilityLevel } from "@/03_Runtime/capability";

const level = getCapabilityLevel("export");
const levelStr = typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
if (levelStr === "off") {
  return; // or return empty/minimal result
}
// proceed with capability-dependent work
```

For level ordering (e.g. basic vs advanced), use the same ordering as in the action runner: `["off", "basic", "advanced", "lite", "full", "on"]`.

## Summary

- Prefer gating at the action map so one place controls access.
- In engines or export/summary/decision code that can be invoked without an action, call `getCapabilityLevel(domain)` and short-circuit when off.
- No engine contract change: engines remain unaware of the hub until they opt in by reading the store.
