# Project: Swim Workout Generator

Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-22  
Status: Active

============================================================================
READ THIS FIRST
============================================================================

This file is the single source of truth for the project.

If there is any uncertainty about:
- what we are working on
- what phase we are in
- what is allowed or frozen
- how to resume after a break

Then STOP and read this file in full before doing anything else.

Chat memory is disposable. This file is not.

============================================================================
INSTRUCTION STYLE RULE
============================================================================

The assistant must always provide explicit, start-to-finish instructions.

This means:
- Always specify the exact file name(s)
- Always specify exactly where to change the file (section or heading and position)
- Always provide copy and paste ready text blocks for additions or replacements
- Do not say "add this somewhere" or "put this in the project state" without exact placement
- Planning happens in chat. The agent is execution-only.

============================================================================
CURRENT PHASE
============================================================================

Phase: v1 Logic Stability and Constraint Engine

Goal of this phase:
Make the generator produce workouts that are:
- mathematically correct
- wall-safe in all pool lengths
- coach-plausible on first generation
- varied without feeling random

Constraints for this phase:
- UI stability is prioritised
- Avoid cosmetic redesigns and layout churn
- UI changes are allowed only when they directly support generator correctness, section realism, pacing, or user control
- No AI rewrite layer yet
- Logic changes must be single, bounded, and testable

This phase is complete when:
- All sets end on the same wall
- No odd or prime rep counts appear where they are unrealistic
- Effort patterns look intentional
- Rerolls feel meaningfully different

============================================================================
ARCHITECTURE OVERVIEW
============================================================================

- Entire app runs from index.js (single-file logic + UI)
- styles.css exists
- Workouts are generated deterministically with seeded variation
- Manual testing is authoritative
- The agent is execution-only
- Planning, validation, and judgement happen in chat

============================================================================
PAUSE IN ACTION AND NEW CHAT HANDOVER
============================================================================

When a Pause In Action is declared:
- The current chat is disposable
- Continuity must be recovered from this file
- No prior chat context should be assumed

To resume in a new chat, provide the canonical raw links below.

Canonical raw links:
PROJECT: labsg-app-01
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/project-state.md
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/WORKING-METHOD-REPLIT.md
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/COACH_DESIGN_NOTES.md
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/index.js
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/styles.css

Rules:
- The assistant cannot browse repo folders
- Only exact raw file URLs are readable
- After any logic change, index.js must be re-linked

============================================================================
WORKOUT STRUCTURE RULES
============================================================================

Standard section order:
1. Warm-up
2. Build
3. Kick
4. Drill
5. Main
6. Cool-down

Rules:
- Warm-up and cool-down are always low effort
- Build is warm-up part two
- Main is the primary intensity
- Kick and Drill should appear in workouts 1000m and above
- No section may end off-wall

============================================================================
DISTANCE AND POOL RULES
============================================================================

- All sets must end on the same wall they start
- Set distances must be divisible by 2 times pool length
- Slight total overshoot is allowed only to preserve wall endings
- Custom pool lengths (for example 33m) are first-class citizens

============================================================================
EFFORT RULES
============================================================================

- Warm-up / Cool-down: blue or green only
- Build: progressive (may touch orange, rarely red)
- Drill: usually blue or green
- Kick: may include strong or hard
- Main: yellow, orange, red expected

Variety intent:
- About 60 to 70 percent of workouts include at least one red exposure
- Gradients should not be overused
- Hard efforts should sometimes stand alone

============================================================================
LOCKED INVARIANTS
============================================================================

- index.js is the runtime authority
- Generator never returns null or fails silently
- Reroll must always produce a valid workout
- Reality Anchors are active constraints:
  - Section distance buckets enforced for Warm up, Kick, Cool down
  - Sprint volume caps enforced, with single line sprint blocks rejected
  - Validation is section aware via validateSetBody(body, targetDistance, poolLen, sectionLabel)

