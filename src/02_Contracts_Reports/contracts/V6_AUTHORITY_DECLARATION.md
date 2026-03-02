# V6 Authority Declaration

**Contract style. Bullet form only.**

---

## Constitutional authority

- APP_BUILD_PROTOCOL_V6.md is the constitutional build authority.
- No step may be skipped.
- No step may be reordered.
- TSX wrapper is always Step 9; Build Report is always Step 10.
- Blueprint + Content are authority for structure and semantics; build output is a Compiled TSX Screen Module.
- Canonical location: `src/02_Contracts_Reports/build_protocol/`. Contracts: `src/02_Contracts_Reports/contracts/`.

---

## REQUIRED contracts

- allowed-molecules.ts
- BLUEPRINT_UNIVERSE_CONTRACT.md
- CONTENT_DERIVATION_CONTRACT.md
- LAYOUT_SYSTEM_CONTRACT.md
- PALETTE_SYSTEM_CONTRACT.md
- RENDERING_PURITY_CONTRACT.md
- layout-closed-sets.ts

---

## SUPPORTING contracts

- JSON_SCREEN_CONTRACT.json
- PARAM_KEY_MAPPING.md
- expected-params.ts
- contract-verbs.ts
- layout-node-types.ts
- ENGINE_LAWS.md
- renderer-contract.ts
- ui-node.ts

---

## MISALIGNED contracts

- JSON_SCREEN_CONTRACT.json — defines JournalHistory and UserInputViewer under molecules; V6 requires exactly 12 molecules; any other is HARD VIOLATION. These two types are outside the closed set unless formally documented as non-molecule screen types.

---

## Drift sources

- allowed-molecules.ts, RENDERING_PURITY_CONTRACT.md, BLUEPRINT_UNIVERSE_CONTRACT.md — same 12 molecules in multiple places; one canonical source (allowed-molecules.ts) should be designated; others reference it.
- layout-closed-sets.ts and LAYOUT_SYSTEM_CONTRACT.md — same 8 structure types and template ids; must be kept in sync.
- JSON_SCREEN_CONTRACT.json — molecule-type surface (JournalHistory, UserInputViewer) extends beyond the 12; status unclear; drift with "exactly 12" rule.
- renderer-contract.ts — reads from config (rendererContract); contract shape not defined in contracts folder; config and docs can diverge.
- ORGAN_CONTRACT_UPDATE_PLAN.md — plan only; if executed, may introduce divergence from other contracts.

---

## Inactive but retained

- SystemContract.ts — not referenced by V6; retained for runtime/ecosystem use.
- index.ts — re-exports only; retained for import convenience.
- ORGAN_CONTRACT_UPDATE_PLAN.md — plan; not a contract; retained for reference.
- CONTRACT_CONSOLIDATION_REPORT.md — historical; retained for reference.
- README.md — reference only; states exporter does not read this folder; retained.
- master-business.blueprint.txt — example blueprint; retained for reference.
- load-app-offline-json.node.ts — test helper; retained for contract tests.
- param-key-mapping.test.ts — test; retained for regression prevention.
- showcase-visual-quality.test.ts — test; retained.
- critical-path.smoke.test.ts — test; retained.
- legacy/.gitkeep — placeholder; retained.

None of the above may modify Blueprint authority.

---

## Blueprint authority rule

- No contract outside the REQUIRED set may modify Blueprint authority.
- Blueprint + Content remain the structure and semantics authority per V6.
- REQUIRED contracts are: allowed-molecules.ts, BLUEPRINT_UNIVERSE_CONTRACT.md, CONTENT_DERIVATION_CONTRACT.md, LAYOUT_SYSTEM_CONTRACT.md, PALETTE_SYSTEM_CONTRACT.md, RENDERING_PURITY_CONTRACT.md, layout-closed-sets.ts.
- Changes to Blueprint authority (molecule set, blueprint grammar, structure types, template set, content derivation rules) are governed by these contracts and by V6; no other contract in the folder may override them.
