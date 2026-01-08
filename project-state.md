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
PS025 — VISION
PS030 — FROZEN
PS040 — ALLOWED
PS050 — ACTIVE_FILES
PS060 — CURRENT_SYSTEM_SNAPSHOT
PS070 — INVARIANTS
PS080 — OBSERVED_FAILURES
PS090 — NEXT_SINGLE_STEP
PS100 — DECISIONS
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

<!-- __START_PS_VISION_PS025__ -->

## Vision

Design philosophy:
- Apple-style clean, sleek, modern UI (think 2012 simplicity)
- Mobile-first (people use it poolside on phones)
- Beautiful, intuitive, friendly, viewable

Platform targets (in order):
1. Web app (current)
2. Android
3. iOS

Future integrations:
- Watch sync (Apple Watch, Wear OS, Samsung)
- Print-friendly output

Monetization intent:
- Free tier: simple workouts, possibly with ads
- Premium tier: more strokes, equipment options, creativity slider, watch sync, saved workouts, advanced features

Far future features (frozen for v1):
- User accounts and saved workouts
- Season planning
- Multi-sport and triathlon
- Workout evaluation and adaptive training (Training Peaks territory)

<!-- __END_PS_VISION_PS025__ -->

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
- Update `project-state.md` and `WORKING-METHOD-REPLIT.md` as we proceed

<!-- __END_PS_ALLOWED_PS040__ -->

---

<!-- __START_PS_ACTIVE_FILES_PS050__ -->

## Active files

- `index.js` (authoritative runtime, UI plus API)
- `project-state.md` (this file, includes decisions)
- `WORKING-METHOD-REPLIT.md` (how we work together)

Reference only (not actively edited):
- `working-method.md` (original ChatGPT method, for historical reference)

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

Critical (FIXED 2026-01-08):
- ~~Generation can fail with `buildOneSetBodyServer is not defined`~~ FIXED: Removed duplicate nested routes that broke function scope
- ~~Home route never sent HTML response, page would not load~~ FIXED: Added proper HTML assembly and res.send()
- Reroll now works correctly

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

Tested 2026-01-08: Generation works but has quality issues.

Priority fixes:
1. Fix inconsistent generation quality (sometimes returns just "1x2000 easy" for a 2000m workout)
2. Fix coach plausibility: Drill, Kick, Pull, Cool down should be single segment
3. Fix custom pools: must end at start end, distance should match or be clearly labeled

After fixes:
- Improve set parsing for more reliable right-side chips in UI
- Style the UI to match the old Serpentine app (color-coded cards, left bar, faded backgrounds)

<!-- __END_PS_NEXT_SINGLE_STEP_PS090__ -->

---

<!-- __START_PS_DECISIONS_PS100__ -->

## Decisions

Decisions are dated and short. Only decisions that still matter.

### 2026-01-06 — v1 is a clean rebuild, not a refactor
We are building Swim Workout Generator v1 as a clean minimal app inside Replit, keeping the old prototype as reference only.

### 2026-01-06 — Secrets are environment only
OpenAI key must be stored as Replit Secret named `OPENAI_API_KEY`. Never hardcode keys into code or commits.

### 2026-01-06 — v1 UI input strategy
- Pool selection uses buttons: 25m, 50m, 25yd, Custom
- Distance uses a slider 500 to 10000 snapping to 100

### 2026-01-06 — Do not trust LLM arithmetic for custom pools
For custom pools, the model may output internally inconsistent distance and length math.

### 2026-01-06 — Custom pools are deterministic only in v1
To guarantee pool valid maths and speed, custom pool workouts are generated deterministically.

### 2026-01-07 — UI renders workouts as structured set cards
Workout output is rendered as set cards in the UI, not raw text:
- Each set has a label, body, Dice reroll, and optional per set goal
- Labels are normalised and grouped
- Totals render as a separate section at the end

This structure is considered v1 stable.

### 2026-01-08 — Coach plausibility rules are first class
- Warm up and cool down exist by default
- Drill, Kick, Pull, Cool down are almost always single segment
- Warm up is one or two segments
- Main is one or two segments, more only when it is clearly structured
- Avoid odd distances that feel non human in standard pools, prefer round numbers

### 2026-01-08 — Output must be parseable for UI and reroll
All segments must use NxD format so the UI can compute set distance and allow reroll.

### 2026-01-08 — Reroll must never fail
If AI reroll cannot produce a valid set, the system must fall back to a deterministic local replacement so Dice never returns an error.

### 2026-01-08 — Basic mode first, advanced options are optional
v1 must produce a good workout with zero configuration. Advanced options can exist, but must not degrade basic output.

<!-- __END_PS_DECISIONS_PS100__ -->

<!-- __END_FILE_PROJECT_STATE_PS000__ -->
