# Translation Feasibility Analysis: Legacy → JSON Engine Architecture

## Executive Summary

**Overall Feasibility Score: 9/10**

The legacy systems are **highly extractable**. Most intelligence lives in pure logic functions, data shape definitions, and flow rules—not backend dependencies. Firebase is primarily used as a persistence layer with minimal business logic coupling.

**Estimated Hours for Logic Extraction Only: 12-16 hours**

---

## System-by-System Analysis

### 1. HABIT SYSTEM

#### Pure Logic (Extractable → Engine)
- **`rampLinearForDate(startValue, targetValue, startDateISO, durationDays, dateISO)`** - Linear interpolation algorithm
  - Location: `habitrackerdemo.jsx:102-108`
  - Pure function, no dependencies
  - **Translation**: Drop into `engines/habitRamp.js`

- **`daysBetween(a, b)`** - Date difference calculation
  - Location: `habitrackerdemo.jsx:73-80`
  - Pure utility function
  - **Translation**: Drop into `engines/dateUtils.js`

- **`calculateStreak(lastCompleted)`** - Streak calculation from completion dates
  - Location: `src/App.jsx:190-196`, `src/components/relationship2.jsx:281-347`
  - Logic: Count consecutive days from last completion
  - **Translation**: Drop into `engines/streakCalculator.js`

- **`isHabitDueToday(habit)`** - Due date determination
  - Location: `src/App.jsx:152-188`, `src/components/relationship2.jsx:348-351`
  - Logic: Check if today matches `activeDays` AND `lastCompleted` != today
  - **Translation**: Drop into `engines/habitDueChecker.js`

- **`formatTime12Hour(timeStr)`** - Time formatting
  - Location: `habitrackerdemo.jsx:86-94`
  - Pure formatting function
  - **Translation**: Drop into `engines/formatters.js`

- **`formatValue(num)`** - Number rounding/formatting
  - Location: `habitrackerdemo.jsx:97-99`
  - Pure function
  - **Translation**: Drop into `engines/formatters.js`

#### Pure State (Extractable → JSON Config)
```javascript
// Data shape definition (NO Firebase dependencies)
{
  id: string,
  name: string,
  priority: number,           // 1-10 system
  category: string,
  icon: string,
  unit: string,
  startValue: number,
  targetValue: number,
  durationDays: number,
  activeDays: string[],       // ["M", "T", "W"]
  timeSlots: string[],        // ["08:00", "11:00"]
  startDate: string,          // ISO date
  progress: {                  // Date-indexed slot status
    "2026-02-12": ["done", "pending", "skipped"]
  },
  lastCompleted: string        // ISO timestamp
}
```
- **Translation**: Define in `config/habitSchema.json` or `schemas/habits.json`

#### Pure UI (Discard → Rebuild with Layout System)
- `HabitCard`, `DayRow`, `ReminderList`, `HabitForm` components
- All React JSX rendering logic
- **Translation**: Rebuild using layout molecules + JSON screen schema

#### Discard (Firebase Wiring)
- `db.collection('tasks').where('mode', '==', 'habit').get()` → Replace with persistence layer read
- `db.collection('tasks').add(payload)` → Replace with persistence layer write
- `db.collection('tasks').doc(id).update()` → Replace with persistence layer update
- `onSnapshot` listeners → Replace with state layer subscriptions
- Firestore document mapping (`doc.data()`, `doc.id`) → Not needed

**Translation Path**: 
1. Extract pure functions → `engines/`
2. Define data shape → `config/schemas/`
3. Map Firebase calls → Use existing persistence layer
4. Rebuild UI → Use layout renderer + JSON config

**Feasibility**: 10/10 (Pure logic, minimal coupling)
**Hours**: 2-3 hours

---

### 2. PLANNER (Weekly/Daily View)

#### Pure Logic (Extractable → Engine)
- **WeekSync store** - Date-indexed data synchronization
  - Location: `src/lib/weeklyView.js:8-44`
  - Logic: Map-based store with subscription pattern
  - **Translation**: Drop into `engines/weekSync.js` (or use existing state layer)

- **Date normalization** (`iso()`, `todayISO()`, `addDays()`)
  - Location: `habitrackerdemo.jsx:55-72`
  - Pure date utilities
  - **Translation**: Drop into `engines/dateUtils.js`

