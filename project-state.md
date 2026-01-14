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

Routes and tools:
- Dolphin assets are served from public/assets/dolphins/ and used across UI and effort bar

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

2026-01-14
- Dolphin animation stabilised
  - Centralised dolphin animation into one helper
  - Cancels older timers and tokenises runs to avoid overlap
  - Works on repeated presses and rapid presses

- Custom SwimGen dolphin icon set created and adopted
  - Replaced emoji dolphin with custom dolphin images
  - Added 6 assets: base plus 5 effort levels
  - Assets stored under public/assets/dolphins/

- CSS extraction started
  - Moved most inline CSS out into styles.css
  - Viewport Lab CSS is scoped to avoid bleeding into the main UI

<!-- __END_PS_RECENT_FIXES_PS090__ -->

---

<!-- __START_PS_CURRENT_KNOWN_UI_ISSUES_PS100__ -->

## Current Known UI Issues

Dolphin and splash animation
- Splash appears at the wrong resting angle
  - Desired: fixed resting angle rotated left about 130 degrees
  - Splash must never spin
- Splash is not visible because scroll or reveal happens too early
  - Desired: splash becomes visible first, then smooth scroll happens
- Dolphin fade out and splash fade in are currently sequential
  - Desired: crossfade at the same time over 0.2 seconds

Generate dolphin sizing regression
- Dolphin sometimes returns to small size after generation
  - Desired: generate dolphin remains large idle after completion

Effort bar icons
- Effort dolphins still read too small on mobile
  - Increase icon size by another 25 percent
  - Coffee cup and Z must be legible at small sizes
- Threshold and Full Gas dolphins look faded on red backgrounds
  - Desired for now: revert them to blue and rely on facial expression
  - Remove warm tint from those two assets

Layout polish parked
- Set card dolphin and metres alignment is noted but not urgent yet
  - Desired: dolphin aligns with set title line
  - Desired: metres aligns with the set detail line
  - May be revisited once sets contain longer instructions

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

Pick one only. UI only.

Fix splash and icon presentation:
- Lock splash to a fixed resting angle rotated left about 130 degrees
- Ensure splash never spins
- Crossfade dolphin out and splash in at the same time over 0.2 seconds
- Delay scroll or reveal so splash is visible before the page moves
- Keep generate dolphin large at rest after completion
- Effort bar icons: increase size by another 25 percent
- Threshold and Full Gas: revert to blue assets with no warm tint

Stop after this single pass and wait for Jess manual testing feedback.

<!-- __END_PS_NEXT_SINGLE_STEP_PS120__ -->

---

<!-- __END_FILE_PROJECT_STATE_PS000__ -->