============================================================================
RECENTLY COMPLETED (v1)
============================================================================

- Main Set template cooldown implemented
  Prevents reroll repetition of Main patterns

- Drill and Kick rep normalisation
  Odd and prime rep counts eliminated
  Drill and Kick now use coach-plausible even counts

- Post generation validator (2026-01-21)
  Now rejects workouts that violate:
  pool-length repeat multiples, unrealistic rep counts, section distance buckets (Warm up, Kick, Cool down), sprint rules (no single line sprint blocks, sprint volume caps), full gas caps (swim max 600m, kick max 300m), and build labeling sanity (min 2 reps).
  Invalid workouts trigger a retry with a new seed.
  Note: Stricter "same wall per repeat" enforcement (2x pool length) is blocked on generator template updates that currently produce 25m repeats.

- Exact target totals enforcement (2026-01-21)
  For standard pools (25m, 50m, 25yd), workouts now total exactly the slider value (for example 3000m equals 3000m, not 3050m).
  Achieved via "final balance" logic that uses cooldown to absorb snapping drift, plus target lock correction for edge cases.

Tests:
- 30/30 pass for all pool types at 3000m and 2000m.

============================================================================
RECENT FIXES / RESOLVED (2026-01-21)
============================================================================

- Reality Anchors enforced by validator:
  - Blocks non coach normal section totals in Warm up, Kick, Cool down
  - Blocks single line sprint blocks
  - Enforces sprint volume caps by section
  Prevents outputs like 350 kick, 650 warm up, or 2100 sprint.

- Intermittent generation crash resolved:
  - Root cause: undefined references in regenerateSectionBody (sectionTemplates, helper fns)
  - Fix: corrected references to SECTION_TEMPLATES, replaced undefined helpers with inline fallbacks
  - Endpoint /generate-workout now always returns HTTP 200 with fallback workout instead of 500

- 25m / 25yd rep explosion prevented:
  - Validator caps added:
  - Main sets: Nx50 capped at N 16 for 25m / 25yd pools
  - Drill sets: 25s 12 reps, 50s 10 reps
  - Eliminates recurring 22x50, 26x50, and 14x25 drill patterns

============================================================================
TESTING / TOOLING
============================================================================

- Added automated smoke test script: scripts/gen_smoke_test.js

- Smoke test suites:
  - Suite A: crash / retry hardening
  - Suite B: rep count sanity (25m)
  - Suite C: intensity detection (enabled)
  - Suite D: 25yd parity

- Latest results (2026-01-21):
  - Suite A: PASS
  - Suite B: PASS
  - Suite C: TODO (enable assertions for sections, sectionMeta, workoutMeta)
  - Suite D: PASS

============================================================================
KNOWN LIMITATIONS
============================================================================

- API returns workouts with workoutText plus structured metadata

- /generate-workout success response includes:
  - sections: array of { label, dist, body }
  - sectionMeta: array of { zone, isStriated }
  - workoutMeta: { hasRed, redSectionsCount }

- This enables automated detection of:
  - red or full gas frequency
  - label and colour mismatches
  - striation patterns (odds and evens, descend, build)

============================================================================
NEXT SINGLE STEP (ACTIVE)
============================================================================

- Enable Suite C assertions for metadata contract and red presence tracking

============================================================================
IDEA PARKING LOT (NOT SCHEDULED, NOT COMMITTED)
============================================================================

Rule: Idea Capture Responsibility

The user does not need to explicitly label something as an idea.

If the user:
- thinks out loud
- describes how real coaches would do something
- says something feels off, unrealistic, or non-standard
- proposes alternatives without asking to implement them

the assistant must:
- recognise this as an idea
- abstract it into a durable form
- ensure it is added to this section before the end of the conversation

Ideas must never rely on chat memory alone.
If an idea is discussed and not written here, it is considered lost.
This section exists to prevent idea loss.

