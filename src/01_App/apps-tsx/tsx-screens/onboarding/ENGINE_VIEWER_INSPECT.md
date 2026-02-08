# Engine Viewer + Engine Adapters + Flow Contract Inspection

**Date:** 2024  
**Purpose:** Precise inventory of current engine viewer, engine adapters, and flow contract used at runtime

---

## 1. ENGINE VIEWER TSX FILE

### Location
- **Exact Path:** `src/screens/tsx-screens/onboarding/engine-viewer.tsx`
- **Component Name:** `EngineViewer` (default export)

### Flow Loading Mechanism
- **Loader Function:** `loadFlow(flowId: string)` from `@/logic/content/flow-loader`
- **Flow Source:** 
  - API Route: `/api/flows/[flowId]` (GET)
  - API Route Implementation: `src/app/api/flows/[flowId]/route.ts`
  - Physical File Path: `src/logic/content/flows/{flowId}.json`
- **Flow Discovery:** 
  - Function: `getAvailableFlows()` from `@/logic/content/flow-loader`
  - API Route: `/api/flows/list` (GET)
  - API Route Implementation: `src/app/api/flows/list/route.ts`
  - Scans: `src/logic/content/flows/*.json`

### Engine Selection
- **Selection Method:** Dropdown UI selector
- **State Management:** 
  - URL Query Param: `?engine={engineId}`
  - Local State: `selectedEngineId` (default: `"learning"`)
  - Available Engines: Retrieved via `getAvailableEngines()` from `@/logic/engines/engine-registry`
- **Engine Application:**
  - Function: `applyEngine(flow, engineId)` from `@/logic/engines/engine-registry`
  - Context Setting: `setCurrentEngine(engineId)` to make engine available to `EducationCard`
  - Caching: Transformed flows cached via `setEngineFlow(flowId, engineId, transformedFlow)`

### Rendering Mechanism
- **Card Component:** `EducationCard` from `./cards/EducationCard`
- **Props Passed:**
  - `onAdvance: (step: number) => void`
  - `onComplete: (result: CardResult) => void`
  - `restoreState: CardState | null`
- **Flow Access:** `EducationCard` loads flow via `loadFlow(flowId)` which automatically uses current engine context

---

## 2. ENGINE REGISTRY

### Location
- **Exact Path:** `src/logic/engines/engine-registry.ts`

### Exports
- **Type:** `EngineId = "learning" | "calculator" | "abc" | "decision" | "summary"`
- **Type:** `EngineFunction = (flow: EducationFlow) => EngineFlow`
- **Constant:** `ENGINE_REGISTRY: Record<EngineId, EngineFunction>`
- **Function:** `getEngine(engineId: EngineId): EngineFunction` (throws if not found)
- **Function:** `applyEngine(flow: EducationFlow, engineId: EngineId): EngineFlow` (fallback to learning on error)
- **Function:** `getAvailableEngines(): EngineId[]`

### Registry Map
```typescript
{
  learning: learningEngine,
  calculator: calculatorEngine,
  abc: abcEngine,
  decision: decisionEngine,
  summary: summaryEngine
}
```

---

## 3. ENGINE ADAPTERS

### 3.1 Learning Engine
- **File:** `src/logic/engines/learning.engine.ts`
- **Export:** `learningEngine(flow: EducationFlow): EngineFlow`
- **Input Shape:** `EducationFlow` (from `@/logic/content/flow-loader`)
- **Output Shape:** `EngineFlow` (same as `EducationFlow`)
- **Transformation:** 
  - **Type:** Pass-through (no transformation)
  - **Behavior:** Preserves original step order and all properties
  - **Preserves:** `routing`, `calcRefs`, all step data

### 3.2 Calculator Engine
- **File:** `src/logic/engines/calculator.engine.ts`
- **Export:** `calculatorEngine(flow: EducationFlow): EngineFlow`
- **Input Shape:** `EducationFlow`
- **Output Shape:** `EngineFlow`
- **Transformation:**
  - **Type:** Reordering
  - **Logic:** 
    1. Identifies steps with calculation-relevant signals (signals containing "cost", "loss", or "time")
    2. Reorders: calculation-relevant steps first, then others
  - **Preserves:** All step data, `routing`, `calcRefs`

### 3.3 ABC Engine
- **File:** `src/logic/engines/abc.engine.ts`
- **Export:** `abcEngine(flow: EducationFlow): EngineFlow`
- **Input Shape:** `EducationFlow`
- **Output Shape:** `EngineFlow`
- **Transformation:**
  - **Type:** Sorting
  - **Logic:** Sorts steps alphabetically by `title` (case-insensitive)
  - **Preserves:** All step data, `routing`, `calcRefs`

