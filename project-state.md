<!-- __START_FILE_PROJECT_STATE_PS000__ -->

# Project State

Project: Swim Workout Generator  
Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-08  
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
Repo and file truth overrides chat memory.

If anything here is unclear or stale, stop and update this file first.

<!-- __END_PS_READ_FIRST_PS010__ -->

---

<!-- __START_PS_CURRENT_PHASE_PS020__ -->

## Current Phase

**v1 Coach Plausibility plus Validity Hardening**

Purpose:
- Keep a minimal working app running in Replit
- Generate coach plausible workouts that feel human
- Keep pool valid structure, especially for custom pools
- Keep output parseable, so UI chips and reroll work reliably
- Add optional pacing and time estimates, without breaking basic mode

<!-- __END_PS_CURRENT_PHASE_PS020__ -->

---

<!-- __START_PS_FROZEN_PS030__ -->

## What is frozen

- No stack changes beyond current Replit v1 (single file Node and Express)
- No accounts, saving, sharing, library ingestion
- No season planner
- No multi sport expansion
- No paywall implementation yet, only design intent

<!-- __END_PS_FROZEN_PS030__ -->

---

<!-- __START_PS_ALLOWED_PS040__ -->

## What is allowed

- UI refinements inside `index.js` (still minimal)
- Prompt and contract refinements
- Add validity gates for pool correctness
- Add deterministic fallbacks where LLM can fail
- Add reroll logic, but it must never break generation
- Add optional advanced options UI, default stays basic
- Add temporary logging for debugging, remove when stable
- Update `project-state.md`, `decisions.md`, `working-method.md` as we proceed

<!-- __END_PS_ALLOWED_PS040__ -->

---

<!-- __START_PS_ACTIVE_FILES_PS050__ -->

## Active files

- `index.js` (authoritative runtime, UI plus API)
- `project-state.md` (this file)
- `decisions.md`
- `working-method.md`

Secrets:
- Replit Secret must exist: `OPENAI_API_KEY`

<!-- __END_PS_ACTIVE_FILES_PS050__ -->

---

<!-- __START_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->

## Current system snapshot (what works today)

App:
- Replit app runs and serves a minimal UI.

Inputs:
- Distance slider 500 to 10000, snaps to 100
- Pool buttons: 25m, 50m, 25yd, Custom
- Custom length enabled only when Custom selected
- Optional threshold pace per 100 input exists in UI
- Advanced options section exists as a collapsible area

Generation behaviour:
- Standard pools use OpenAI for structure and variety, then a validity gate runs
- Custom pools should be deterministic only for pool validity and speed

UI rendering:
- `workoutText` is parsed and rendered as set cards
- Each set card includes label, body, Dice reroll, and optional goal input stored locally
- Set cards are colour coded by set type
- Total section renders after all sets as chips

Intended UI chips:
- Right side chips per set should include distance, and if threshold pace is provided, an estimated time
- Total section chips should include pool, requested, total, total lengths if present, ends at start end if present

<!-- __END_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->

---

<!-- __START_PS_INVARIANTS_PS070__ -->

## Known constraints and invariants (must always be true)

Coach plausibility rules:
- Workouts should look like a real coach wrote them
- Warm up and cool down should exist by default
- Drill, Kick, Pull, Cool down are almost always single segment
- Warm up is one segment or two segments, not many
- Main can be one segment or two segments, more only when it is a clearly structured set
- Avoid weird non standard distances that feel unnatural in standard pools, prefer round numbers
- For large workouts, structure can expand, but it must still read like a coached session

Output parse contract:
- Each segment must use NxD format like 8x50, 4x100, 1x400
- Segment lines must remain parseable so the UI can compute distance chips and reroll distance targets
- Do not rely on free form comma number ladders for v1

Pool and validity rules:
- Pool length is explicit and first class
- Standard pools: 25m, 50m, 25yd
- Custom pools: any length in meters or yards
- Every set ends at the start end, and the full workout ends at the start end
- Standard pools must match requested total exactly
- Custom pools may choose nearest even length total when exact is impossible, and must label requested versus total

Timing rules:
- If threshold pace per 100 is provided, the UI should estimate set time and total time
- Rest defaults are allowed, but should be coach plausible and vary by intensity

<!-- __END_PS_INVARIANTS_PS070__ -->

---

<!-- __START_PS_OBSERVED_FAILURES_PS080__ -->

## Observed failures (authoritative)

Critical:
- Generation can fail with `buildOneSetBodyServer is not defined`
- Reroll frequently fails to produce a valid replacement set

Coach plausibility defects:
- Too many sub parts inside Drill, Kick, Pull, Cool down
- Warm up distances like 550, 625 appear in standard pools, which feels non human

UI defects:
- Right side chips sometimes missing because set distance parser fails when output is not strictly NxD
- Dice click can error when the set distance cannot be parsed, or when reroll returns invalid output

Custom pool risks:
- LLM arithmetic is not trusted for custom pools, deterministic generation is required

<!-- __END_PS_OBSERVED_FAILURES_PS080__ -->

---

<!-- __START_PS_NEXT_SINGLE_STEP_PS090__ -->

## Next single step

Fix the generation runtime error:

- In `index.js`, find any reference to `buildOneSetBodyServer`
- Ensure the called function exists in server scope, and the name matches exactly
- Replace the call or define the function, but do the smallest change possible
- Confirm Generate works end to end again before touching reroll or workout style

Proceed via one full block replacement only.

<!-- __END_PS_NEXT_SINGLE_STEP_PS090__ -->

<!-- __END_FILE_PROJECT_STATE_PS000__ -->