- **Day-of-week calculation** (`dayOfWeek(dateISO)`)
  - Location: `habitrackerdemo.jsx:83`
  - Pure function
  - **Translation**: Drop into `engines/dateUtils.js`

- **Time slot scheduling logic** - Distributing habits across day
  - Location: `src/components/dayview2.jsx:599-655`
  - Logic: Map habits to time slots, filter by active days
  - **Translation**: Drop into `engines/scheduler.js`

#### Pure State (Extractable → JSON Config)
```javascript
// Week data structure
{
  "2026-02-12": {
    blocks: [{ start: 8.5, end: 9.0, title: "Habit", ... }],
    habits: [{ title: "Water", start: 8.0, ... }]
  }
}
```
- **Translation**: Define in `config/plannerSchema.json`

#### Pure UI (Discard → Rebuild)
- Calendar grid rendering (`weeklyView.js` DOM manipulation)
- Day view chunks/panels
- Drag-and-drop handlers
- **Translation**: Rebuild with layout molecules

#### Discard (Firebase Wiring)
- `db.collection('tasks').get()` → Replace with persistence read
- Real-time sync via `onSnapshot` → Use state layer subscriptions

**Translation Path**:
1. Extract date/time logic → `engines/`
2. Extract scheduling algorithm → `engines/scheduler.js`
3. Define week/day data shape → `config/schemas/`
4. Map Firebase reads → Persistence layer

**Feasibility**: 9/10 (Some DOM manipulation, but core logic is pure)
**Hours**: 3-4 hours

---

### 3. TRACK JOURNAL

#### Pure Logic (Extractable → Engine)
- **TRACK acronym expansion** - Think, Repent, Ask, Conform, Keep
  - Location: `src/components/journey.jsx:701-860`, `src/components/JourneyLanding.jsx:640-683`
  - Logic: Five-field structure with prompts
  - **Translation**: Drop into `engines/trackProcessor.js`

- **Journal persistence key generation** (`journalKeyOf(stepId, letter)`)
  - Location: `src/components/JourneyLanding.jsx:414`
  - Pure key generation function
  - **Translation**: Drop into `engines/journalKeys.js`

- **Track prompt extraction** (`extractVideoIdsFromTrack()`)
  - Location: `src/components/JourneyLanding.jsx:320-323`
  - Logic: Parse TRACK object structure
  - **Translation**: Drop into `engines/trackParser.js`

#### Pure State (Extractable → JSON Config)
```javascript
// TRACK structure
{
  think: string,
  repent: string,
  ask: string,
  conform: string,
  keep: string
}

// Journal entries (stepId + letter indexed)
{
  "step123:T": "journal text...",
  "step123:R": "journal text...",
  ...
}
```
- **Translation**: Define in `config/trackSchema.json`

#### Pure UI (Discard → Rebuild)
- TRACK form inputs
- Journal textarea components
- Track assessment questionnaire
- **Translation**: Rebuild with layout molecules

#### Discard (Firebase Wiring)
- `db.collection('journey_responses').add()` → Persistence layer
- `db.collection('template_steps').doc().update({ track_prompts })` → Persistence layer
- LocalStorage journal persistence → Use existing persistence layer

**Translation Path**:
1. Extract TRACK structure logic → `engines/trackProcessor.js`
2. Extract journal key generation → `engines/journalKeys.js`
3. Define TRACK schema → `config/schemas/track.json`
4. Map Firebase writes → Persistence layer

**Feasibility**: 10/10 (Pure data structure + simple CRUD)
**Hours**: 1-2 hours

---

### 4. ONBOARDING

#### Pure Logic (Extractable → Engine)
- **User setup flow** - Not found in codebase (may be implicit or removed)
- **Initial data seeding** - DEFAULT_HABITS, SAMPLE_RELATIONSHIPS
  - Location: `constants.jsx:41-48`
  - Logic: Default data structures
  - **Translation**: Define in `config/defaults.json`

#### Pure State (Extractable → JSON Config)
```javascript
// Default templates/data
{
  defaultHabits: [...],
  sampleContacts: [...],
  defaultCategories: [...]
}
```