### 3.4 Decision Engine
- **File:** `src/logic/engines/decision.engine.ts`
- **Export:** `decisionEngine(flow: EducationFlow): EngineFlow`
- **Input Shape:** `EducationFlow`
- **Output Shape:** `EngineFlow`
- **Transformation:**
  - **Type:** Reordering by severity and complexity
  - **Logic:**
    1. Finds highest severity in each step's choices (`outcome.severity`: "high"=3, "medium"=2, "low"=1)
    2. Sorts by: higher severity first, then by number of choices (more choices = more complex)
  - **Preserves:** All step data, `routing`, `calcRefs`

### 3.5 Summary Engine
- **File:** `src/logic/engines/summary.engine.ts`
- **Export:** `summaryEngine(flow: EducationFlow): EngineFlow`
- **Input Shape:** `EducationFlow`
- **Output Shape:** `EngineFlow`
- **Transformation:**
  - **Type:** Reordering by complexity
  - **Logic:**
    1. Separates steps: simple (1 choice) vs complex (>1 choice)
    2. Reorders: simple steps first, then complex steps
  - **Preserves:** All step data, `routing`, `calcRefs`

---

## 4. FLOW JSON CONTRACT

### Type Definition Location
- **File:** `src/logic/content/flow-loader.ts`
- **Type Name:** `EducationFlow`

### Contract Structure
```typescript
{
  id: string;
  title: string;
  steps: EducationStep[];
  routing?: {
    defaultNext?: "linear" | "conditional";
    rules?: Array<{
      when?: {
        signals?: string[];
        blockers?: string[];
        opportunities?: string[];
      };
      then: "skip" | "goto" | "repeat";
      skipTo?: string;
      gotoStep?: string;
    }>;
  };
  calcRefs?: Array<{
    id: string;
    inputs?: string[];
    output?: string;
  }>;
}
```

### Step Structure
```typescript
{
  id: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  choices: EducationChoice[];
}
```

### Choice Structure
```typescript
{
  id: string;
  label: string;
  kind: "understand" | "unsure" | "more" | "yes" | "no";
  outcome: EducationOutcome;
}
```

### Outcome Structure
```typescript
{
  signals: string[];
  blockers?: string[];
  opportunities?: string[];
  severity?: "low" | "medium" | "high";
  affects?: string[];
}
```

### Metadata Fields Status
- **Purpose:** ❌ Not present
- **Tags:** ❌ Not present
- **Weights:** ❌ Not present
- **ExportRole:** ❌ Not present
- **Other Metadata:** ❌ None found

### Runtime Expectations
- ✅ `steps[].choices[].outcome` is **required** and used
- ✅ `outcome.signals` is **required** (array)
- ✅ `outcome.blockers` is **optional** (array)
- ✅ `outcome.opportunities` is **optional** (array)
- ✅ `outcome.severity` is **optional** ("low" | "medium" | "high")
- ✅ `outcome.affects` is **optional** (array)

---

## 5. NEXT STEP COMPUTATION

### Location
- **File:** `src/logic/engines/flow-router.ts`
- **Function:** `resolveNextStep()`

### Function Signature
```typescript
resolveNextStep(
  flow: EducationFlow,
  currentStepIndex: number,
  accumulatedSignals: string[],
  accumulatedBlockers: string[],
  accumulatedOpportunities: string[]
): number | null
```

### Computation Logic
1. **Routing Config Check:**
   - If `flow.routing` is missing or `defaultNext === "linear"` → linear progression
   - Otherwise → signal-based routing

2. **Linear Progression:**
   - Returns `currentStepIndex + 1` if within bounds
   - Returns `null` if flow is complete

3. **Signal-Based Routing:**
   - Iterates through `flow.routing.rules[]`
   - For each rule, calls `evaluateRoutingRule()` to check if `when` conditions match:
     - Signals: ALL must be present in `accumulatedSignals`
     - Blockers: ANY must be present in `accumulatedBlockers`
     - Opportunities: ANY must be present in `accumulatedOpportunities`
   - If rule matches, calls `applyRoutingAction()`:
     - `"skip"` → finds step by `skipTo` ID, returns index
     - `"goto"` → finds step by `gotoStep` ID, returns index
     - `"repeat"` → finds step by `repeatStep` ID, returns index
   - If no rules match → falls back to linear progression

### Inputs Used
- **From Flow:** `flow.routing.defaultNext`, `flow.routing.rules[]`
- **From State:** 
  - `accumulatedSignals` (from all previous `outcome.signals`)
  - `accumulatedBlockers` (from all previous `outcome.blockers`)
  - `accumulatedOpportunities` (from all previous `outcome.opportunities`)
- **From Context:** `currentStepIndex`, `flow.steps[]`

### Call Site
- **File:** `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`
- **Function:** `handleChoice(choiceId: string)` (line ~238)
- **Accumulation Logic:**
  ```typescript
  const accumulatedSignals = updatedOutcomes.flatMap((o: any) => o.outcome?.signals ?? []);
  const accumulatedBlockers = updatedOutcomes.flatMap((o: any) => o.outcome?.blockers ?? []);
  const accumulatedOpportunities = updatedOutcomes.flatMap((o: any) => o.outcome?.opportunities ?? []);
  ```

---

## SUMMARY

