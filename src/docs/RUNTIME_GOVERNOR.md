# RUNTIME GOVERNOR — SYSTEM OPERATION CONTRACT


Purpose:  
This document defines how AI agents must interpret, analyze, and plan changes for this system. It is NOT feature documentation. It is the runtime rules for safe architecture-aware planning.


This file is authoritative for:
• Understanding runtime flow  
• Understanding which files define system truth  
• Ensuring future plans respect existing architecture  
• Preventing destructive or guess-based edits  


---


## 1️⃣ SYSTEM TRUTH SOURCES (READ FIRST)


AI agents must derive understanding from **code-derived architecture files**, not memory or assumptions.


Primary sources of runtime truth:


/ARCHITECTURE_AUTOGEN/
- RUNTIME_PIPELINE_CONTRACT.md
- SCREEN_JSON_SCHEMA.generated.md
- LAYOUT_RESOLUTION_CONTRACT.generated.md
- BEHAVIOR_TO_STATE_MAP.generated.md
- REGISTRY_MAP.generated.md
- BLUEPRINT_RUNTIME_INTERFACE.generated.md
- STATE_SHAPE_CONTRACT.generated.md
- ORGAN_EXPANSION_CONTRACT.generated.md
- SKIN_APPLICATION_CONTRACT.generated.md
- DATA_FLOW_CONTRACT.generated.md
- RUNTIME_FALLBACKS.generated.md


These files reflect actual code behavior. If conflict exists between docs and code, **these win**.


---


## 2️⃣ HOW AI MUST ANALYZE BEFORE MAKING CHANGES


Before proposing edits, AI must:


1. Identify which runtime layer is affected:
   - Layout
   - Behavior
   - State
   - Rendering
   - Blueprint/compiler
   - Skin/organs


2. Read the corresponding AUTOGEN contract file(s)


3. Determine:
   - What the system does NOW
   - Which files enforce that behavior
   - What dependencies exist


4. Only then may AI propose a change plan.


---


## 3️⃣ CHANGE PLANS MUST INCLUDE


Every future plan must explicitly state:


• Which runtime contracts are involved  
• Which files will change  
• What must NOT change  
• Whether state shape changes  
• Whether layout resolution order changes  
• Whether behavior-to-state mappings change  


If this analysis is missing, the plan is invalid.


---


## 4️⃣ WHAT AI MUST NEVER DO


AI must NOT:


✖ Guess how runtime works  
✖ Invent new architecture layers  
✖ Bypass layout/state/behavior contracts  
✖ Hardcode layout where resolver is required  
✖ Modify contracts without updating AUTOGEN files  


---


## 5️⃣ HOW TO UPDATE SYSTEM UNDERSTANDING


When the codebase changes significantly, regenerate:


/ARCHITECTURE_AUTOGEN/


using the architecture extraction command.


This keeps system understanding synchronized with code reality.


---


## 6️⃣ AI SESSION STARTUP RULE


When a new AI session begins, it should be instructed:


"Read src/docs/RUNTIME_GOVERNOR.md and ARCHITECTURE_AUTOGEN before proposing changes."


This ensures architecture-aware reasoning.


---


END OF FILE
