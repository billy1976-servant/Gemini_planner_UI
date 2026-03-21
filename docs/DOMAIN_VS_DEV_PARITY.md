# Domain routes vs `/dev` — layout and palette parity

## Pathname shape

- **Custom domain (live):** Middleware rewrites to an internal pathname whose **first segment is the full host** (e.g. `/learn.containercreations.com/landing/landing-v5`). See `src/middleware.ts`.
- **Local preview:** `http://localhost:3000/dev?screen=...` uses **`/dev`** and **does not** go through host rewrite; `src/app/layout.tsx` treats `/dev` as the dev shell (`RootLayoutBody`), not `UserLayoutChrome`.

## RootLayout selection (`src/app/layout.tsx`)

- **`UserLayoutChrome`** (mobile shell + bottom nav): user-mode paths that are **not** `/dev` and **not** in the bypass list.
- **Bypass (raw `children`):** Includes paths where **any segment contains `.`** (`pathnameHasHostStyleSegment`) so host-shaped routes are not wrapped in the mobile shell.
- **`RootLayoutBody`:** Dev navigator / device preview when `pathname` starts with `/dev`.

**Same JSON screen** can therefore **look different** on `/dev` vs custom domain because **chrome, width simulation, and palette scope** differ — not because the JSON file differs.

## Palette

- Dev mode may scope palette CSS to the canvas (see `usePaletteCSS` usage in `layout.tsx`).
- User shell applies palette at document root when that path is active.

## Observability

- `traceDomainResolutionFromWindow(domain, pathSegments)` in `src/lib/domain-config.ts` uses **router params** when both are provided; window pathname is logged only for **drift detection**.
