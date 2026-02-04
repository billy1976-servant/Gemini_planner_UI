# Slot name convention (layout compatibility)

Used by the Layout Compatibility Engine: requirement JSON files and the Content Capability Extractor must use the same slot names.

## Section and card layouts

| Slot       | Meaning                    | Child type / content key |
| ---------- | -------------------------- | ------------------------- |
| `heading`  | Title or headline          | `type: "heading"` or `content.title` |
| `body`     | Body text / description    | `type: "body"` or `content.body`     |
| `image`    | Media / image block        | `type: "image"` or `content.image`   |
| `card_list`| One or more card children  | One or more `type: "card"` children  |

Use these in `section-layout-requirements.json` and `card-layout-requirements.json`. The content capability extractor normalizes child types to these slots (e.g. `title` → `heading`).

## Organ internal layouts

Use the slot names from each organ’s `capabilities.slots` in `organ-layout-profiles.json`, e.g. `title`, `items`, `primary`, `logo`, `cta`. The extractor uses the organ profile’s slots when the section has a matching `role`; otherwise it derives from children and content.

## Normalization in extractor

- Child `type: "heading"` or `content.title` → slot `heading`
- Child `type: "body"` or `content.body` → slot `body`
- Child `type: "image"` or `content.image` → slot `image`
- One or more children with `type: "card"` → slot `card_list`
