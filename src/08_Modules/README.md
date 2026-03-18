# 08_Modules — Master Template Source of Truth

**This folder is the single source of master blueprint and content templates.**  
Structure mirrors what working apps use so it can be copied directly when generating. No compiler or runtime changes required.

---

## What 08_Modules Is

- **Copy source** for `blueprint.txt` and `content.txt` when creating new apps.
- **One master per vertical** with full blueprint + content + images.
- **Subtype folders** that inherit structure (content + images only; no blueprint).
- **Reference only** — no imports; combination is manual or via your generator.

## What 08_Modules Is NOT

- **NOT** used by the compiler unless you copy files into an app folder first.
- **NOT** loaded by the app or JsonRenderer.
- **NOT** part of the compile pipeline or runtime.

---

## Folder Layout (Final State)

```
08_Modules/
  README.md
  _samples/                    ← Sample/template reference (e.g. doctor)
    doctor/
      blueprint.txt
      content.txt
    README.md
  contractors/
    master/
      blueprint.txt            ← Full structure; copy to app
      content.txt              ← Canonical content template
      images/
        .gitkeep
        README.md
    painter/
      content.txt              ← Override content only
      images/
    framer/
      content.txt
      images/
    general-contractor/
      content.txt
      images/
  medical/
    master/
      blueprint.txt
      content.txt
      images/
    dentist/
      content.txt
      images/
    chiropractor/
      content.txt
      images/
    physician/
      content.txt
      images/
  legal/
    master/
      blueprint.txt
      content.txt
      images/
    family-law/
      content.txt
      images/
    criminal-defense/
      content.txt
      images/
```

- **`master/`** = one blueprint + one content template + images folder per vertical.
- **Subtype folders** (e.g. `painter`, `dentist`) = **content.txt and images/ only**; they do **not** have blueprint.txt. They inherit structure from master.

---

## Workflow: Generate an App

1. **Pick a vertical and subtype** (e.g. contractors, painter).
2. **Copy master blueprint** from `contractors/master/blueprint.txt` into your app folder (e.g. `apps-json/generated/<slug>/blueprint.txt`).
3. **Copy subtype content** from `contractors/painter/content.txt` into the same app folder as `content.txt`.
4. **Optional:** Copy or reference images from `contractors/master/images/` or `contractors/painter/images/`.
5. **Compile** with your existing compiler (e.g. `/api/compile-app`). No generator changes required.

Result: app has master structure + subtype wording; compile immediately.

---

## Rules

- **Do not** add imports from 08_Modules anywhere in the project.
- **Do not** change the compiler, JsonRenderer, or apps-json app structure for this folder.
- Compiler continues to read only `blueprint.txt` and `content.txt` from the target app folder.

**Note:** If your app-creation API (e.g. create-from-module) currently expects `vertical/<subtype>.blueprint.txt`, update it to copy `vertical/master/blueprint.txt` and `vertical/<subtype>/content.txt` so it matches this layout.
