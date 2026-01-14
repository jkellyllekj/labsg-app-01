<!-- __START_FILE_PROJECT_STATE_PS000__ -->

# Project State

Project: Swim Workout Generator  
Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-14  
Status: Authoritative

---

<!--
============================================================================
BLOCK INDEX
PS010 - READ_FIRST
PS020 - CURRENT_PHASE
PS030 - FROZEN
PS040 - ALLOWED
PS050 - ACTIVE_FILES
PS060 - CURRENT_SYSTEM_SNAPSHOT
PS070 - INVARIANTS
PS080 - OBSERVED_FAILURES
PS090 - RECENT_FIXES
PS100 - CURRENT_KNOWN_UI_ISSUES
PS110 - WORKING_MODE_OVERRIDE
PS120 - NEXT_SINGLE_STEP
============================================================================
-->

<!-- __START_PS_READ_FIRST_PS010__ -->

## If this is a new chat, read this first

This file is the sole source of truth for the current state of the project.  
Repo and file truth overrides chat memory.

If anything here is unclear or stale: STOP and update this file first.

<!-- __END_PS_READ_FIRST_PS010__ -->

---

<!-- __START_PS_CURRENT_PHASE_PS020__ -->

## Current Phase

v1 Build plus UI validity hardening

Purpose:
- Keep a minimal working app running in Replit
- Generate plausible swim workouts via OpenAI
- Stabilise UI behaviours and layout before adding new features

Non goals:
- No refactors for cleanliness
- No architectural changes
- No new feature work beyond the agreed UI tier scaffolding

<!-- __END_PS_CURRENT_PHASE_PS020__ -->

---

<!-- __START_PS_FROZEN_PS030__ -->

## Frozen

- index.js is the only runtime file
- Two layer background crossfade system (bgA and bgB)
- Background randomises on page load
- Workout cards full width layout (no extra outer panel around the sets)

<!-- __END_PS_FROZEN_PS030__ -->

---

<!-- __START_PS_ALLOWED_PS040__ -->

## Allowed

- Small, bounded UI fixes (layout, styling, spacing)
- One function or one UI section at a time
- Defensive fixes that preserve current behaviour

<!-- __END_PS_ALLOWED_PS040__ -->

---

<!-- __START_PS_ACTIVE_FILES_PS050__ -->

## Active Files

- index.js - sole runtime and UI logic
- project-state.md - authoritative state
- WORKING-METHOD-REPLIT.md - working rules

<!-- __END_PS_ACTIVE_FILES_PS050__ -->

---

<!-- __START_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->

## Current System Snapshot

Backgrounds:
- Random background works on page load
- Manual background cycling works
- Two layer crossfade is live and does not flash fallback green in normal use

UI top area:
- Ad placeholder banner at top
- Single Swim Gen panel contains:
  - Title row with Swim Gen text and a background icon button (picture icon)
  - Distance slider with the distance readout to the right
  - Pool length buttons in one row (25m, 50m, 25yd) plus Generate on same row
  - Advanced options collapsed area below
  - Dolphin loader visible on the panel

Workout area:
- Set cards render below and should remain full width (no extra enclosing panel)

<!-- __END_PS_CURRENT_SYSTEM_SNAPSHOT_PS060__ -->

---

<!-- __START_PS_INVARIANTS_PS070__ -->

## Invariants

- Background filenames may contain spaces and parentheses
- Background switching must never reveal fallback colour
- Manual background cycling must advance, not toggle
- Keep index.js as the only runtime file
- Keep workout set cards full width (no extra outer container around the list)

<!-- __END_PS_INVARIANTS_PS070__ -->

---

<!-- __START_PS_OBSERVED_FAILURES_PS080__ -->

## Observed Failures

- Workout structures sometimes implausible
- Reroll logic occasionally fails
- UI chips fail when output is not NxD parseable

<!-- __END_PS_OBSERVED_FAILURES_PS080__ -->

---

<!-- __START_PS_RECENT_FIXES_PS090__ -->

## Recent Fixes

2026-01-13
- Manual background cycle button fixed
  - Root cause: backgroundImage used url(...) without quotes and broke on filenames with spaces and parentheses
  - Fix: setLayerImage now uses url("...") quoting so CSS stays valid

2026-01-13 to 2026-01-14
- UI condensation and tier scaffolding started
  - Removed the old top title card and moved controls into a single Swim Gen panel
  - Added Ad placeholder banner
  - Moved Generate onto the same row as pool buttons
  - Added a small background icon button near the title

2026-01-14
- Glass style iteration added to Swim Gen panel
  - Current look is clear glass style with border and transparency
  - Readability varies by background and needs refinement

<!-- __END_PS_RECENT_FIXES_PS090__ -->

---

<!-- __START_PS_CURRENT_KNOWN_UI_ISSUES_PS100__ -->

## Current Known UI Issues

Glass and readability
- Text can become hard to read on darker or high contrast backgrounds
- Some controls may need a subtle local text backing or outline treatment while keeping the clear glass look

Selection styling
- Pool length selection styling is reversed from intended behaviour
  - Intended: unselected buttons look like the current selected look
  - Intended: selected button becomes white and bold
  - Intended: Generate also becomes white and bold when active

Dolphin loader
- Dolphin position is close but not yet correct
  - Intended: centred under Generate area, not too high
- Spin direction and timing are not as intended
  - Intended: counterclockwise spin, about 1.5 seconds per cycle
- Splash should appear at the same anchor point as before

Background icon
- Background icon should be near the Swim Gen title and should cycle background without needing to generate first
- Desired icon is the picture icon, not the old circular arrow

Spacing
- Global side padding is still a bit too large
  - Reduce outer margins slightly so panels and cards gain horizontal real estate on phones
- Border radius feels slightly too rounded
  - Reduce radius a little on panels, capsules, and cards

Workout list container regression to avoid
- Do not reintroduce an extra wide panel below Swim Gen that wraps the workout cards
  - Cards should remain full width as before

<!-- __END_PS_CURRENT_KNOWN_UI_ISSUES_PS100__ -->

---

<!-- __START_PS_WORKING_MODE_OVERRIDE_PS110__ -->

## Working Mode Override for this project

Hybrid mode:
- ChatGPT does planning and produces precise search strings and patch instructions
- Replit Agent executes edits only
- Jess manually tests in the browser

Testing note:
- The Agent should not claim something works unless Jess confirms after manual testing

<!-- __END_PS_WORKING_MODE_OVERRIDE_PS110__ -->

---

<!-- __START_PS_NEXT_SINGLE_STEP_PS120__ -->

## Next Single Step

Pick one only.

UI polish pass for the Swim Gen panel:
- Improve text readability on glass while keeping the clear glass look
- Fix button selection styling to match intended behaviour
- Correct dolphin position plus spin direction and timing
- Slightly reduce global padding and border radius

Stop after that single pass and wait for Jess testing feedback.

<!-- __END_PS_NEXT_SINGLE_STEP_PS120__ -->

---

<!-- __END_FILE_PROJECT_STATE_PS000__ -->
