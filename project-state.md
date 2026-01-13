<!-- __START_FILE_PROJECT_STATE_PS000__ -->

# Project State

Project: Swim Workout Generator  
Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-13  
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
PS090 — RECENT_FIXES
PS100 — NEXT_SINGLE_STEP
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
- Generate plausible swim workouts via OpenAI
- Stabilise UI behaviours before adding features

Non-goals:
- No refactors for cleanliness
- No new UI features
- No architectural changes

<!-- __END_PS_CURRENT_PHASE_PS020__ -->

---

<!-- __START_PS_FROZEN_PS030__ -->

## Frozen

- Overall UI layout and colour palette
- Two-layer background crossfade system
- Random background selection on page load
- index.js as the only runtime file

<!-- __END_PS_FROZEN_PS030__ -->

---

<!-- __START_PS_ALLOWED_PS040__ -->

## Allowed

- One-line or single-function bug fixes
- Defensive fixes that preserve current behaviour
- Small state correctness fixes
- Documentation updates reflecting completed fixes

<!-- __END_PS_ALLOWED_PS040__ -->

---

<!-- __START_PS_ACTIVE_FILES_PS050__ -->

## Active Files

- `index.js` — sole runtime and UI logic
- `project-state.md` — authoritative state
- `WORKING-METHOD-REPLIT.md` — working rules

<!-- __END_PS_ACTIVE_FILES_PS050__ -->

---

<!-- __START_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->

## Current System Snapshot

- UI renders correctly
- Background images:
  - Randomised on page load
  - Two-layer crossfade (`bgA` / `bgB`)
  - Manual background cycle button present
- Dice reroll UI present
- Threshold pace input present
- Workout generation logic still under validity review

<!-- __END_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->

---

<!-- __START_PS_INVARIANTS_PS070__ -->

## Invariants

- Background filenames may contain spaces and parentheses
- Background switching must never reveal fallback colour
- Manual background cycling must advance, not toggle
- All fixes must be minimal and reversible
- User manually tests all behaviour

<!-- __END_PS_INVARIANTS_PS070__ -->

---

<!-- __START_PS_OBSERVED_FAILURES_PS080__ -->

## Observed Failures

- Generate previously failed due to `buildOneSetBodyServer` reference mismatch
- Reroll logic occasionally fails
- Workout structures sometimes implausible (too many sub-parts)
- UI chips fail when output is not NxD parseable

<!-- __END_PS_OBSERVED_FAILURES_PS080__ -->

---

<!-- __START_PS_RECENT_FIXES_PS090__ -->

## Recent Fixes

- **Manual background cycle button fixed (2026-01-13)**  
  Root cause: JS was setting `backgroundImage` using unquoted `url(...)`.  
  Filenames include spaces and parentheses, causing invalid CSS and fallback green background.  
  Fix: Quote the URL in `setLayerImage()` so manual cycling works correctly.

<!-- __END_PS_RECENT_FIXES_PS090__ -->

---

<!-- __START_PS_NEXT_SINGLE_STEP_PS100__ -->

## Next Single Step

Choose one only:

- Validate workout generation structure for coach plausibility  
**or**
- Stabilise reroll logic failure case  
**or**
- Add defensive guard so background fallback colour can never appear silently again

Do not start more than one.

<!-- __END_PS_NEXT_SINGLE_STEP_PS100__ -->

---

<!-- __END_FILE_PROJECT_STATE_PS000__ -->
