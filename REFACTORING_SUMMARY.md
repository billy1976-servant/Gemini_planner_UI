# Decision Engine Refactoring Summary

## ✅ Completed Changes

### 1. Created Decision Engine Structure
- **`src/logic/engines/decision-types.ts`**: Canonical DecisionState types
  - `DecisionState`: Aggregates signals, blockers, opportunities, context, outputs
  - `UIBlock`: Mobile-first immediate view blocks
  - `DocumentBlock`: Detailed export view blocks

- **`src/logic/engines/decision-engine.ts`**: Aggregation engine
  - `aggregateDecisionState()`: Converts outcomes → DecisionState
  - Extracts semantic signals from text
  - Builds immediateView and exportView

### 2. Multi-Business Support
- **`src/logic/config/business-profiles.ts`**: Business profile configurations
  - `BusinessProfile`: Defines signals, labels, explanations per business
  - `resolveBusinessProfile()`: Resolves profile from context
  - Example: `contractor-cleanup` profile (ready for more)

### 3. Export System
- **`src/logic/runtime/export-resolver.ts`**: Export generation
  - `resolveImmediateView()`: Mobile-first view blocks
  - `resolveExportView()`: Detailed printable blocks
  - `generateChecklist()`: Action checklist export
  - `generateContractorSummary()`: Contractor summary
  - `generateHomeownerActionPlan()`: Homeowner action plan

### 4. Updated Content Schema
- **`src/logic/content/education.flow.ts`**: Converted to semantic signals
  - Replaced `learned: string[]` → `signals: string[]`
  - Replaced `flags: string[]` → `blockers: string[]` and `opportunities: string[]`
  - Added `severity` and `affects` to outcomes
  - All outcomes now emit semantic tokens

### 5. Updated EducationCard
- **`src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`**:
  - Uses `aggregateDecisionState()` to create canonical output
  - Progress indicators derived from signals/blockers (not learned/flags)
  - Emits DecisionState instead of raw outcomes
  - Zero business logic - pure UI rendering

## 📁 Files Changed

### New Files
1. `src/logic/engines/decision-types.ts`
2. `src/logic/engines/decision-engine.ts`
3. `src/logic/config/business-profiles.ts`
4. `src/logic/runtime/export-resolver.ts`

### Modified Files
1. `src/logic/content/education.flow.ts` - Converted to semantic signals
2. `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` - Uses decision engine

## 🚀 How to Add a New Business (15 minutes)

1. **Create business profile** in `src/logic/config/business-profiles.ts`:
```typescript
"your-business": {
  id: "your-business",
  name: "Your Business Name",
  domain: "your-domain",
  signals: {
    your_signal: {
      label: "Your Signal Label",
      severity: "high",
      affects: ["impact1", "impact2"],
    },
  },
  exportSections: { ... },
  content: {
    labels: { your_signal: "Label text" },
    explanations: { your_signal: "Explanation text" },
  },
}
```

2. **Update education flow** in `src/logic/content/education.flow.ts`:
   - Modify steps, choices, outcomes
   - Use semantic signals (not learned/flags)
   - All text comes from content

3. **Set context** when initializing:
```typescript
writeEngineState({
  context: {
    businessType: "your-business",
    // ... other context
  }
});
```

That's it! No TSX changes needed.

## ✅ Zero Business Logic in TSX

**Confirmed**: EducationCard.tsx contains:
- ✅ Only rendering logic
- ✅ Only event wiring (onClick → handleChoice)
- ✅ Only UI state management
- ❌ No business rules
- ❌ No conditional logic based on business type
- ❌ No hard-coded text or labels
- ❌ No meaning inference

All business logic lives in:
- `decision-engine.ts` (aggregation)
- `education.flow.ts` (content)
- `business-profiles.ts` (config)

## 🧪 Success Test

Editing `src/logic/content/education.flow.ts` alone changes:
- ✅ Text (title, body, labels)
- ✅ Flow (add/remove steps)
- ✅ Images
- ✅ Choices
- ✅ Progress logic (signals/blockers determine ✓/✕/○)
- ✅ Completion behavior

Editing `src/logic/config/business-profiles.ts` alone changes:
- ✅ Business-specific labels
- ✅ Signal definitions
- ✅ Export sections
- ✅ Explanations

**No TSX changes required.**

## 📊 Decision State Structure

```typescript
DecisionState {
  signals: ["profit_drain", "safety_concern"],
  blockers: ["safety_trust_blocked"],
  opportunities: ["profit_drain_understood"],
  context: {
    businessType: "contractor-cleanup",
    // ... other context
  },
  outputs: {
    immediateView: [
      { type: "alert", severity: "high", title: "Blockers", items: [...] },
      { type: "opportunity", ... },
    ],
    exportView: [
      { type: "summary", title: "Decision Summary", ... },
      { type: "steps", ... },
      { type: "actions", ... },
    ],
  },
}
```

