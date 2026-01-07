<!-- __START_FILE_PROJECT_STATE_PS000__ -->

# Project State

Project: Swim Workout Generator  
Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-06  
Status: **Authoritative**

---

<!--
============================================================================
BLOCK INDEX
PS010 — READ_FIRST
PS020 — CURRENT_PHASE
PS030 — FROZEN
PS040 — ALLOWED
PS050 — ACTIVE_FILES
PS060 — CURRENT_SYSTEM_SNAPSHOT
PS070 — INVARIANTS
PS080 — OBSERVED_FAILURES
PS090 — NEXT_SINGLE_STEP
============================================================================
-->

<!-- __START_PS_READ_FIRST_PS010__ -->

## If this is a new chat, read this first

This file is the sole source of truth for the current state of the project.  
Repo/file truth overrides chat memory.

If anything here is unclear or stale: **STOP and update this file first.**

<!-- __END_PS_READ_FIRST_PS010__ -->

---

<!-- __START_PS_CURRENT_PHASE_PS020__ -->

## Current Phase

**v1 Build + Validity Hardening**

Purpose:
- Keep a minimal working app running in Replit
- Generate workouts via OpenAI
- Enforce pool-valid structure (especially for non-standard pools)
- Prevent “nice-looking but wrong” workouts

<!-- __END_PS_CURRENT_PHASE_PS020__ -->

---

<!-- __START_PS_FROZEN_PS030__ -->

## What is frozen

- No stack decisions beyond current Replit v1 (no Expo/React Native decision yet)
- No accounts / saving / sharing
- No season planner
- No workout library ingestion
- No dice “reroll” work (parked)
- No multi-sport expansion

<!-- __END_PS_FROZEN_PS030__ -->

---

<!-- __START_PS_ALLOWED_PS040__ -->

## What is allowed

- UI refinements inside `index.js` (still minimal)
- Prompt contract refinements
- Add a code-level validity gate for pool correctness
- Add logging for debugging (temporary, removed when stable)
- Update `project-state.md` + `decisions.md` as we proceed

<!-- __END_PS_ALLOWED_PS040__ -->

---

<!-- __START_PS_ACTIVE_FILES_PS050__ -->

## Active files

- `index.js` (authoritative runtime: UI + API)
- `project-state.md` (this file)
- `decisions.md`
- `working-method.md`

Secrets:
- Replit Secret must exist: `OPENAI_API_KEY`

<!-- __END_PS_ACTIVE_FILES_PS050__ -->

---

<!-- __START_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->

## Current system snapshot (what works today)

- Replit app runs and serves a minimal UI.
- Distance input:
  - slider 500–10,000
  - snaps to 100
- Pool input:
  - buttons: 25m / 50m / 25yd / Custom
  - custom length enabled only when Custom selected

Generation behaviour (v1):
- **Standard pools (25m / 50m / 25yd):**
  - Uses OpenAI
  - Returns plain-text workout sets
  - No “(lengths)” annotations
- **Custom pools:**
  - Deterministic-only (no OpenAI)
  - Instant response
  - Always pool-valid
  - Includes per-set “(N lengths)” where needed
  - Includes footer metadata (total lengths, ends-at-start, total distance)

UI rendering:
- `workoutText` is parsed and rendered as **set cards**
- Each set renders as:
  - Section label (Warm up, Drill, Main, Kick, Cool down, etc.)
  - Set body text
  - Optional per-set goal input (stored locally in browser)
- Labels are normalised (e.g. “Drill set” → “Drill”, “Warm-up” → “Warm up”)
- Unlabelled lines are grouped under the previous labelled section

Totals:
- A **Total** section renders after all sets
- Total displays:
  - Total distance (meters or yards)
  - Total lengths (when computable)
  - Ends-at-start indicator (for custom pools)
- Totals are derived from deterministic footer lines or computed from set text

Known issue:
- Total footer chips intermittently revert to an older layout due to stale or partially updated UI render blocks.
  This requires verification of `ROUTE_HOME_UI_JS_RENDER_CORE_R161` and server restart discipline.

<!-- __END_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->



---

<!-- __START_PS_INVARIANTS_PS070__ -->

## Known constraints / invariants (must always be true)

Pool rules:
- Pool length is explicit and first-class
- Standard pools: 25m / 50m / 25yd
- Custom pools: any length in meters or yards

Validity rules:
- Every **SET** must finish on an even number of lengths
- Full workout must finish on an even number of lengths
- Standard pools must match total distance exactly
- Custom pools may be “close” (±100–200) only if required for symmetry/end-position

Display rules:
- Standard pools: use conventional notation (e.g. 10x100); no “(lengths)”
- Custom pools: include “(lengths)” only when needed for clarity

<!-- __END_PS_INVARIANTS_PS070__ -->

---

<!-- __START_PS_OBSERVED_FAILURES_PS080__ -->

## Observed failures (authoritative)

Previously:
- For custom pools, OpenAI output often contained inconsistent distance/length math (critical defect).
- Repair re-prompt still sometimes failed and introduced latency/hangs risk.

Resolved:
- Custom pools no longer rely on OpenAI; deterministic generation removes arithmetic failures and makes custom generation instant.

Remaining risks:
- Standard pools still call OpenAI; requests may occasionally stall without a timeout (to harden).

<!-- __END_PS_OBSERVED_FAILURES_PS080__ -->


---

<!-- __START_PS_NEXT_SINGLE_STEP_PS090__ -->

## Next single step

Stabilise the Total footer rendering:

- Verify the **exact contents** of:
  - `ROUTE_HOME_UI_JS_RENDER_CORE_R161`
  - `ROUTE_HOME_UI_JS_RENDER_CARDS_R162`
- Ensure the Total section shows **only totals**:
  - Total distance (m or yd)
  - Total lengths (when applicable)
  - Ends-at-start indicator (last item)
- Remove Pool / Requested from Total footer
- Confirm Replit is serving the latest `index.js` after changes

Proceed via **one full-block replacement only**.

<!-- __END_PS_NEXT_SINGLE_STEP_PS090__ -->



<!-- __END_FILE_PROJECT_STATE_PS000__ -->