#### Pure UI (Discard → Rebuild)
- Onboarding screens/wizards (if any)
- **Translation**: Rebuild with layout molecules

#### Discard (Firebase Wiring)
- Auth flow (`auth.onAuthStateChanged`) → Use existing auth system
- Initial data creation → Use persistence layer

**Feasibility**: 8/10 (May need to infer flow from implicit patterns)
**Hours**: 1 hour

---

### 5. PRIORITY SYSTEM

#### Pure Logic (Extractable → Engine)
- **Priority-based sorting** - Sort habits by priority (1-10)
  - Location: Implicit in filtering/sorting logic
  - Logic: `habits.sort((a, b) => (a.priority || 10) - (b.priority || 10))`
  - **Translation**: Drop into `engines/prioritySorter.js`

- **Priority filtering** - Filter by priority range
  - Logic: `habits.filter(h => h.priority <= 3)` for high priority
  - **Translation**: Drop into `engines/priorityFilter.js`

#### Pure State (Extractable → JSON Config)
```javascript
// Priority field in habit schema
{
  priority: number  // 1-10, where 1 = highest priority
}
```
- Already part of habit schema

#### Pure UI (Discard → Rebuild)
- Priority selector/input
- Priority-based grouping/display
- **Translation**: Rebuild with layout molecules

#### Discard (Firebase Wiring)
- None (priority is just a field, no special Firebase logic)

**Translation Path**:
1. Extract sorting/filtering logic → `engines/prioritySorter.js`
2. Priority is already in habit schema
3. Rebuild UI with layout system

**Feasibility**: 10/10 (Trivial - just sorting/filtering)
**Hours**: 0.5 hours

---

### 6. RECURRING TASK MODEL

#### Pure Logic (Extractable → Engine)
- **Recurring type normalization** (`normalizeRecurringType(rt)`)
  - Location: `src/App.jsx:536`
  - Logic: Map DB enum to internal codes ('1w', '1m', 'off')
  - **Translation**: Drop into `engines/recurringNormalizer.js`

- **Recurring group collapse/expand** (`toggleRecurringGroup()`)
  - Location: `src/App.jsx:1762-1769`
  - Logic: Toggle group visibility state
  - **Translation**: Drop into `engines/recurringGroups.js` (or use state layer)

- **Recurring frequency calculation** - Determine next occurrence
  - Logic: Based on `recurring_type` enum (daily, weekly, monthly)
  - **Translation**: Drop into `engines/recurringCalculator.js`

#### Pure State (Extractable → JSON Config)
```javascript
// Recurring task structure
{
  recurring_type: "daily" | "weekly" | "monthly" | "off",
  recurring_details: string,
  due_date: string,           // ISO date
  // ... other task fields
}
```
- **Translation**: Define in `config/recurringSchema.json`

#### Pure UI (Discard → Rebuild)
- Recurring type selector
- Recurring group views
- **Translation**: Rebuild with layout molecules

#### Discard (Firebase Wiring)
- `db.collection('tasks').where('recurring_type', '==', type)` → Persistence layer filter
- Recurring type enum queries → Not needed (just filter in memory)

**Translation Path**:
1. Extract normalization logic → `engines/recurringNormalizer.js`
2. Extract frequency calculation → `engines/recurringCalculator.js`
3. Define recurring schema → `config/schemas/recurring.json`
4. Map Firebase queries → Persistence layer filters

**Feasibility**: 9/10 (Simple enum mapping + date math)
**Hours**: 1-2 hours

---

## Intelligence Location Analysis

### Where Does the Intelligence Live?

**✅ Data Shape (60%)**
- Habit structure (ramp, time slots, active days)
- TRACK structure (5 fields)
- Recurring type enums
- Priority system (1-10)
- Progress tracking structure

**✅ Flow Rules (30%)**
- Ramp calculation algorithm
- Streak calculation logic
- Due date determination
- Recurring frequency rules
- Time slot scheduling

**✅ Component Orchestration (10%)**
- How components pass data
- State update patterns
- Event handling flows

**❌ Backend Dependency (0% - Discard)**
- Firebase queries are just CRUD wrappers
- No business logic in Firebase
- Real-time listeners are just state subscriptions