### Key Findings
1. **Engine Viewer** loads flows from JSON files via API routes, applies engine transformations, and renders via `EducationCard`
2. **Engine Adapters** only transform step ordering/grouping; they preserve all content, IDs, and routing
3. **Flow Contract** expects `steps[].choices[].outcome` with `signals` (required) and optional `blockers`, `opportunities`, `severity`, `affects`
4. **Next Step Computation** uses `resolveNextStep()` which evaluates routing rules based on accumulated signals/blockers/opportunities
5. **No Metadata Fields** exist for purpose, tags, weights, or exportRole in the current contract

### Architecture Notes
- Engine transformations are **presentation-only** (ordering/grouping)
- All engines preserve `routing` and `calcRefs` properties
- Flow loading uses a context system (`setCurrentEngine`) to inject transformed flows
- Routing is content-driven and evaluated at runtime based on accumulated outcomes

---

## 6. ENGINE EXPLAIN TRACE (STEP 2 ADDITION)

### Location
- **Helper Module:** `src/logic/engines/engine-explain.ts`
- **Function:** `explainNextStep()`
- **Type:** `EngineExplainEvent`

### Explain Panel Location
- **UI Component:** Small panel above the card in `engine-viewer.tsx`
- **Position:** Between flow/engine selectors and the `EducationCard` component
- **Visibility:** Appears when a choice is clicked, can be closed with × button

### Explain Event Structure
```typescript
{
  currentStepId: string;
  choiceId: string;
  emitted: {
    signals: string[];
    blockers: string[];
    opportunities: string[];
  };
  routing: {
    mode: "linear" | "rule-matched";
    matchedRuleId?: string;
  };
  nextStepId: string | null;
}
```

### Manual Test Note
**Test Scenario:** Click a choice in the EducationCard

**Expected Output:**
1. Panel appears above the card with title "Why this next step?"
2. Shows 5 bullet points:
   - Current step: `{stepId}` (e.g., "profit-drain")
   - Selected choice: `{choiceId}` (e.g., "next")
   - Emitted: signals/blockers/opportunities arrays (or "none")
   - Routing: "linear" or "rule-matched (rule: rule_0)"
   - Next step: `{nextStepId}` or "complete"
3. Panel can be closed with × button
4. Panel clears when flow or engine changes

**Example Output for test-flow:**
- Current step: `profit-drain`
- Selected choice: `next`
- Emitted: `signals: [profit_drain]`
- Routing: `rule-matched (rule: rule_0)`
- Next step: `safety-trust`

---

## 7. PRESENTATION ENGINES (STEP 4 ADDITION)

### Presentation Model Contract
- **Type Definition:** `src/logic/engines/presentation-types.ts`
- **Structure:**
  ```typescript
  {
    engineId: string;
    title: string;
    stepOrder: string[]; // Step IDs in render order
    groups?: Array<{ id, title, stepIds: string[] }>;
    badges?: Record<string, string[]>; // stepId -> badge labels
    notes?: string[]; // 1-2 line engine notes
  }
  ```

### Engine Presentation Functions
- **learning:** `learningPresentation()` - Original order, notes: ["Linear learning path"]
- **abc:** `abcPresentation()` - Alphabetical by title, notes: ["Browse/reference ordering"]
- **calculator:** `calculatorPresentation()` - Input steps first, then calc-tagged/high-weight, badges: "INPUT"
- **decision:** `decisionPresentation()` - High-impact first (density/weight), badges: "HIGH IMPACT"
- **summary:** `summaryPresentation()` - Groups: "Key Points" (top 3), "Everything Else"

### Visual Changes Checklist
When switching engines, the following should change:

**Learning Engine:**
- ✅ Steps appear in original order
- ✅ Engine notes: "Linear learning path" shown at top
- ✅ No badges or groups

**ABC Engine:**
- ✅ Steps appear alphabetically by title
- ✅ Engine notes: "Browse/reference ordering" shown at top
- ✅ No badges or groups

**Calculator Engine:**
- ✅ Steps with `meta.purpose === "input"` appear first
- ✅ Steps tagged "calc" or weight >= 3 appear next
- ✅ Input steps show "INPUT" badge
- ✅ Engine notes: "Data collection and calculation focus"

**Decision Engine:**
- ✅ Steps with highest signal/blocker/opportunity density appear first
- ✅ Steps with weight >= 4 or purpose === "decide" show "HIGH IMPACT" badge
- ✅ Engine notes: "Decision points and high-impact choices prioritized"

**Summary Engine:**
- ✅ Steps grouped into "Key Points" (top 3 by weight+density) and "Everything Else"
- ✅ Group labels shown above current step
- ✅ Steps appear in group order (Key Points first, then Everything Else)
- ✅ Engine notes: "Key points highlighted, then full overview"

**Common Behavior:**
- ✅ Step content (title, body, choices) remains identical across engines
- ✅ Step IDs and choice IDs never change
- ✅ Routing behavior unchanged
- ✅ Only ordering, grouping, badges, and notes differ
