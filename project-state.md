# Project: Swim Workout Generator
Working title(s): SwimDice / SetRoll / PacePalette (TBD)
Last updated: 2026-01-20
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

Chat memory is disposable.
This file is not.

============================================================================
INSTRUCTION STYLE RULE
============================================================================

The assistant must always provide explicit, start-to-finish instructions.

This means:
- Always specify the exact file name(s)
- Always specify exactly where to change the file (section/heading and position)
- Always provide copy/paste-ready text blocks for additions or replacements
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
- UI is frozen
- No visual redesigns
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
- styles.css exists but is frozen during v1
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
- UI remains frozen unless this file says otherwise

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
- Kick and Drill should appear in workouts ≥1000m
- No section may end off-wall

============================================================================
DISTANCE AND POOL RULES
============================================================================

- All sets must end on the same wall they start
- Set distances must be divisible by 2 × pool length
- Slight total overshoot is allowed only to preserve wall endings
- Custom pool lengths (e.g. 33m) are first-class citizens

============================================================================
EFFORT RULES
============================================================================

- Warm-up / Cool-down: blue or green only
- Build: progressive (may touch orange, rarely red)
- Drill: usually blue/green
- Kick: may include strong or hard
- Main: yellow/orange/red expected

Variety intent:
- About 60–70 percent of workouts include at least one red exposure
- Gradients should not be overused
- Hard efforts should sometimes stand alone

============================================================================
LOCKED INVARIANTS
============================================================================

- No UI changes during v1
- index.js is the runtime authority
- Generator never returns null or fails silently
- Reroll must always produce a valid workout

============================================================================
RECENTLY COMPLETED (v1)
============================================================================

- Main Set template cooldown implemented
  Prevents reroll repetition of Main patterns
- Drill and Kick rep normalisation
  Odd and prime rep counts eliminated
  Drill and Kick now use coach-plausible even counts

============================================================================
NEXT SINGLE STEP (ACTIVE)
============================================================================

- Tighten snapping and remainder handling so no section
  ever produces odd-length artifacts in any pool

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

Do not implement anything from this section without
explicitly promoting it to an active step.

Long-distance realism:
- Very long workouts (6k–10k) should not look like scaled-up 2k workouts
- Long sessions may use fewer sections with larger blocks
- Distance training should shift from endless 50s toward 100s, 200s, 400s, and occasional 800s

Set construction ideas:
- Drill sets could sometimes alternate drill/swim instead of pure drill
- Kick–Drill–Swim composite sets may be useful later
- Main sets could include broken race or race-pace concepts
- Alternating effort patterns (easy/hard repeats) should sometimes appear

Effort semantics:
- Negative split meaning needs tightening
  (within-rep vs across-rep clarity)
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
- Observed: index.js contained an invalid `Return null.` token inside remainder filler logic near "If stuck, do not output weirdness."
  This may cause section build failure or odd-length leaks in edge cases.
  Fix is to replace with valid `return null;` and propagate null upward to force regeneration.

============================================================================
END OF FILE
============================================================================
