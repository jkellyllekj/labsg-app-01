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

2026-01-14
- Free-tier realism validation guards added
  - Added validation helpers: isAllowedRepCount, endsAtHomeEnd, isValidWarmupCoolLine, isValidDrillLine, isValidKickLine, parseNxD, validateSetBody
  - findBestFit now filters by allowed rep counts (2,3,4,5,6,8,10,12,16,20 for short reps; less for longer)
  - Warm-up and cool-down guard against hard effort keywords
  - Drill sets guard against odd/random rep counts (7, 9, 11, 13)
  - Kick sets guard against "relaxed" or "easy" with short reps
  - Set-level validation rerolls invalid sets up to 5 times before fallback
  - No tier engine yet - just validation guards

- Template-based section generation added to prevent fragmented sets
  - SECTION_TEMPLATES object with warmup, build, drill, kick, cooldown templates
  - pickTemplate(section, targetDistance, seed) selects templates that fit
  - Each section tries template first, falls back to existing logic
  - Prevents 125m/175m/225m fragments at small totals

- Fixed template selection by normalizing section labels
  - Added normalizeSectionKey(label) to convert "Warm up" -> "warmup", etc.
  - Template selection now uses normalized key instead of raw label
  - Templates now actually fire for matching sections

- Added minimum section distance floors so templates can fire on small workouts
  - SECTION_MIN_DIST: warmup 300, build/drill/kick/cooldown 200
  - Template selection uses effectiveTarget = max(target, minDist)
  - Excess distance implicitly shifts to main set

- Fixed template execution order
  - Template selection moved to top of buildOneSetBodyShared
  - Runs immediately after variable setup, before any section logic
  - If template fits, returns immediately (no fallthrough to fragment logic)
  - Removed duplicate template checks from individual sections

- Allocator now snaps section distances to pool multiples and even lengths
  - Added snapSection(dist, poolLen) for even-length snapping
  - Added applySectionMinimums(sets, total, poolLen) to enforce minimums
  - Minimums: warmup 300, build/drill/kick/cooldown 200
  - Excess distance shifts to main set
  - Prevents 125-225 fragments and allows templates to validate
  - Template selection now uses real targetDistance (allocator ensures clean values)

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

Pick one only. Logic only.

Validation guards are now in place. Next:
- Test generated workouts for coach plausibility
- Review rep count distributions
- Review effort level distributions
- Identify remaining implausible patterns

Stop after testing and wait for Jess manual review of generated workouts.

<!-- __END_PS_NEXT_SINGLE_STEP_PS120__ -->

---

<!-- __END_FILE_PROJECT_STATE_PS000__ -->