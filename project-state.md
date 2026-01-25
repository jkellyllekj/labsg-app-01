# Project: Swim Workout Generator

Working title(s): SwimDice / SetRoll / PacePalette (TBD)  
Last updated: 2026-01-25  
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

The assistant must always provide explicit, start to finish instructions.

This means:
- Always specify the exact file name(s)
- Always specify exactly where to change the file (section or heading and position)
- Always provide copy and paste ready text blocks for additions or replacements
- Do not say "add this somewhere" or "put this in the project state" without exact placement
- Planning happens in chat. The agent is execution only.

Agent message format rule (from WORKING-METHOD-REPLIT.md):
- All instructions sent to the agent must be enclosed in a single code block
- Begin with "START MESSAGE TO AGENT"
- End with "FINISH MESSAGE TO AGENT"
- Contain all actions, tests, and reporting requirements inline
- Never rely on prose outside the code block

============================================================================
PROJECT INTENT
============================================================================

Swim Workout Generator (SwimGen) is intended to be a real, shippable consumer app, not a demo.

The goal is:
- A usable, attractive, coach plausible swim workout generator
- Deployed first as a web app
- Then wrapped and shipped to the iOS App Store
- With monetisation from day one
- Without architectural dead ends that require a rebuild

Long term evolution is expected (years), but v1 must stand on its own.

============================================================================
CURRENT PHASE
============================================================================

Phase: v1 Reality Anchoring and Productisation

Primary goals:
- Generator outputs are coach plausible on first generation
- Set structures feel conventional and recognisable
- Workouts are wall safe in all pool lengths
- The app is usable poolside
- Product is ready for TestFlight by end of February

Constraints:
- Core generator correctness is prioritised
- UI redesign is not permitted, but additive UI evolution is allowed
- No AI rewrite layer yet
- Changes must be bounded and testable
- Avoid speculative architecture work

Phase is complete when:
- Generator uses a finite catalogue of coach normal set structures
- Outputs can be swum without "why would a coach do this" moments
- v1 feature set is complete and internally stable
- App is ready for TestFlight distribution

============================================================================
ARCHITECTURE OVERVIEW
============================================================================

- Entire app runs from index.js (single file logic plus UI)
- styles.css exists
- Workouts are generated deterministically with seeded variation
- Manual swimming and inspection is authoritative
- The agent is execution only
- Planning, validation, and judgement happen in chat

============================================================================
PAUSE IN ACTION AND NEW CHAT HANDOVER
============================================================================

When a Pause In Action is declared:
- The current chat is disposable
- Continuity must be recovered from this file
- No prior chat context should be assumed

Canonical raw links:
PROJECT: labsg-app-01
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/project-state.md
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/WORKING-METHOD-REPLIT.md
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/COACH_DESIGN_NOTES.md
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/index.js
https://raw.githubusercontent.com/jkellyllekj/labsg-app-01/main/styles.css

Rules:
- Assistant cannot browse repo folders
- Only exact file URLs are readable
- After any logic change, index.js must be re linked (raw link is sufficient)

Pinning rule:
- For precise debugging, pin index.js to a commit permalink when investigating a bug so the file cannot change under us.

============================================================================
WORKOUT STRUCTURE RULES
============================================================================

Standard section order:
1. Warm up
2. Build
3. Kick
4. Drill
5. Main
6. Cool down

Rules:
- Warm up and cool down are always low effort
- Build is warm up part two
- Main is primary intensity
- No section may end off wall

Short workout rule (critical):
- 1000m workouts must not be over constrained by forcing all sections
- The generator must avoid impossible constraint combinations at short totals

Section gating (current intent):
- Below 1200m: Drill may be omitted
- Below 1000m: Kick and Drill may be omitted
- At 1800m and above: full structure is expected

This gating exists to prevent constraint satisfaction failure at short totals.

============================================================================
DISTANCE AND POOL RULES
============================================================================

- All sets must end on the same wall they start
- Set distances must be divisible by 2 times pool length (wall safe)
- Slight total overshoot is allowed only to preserve wall endings when custom pools require it
- Custom pool lengths (example 33m) are first class citizens
- For standard pools (25m, 50m, 25yd) totals should match the slider exactly

============================================================================
EFFORT RULES
============================================================================

- Warm up and Cool down: blue or green only
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

- index.js is runtime authority
- Generator never returns null or fails silently
- Reroll must always produce a valid workout
- Reality Anchors remain active constraints:
  - Section distance buckets enforced for Warm up, Kick, Cool down
  - Sprint volume caps enforced, with single line sprint blocks rejected
  - Validation is section aware via validateSetBody(body, targetDistance, poolLen, sectionLabel)

