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

v1 Logic and tier engine build

Purpose:
- Lock the current UI and stop UI iteration for now
- Make workouts coach plausible and consistent
- Introduce tiers and constraints so outputs are structured and reliable
- Keep the app minimal and stable in Replit

Non goals:
- No UI redesigns
- No refactors for cleanliness
- No architectural changes

<!-- __END_PS_CURRENT_PHASE_PS020__ -->

---

<!-- __START_PS_FROZEN_PS030__ -->

## Frozen

- index.js is the only runtime file
- styles.css is used for extracted CSS and is served by index.js
- Two layer background crossfade system (bgA and bgB)
- Background randomises on page load
- Workout cards render full width layout (no extra outer panel around the sets)
- Current Swim Gen top panel layout and control placements are locked for now
- Effort strip behaviour is locked for now, even if imperfect on some phones

<!-- __END_PS_FROZEN_PS030__ -->

---

<!-- __START_PS_ALLOWED_PS040__ -->

## Allowed

Primary work now:
- Workout generation logic changes only
- Tier model and constraints
- Output formatting so parsing is reliable
- Reroll reliability improvements

UI work:
- Only tiny UI fixes that are strictly required to support logic work
- Park all other UI polish until after the tier engine is stable

Change size rule:
- One bounded change at a time
- Touch as few blocks as possible

<!-- __END_PS_ALLOWED_PS040__ -->

---

<!-- __START_PS_ACTIVE_FILES_PS050__ -->

## Active Files

- index.js - sole runtime and UI logic
- styles.css - external stylesheet
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

- Rest seconds still appear in free tier as a red 20s line. This must never render in free tier.
- Reroll sometimes shows "Reroll failed to produce a replacement set." This warning is not acceptable. There must always be a replacement, at minimum a change in effort.
- Home-end rule is inconsistent. Total distance is even-length, but individual set distances can still be odd-length totals (example 550m, 450m, 350m, and similar). Rule should be: every set ends at the same wall, so each set distance must be a multiple of 2 * poolLen.
- Intensity colour is missing on first generation. Red (hard or fullgas) almost never appears unless rerolling individual sets. First generation should include at least one red set about 50 percent of the time. Mainly in Main or Kick, never in Warm up or Cool down.
- Variety is still low. On repeated Generate, templates repeat quickly and large workouts sometimes fall back to generic swim blocks, so Drill and Kick stop looking like drills and kick.
- Cool down often locks to "200 easy" too often. Need more plausible options like 250 and 300 in metres, and the yard equivalents.
- Terminology: In this app a lap means one length, not down and back. Add a small help popup later.

<!-- __END_PS_OBSERVED_FAILURES_PS080__ -->

---

<!-- __START_PS_RECENT_FIXES_PS090__ -->

## Recent Fixes

- Template based section generation was added and is now firing for many small and mid workouts, removing the worst 125m and 175m fragment sections.
- Some sessions now look more coach plausible on first generate, but the issues in PS080 remain and must be fixed before further tier work.

Rollback note:
- Safe rollback checkpoint exists from about 2026-01-14 around 18:00, labelled by Jess as the May checkpoint. Use this if the logic work goes haywire.

<!-- __END_PS_RECENT_FIXES_PS090__ -->

---

<!-- __START_PS_CURRENT_KNOWN_UI_ISSUES_PS100__ -->

## Current Known UI Issues

UI is parked. Do not spend time here unless it blocks logic work.

Dolphin and splash animation
- Splash resting angle is still not correct in all contexts
  - Desired: fixed resting angle rotated left about 130 degrees
  - Splash must never spin
- Dolphin fade out and splash fade in should be a true crossfade
  - Desired: both happen at the same time over 0.2 seconds
- Reveal and scroll timing still feels slightly off on some devices
  - Desired: splash is visible before any smooth scroll begins

Effort bar icons
- Effort dolphins still feel cut off or tight on some phones
- Threshold and Full Gas sometimes appear faded again
  - Desired for now: both remain blue, no warm tint

Layout polish parked
- Set card dolphin and metres alignment is noted but not urgent yet
  - Desired: dolphin aligns with set title line
  - Desired: metres aligns with the set detail line

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

Stop all new feature work. Do one control fix.

Free tier must never display rest seconds and reroll must never fail.

Implement:
- Strip any standalone rest line like "20s" from all set bodies before rendering.
- Ensure the reroll endpoint always returns a valid replacement set, with a guaranteed effort change fallback, and never returns null.

Keep UI frozen.

<!-- __END_PS_NEXT_SINGLE_STEP_PS120__ -->

---

<!-- __END_FILE_PROJECT_STATE_PS000__ -->