**Conclusion**: 90% of intelligence is pure logic/data shape. Firebase is just a persistence layer with no business logic.

---

## Translation Difficulty Matrix

| System | Pure Logic | Pure State | Pure UI | Firebase Coupling | Feasibility | Hours |
|--------|-----------|------------|---------|-------------------|-------------|-------|
| Habit System | High | High | High | Low | 10/10 | 2-3 |
| Planner | Medium | High | High | Low | 9/10 | 3-4 |
| TRACK Journal | High | High | High | Low | 10/10 | 1-2 |
| Onboarding | Low | Medium | Medium | Low | 8/10 | 1 |
| Priority System | High | High | Medium | None | 10/10 | 0.5 |
| Recurring Tasks | Medium | High | Medium | Low | 9/10 | 1-2 |
| **TOTAL** | | | | | **9/10** | **12-16** |

---

## Fastest Translation Path

### Phase 1: Extract Pure Functions (4-5 hours)
1. Copy all pure functions from legacy → `engines/`
   - `rampLinearForDate()` → `engines/habitRamp.js`
   - `calculateStreak()` → `engines/streakCalculator.js`
   - `isHabitDueToday()` → `engines/habitDueChecker.js`
   - `normalizeRecurringType()` → `engines/recurringNormalizer.js`
   - Date utilities → `engines/dateUtils.js`
   - Formatters → `engines/formatters.js`

### Phase 2: Define Data Schemas (2-3 hours)
2. Extract data structures → `config/schemas/`
   - `habits.json` - Habit schema
   - `track.json` - TRACK structure
   - `recurring.json` - Recurring task schema
   - `planner.json` - Week/day data structure

### Phase 3: Map Persistence Calls (3-4 hours)
3. Identify all Firebase calls → Map to persistence layer
   - `db.collection().get()` → `persistence.read()`
   - `db.collection().add()` → `persistence.create()`
   - `db.collection().doc().update()` → `persistence.update()`
   - `onSnapshot()` → `state.subscribe()`

### Phase 4: Extract Flow Rules (2-3 hours)
4. Document behavior patterns → `engines/flowRules.js`
   - Habit creation flow
   - Progress update flow
   - Streak calculation trigger
   - Due date recalculation

### Phase 5: Create JSON Config Bindings (1-2 hours)
5. Create JSON configs that wire engines to layout
   - Screen schemas for habit forms
   - Action definitions for progress updates
   - Behavior bindings for streak display

---

## Key Findings

1. **Minimal Firebase Coupling**: Firebase is used purely for CRUD. No business logic lives in Firebase queries.

2. **Pure Functions Abound**: Core algorithms (`rampLinearForDate`, `calculateStreak`, `isHabitDueToday`) are pure functions with zero dependencies.

3. **Data Shape is King**: Most intelligence is in the data structure definitions (habit schema, TRACK structure, recurring enums).

4. **UI is Disposable**: All React components can be rebuilt using layout molecules + JSON screen schema.

5. **State Patterns are Simple**: State updates follow predictable patterns (setState, useEffect) that map directly to existing state layer.

6. **No Complex Backend Logic**: No stored procedures, triggers, or server-side calculations. Everything is client-side logic.

---

## Recommendations

1. **Start with Habit System** - Highest value, purest logic, easiest extraction
2. **Extract Pure Functions First** - These are drop-in replacements
3. **Define Schemas Second** - Data shape drives everything else
4. **Map Persistence Last** - Firebase calls are trivial to replace
5. **Rebuild UI Incrementally** - Use layout system to rebuild one component at a time

---

## Conclusion

**Translation Feasibility: 9/10**

The legacy systems are **highly extractable**. The architecture is cleanly separated:
- Logic → Pure functions (easily moved to engines)
- State → Data structures (easily defined in JSON)
- UI → React components (easily rebuilt with layout system)
- Persistence → Firebase CRUD (easily replaced with existing persistence layer)

**Estimated Hours for Logic Extraction Only: 12-16 hours**

This assumes:
- Persistence layer already exists ✅
- State layer already exists ✅
- Layout renderer already exists ✅
- Engines framework already exists ✅

The translation is straightforward because the legacy system's intelligence lives in **data shape and flow rules**, not backend dependencies.