## 🔄 Next Steps (Optional)

1. Add more business profiles (ADU, remodel, guitar marketing, etc.)
2. Enhance signal extraction with NLP/pattern matching
3. Add PDF generation for exports
4. Create SummaryCard component that displays DecisionState
5. Add calculator outcomes to DecisionState aggregation

---

# Complete System Refactoring Summary

## 🎯 System Overview

The system has been refactored into a **strictly deterministic, JSON-driven decision engine** with zero business logic in TSX. All content, routing, and presentation logic is data-driven and can be swapped by changing JSON files.

## 📦 Major System Components

### 1. Decision Engine Architecture
- **Canonical DecisionState**: Single source of truth for all outcomes
- **Multi-business support**: Same engine serves different business types via profiles
- **Export system**: Generates checklists, summaries, and action plans
- **Semantic signals**: Replaced verbose text with machine-readable tokens

### 2. JSON-Driven Flow System
- **Flow loader**: Dynamic loading of JSON flow files via API routes
- **Engine viewer**: Dedicated screen to test flows in isolation
- **Multiple flows**: Switch between flows at runtime without code changes
- **Content-driven routing**: Engine decides next step based on accumulated signals

**Key Files:**
- `src/logic/content/flow-loader.ts` - Flow loading and caching
- `src/app/api/flows/[flowId]/route.ts` - API route for flow files
- `src/app/api/flows/list/route.ts` - API route to list available flows
- `src/screens/tsx-screens/onboarding/engine-viewer.tsx` - Flow testing interface

### 3. Logic Compiler
- **Blueprint parser**: Parses `blueprint.txt` for structure (steps, choices, routing)
- **Content parser**: Parses `content.txt` for text and metadata
- **Flow JSON output**: Emits `generated.flow.json` matching the Flow contract
- **Metadata support**: Optional meta fields for steps and choices (purpose, weight, tags, exportRole)

**Usage:**
```bash
npm run logic [folder-name]
```

**Key Files:**
- `src/scripts/logic/compile.ts` - Main compiler
- `src/screens/tsx-screens/generated/*/blueprint.txt` - Structure definitions
- `src/screens/tsx-screens/generated/*/content.txt` - Content and metadata
- `src/screens/tsx-screens/generated/*/generated.flow.json` - Compiled output

### 4. Presentation Engines
- **Five engine adapters**: Transform flow presentation without changing logic
  - `learning`: Original order, linear learning path
  - `abc`: Alphabetical by title, browse/reference ordering
  - `calculator`: Input steps first, then calc-tagged/high-weight, badges for input steps
  - `decision`: High-impact first (density/weight), badges for high-impact steps
  - `summary`: Groups "Key Points" (top 3) and "Everything Else"
- **PresentationModel contract**: Defines ordering, grouping, badges, and notes
- **Engine registry**: Central registry for all presentation engines

**Key Files:**
- `src/logic/engines/presentation-types.ts` - PresentationModel type
- `src/logic/engines/learning.engine.ts` - Default pass-through engine
- `src/logic/engines/abc.engine.ts` - Alphabetical sorting
- `src/logic/engines/calculator.engine.ts` - Calculation-focused ordering
- `src/logic/engines/decision.engine.ts` - Decision-focused ordering
- `src/logic/engines/summary.engine.ts` - Summary-focused grouping
- `src/logic/engines/engine-registry.ts` - Engine registry and helpers

### 5. Next-Step Reason System
- **NextStepReason type**: First-class deterministic output explaining routing decisions
- **Copy debug JSON**: Export reason object as JSON for debugging
- **Human-readable explanations**: Routing decisions explained in plain language
- **Context tracking**: Includes flow ID, engine ID, timestamps, and presentation order

**Key Files:**
- `src/logic/engines/next-step-reason.ts` - NextStepReason type and helpers
- `src/logic/engines/engine-explain.ts` - Routing explanation logic

### 6. Metadata Support
- **Step metadata**: `purpose`, `weight`, `tags`, `exportRole`
- **Choice metadata**: `weight`, `tags`
- **Compiler integration**: META blocks in `content.txt` parsed and emitted
- **Runtime support**: Metadata used by presentation engines for ordering and badges

**Syntax:**
```
[meta:1.0]
purpose=explain
weight=3
tags=profit,cost
exportRole=primary
```

## 🏗️ Architecture Principles

### ✅ Zero Business Logic in TSX
- All business rules live in JSON/content files
- TSX files are pure UI skins
- No hard-coded text, labels, or logic
- No meaning inference in components

### ✅ Deterministic Output
- Same input always produces same output
- No randomness, no async side effects
- Pure functions for all transformations
- Local state only (no persistence, no analytics)