Items here are NOT tasks.
They may be vague, contradictory, or long-term.
Do not implement anything from this section without explicitly promoting it to an active step.

- The following ideas describe intentional post v1 evolution and should not be partially implemented without a clear phase decision

Template driven realism and workout corpus:
- Shift from generate then ban toward template first generation
- Build a library of coach normal set templates derived from real published workouts
- Template picker chooses by section, distance bucket, and training intent
- Templates stored primarily as length counts to support any pool length, including custom pool lengths
- Keep validator as a backstop, but aim for near zero rejections once templates drive generation
- Add tags on templates for:
  - stroke mix
  - energy system focus (aerobic, threshold, speed, skills)
  - triathlon focus versus pool race focus
  - phase intent (base, build, taper, race prep)
  - equipment suitability (paddles, snorkel, fins, pull buoy)

Engine architecture reset (post v1):
- Move from monolithic index.js toward a modular engine structure
- Keep UI and API contract stable while swapping generation internals
- Allow parallel development of a template driven engine without breaking existing functionality
- Treat current generator as legacy once template engine is proven

User customisation and set editing (post v1 UI work):
- Allow resizing a section card to increase or decrease that section distance
- Resizing changes total workout distance unless user manually adjusts other sections to compensate
- Allow removing a section by dragging it off screen
- Allow inserting a new section at a chosen point, then selecting a section type and distance bucket
- Allow re rolling a single section without re rolling the entire workout
- Allow locking a section so it is preserved while other sections are re rolled

Intervals, pacing, and time budgeting (future tiers):
- Add optional user pace inputs (for example CSS, 100 pace, 200 pace, or a simple speed slider)
- Generate suggested intervals per set based on user pace plus rest intent
- Show estimated duration per set using:
  - interval time times reps
  - plus a default transition buffer between sets (for example 60 seconds)
- Allow user adjustments to intervals with plus or minus controls, then recompute total time estimate
- Eventually allow toggling between interval based presentation and rest based presentation

Training plans and season logic (long term):
- Generate multi week plans, not just one off workouts
- Support A and B races and a target date
- Track what the user actually completed and how it felt
- Adapt future sessions based on compliance and feedback

Integrations (long term):
- Consider export or sync targets:
  - Garmin
  - Strava
  - TrainingPeaks

Long-distance realism:
- Very long workouts (6k to 10k) should not look like scaled-up 2k workouts
- Long sessions may use fewer sections with larger blocks
- Distance training should shift from endless 50s toward 100s, 200s, 400s, and occasional 800s

Set construction ideas:
- Drill sets could sometimes alternate drill/swim instead of pure drill
- Kick, Drill, Swim composite sets may be useful later
- Main sets could include broken race or race-pace concepts
- Alternating effort patterns (easy/hard repeats) should sometimes appear

Effort semantics:
- Negative split meaning needs tightening (within-rep vs across-rep clarity)
- Build sets could occasionally finish with red
- Effort colour usage could include blue more deliberately
- Red does not need to appear every workout, but should feel earned

Visual and representation ideas (post-v1):
- Solid colour backgrounds (white, sepia, pastels)
- Optional light-only colour picker
- Colour striping to represent alternating effort patterns

AI and higher tiers (future):
- Deterministic generator as base layer
- AI as constrained editor, not primary author
- AI-generated coaching notes per set
- Full AI generation only after validator is rock-solid

Meta:
- Project state must capture ideas automatically as they arise
- No idea should rely on chat memory alone
- Context decay is expected and designed around

============================================================================
KNOWN ISSUES
============================================================================

- Rare odd-length leaks still observed in edge cases
- Effort gradients slightly overrepresented
- Full Gas still underrepresented in some runs
- Bug (fixed 2026-01-21): displayed TOTAL and total lengths were using planned target values and could diverge from actual generated section sums after snapping and fill.
  Fix is to compute totals from rendered sections and retry generation if totals are not divisible by pool length.

============================================================================
END OF FILE
============================================================================
