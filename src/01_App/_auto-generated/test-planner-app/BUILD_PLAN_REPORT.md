# BUILD PLAN REPORT

## SECTION 1 — APP REQUEST

- **slug**: test-planner-app
- **raw description**: planner with autoprioritation and cancel days to reorder things

## SECTION 2 — REGISTRY SNAPSHOT (EXHAUSTIVE)

### All engines (full list)
- 25x
- abc
- calculator
- value-comparison
- value-translation
- decision
- flow-router
- onboarding-flow-router
- structure-mapper
- recurrence
- prioritization
- parser-v4
- aggregation
- learning
- summary
- json-skin
- next-step-reason
- hi-engine-runner
- progression
- rule-evaluator
- scheduling

### All templates (full list)
- list:default
- list:compact
- list:dense
- list:minimal
- board:default
- board:minimal
- board:pipeline
- board:swimlanes
- dashboard:default
- dashboard:compact
- dashboard:single-column
- dashboard:wide
- editor:default
- editor:minimal
- editor:sidebar-left
- editor:fullscreen
- timeline:default
- timeline:compact
- timeline:day-only
- timeline:week-month
- detail:default
- detail:minimal
- detail:detail-right
- detail:detail-bottom
- wizard:default
- wizard:minimal
- wizard:linear
- wizard:branched
- gallery:default
- gallery:minimal
- gallery:masonry
- gallery:uniform
- WebsiteTemplate

### All structure types
- list
- board
- dashboard
- editor
- timeline
- detail
- wizard
- gallery

### All TSX25 components
- Grid
- Row
- Column
- Stack
- button
- section
- card
- toolbar
- list
- footer
- chip
- avatar
- field
- toast
- modal
- stepper

### CONTRACT_VERB_LIST verbs
- tap
- double
- long
- drag
- scroll
- swipe
- go
- back
- open
- close
- route
- crop
- filter
- frame
- layout
- motion
- overlay

### EXPECTED_PARAMS grouped by component type
- **button**: surface, label, trigger
- **section**: surface, title
- **card**: surface, title, body, media
- **toolbar**: surface, item
- **list**: surface, item
- **footer**: surface, item
- **chip**: surface, text, body, media
- **avatar**: surface, media, text
- **field**: surface, label, field, error
- **toast**: surface, text
- **modal**: surface, title, body

## SECTION 3 — CONTRACT SUMMARY

- verbs count: 17
- layout node types count: 4
- expected param groups count: 11
- tsx25 component count: 16

## SECTION 4 — EXECUTION RULES FOR CURSOR

- Only use registered engines.
- Only use registered templates.
- Only use TSX25 components.
- Only use CONTRACT_VERB_LIST verbs.
- Only use EXPECTED_PARAMS per component.
- No router.
- No JSON compiler.
- No hardcoded state keys.
- No hardcoded strings outside content object.
- Do not scaffold until approved.
