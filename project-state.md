<!-- __START_FILE_PROJECT_STATE_PS000__ -->

# Project State

Project: Swim Workout Generator  
Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-09  
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
- ~~Minimal workout bug (1x2000 easy)~~ FIXED: Rewrote allocation logic to guarantee main set space
- ~~Drill/Kick/Pull had multiple segments~~ FIXED: Now output single segments (1x300 drill)
- ~~Custom pools ended at wrong end~~ FIXED: Total is now forced to even number of lengths
- ~~"easy swim" awkward wording~~ FIXED: Changed to "easy drill", "easy kick", etc.

Remaining minor issues:
- ~~Custom pool distances look robotic (3x99, 1x231)~~ FIXED 2026-01-09: Added lap count display "(X lengths)" for non-standard pools

UI defects:
- ~~Right side chips sometimes missing~~ FIXED 2026-01-09: Improved set distance parser to handle multi-line sets and more formats
- Dice click can error when the set distance cannot be parsed, or when reroll returns invalid output

<!-- __END_PS_OBSERVED_FAILURES_PS080__ -->

---

<!-- __START_PS_NEXT_SINGLE_STEP_PS090__ -->

## Next single step

Tested 2026-01-09: All core fixes and UI polish complete.

Completed:
1. DONE: Fixed minimal workout bug (allocation logic rewritten)
2. DONE: Drill/Kick/Pull now use proper rep structures (6x50 drill, 4x75 kick)
3. DONE: Custom pools end at start end (even lengths enforced)
4. DONE: Wording cleaned up (no more "easy swim")
5. DONE: Fixed slider bug (distance label now updates when slider moves)
6. DONE: Serpentine-style UI with color-coded cards and left accent bars
7. DONE: Effort-based color system (5 levels: green/blue/yellow/orange/red)
8. DONE: Reroll seed-based variety (6 drill/kick/pull description variations)
9. DONE: Jumping dolphin animation during generation
10. DONE: Minimum 1 second loader display
11. DONE: Smooth 0.3s fade-in for workout results
12. DONE: Premium form styling (gradient background, drop shadow, rounded corners)
13. DONE: Updated header with cleaner tagline
14. DONE: Viewport Lab testing page at /viewport-lab (temporary)
15. DONE: Default distance 1500m, 25m pool highlighted by default

Remaining:
- ~~Improve set parsing for more reliable right-side chips in UI~~ DONE 2026-01-09
- ~~Consider improving custom pool distance formatting~~ DONE 2026-01-09 - Added "(X lengths)" display
- Premium features: temperature option for more varied workout structures (pyramids, etc.)
- Remove Viewport Lab link and dev color picker before production release
- Dev color picker added for real-time color experimentation

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

### 2026-01-09 — Effort-based color system
Colors indicate intensity level, not set type:
- Level 1 (green): Easy (warm-up, cool-down)
- Level 2 (blue): Moderate
- Level 3 (yellow): Mod-high
- Level 4 (orange): Hard
- Level 5 (red): Sprint
Each level has matching background tint and left accent bar.

### 2026-01-09 — No "easy" in drill/kick/pull labels
Color tells the intensity story. Use "relaxed" instead of "easy" for drill, kick, and pull sets. Reserve "easy" only for warm-up and cool-down.

### 2026-01-09 — Minimum 1 second loader display
Even if generation is fast, the jumping dolphin loader shows for at least 1 second. This creates a polished feel and prevents jarring instant transitions.

### 2026-01-09 — Smooth fade-in for results
Workout cards fade in with 0.3s animation (opacity plus translateY) instead of appearing instantly. Creates Apple-style polish.

### 2026-01-09 — Viewport Lab is a temporary testing tool
The /viewport-lab route shows the app at multiple screen sizes (mobile, tablet, desktop) for responsive design testing. Link appears on home page during development. Remove before production.

### 2026-01-09 — Pool photo background
Body background uses a realistic pool water photo (public/pool-lanes.jpg) with glassy water and lane lines. Fallback gradient for slow connections. Form card uses frosted glass effect (white with 85% opacity) for readability.

### 2026-01-09 — Title in visible container
Title and Viewport Lab link are now wrapped in a white semi-transparent container so they're visible against the pool background.

### 2026-01-09 — Single-column form layout
Form layout is now single-column (Distance above Pool length) for cleaner mobile and desktop experience. Previous side-by-side layout was removed.

### 2026-01-09 — Zone-based color system (updated)
Colors now match triathlon coaching zone system:
- Zone 1 (blue): Easy - chatting pace, warm-up, cool-down
- Zone 2 (green): Moderate - phrases, drill, technique (NOT for main sets)
- Zone 3 (creamy yellow with brown bar): Mod-high - single words, build, descend
- Zone 4 (orange): Hard - hard to speak, fast, strong, threshold, main sets default
- Zone 5 (red): Sprint - unable to speak, all out, race pace

### 2026-01-09 — Responsive mobile-first layout
Form columns stack vertically on screens under 680px. Slider and controls expand to full width on mobile. Advanced options grid collapses to single column. Tested via Viewport Lab on iPhone 15 (390px) viewport.

### 2026-01-09 — Main sets never green
Main sets are never Zone 2 (green). At minimum they show Zone 3 (yellow/cream) if using "steady" or "smooth", otherwise default to Zone 4 (orange/hard). Only drill, kick, pull technique sets can be green.

