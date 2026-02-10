Behaviors synopsis (how it wires now, and how it should wire):
 Your system already defines behaviors cleanly in three parts: (1) the universal 6×7 Action matrix (media × verb) in behavior-actions-6x7.json, (2) Interaction verbs (tap, swipe, drag, etc.), and (3) Navigation verbs (go, back, open, close), all resolved deterministically by the verb resolver and runner .

Where behaviors belong:
 Behaviors should be hard-wired at the Atom level, not rewritten per molecule: atoms like TriggerAtom, MediaAtom, and FieldAtom are the correct execution points because they already receive final params and events, while molecules simply declare intent (they pass { behavior: { type, verb, variant, params } } downward) .

How molecules participate (without engines):
 Each molecule TSX only needs a thin, shared behavior adapter (≈5–10 lines) that forwards its declared behavior object to the atom it wraps; no molecule needs custom logic, and unused behaviors remain inert.

What is missing today:
 Nothing is missing conceptually—the 6×7 matrix, interaction set, and navigation set are already complete—but behavior execution is still centralized in the behavior engine, whereas your goal is to inline that execution into atoms (mostly TriggerAtom + MediaAtom) by moving the resolver/runner logic there.

Size and effort:
 This is ~150–250 lines total, not per atom: one shared resolver utility plus small hooks in 3–4 atoms; this is a 2–4 hour refactor, not a rewrite, and it does not block building TRACK Journal or Task Manager now.

Key takeaway:
 Your design is sound and already drift-proof—the remaining step is simply relocating the existing behavior machinery into atoms so molecules stay declarative and your system becomes engine-free by construction.


