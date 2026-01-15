# Project: Swim Workout Generator

Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-16  
Status: Active

---

## Current Focus

**Phase: v1 Logic Stability and Constraint Engine**

The current focus is to:
- Fix math regressions in conventional pools (25m, 50m, 25yd)
- Stabilize set and effort logic so outputs feel coach-realistic
- Honor a consistent workout structure across all pool types
- Keep UI frozen (no visual redesigns or layout changes)

This phase completes when:
- All workouts follow the correct section sequence
- Every set ends at the same wall (even number of lengths)
- Effort patterns are plausible and varied
- Generator outputs are coach-plausible on first try

---

## Architecture Overview

- The entire app runs from `index.js` (single file logic and UI).
- Styles are in `styles.css` (UI is frozen for now).
- Workouts are generated client-side, using seeded randomness.
- The user selects pool length, total distance, and a few advanced options.
- Workouts are structured as a sequence of “cards” (Warm-up, Drill, Main, etc.).

---

## Structure Goals (Workout Format)

Every workout should follow this high-level section order:

1. **Warm-up**  
   Easy or very easy swimming only (effort: blue or green). No build or sprint sets in warm-up.

2. **Build Set** (when total distance allows)  
   Treated as “warm-up part 2”. Progressively builds intensity. Should ramp up or alternate effort. Can include yellow or orange, and very rarely red if warming up for sprints.

3. **Kick and/or Pull Set**  
   Typically comes *before* the Drill. Kick sets may include harder efforts (orange or red). Pull is optional based on user toggle.

4. **Drill Set**  
   Technique-focused, always low to moderate effort (blue, green, yellow max). Never red. Often short and simple, but should appear in most workouts ≥ 1000m.

5. **Main Set**  
   Highest intensity. Can include moderate to full gas efforts. Should sometimes include gradients (descends, builds, variable). Red-level effort must appear in at least 60–70% of workouts.

6. **Cool-down**  
   Always low effort. No descending sets or surprises. Typically 100–300m in total.

Not every workout must include every section. But if the total is ≥ 1000m:
- Build should appear
- Kick and Drill should appear
- Main and Cool-down are always present

---

## Distance and Pool Length Rules

- **Every set must end at the same wall it started**: this means each set distance must be divisible by `2 × poolLength` (e.g. 50m in a 25m pool, 100m in a 50m pool).
- The **total workout** may slightly overshoot the user request (e.g. 3320m for a requested 3300m) — this is allowed *only* if necessary to preserve even-wall endings.
- This logic **must apply equally** across all pools — standard (25m, 50m, 25yd) and custom (e.g. 27m, 33m, etc.).
- For custom pools, the generator should display `(X lengths)` after each set for clarity.
- No set should ever end on an odd number of pool lengths.

---

## Effort and Variety Rules

- **Warm-up and Cool-down**: only blue/green (easy) efforts.
- **Build**: may ramp up from blue to yellow/orange. Red allowed very rarely.
- **Drill**: never red, usually blue/green. Should include recognizable drills.
- **Kick**: can include all zones, including red (e.g. sprint kick).
- **Main**: may include yellow, orange, red. Often descends, builds, or varies effort.

**Effort variety goals:**
- At least one red set in 60–70% of workouts.
- Hard (orange) should appear alone, not only inside gradients.
- Gradients (descends, builds, etc.): target 30% of workouts.
- Avoid back-to-back gradients in every section — it should feel deliberate and varied.

---

## Invariants

These must always hold:
- Every set must end at the starting wall.
- No UI layout changes during this phase.
- index.js is the only file with runtime logic.
- Each section card must render at full width, no outer wrappers.
- Generator must never return null or show “Reroll failed”.

---

## Recent Fixes

- Effort logic refactored to allow for gradient + single-intensity variation.
- Set snapping confirmed to work correctly in custom pools (e.g. 27m).
- Some template selection bugs corrected (templates now respect pool length).
- Section validation logic now respects min section length and avoids bad splits.

---

## Current Known Issues

- Standard pools (25m, 50m, 25yd) still allow some sets to end on odd number of lengths.
- Build section sometimes merged into Warm-up.
- Kick and Drill occasionally skipped in workouts between 1000–1500m.
- Effort variety remains too gradient-heavy. Needs more “hard only” or “sprint only” sets.
- Full Gas effort still underrepresented.
- Reroll rotation often reuses same templates too quickly.

---

## Working Method (summary)

- All edits happen in `index.js`
- One small, bounded change per step
- Agent must test each output in Replit
- UI is frozen — logic fixes only
- No full file rewrites unless explicitly needed
- Agent must update this file when fixing a listed issue

---

## Next Task

**Fix set snapping logic in conventional pools.**  
Ensure all sets, including Main, are passed through the same `snapSection()` logic so that every set ends at the same wall. No 350m/450m sets in a 50m pool.  
Allow slight total overshoot if needed, just like in custom pools.