### 2026-01-09 — Build/mod-high color is creamy yellow with brown bar
Zone 3 (mod-high/build) uses creamy yellow background (#fef3c7) with brown accent bar (#92400e), not lime/green.

### 2026-01-09 — Removed "Your Workout" title
The workout results no longer have a title header - the set cards speak for themselves.

### 2026-01-09 — User's pool photo as background (compressed)
Background image is user's own sunny outdoor pool photo with lane lines and pennants. Compressed from 6MB to 133KB for fast loading. Uses background-attachment:fixed for subtle parallax effect.

### 2026-01-09 — Custom pool lengths show lap count (DONE)
For non-standard pool lengths (30m, 33m, 27m etc), set descriptions now show "(X lengths)" in parentheses so swimmers know lap count. Example: "3x99 (3 lengths)" for a 33m pool.

### 2026-01-09 — Long workouts don't always need many subsets (TODO)
Long workouts (3000m+) don't always need 3-5 subsets per category. Sometimes a simpler structure (single main set, single drill set) is preferred. Not yet implemented.

### 2026-01-09 — Zone-based workout card colors (updated 2026-01-09)
Workout set cards have colored backgrounds + left accent bar. Zone names updated to match coaching terminology:
- GREEN background (#dcfce7) + green bar (#22c55e): Easy (Zone 1) - warm-up, cool-down, recovery
- BLUE background (#dbeafe) + blue bar (#3b82f6): Steady (Zone 2) - technique, drill, kick, pull
- Creamy yellow background (#fef3c7) + warm gold bar (#f6c87a): Moderate (Zone 3) - building effort
- Deeper orange background (#fed7aa) + red-orange bar (#ea580c): Strong (Zone 4) - main sets, sustained effort
- Unsaturated red background (#f6c1c1) + bold red bar (#d10f24): Hard (Zone 5) - max effort sets

Note: "Sprint" is a SET TYPE (like "1x100 Sprint"), not a zone. Zones describe intensity levels.

### 2026-01-09 — WORKFLOW: Always test by generating a workout
Before completing any UI/styling changes, ALWAYS generate a workout and visually verify the result. Do not rely on just API tests - check the actual rendered output.

### 2026-01-09 — Build set reroll variety
Build set generation now has 4 pattern variations and 5 description options (build, descend, negative split, build to fast, smooth to strong) so rerolling produces different results.

### 2026-01-09 — Dev color picker for live experimentation (updated 2026-01-09)
Color picker moved from main page to /viewport-lab page. Positioned on right side with tighter spacing. Allows real-time adjustment of zone colors for all 5 zones. Hex codes shown for easy handoff. Remove before production.

### 2026-01-09 — Distance chips now show units
Right-side distance chips now display with unit suffix (e.g., "225m" instead of just "225") for clarity.

### 2026-01-09 — Improved set parsing
Set distance parser now handles multi-line sets and standalone distances (like "200 easy" without NxD format) more reliably.

### 2026-01-09 — Card drop shadow increased
Workout set cards now have deeper drop shadows (0 8px 24px rgba) for more visual depth, inspired by user's 2019 CardGym printed cards.

### 2026-01-09 — CardGym 2019 Inspiration Features (ROADMAP)
Features to implement, inspired by user's 2019 printed CardGym cards:

**COMPLETED 2026-01-09:**
- DONE: Floating cards: Remove white form/results container, let cards float on pool background
- DONE: 3-column layout: Set description (left), rest in red (center), distance (right)
- DONE: Zone renaming: Easy, Steady, Moderate, Strong, Hard
- DONE: Vertical gradients (top-to-bottom) for multi-zone sets: build, descend, pyramid, reducer
- DONE: Drill name library: 16 specific drills (Catch-up, Fist drill, Fingertip drag, DPS, Shark fin, Zipper, Scull, Corkscrew, Single arm, Long dog, Tarzan, Head up, Hip rotation, Paddle scull, Kickboard balance, 6-3-6)
- DONE: Snazzy workout names: Context-aware names based on distance, focus, and equipment (e.g., "Steady State", "Speed Demon", "Lane Lines", "Full Tank")
- DONE: Emoji intensity strip: 5 faces at bottom showing workout difficulty (😊 🙂 😐 😣 🔥)
- DONE: Inline rest display: ":15 Rest" shown inline in red text

**REMAINING:**
- (none currently)

**DEFERRED:**
- Playing card theme (not needed for web app)
- Selectable backgrounds (future)
- Font exploration
- Multi-sport expansion (CardGym concept for running, cycling, gym)

### 2026-01-09 — Moderate zone border fix
Fixed white corner artifacts on yellow/moderate zone cards. The issue was the semi-transparent border color (40% opacity) appearing white against the pool background. Changed to use opaque border color matching the bar color.

### 2026-01-09 — Gradient system for zone transitions (NEEDS EXPANSION)
Sets that span multiple zones display gradient backgrounds. Currently only triggers on:
- Build sets with "build", "negative split", "smooth to strong" keywords
- Descend sets
- Kick build sets

**ISSUE:** Gradients don't appear on enough set types. Need to expand to cover more scenarios like:
- Main sets that build effort
- Pyramid sets
- Any set with progressive intensity language

Functions: getZoneSpan(), getZoneColors(), gradientStyleForZones()
Reroll handler also applies gradients when set content changes.

<!-- __END_PS_DECISIONS_PS100__ -->

<!-- __END_FILE_PROJECT_STATE_PS000__ -->
