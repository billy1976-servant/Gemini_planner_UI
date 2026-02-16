# Native Voice-to-Text Verification (No Custom Audio Code)

**Goal:** All text inputs allow OS-level speech-to-text from the phone keyboard. No SpeechRecognition, Web Speech API, or plugins—keyboard mic only.

**Date:** 2025-02-14

---

## Input components verified

### hiclarify

| Location | Component | Type | Focus / keyboard | Blocking |
|----------|-----------|------|------------------|----------|
| `src/components/relationship2.jsx` | Response textareas | `<textarea>` | ✓ Focus, keyboard | None |
| `src/components/relationship2.jsx` | Search contacts | `<input type="search">` | ✓ | None |
| `src/components/relationship2.jsx` | Campaign preview URL | `<input readOnly>` | Copy-only (intentional) | N/A – not for voice |
| `src/components/relationship2.jsx` | Step editor fields | `<input type="text\|url">`, `<textarea>` | ✓ | None |
| `src/components/relationship2.jsx` | Contact form (First/Last name, Phone, Email, Notes, etc.) | `<input>`, `<textarea>` | ✓ | None |
| `src/components/relationship2.jsx` | Share modal URL | `<input readOnly>` | Copy-only (intentional) | N/A |
| `src/components/relationship2.jsx` | Habit template form | `<input type="text\|number">` | ✓ | None |
| `src/lib/weeklyView.js` | Event title / notes | `<input>`, `<textarea>` | ✓ | None |
| `src/components/PrimeEditor.jsx` | Rich text (Quill) | PrimeReact Editor (contentEditable) | ✓ Keyboard; native mic may vary by OS | None |
| `src/components/NewJourneyBuilder.jsx` | PrimeEditor instances | Same as above | ✓ | None |
| `src/components/journey.jsx` | Section header input | `<input>` | ✓ | None |
| `src/components/ScriptureGenerator.jsx` | Share URL in modal | `<input readOnly>` | Copy-only (intentional) | N/A |
| `src/components/ScriptureTagger.jsx` | contentEditable areas | Editable div | ✓ | None |

### HiSense

| Location | Component | Type | Focus / keyboard | Blocking |
|----------|-----------|------|------------------|----------|
| `src/mobile/auth/AuthModal.tsx` | Email, Password | `<input type="email\|password">` | ✓ | None |
| `src/05_Logic/logic/engines/json-skin.engine.tsx` | User input fields | `<input type={text\|...}>` | ✓ | None |
| `src/app/ui/control-dock/*.tsx` | Dev/panel inputs | `<input>` | ✓ (desktop-oriented) | None |
| `src/07_Dev_Tools/devtools/InteractionTracerPanel.tsx` | Dev inputs | `<input>` | ✓ | None |

---

## Blocking checks performed

- **readonly / disabled:** Only on share-URL copy fields (3 places); all other text-entry inputs are editable.
- **pointer-events: none:** Not applied to any input or textarea. Used only on: `.live-time-bar` (weeklyView.css), tooltips (ScriptureTagger, NewJourneyBuilder), and `.rte-toolbar` container (buttons have `pointer-events: auto`; editor content is outside toolbar).
- **contentEditable={false}:** Only on specific non-editable spans in ScriptureGenerator; main editable regions remain contentEditable.
- **Event handlers:** No `preventDefault`/`stopPropagation` on or around text inputs that would block focus; modals use `stopPropagation` on modal-content to avoid closing, not on inputs.
- **MobileLayout (HiSense):** No overlay over main content; bottom nav is fixed at bottom with `paddingBottom` on main so inputs are not covered; no tap interception on form areas.

---

## Components that were blocking focus and were fixed

**None.** No text-entry inputs were found with readonly, disabled, pointer-events: none, or focus-blocking handlers. The only readOnly inputs are share-URL copy fields, which are intentionally non-editable.

---

## Test logic

1. Focus any text input or textarea → keyboard should open.
2. On Android/iOS, mic icon should appear in the keyboard when available (OS-controlled).
3. If a custom editor (e.g. PrimeEditor) does not show the mic, temporarily replace that instance with a standard `<textarea>` to confirm OS voice input works in that screen.

---

## Do not add

- SpeechRecognition / Web Speech API  
- Capacitor or other speech plugins  
- Custom audio or voice libraries  

Voice input is entirely via the native keyboard mic.
