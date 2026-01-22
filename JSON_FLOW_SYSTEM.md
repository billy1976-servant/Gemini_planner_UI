# JSON Flow System - Implementation Summary

## ✅ Completed Implementation

### 1. JSON Flow Files Created
- **`src/logic/content/flows/flow-a.json`**: Original "Why This Matters" flow (3 steps)
- **`src/logic/content/flows/flow-b.json`**: "Project Planning Essentials" flow (3 steps)
- **`src/logic/content/flows/flow-c.json`**: "Client Communication" flow (2 steps)

All flows follow the same schema:
```json
{
  "id": "flow-id",
  "title": "Flow Title",
  "steps": [
    {
      "id": "step-id",
      "title": "Step Title",
      "body": "Step body text",
      "image": "url",
      "imageAlt": "alt text",
      "choices": [
        {
          "id": "choice-id",
          "label": "Button Label",
          "kind": "understand|unsure|more|yes|no",
          "outcome": {
            "signals": ["signal1", "signal2"],
            "blockers": ["blocker1"],
            "opportunities": ["opp1"],
            "severity": "low|medium|high",
            "affects": ["impact1", "impact2"]
          }
        }
      ]
    }
  ]
}
```

### 2. Flow Loader System
- **`src/logic/content/flow-loader.ts`**: 
  - `loadFlow(flowId)`: Async loader for JSON flows
  - `getAvailableFlows()`: Returns list of available flows
  - `registerFlow()`: Dynamic flow registration
  - Caching for performance

### 3. API Route
- **`src/app/api/flows/[flowId]/route.ts`**: 
  - Serves JSON flow files
  - Security: Only allows alphanumeric + hyphens
  - Cache-busting headers
  - Error handling

### 4. Flow Selector
- **EducationCard.tsx**: 
  - Dropdown selector at top of card
  - Reads `?flow=flow-id` from URL
  - Updates URL on change
  - State reinitializes cleanly when flow changes

### 5. State Management
- Flow switching:
  - Resets step index to 0
  - Clears outcomes and results
  - Tracks `currentFlowId` to prevent cross-flow state pollution
  - Clean slate for each flow

## 📁 Files Changed

### New Files
1. `src/logic/content/flows/flow-a.json`
2. `src/logic/content/flows/flow-b.json`
3. `src/logic/content/flows/flow-c.json`
4. `src/logic/content/flow-loader.ts`
5. `src/app/api/flows/[flowId]/route.ts`

### Modified Files
1. `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`
   - Uses `loadFlow()` instead of `resolveEducationFlow()`
   - Reads flowId from query param
   - Adds flow selector dropdown
   - Reinitializes state on flow change

## 🚀 How to Add a New Business Flow (Zero TSX Changes)

1. **Create JSON file** in `src/logic/content/flows/`:
   - Name: `your-business.json`
   - Follow the schema above
   - Define steps, choices, outcomes

2. **Register flow** in `src/logic/content/flow-loader.ts`:
   ```typescript
   const FLOW_REGISTRY: Record<string, string> = {
     // ... existing flows
     "your-business": "your-business",
   };
   ```

3. **Done!** The flow appears in the dropdown automatically.

**No TSX changes required.**

## ✅ Success Criteria Met

- ✅ 100% JSON-driven (no hard-coded content in TSX)
- ✅ Multiple selectable flows (flow-a, flow-b, flow-c)
- ✅ Selector mechanism (dropdown + query param)
- ✅ State reinitializes cleanly on flow switch
- ✅ Same engine + renderer (decision-engine, export-resolver)
- ✅ Zero TSX changes per new flow
- ✅ All content from JSON (questions, choices, signals, outcomes)

## 🧪 Testing

1. **Switch flows**: Use dropdown to switch between flow-a, flow-b, flow-c
2. **Verify state reset**: Each flow starts at step 0 with clean state
3. **Verify content**: All text, images, choices come from JSON
4. **Add new flow**: Drop in new JSON file, register it, it works immediately

## 📊 Flow Schema

All flows must have:
- `id`: Unique identifier
- `title`: Display title
- `steps[]`: Array of steps
  - Each step: `id`, `title`, `body`, `image?`, `imageAlt?`, `choices[]`
  - Each choice: `id`, `label`, `kind`, `outcome`
  - Each outcome: `signals[]`, `blockers?[]`, `opportunities?[]`, `severity?`, `affects?[]`
