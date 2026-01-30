# Onboarding Blueprint Contract

## Purpose
This contract defines the minimum requirements for onboarding blueprint generation. All blueprints MUST meet these requirements or generation will fail.

## Minimum Structure Requirements

### A) Calculator Intake Section
- **Minimum: 8 questions**
- **Purpose**: Collect data needed for calculator inputs
- **Required Variables** (from calculator schemas):
  - crewSize (or equivalent)
  - minutesPerDay / cleanupMinutesPerDay (or equivalent)
  - wage / hourlyWage (or equivalent)
  - Additional variables as defined by calculator engine (25x, etc.)
- **Format**: Each question must be a Choice node under a Step node
- **Example IDs**: `1.1`, `1.2`, `1.3`, etc.

### B) Cost Variables Section
- **Minimum: 6 questions**
- **Purpose**: Understand cost drivers and pain points
- **Topics**: Labor costs, time waste, opportunity costs, hidden expenses
- **Format**: Step with multiple Choice nodes
- **Example IDs**: `2.1`, `2.2`, `2.3`, etc.

### C) Workflow/Process Diagnosis Section
- **Minimum: 8 questions**
- **Purpose**: Diagnose current workflow issues and inefficiencies
- **Topics**: Process bottlenecks, workflow interruptions, quality issues, team coordination
- **Format**: Step with multiple Choice nodes
- **Example IDs**: `3.1`, `3.2`, `3.3`, etc.

### D) Objections & Barriers Section
- **Minimum: 6 questions**
- **Purpose**: Identify barriers to adoption and common objections
- **Topics**: Budget concerns, implementation challenges, change resistance, competing priorities
- **Format**: Step with multiple Choice nodes
- **Example IDs**: `4.1`, `4.2`, `4.3`, etc.

### E) Education Section
- **Minimum: 5 questions/points**
- **Purpose**: Educate on value proposition and benefits
- **Topics**: ROI, best practices, industry insights, success stories
- **Format**: Step with Choice nodes for engagement
- **Example IDs**: `5.1`, `5.2`, `5.3`, etc.

### F) Summary + Next Step Section
- **Minimum: 3 choices/actions**
- **Purpose**: Provide clear next steps and CTAs
- **Format**: Step with multiple Choice nodes for different actions
- **Example IDs**: `6.1`, `6.2`, `6.3`

## Total Minimum Node Count
- **Minimum: 30 total nodes** (Steps + Choices combined)
- This ensures sufficient depth for meaningful onboarding

## ID Requirements
- Every Step MUST have a unique ID in format: `{number}.0` (e.g., `1.0`, `2.0`)
- Every Choice MUST have a unique ID in format: `{parent}.{number}` (e.g., `1.1`, `1.2`)
- All IDs must be sequential and properly nested

## Link Target Requirements
- Every Choice that routes to another Step MUST have a `->` target
- Target format: `-> {stepId}` (e.g., `-> 2.0`)
- At least one path must lead to Summary section

## Diagnostic Engine Requirements

### Variable Extraction
- **Minimum: 5 variables** must be captured from questions
- Each variable must have: `var=`, `type=`, `unit=` (where applicable)
- Variables must map to calculator inputs and diagnostic metrics

### Derived Metrics
- **Minimum: 3 derived metrics** must be calculated
- Metrics must use formulas based on captured variables
- Metrics step must be marked as `System` type (not user-visible)

### Conditional Routing
- **Minimum: 3 conditional routing branches** based on metrics
- Routing must use `condition:` syntax with metric comparisons
- At least 3 different paths based on metric thresholds

### Result Assembly
- **Result Assembly step** must exist (marked as `System` type)
- Must include: primaryProblem, metrics array, recommendations, confidenceScore

### Export Metadata
- **Export block** must exist with `[exports]` section
- Must list metrics and chartTypes for visualization

## Validation Rules
1. Count all nodes (Steps + Choices)
2. Verify each required section has minimum question count
3. Verify all IDs are unique and properly formatted
4. Verify all routing targets exist
5. Verify at least 5 variables are captured
6. Verify at least 3 derived metrics exist
7. Verify at least 3 conditional routing branches exist
8. Verify Result Assembly step exists
9. Verify Export block exists
10. If any requirement fails, generation MUST fail with clear error message

## Grounding Requirements
- Blueprint MUST be grounded in:
  - Calculator schema inputs (from cleanup.logic.json, 25x-cleanup-flow.json, etc.)
  - Site products/services (from report.final.json)
  - Value model insights (from value.model.json)
  - Industry-specific questions (from site content)

## Example Valid Structure
```
0.0 | Onboarding Flow | Flow

1.0 | Calculator Intake | Step
  1.1 | Question 1 | Choice -> 1.2
  1.2 | Question 2 | Choice -> 1.3
  ... (8+ questions total)

2.0 | Cost Variables | Step
  2.1 | Cost Question 1 | Choice -> 2.2
  ... (6+ questions total)

3.0 | Workflow Diagnosis | Step
  ... (8+ questions total)

4.0 | Objections & Barriers | Step
  ... (6+ questions total)

5.0 | Education | Step
  ... (5+ points total)

6.0 | Summary & Next Steps | Step
  6.1 | Action 1 | Choice
  6.2 | Action 2 | Choice
  6.3 | Action 3 | Choice
```
