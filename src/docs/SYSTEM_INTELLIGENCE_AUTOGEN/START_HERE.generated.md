# SYSTEM_INTELLIGENCE_AUTOGEN — Start Here

**Purpose:** Entry point for full system architecture scan artifacts. All files in this folder are generated; do not refactor runtime code from these docs alone.

**Scan rules:** Docs + report + plan generation only. No runtime code changes. Every report includes PASS / FAIL / PASS_WITH_GAPS, exact file paths, function names, line ranges when possible.

---

## Artifacts

| Artifact | Path | Purpose |
|----------|------|--------|
| **MASTER_SYSTEM_INDEX** | [MASTER_SYSTEM_INDEX.generated.md](./MASTER_SYSTEM_INDEX.generated.md) | Subsystems: folder roots, entrypoints, public APIs, runtime callers, state surfaces, JSON registries, status (Wired/Dormant/Missing/Ambiguous) |
| **RUNTIME_REACHABILITY_GRAPH** | [graphs/RUNTIME_REACHABILITY_GRAPH.generated.mmd](./graphs/RUNTIME_REACHABILITY_GRAPH.generated.mmd) | Mermaid: Next.js → screen load → compose → renderer → behaviors → state; Reachable / Unreachable / Docs only / Code only |
| **ENGINE_REACHABILITY_TABLE** | [graphs/ENGINE_REACHABILITY_TABLE.generated.md](./graphs/ENGINE_REACHABILITY_TABLE.generated.md) | Engine-level reachability table |
| **DISCONNECTED_SYSTEMS_REPORT** | [DISCONNECTED_SYSTEMS_REPORT.generated.md](./DISCONNECTED_SYSTEMS_REPORT.generated.md) | Exhaustive: what exists, where it lives, what should call it, evidence not called, required wiring (TODO), risk, JSON violations |
| **JSON_DRIVEN_VIOLATIONS** | [JSON_DRIVEN_VIOLATIONS.generated.md](./JSON_DRIVEN_VIOLATIONS.generated.md) | Hardcoded layout ID arrays, registry lists, capability allow-lists, silent fallbacks |
| **STATE_WRITE_SURFACE_AUDIT** | [STATE_WRITE_SURFACE_AUDIT.generated.md](./STATE_WRITE_SURFACE_AUDIT.generated.md) | All mutations: dispatchState, setState, localStorage, store setters; Logic→Layout/State direct mutation |
| **AUTHORITY_PRECEDENCE_AUDIT** | [AUTHORITY_PRECEDENCE_AUDIT.generated.md](./AUTHORITY_PRECEDENCE_AUDIT.generated.md) | Resolver precedence vs documented hierarchy |
| **MASTER_VERIFICATION_SUMMARY** | [MASTER_VERIFICATION_SUMMARY.generated.md](./MASTER_VERIFICATION_SUMMARY.generated.md) | Rollup of verification reports for all 12 plans |

---

## Related

- **Cursor system plans:** [src/cursor/system/PLANS_INDEX.md](../../cursor/system/PLANS_INDEX.md) — planned vs complete; 12 master plan files.
- **Reachability (module-level):** [SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md](../SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md).
- **Engine wiring:** [ARCHITECTURE_AUTOGEN/ENGINE_WIRING_STATUS.generated.md](../ARCHITECTURE_AUTOGEN/ENGINE_WIRING_STATUS.generated.md).

---

**Generated:** Full system architecture scan. Deterministic; regenerate when seed or code structure changes.
