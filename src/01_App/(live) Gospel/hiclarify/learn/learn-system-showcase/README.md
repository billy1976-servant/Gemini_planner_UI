# Learn System Showcase — canonical duplication template

This folder is the **master reference** for TXT → Learn (profile **v2**). Duplicate it when starting a new flow: keep `blueprint.txt`, `content.txt`, and `learn.compile-options.json` as the source of truth; regenerate **`v1.json`**—do not hand-edit runtime JSON except in emergencies.

## Source vs generated

| Role | Files |
|------|--------|
| **Source (edit these)** | `blueprint.txt`, `content.txt`, `learn.compile-options.json`, optional `assets.manifest.json` (inventory only) |
| **Generated (compile output)** | `v1.json`, `v1.learn-structure.json`, `v1.learn-content.json` |

## Compile

From the repo root:

```bash
npm run learn:from-txt -- "src/01_App/(live) Gospel/hiclarify/learn/learn-system-showcase" "src/01_App/(live) Gospel/hiclarify/learn/learn-system-showcase/v1.json"
```

Always pass the **full output path** for `v1.json` so artifacts land in this folder (not the repo root).

## Duplication checklist

1. Copy this entire folder to a new path under `learn/<your-flow>/`.
2. Rename titles and `learn.slideId` values in `content.txt`; adjust section names in `blueprint.txt` if you change **`SEQUENCE:`** tokens.
3. Edit `learn.compile-options.json` (`shopUrl`, palette, tracker copy, `slidePresentationDefaults`).
4. Run **`npm run learn:from-txt`** with your folder and output `v1.json` path.
5. Commit **source** files + regenerated JSON; do not hand-edit `v1.json` unless there is an emergency.

## Media convention

- **Keyed catalog media:** set `learn.media.key` + `learn.media.image` (and alt). The profile registers **`outline.media[key]`** and sets **`mediaKeys`** on the slide so the rail resolves from the catalog (see the museum slide’s `showcaseBrand` entry).
- **Inline-only media:** omit `learn.media.key`; images/video/beforeAfter/imageGrid still land in **`inlineMedia`** and compile into the screen `media` array.
- **`assets.manifest.json`:** lightweight inventory of first-party paths under `/images/...` plus documented external URLs—so humans and automation can see what the flow references without parsing all of `content.txt`. Do **not** check in large binaries; prefer public URLs or existing app static paths.

## What this flow demonstrates

- **Intro** (`1.0`): deck-level intro slide from `learn.kind: intro`.
- **Hero**: dedicated hero layout (`layout: hero`).
- **Teach (“component museum”)**: one **stamped** slide with supported blocks + media rail patterns; logo uses **keyed** media (`showcaseBrand`) beside **inline** video, before/after, and grid.
- **Layout override**: optional **`learn.layoutOverride: splitProof`** on a teach section (`SplitProofLane`) to show a non-default shell while keeping the teach template spine.
- **Proof**: scripture alone in **proofPanel** layout (same anchor verse as in the museum—intentionally).
- **Comparison**: screen-level **twoCol** layout (`learn.kind: comparison`).
- **Quiz**: gated select + tracker labels.
- **Summary**: **textOnly** recap from `learn.summary.bullets`.
- **CTA**: closing checklist pattern.

Slide order is driven by **`SEQUENCE:`** in `blueprint.txt`.

## Syntax reminders

- **`learn.compare.rows`**: rows separated by **`;`**, columns by **`||`** (see profile README). Pipe **`|`** alone does **not** split comparison rows.

Full contract: [`src/lib/txt-authoring/profiles/learn/README.md`](../../../../../../lib/txt-authoring/profiles/learn/README.md).

## Split artifacts

The compiler may emit **`v1.learn-structure.json`** and **`v1.learn-content.json`** beside `v1.json`. Treat them as derived unless your editor maintains split SSOT—see [`STRUCTURE_VS_CONTENT.md`](../../../../../../lib/landing-deck/translator/STRUCTURE_VS_CONTENT.md).
