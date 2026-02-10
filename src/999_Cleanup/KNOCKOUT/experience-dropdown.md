Developer Note — Experience Layer (Website / App / Learning)
Goal
 Introduce an Experience Layer that sits above layout and components, allowing the same app.json content to be rendered as a Website, App, Learning flow, or future modes (e.g., Training, Onboarding) without duplicating content.
Core Concept
JSON = content truth (what is being said)
Experience = intent (how the user is meant to use it)
Layout = expression (visual structure, spacing, flow)
The Experience Layer must:
Interpret the same JSON differently based on intent
Drive default layout decisions, section behaviors, navigation patterns, and interaction priorities
Act as a directive layer that layout follows—not the other way around
What Needs to Happen
Define Experience Profiles (JSON)
website.profile.json
app.profile.json
learning.profile.json
Each profile defines:
Section role mappings
Default layouts per section
Interaction expectations (scroll vs step vs task)
Navigation model (page, flow, lesson)
Experience Selector (UI)
Existing dropdown (Website / App / Learning) becomes the active experience controller
Selection updates a global experienceStore
Experience → Layout Bridge
Layout resolver must:
Read experience first
Apply experience-driven layout defaults
Allow per-section overrides (but never require them)
Renderer Integration
JsonRenderer applies the active experience profile before resolving layout
Same app.json renders differently without modification
Non-Destructive
No changes to existing app.json structure
No impact on current website building while inactive
What This Is NOT
Not styling tweaks
Not spacing presets
Not a refactor of existing layout logic
Not required to build a website today
Impact / Priority
Architectural power: 9.5 / 10
Immediate UI impact (today): Low
Long-term leverage: Very High
Enables:
Website → Training → App from same data
Automated system generation from business input
Zero-duplication content workflows
When to Do This
Can be added later safely
Does not block building websites now
Recommended timing:
Phase 1 (Web build): ignore, use default experience
Phase 2 (1–2 focused sessions): implement experience layer cleanly
Estimated Time
Initial working version: 2–4 hours
Polished + extensible: 6–8 hours
Key Rule to Lock
Experience decides how content behaves.
 Layout decides how it looks.
 Content never changes.

If you want, next we can:
Reduce this to a one-screen checklist, or
Design the exact shape of an experience.profile.json, or
Decide the minimum viable version to unblock everything else immediately.




