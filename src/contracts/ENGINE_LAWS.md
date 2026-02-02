
1️⃣ WRAPPER LAW (Child Inspection Rule)
Problem: Layout logic couldn’t detect media children
 Cause: Nodes are wrapped in MaybeDebugWrapper, so child props are not the real component props
 Law:
When inspecting child nodes inside compounds, always read from
 child.props.node, not child.props
Applies to:
Split layouts
Media-left/right detection
Any compound that analyzes child content

2️⃣ PRESET OVERRIDE LAW
Problem: Layout presets selected in UI didn’t affect rendering
 Cause: Template params overwrote preset params later in the merge chain
 Law:
Section/Card presets must be merged after templates and must win in conflicts
Order of authority: Base → Template → Experience → Preset → Node Overrides

3️⃣ HERO IS NOT A NORMAL SECTION LAW
Problem: Hero looked like a basic card section
 Cause: Hero used default section container rules
 Law:
Hero sections require explicit hero presets for:
container width
vertical padding
alignment
media behavior
Never rely on default section styling for heroes.

WRAPPER RULE
When detecting properties of a rendered child (media, role, type, etc.), the engine must check both:
• child.props
• child.props.node
because components may be wrapped (DebugWrapper, layout wrappers, etc.)



4️⃣ SPLIT LAYOUT REQUIRES 3 CONDITIONS
Split will not activate unless ALL are true:
Required Param
Why
params.split exists
Enables partition logic
moleculeLayout.type === "row"
Enables horizontal layout
Media child detected via WRAPPER LAW
Otherwise no media column


5️⃣ TEMPLATES DEFINE STRUCTURE, PRESETS DEFINE STYLE
Problem: Confusion about why template edits didn’t change hero layout
 Law:
Templates define section type and layout structure
 Presets define visual styling and special behaviors

6️⃣ PARAM MERGE MUST BE NON-DESTRUCTIVE
Problem: Earlier merges erased preset keys
 Law:
Param merging must always be deep-merge, never replace entire objects
Especially for:
moleculeLayout
split
spacing
containerWidth

7️⃣ CONTENT LIVES ON NODE, NOT COMPONENT
Problem: Compounds checked component props instead of resolved node
 Law:
Engine logic should treat the resolved node as source of truth, not React props

8️⃣ ENGINE LOGS TELL TRUTH, UI DOES NOT
Problem: Organ Panel showed correct preset, but layout was wrong
 Law:
Trust renderer console logs over UI panels when debugging

9️⃣ SECTION LAYOUT ≠ CARD LAYOUT
Problem: Changing Card Layout didn’t affect hero structure
 Law:
Section layout controls split/grid behavior
 Card layout only affects internal card content flow

🔟 IF A LAYOUT DEPENDS ON CHILD TYPE, IT IS A COMPOUND RESPONSIBILITY
Never solve child-analysis problems in the renderer — fix them in the compound.








Each law =
## LAW NAME
**Problem**
**Root Cause**
**Rule**
**Applies To**
