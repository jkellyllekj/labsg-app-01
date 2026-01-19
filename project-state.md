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

## ✅ Snapping Logic Overhaul (Jan 2026)

- All pool lengths (25m, 50m, 25yd, and non-standard sizes like 27m, 29m, 33m) now share the **same universal snapping logic**.
- All swim sets (warmup, build, drill, kick, main, cooldown) are **snapped to even multiples of poolLength**, ensuring swimmers always finish at the home wall.
- The generator allows small rounding up/down (e.g., 2484m instead of 2500m for a 27m pool), but always preserves lap logic.
- **Main and Drill sections preserve their assigned distance exactly** during generation and regeneration — no drift.
- Legacy fallback functions like `safeSimpleSetBody()` and soft-matching logic in `pickTemplate()` and `findBestFit()` have been disabled.
- **1x filler lines** (e.g., “1x50 easy”) are no longer generated under any condition.
- Snapping logic is now clean, unified, and validated across pool types.

> Note: The 27m test exposed one case of drill math drift (7x54 = 403), which was caused by regeneration fallback. This was fixed as part of this rewrite.


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

## Validation Rules (Snapping, Math, Effort)

The Agent must NEVER be trusted to validate correctness for:

- Pool math (snapping to 2×poolLength)
- Drill or Main set distance matching
- Effort logic realism or plausibility
- Coaching convention (e.g., set progression, pacing structure)

These must be tested manually by a human or verified through ChatGPT logic review.

The Agent may:
- Generate workouts or perform rerolls
- Report numeric totals and rep counts

The Agent # Project: Swim Workout Generator
Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-19  
Status: Active

---

## Current Focus
Phase: v1 Logic Stability and Constraint Engine

The current focus is to:
- Fix math regressions in conventional pools (25m, 50m, 25yd)
- Stabilize set and effort logic so outputs feel coach realistic
- Honor a consistent workout structure across all pool types
- Keep UI frozen (no visual redesigns or layout changes)

This phase completes when:
- All workouts follow the correct section sequence
- Every set ends at the same wall (even number of lengths)
- Effort patterns are plausible and varied
- Generator outputs are coach plausible on first try

---

## Architecture Overview
- The entire app runs from `index.js` (single file logic and UI).
- Styles are in `styles.css` (UI is frozen for now).
- Workouts are generated client side, using seeded randomness.
- The user selects pool length, total distance, and a few advanced options.
- Workouts are structured as a sequence of cards (Warm up, Drill, Main, etc.).

---

## Workflow
Git first workflow is now active for this project.
- GitHub is the source of truth.
- Replit Agent is execution only.
- ChatGPT reads files directly from GitHub via file links (blob with plain or raw links).
- After Agent changes: commit and push, then continue from the same GitHub links.

---

## Structure Goals (Workout Format)
Every workout should follow this high level section order:

1. Warm up  
Easy or very easy swimming only (effort blue or green). No build or sprint sets in warm up.

2. Build Set (when total distance allows)  
Treated as warm up part 2. Progressively builds intensity. Should ramp up or alternate effort. Can include yellow or orange, and very rarely red if warming up for sprints.

3. Kick and or Pull Set  
Typically comes before the Drill. Kick sets may include harder efforts (orange or red). Pull is optional based on user toggle.

4. Drill Set  
Technique focused, always low to moderate effort (blue, green, yellow max). Never red. Often short and simple, but should appear in most workouts at or above 1000m.

5. Main Set  
Highest intensity. Can include moderate to full gas efforts. Should sometimes include gradients (descends, builds, variable). Red level effort must appear in at least 60 to 70 percent of workouts.

6. Cool down  
Always low effort. No descending sets or surprises. Typically 100 to 300m in total.

Not every workout must include every section.  
But if the total is at or above 1000m:
- Build should appear
- Kick and Drill should appear
- Main and Cool down are always present

---

## Distance and Pool Length Rules
- Every set must end at the same wall it started. Each set distance must be divisible by 2 times poolLength (example 50m in a 25m pool, 100m in a 50m pool).
- The total workout may slightly overshoot the user request (example 3320m for a requested 3300m). This is allowed only if necessary to preserve even wall endings.
- This logic must apply equally across all pools, standard and custom.
- For custom pools, the generator should display (X lengths) after each set for clarity.
- No set should ever end on an odd number of pool lengths.

---

## Effort and Variety Rules
- Warm up and Cool down: only blue or green.
- Build: may ramp up from blue to yellow or orange. Red allowed very rarely.
- Drill: never red, usually blue or green.
- Kick: can include all zones, including red (example sprint kick).
- Main: may include yellow, orange, red. Often descends, builds, or varies effort.

Effort variety goals:
- At least one red set in 60 to 70 percent of workouts.
- Hard (orange) should appear alone, not only inside gradients.
- Gradients (descends, builds, etc.) target 30 percent of workouts.
- Avoid back to back gradients in every section. It should feel deliberate and varied.

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
- Removed `safeSimpleSetBody()` usage as a fallback during section build failure. Fallback now uses a single distance exact line based on section label.
- Fixed drill distance badge errors caused by parsing numbers inside drill list text. Drill cards now display the correct badge distance in tested cases.

---

## Current Known Issues
- Conventional pool snapping still needs validation across more totals, especially occasional total mismatch in 25m.
- Main set structure variation can repeat too often across rerolls.
- Some workouts can produce main sets that feel too continuous full gas for the workout length.

---

## Next Task
Fix conventional pool snapping and final total reconciliation.
- Ensure all sets in 25m, 50m, 25yd are passed through the same snap logic so every set ends at the same wall.
- Allow slight total overshoot only when required to preserve even wall endings.

---

## Validation Rules (Snapping, Math, Effort)
The Agent must not be trusted to validate correctness for:
- Pool math (snapping to 2 times poolLength)
- Drill or Main set distance matching
- Effort logic realism or plausibility
- Coaching convention (set progression, pacing structure)

These must be tested manually by a human or verified through ChatGPT logic review.

The Agent may:
- Generate workouts or perform rerolls
- Report numeric totals and rep counts

The Agent may not:
- Claim effort logic is realistic or varied
- Declare math is correct without visual confirmation
- Validate that sets are coach appropriate

All final validation and logic review is human only.
may not:
- Claim effort logic is “realistic” or “varied”
- Declare math is correct without visual confirmation
- Validate that sets are “coach-appropriate”

All final validation and logic review is human-only.
