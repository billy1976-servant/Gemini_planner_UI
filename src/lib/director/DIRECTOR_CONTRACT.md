# Director contract

- **Stateless:** Director does not hold state; it only subscribes to existing state and config.
- **Read-only:** Reads from `getState()`, `getLayout()`, `subscribeLayout`. Never calls `dispatchState`, `navigate`, or any mutating API.
- **Config-driven:** Profile resolved from `state.values.profileName` → `mode-profiles.json`. No `if (profileName === "google")` or other feature branches in code.
- **Single output:** One `directorProps` object (25 primitives) plus `experience`, `profileName`, `archetype` via context.
- **No feature names:** No hardcoded track, journal, section types, or app names. All labels and routes come from config (e.g. journal-modes.json) outside Director.
- **One state engine, one behavior bridge, one layout engine:** Director is a resolver layer only; it does not introduce a new store or event pipeline.