### ✅ Content-Driven Everything
- Questions, choices, outcomes from JSON
- Routing rules from JSON
- Presentation ordering from engines
- Export formats from business profiles

### ✅ Multi-Business Support
- Same engine serves different business types
- Business profiles define signals, labels, exports
- No code changes needed to add new business
- Just swap JSON files

## 📊 Data Flow

```
blueprint.txt + content.txt
    ↓ (logic compiler)
generated.flow.json
    ↓ (flow loader)
EducationFlow
    ↓ (presentation engine)
PresentationModel + EngineFlow
    ↓ (EducationCard)
User interactions
    ↓ (engine-explain)
EngineExplainEvent
    ↓ (next-step-reason)
NextStepReason
    ↓ (decision-engine)
DecisionState
```

## 🎨 Key Features

1. **Flow Switching**: Change flows at runtime via dropdown
2. **Engine Switching**: Change presentation via engine selector
3. **Metadata-Driven**: Steps and choices can have optional metadata
4. **Routing Explanation**: "Why this next step?" panel with copy-to-clipboard
5. **Presentation Variants**: Same flow, different ordering/grouping/badges
6. **Compile-Time Safety**: TypeScript types ensure contract compliance
7. **Runtime Flexibility**: JSON changes take effect immediately

## 🚀 Adding a New Flow (5 minutes)

1. Create folder: `src/screens/tsx-screens/generated/my-flow/`
2. Add `blueprint.txt` with structure
3. Add `content.txt` with text and optional `[meta:*]` blocks
4. Run: `npm run logic my-flow`
5. Copy `generated.flow.json` to `src/logic/content/flows/my-flow.json`
6. Flow appears in engine viewer dropdown automatically

## 🚀 Adding a New Business (15 minutes)

1. Create business profile in `src/logic/config/business-profiles.ts`
2. Update flow content to use semantic signals
3. Set context when initializing: `{ businessType: "your-business" }`
4. No TSX changes needed

## 🚀 Adding a New Presentation Engine (10 minutes)

1. Create engine file: `src/logic/engines/my-engine.ts`
2. Export `myEngine()` and `myPresentation()` functions
3. Add to `ENGINE_REGISTRY` and `PRESENTATION_REGISTRY`
4. Engine appears in dropdown automatically

## ✅ Success Criteria

- ✅ Editing JSON alone changes flow, text, routing, and presentation
- ✅ No TSX changes needed to add new flows or businesses
- ✅ All business logic in JSON/content files
- ✅ Deterministic output (same input = same output)
- ✅ First-class debugging with NextStepReason export
- ✅ Multiple presentation variants of same flow
- ✅ Compile-time type safety
- ✅ Runtime flexibility

## 📁 Complete File Structure

```
src/
├── logic/
│   ├── engines/
│   │   ├── decision-engine.ts          # DecisionState aggregation
│   │   ├── decision-types.ts            # DecisionState types
│   │   ├── engine-explain.ts            # Routing explanations
│   │   ├── next-step-reason.ts          # First-class reason output
│   │   ├── presentation-types.ts        # PresentationModel contract
│   │   ├── learning.engine.ts            # Default engine
│   │   ├── abc.engine.ts                # Alphabetical engine
│   │   ├── calculator.engine.ts         # Calculator engine
│   │   ├── decision.engine.ts           # Decision engine
│   │   ├── summary.engine.ts            # Summary engine
│   │   ├── engine-registry.ts           # Engine registry
│   │   └── flow-router.ts               # Content-driven routing
│   ├── content/
│   │   ├── flow-loader.ts               # Flow loading
│   │   └── flows/                       # JSON flow files
│   ├── config/
│   │   └── business-profiles.ts         # Business configurations
│   └── runtime/
│       └── view-resolver.ts             # View resolution
├── scripts/
│   └── logic/
│       └── compile.ts                   # Logic compiler
├── screens/
│   └── tsx-screens/
│       ├── onboarding/
│       │   ├── engine-viewer.tsx        # Flow testing interface
│       │   └── cards/
│       │       └── EducationCard.tsx    # Pure UI skin
│       └── generated/                   # Compiled flows
│           └── */                       # Flow folders
│               ├── blueprint.txt        # Structure
│               ├── content.txt          # Content + metadata
│               └── generated.flow.json  # Compiled output
└── app/
    └── api/
        └── flows/
            ├── [flowId]/route.ts        # Flow API route
            └── list/route.ts            # Flow list API route
```

## 🎯 System Status: READY

The system is now a **complete, deterministic, JSON-driven decision engine** with:
- ✅ Zero business logic in TSX
- ✅ Multi-business support
- ✅ Multiple presentation engines
- ✅ Compile-time flow generation
- ✅ Runtime flow switching
- ✅ First-class debugging output
- ✅ Metadata-driven enhancements
- ✅ Content-driven routing

**All refactoring complete. System ready for production use.**
