# Action Plan (Cursor copy-paste)

**Classification:** HISTORICAL — Packetized execution plan; superseded by phase-based PLAN_ACTIVE/MASTER_TASK_LIST.

Paste this as a single command to Cursor:
Use ACTION_PLAN_CURSOR.md as the only specification. Execute Packets 11–15 sequentially. For each packet: (1) open and read every file listed under “Files to inspect”, (2) perform only the “Exact edits to make” for that packet, (3) run the packet’s Validation steps, (4) STOP and summarize what changed and whether validation passed, then WAIT for my approval before continuing to the next packet. Do not skip packets, do not combine steps, and do not modify anything not explicitly listed in the current packet.


Single executable plan derived from [MASTER_TASK_LIST.md](MASTER_TASK_LIST.md).
One packet = one atomic, testable unit. Use Covers to trace back to original steps.


FILES FOR LATER.... STARTED 1-6

🛍 PHASE 3 — Product Compiler → JSON Screen
Packet 07 Command
Read ACTION_PLAN_CURSOR.md.


Execute PHASE 3 → Packet 07 only.


Create:
src/lib/products/products-to-screen.ts


Function:
productsToScreen(products, options)


Output must be valid offline screen JSON:
screenRoot → Section → Grid → Card[]


Use productToMoleculeNodes mapper.


Every leaf node must include children: [].


Validate by console logging generated JSON shape.


STOP after completion.



Packet 08 Command
Read ACTION_PLAN_CURSOR.md.


Execute PHASE 3 → Packet 08 only.


Enhance productsToScreen:
Add sorting option (price/name/custom)
Do not change output structure.


Validate sorted output.


STOP after completion.



🧹 PHASE 4 — Stop Product Loss Bug
Packet 09 Command
Read ACTION_PLAN_CURSOR.md.


Execute PHASE 4 → Packet 09 only.


Find dedupe/variant collapse logic in compiler.


Fix so unique products are never dropped.
Use stricter dedupe key: url + sku + name.


Remove any hidden cap on product count.


Validate:
If 7 products input → 7 products output.


STOP after completion.
