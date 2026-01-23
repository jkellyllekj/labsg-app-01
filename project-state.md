# Project: Swim Workout Generator

Working title(s): SwimDice / SetRoll / PacePalette (TBD)
Last updated: 2026-01-23
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
- Always provide copy-and-paste-ready text blocks for additions or replacements
- Do not say "add this somewhere" or "put this in the project state" without exact placement
- Planning happens in chat. The agent is execution-only.

============================================================================
PROJECT INTENT
============================================================================

Swim Workout Generator (SwimGen) is intended to be a real, shippable consumer app,
not a demo or internal tool.

The goal is:
- A usable, attractive, coach-plausible swim workout generator
- Deployed first as a web app
- Then wrapped and shipped to the iOS App Store
- With monetisation from day one
- Without architectural dead ends that require a rebuild

Long-term evolution is expected (years), but v1 must stand on its own.

============================================================================
CURRENT PHASE
============================================================================

Phase: v1 Reality Anchoring and Productisation

This phase supersedes the earlier “Logic Stability” framing.

Primary goals:
- Generator outputs are coach-plausible on first generation
- Set structures feel conventional and recognisable
- Workouts are wall-safe in all pool lengths
- The app is usable poolside
- The product is ready for TestFlight by end of February

Constraints:
- Core generator correctness is still prioritised
- UI redesign is not permitted, but additive UI evolution is allowed
- No AI rewrite layer yet
- Changes must be bounded and testable
- Avoid speculative architecture work

This phase is complete when:
- Generator uses a finite catalogue of coach-normal set structures
- Outputs can be swum without “why would a coach do this?” moments
- v1 feature set is complete and internally stable
- App is ready for TestFlight distribution

============================================================================
ARCHITECTURE OVERVIEW
============================================================================

- Entire app runs from index.js (single-file logic + UI)
- styles.css exists
- Workouts are generated deterministically with seeded variation
- Manual swimming and inspection is authoritative
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
  - Section distance buckets enforced for Warm-up, Kick, Cool-down
  - Sprint volume caps enforced, with single-line sprint blocks rejected
  - Validation is section-aware via validateSetBody(body, targetDistance, poolLen, sectionLabel)

============================================================================
PRODUCT TIERS AND MONETISATION (v1)
============================================================================

SwimGen uses a subscription-based model.

Generator rerolls are deterministic and local; monetisation is not tied to generation count.

Free (Ad-supported):
- Unlimited workout generation
- Full workout visibility
- Standard pool lengths
- Fixed sets (no resizing or editing)
- Persistent ad banner at top of screen
- Optional light interstitial ads

Premium:
- Removes all ads
- Allows resizing workout sections
- Allows rerolling individual sections
- Supports custom pool lengths

Pro:
- Includes all Premium features
- Adds pace input (CSS or equivalent)
- Pace-aware set suggestions
- Advanced control over effort and stroke bias
- Intended home for future advanced features

Notes:
- No standalone “ad-removal-only” tier
- Subscription only (monthly and yearly)
- No lifetime unlocks
- Free trial supported where platform allows

Accounts:
- No mandatory accounts in v1
- Account system deferred to post-v1

============================================================================
UI EVOLUTION RULES
============================================================================

UI is considered stable but not frozen.

Rules:
- Structural redesign is not allowed in v1
- Additive and reversible UI changes are allowed
- Visual variants (for example white background) may be added if they do not destabilise layout or interaction
- Gesture-heavy interactions are deferred

The current colour-coded workout cards are a core engagement feature.

============================================================================
RECENTLY COMPLETED (v1)
============================================================================

- Main set template cooldown implemented
  Prevents reroll repetition of Main patterns

- Drill and Kick rep normalisation
  Odd and prime rep counts eliminated
  Drill and Kick now use coach-plausible even counts

- Post-generation validator (2026-01-21)
  Rejects workouts that violate:
  pool-length repeat multiples, unrealistic rep counts,
  section distance buckets, sprint rules, full gas caps,
  and build labelling sanity.
  Invalid workouts trigger retry with new seed.

- Exact target totals enforcement (2026-01-21)
  Standard pools now total exactly the slider value.
  Achieved via final balance logic using cooldown fill.

Tests:
- 30/30 pass for all pool types at 3000m and 2000m.

============================================================================
TESTING / TOOLING
============================================================================

- Automated smoke test script: scripts/gen_smoke_test.js

Smoke test suites:
- Suite A: crash / retry hardening (PASS)
- Suite B: rep count sanity (PASS)
- Suite C: intensity detection (TODO)
- Suite D: 25yd parity (PASS)

============================================================================
KNOWN LIMITATIONS
============================================================================

- API returns workouts with workoutText plus structured metadata
- /generate-workout includes:
  - sections
  - sectionMeta
  - workoutMeta

This supports detection of:
- red presence
- label and colour mismatches
- striation patterns

============================================================================
NEXT SINGLE STEP (ACTIVE)
============================================================================

Define and implement the v1 Base Set Catalogue:

- Finite list of coach-normal structural set shapes
- Grouped by section (Warm-up, Build, Kick, Drill, Main, Cool-down)
- No modifiers yet
- No gesture-based editing yet
- Generator must sample only from this catalogue

============================================================================
IDEA PARKING LOT (NOT SCHEDULED, NOT COMMITTED)
============================================================================

Rule: Idea Capture Responsibility

If an idea is discussed and not written here, it is considered lost.

Items below are not tasks and must not be implemented without promotion.

Template-driven realism:
- Shift from generate-then-ban to template-first generation
- Large corpus of coach-derived set shapes
- Templates tagged by intent, stroke mix, energy system

User customisation and editing:
- Drag to reorder sections
- Resize sections by dragging edges
- Swipe to remove sections
- Lock sections to preserve them across rerolls
- Poolside interaction lock mode to prevent accidental edits

Visual themes:
- White background and monochrome modes
- Colour banding instead of full card backgrounds
- User-selectable themes

Pacing and timing:
- Floating pace clock overlay
- Standalone pace clock app
- Interval-based and rest-based views
- Estimated workout duration

Video and feedback systems:
- Drill demonstration videos linked from sets
- Timestamped video references
- Delayed playback poolside mirror system
- Underwater and multi-angle feedback concepts

Hardware and accessories:
- Waterproof phone cases with built-in stands
- Poolside mounting concepts
- Potential partnerships

Accounts and data:
- Optional user accounts
- Saved preferences
- Workout history
- Email capture

AI and higher tiers:
- AI as constrained editor
- AI-generated coaching notes
- Full AI generation only after validator maturity

============================================================================
KNOWN ISSUES
============================================================================

- Rare odd-length leaks in edge cases
- Effort gradients slightly overrepresented
- Full Gas underrepresented in some runs

============================================================================
END OF FILE
============================================================================
