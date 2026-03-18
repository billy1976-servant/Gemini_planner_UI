# Plan 2 — Screen Loading and API Contract

**Purpose:** Define contract for screen loading (JSON and TSX) and API that serves screens; align with loadScreen and API route behavior.

**Scope:** `src/engine/core/screen-loader.ts`, `src/app/api/screens/route.ts`, `src/app/api/screens/[...path]/route.ts`, page.tsx screen param handling.

**Non-negotiables:**
- loadScreen(path) returns either JSON screen or { __type: "tsx-screen", path }; no silent fallback into legacy systems.
- API serves from documented roots (e.g. public/screens, apps-offline); TSX from src/screens.

**Current runtime summary:**
- page.tsx calls loadScreen(screen) when screen param present; loadScreen fetches /api/screens/... for JSON or returns tsx-screen marker. API route reads filesystem. State: initial currentView applied from JSON when present. Status: Wired.

**Required outputs:**
- Contract: loadScreen input/output; API GET response shape; TSX resolution path.
- Document screen roots and resolution order.

**Verification checklist:**
- [ ] Contract doc exists.
- [ ] No silent fallback in loadScreen (per comment in screen-loader).
- [ ] API and TSX paths documented.

---

## Verification Report (Step 2)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
