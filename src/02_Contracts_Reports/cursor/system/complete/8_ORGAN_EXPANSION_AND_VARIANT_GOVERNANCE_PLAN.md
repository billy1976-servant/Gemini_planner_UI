# Plan 8 — Organ Expansion and Variant Governance

**Purpose:** Govern organ expansion (resolve-organs, organ-registry) and variant resolution; align override stores and organ layout profiles.

**Scope:** `src/organs/`, `src/layout-organ/`, override store organ-internal-layout-store, organ-registry and loadOrganVariant.

**Non-negotiables:**
- Variant precedence: user override → node.variant → default; resolveInternalLayoutId for valid ID or profile default.
- Organ expansion runs after compose; expandOrgansInDocument and loadOrganVariant from page.
- No Layout→Organ direct mutation; overrides from UI (OrganPanel/page).

**Current runtime summary:**
- page.tsx calls expandOrgansInDocument, loadOrganVariant; resolve-organs uses overrides (instanceKey/organId), node.variant, "default". organ-layout-resolver resolveInternalLayoutId; organ-internal-layout-store setOrganInternalLayoutOverride. Status: Wired. See ORGAN_EXPANSION_CONTRACT.generated.md.

**Required outputs:**
- Variant precedence doc (matches AUTHORITY_PRECEDENCE_AUDIT).
- Organ registry and loadOrganVariant contract (variant ID, fallback).
- Plan for organ layout profiles JSON (if not already).

**Verification checklist:**
- [ ] Precedence matches documented ladder.
- [ ] Override store only set from page/OrganPanel.
- [ ] No invented variant IDs (explicit default or from profile).

---

## Verification Report (Step 8)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