============================================================================
PRODUCT TIERS AND MONETISATION (v1)
============================================================================

SwimGen uses a subscription based model. Generator rerolls are deterministic and local. Monetisation is not tied to generation count.

Free (ad supported):
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
- Pace aware set suggestions
- Advanced control over effort and stroke bias
- Intended home for future advanced features

Notes:
- No standalone ad removal only tier
- Subscription only (monthly and yearly)
- No lifetime unlocks
- Free trial supported where platform allows

Accounts:
- No mandatory accounts in v1
- Account system deferred to post v1

============================================================================
UI EVOLUTION RULES
============================================================================

UI is stable but not frozen.

Rules:
- Structural redesign is not allowed in v1
- Additive and reversible UI changes are allowed
- Visual variants (example white background) may be added if they do not destabilise layout or interaction
- Gesture heavy interactions are deferred

The current colour coded workout cards are a core engagement feature.

============================================================================
RECENT WORK (FACTS, NOT PLANS)
============================================================================

- Post generation validator added (2026-01-21)
- Exact target totals enforcement for standard pools added (2026-01-21)
- Rep count realism caps and odd prime rep elimination added (2026-01-21)

Constraint failure discovery:
- Short totals (especially 1000m) can fail due to too many required sections plus realism targets plus snapping and validation.
- Failure manifests as repeated retries and the UI showing "Fallback Workout".
- This is a constraint satisfaction issue, not a one line bug.

Recent mitigation work:
- Introduced section target resolving so sections target coach normal distances.
- Helper scope issues caused fallback to appear constantly until resolver and snap wrappers were restored to global scope.
- Short distance failures still require a structural fix, not number tweaks.

============================================================================
TESTING AND TOOLING
============================================================================

- Automated smoke test script: scripts/gen_smoke_test.js

Smoke test suites:
- Suite A: crash and retry hardening
- Suite B: rep count sanity (25m)
- Suite C: intensity detection (TODO)
- Suite D: 25yd parity

Manual testing is authoritative. Short distance manual testing is mandatory:
- 25m at 1000, 1500, 2000
- Custom pool at 2000

============================================================================
KNOWN LIMITATIONS
============================================================================

- API returns workoutText plus structured metadata
- /generate-workout includes:
  - sections
  - sectionMeta
  - workoutMeta

This enables detection of:
- red presence
- label and colour mismatches
- striation patterns

============================================================================
NEXT SINGLE STEP (ACTIVE)
============================================================================

Implement robust short distance section gating and allocation so 1000m never falls back.

Definition of done for this step:
- 25m at 1000 generates successfully 50 out of 50 times
- 25m at 1500 generates successfully 50 out of 50 times
- 25m at 2000 generates successfully 50 out of 50 times
- No "Fallback Workout" in these runs
- Total matches slider for standard pools

Scope lock:
- No template library work until 1000 to 2000 generation is stable again
- No UI work in this step

============================================================================
IDEA PARKING LOT (NOT SCHEDULED, NOT COMMITTED)
============================================================================

Rule: Idea Capture Responsibility

If an idea is discussed and not written here, it is considered lost.

Items below are not tasks and must not be implemented without promotion.

Template driven realism:
- Shift from generate then ban to template first generation
- Large corpus of coach derived set shapes
- Templates tagged by intent, stroke mix, energy system

User customisation and editing:
- Drag to reorder sections
- Resize sections by dragging edges
- Swipe to remove sections
- Lock sections to preserve them across rerolls
- Poolside interaction lock mode to prevent accidental edits
- Manual distance rebalancing when resizing sections
- Workout total may exceed or fall below slider after edits
- Optional lock to preserve total and redistribute
- Insert new section between existing blocks

Visual themes:
- White background and monochrome modes
- Colour banding instead of full card backgrounds
- User selectable themes

Pacing and timing:
- Floating pace clock overlay
- Standalone pace clock app
- Interval based and rest based views
- Estimated workout duration

Video and feedback systems:
- Drill demonstration videos linked from sets
- Timestamped video references
- Delayed playback poolside mirror system
- Underwater and multi angle feedback concepts

Hardware and accessories:
- Waterproof phone cases with built in stands
- Poolside mounting concepts
- Potential partnerships

Accounts and data:
- Optional user accounts
- Saved preferences
- Workout history
- Email capture

AI and higher tiers:
- AI as constrained editor
- AI generated coaching notes
- Optionally suggest coach rationale per set
- Full AI generation only after validator maturity

============================================================================
KNOWN ISSUES
============================================================================

- Short workout constraint failure still observed
- Effort gradients slightly overrepresented
- Full Gas underrepresented in some runs
- Rare odd length leaks in edge cases

============================================================================
END OF FILE
============================================================================
