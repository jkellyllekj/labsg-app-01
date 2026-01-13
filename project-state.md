# Project State

Project: Swim Workout Generator  
Working title(s): SwimDice, SetRoll, PacePalette (TBD)  
Last updated: 2026-01-13  
Status: Authoritative  

## Read first

This file is the source of truth for the current state of the project.  
If anything here is unclear or stale, stop and update this file first.

Chat memory is helpful but the repo is truth.

## Agent brief

Goal right now: ship a stable v1 to Android Play Store.

Rules for Replit Agent:
- Execute only. Do not plan beyond a short summary.
- Do not scan the repo.
- Touch only files named in the task.
- One small change per task.
- Update this file only when explicitly instructed.

Default files allowed for most tasks:
- index.js
- project-state.md
- replit.md
- WORKING-METHOD-REPLIT.md

Deep coaching intent lives in:
- COACH_DESIGN_NOTES.md  
Agent does not need to read it unless explicitly told.

## Current phase

v1 Coach Plausibility plus Validity Hardening, then ship.

Purpose:
- Keep a minimal working app running in Replit
- Generate coach plausible workouts that feel human
- Keep pool valid structure, especially for custom pools
- Keep output parseable so UI chips and reroll work reliably
- Add optional pacing and time estimates without breaking basic mode
- Prepare for Android release path

## Vision

Core identity:
- This is a coach-quality swim workout generator, not a random set generator
- Core generation is rule-based first, not AI-first
- The algorithm is already strong and should be refined, not replaced
- The app should feel like a real coach, not just outputting sets

AI's future role:
- Conversational coaching
- Explaining intent behind sets
- Asking for feedback ("How did that feel?")
- Adjusting future sessions based on feedback

Design philosophy:
- Clean modern UI
- Mobile first, used poolside
- Beautiful, friendly, readable

Platform targets:
1. Android is far in the future
2. iOS after Android
3. Web app for development preview and easy sharing

Cross platform strategy:
- React Native with Expo is the intended path for the store releases
- Keep the current web app as the reference implementation and testbed
- Later extract the workout engine into a reusable module

Generation strategy:
- v1 uses fast deterministic generation for most output
- Deterministic generation is a feature, not a compromise, because it is instant and low cost
- AI is reserved for later premium tiers, mainly for conversational coaching, cues, explanations, and personalization
- AI should not invent random drills. It should select from controlled templates and explain them

Coach experience intent for future:
- User can talk to the app like a coach
- App can give cues and focus points, not just the set
- App can ask for feedback like how did that feel and adapt suggestions
- App supports saving workouts and favourites

Workout library intent:
- Build a large library of canonical sets over time
- If the library grows large enough, many sessions can be generated without AI calls

Coach upload intent:
- Coaches can upload their own workouts and tag them
- Users can generate from a coach specific library

Monetization intent:
Three tier model based on generation method.

Free tier:
- Deterministic generation
- Standard pools only
- Limited options
- Ads

Mid tier:
- Enhanced deterministic generation
- Custom pool lengths
- More strokes and equipment options
- No ads

Premium tier:
- AI assisted generation and coaching
- Deeper customization and guidance
- No ads

## Confirmed UI / UX decisions

Dolphin reroll:
- Spins only
- No glow, haze, fade, opacity, scaling, or highlight
- Animation is correct and final

Backgrounds:
- Stored in /public/backgrounds
- Format: .webp (currently .png, to be converted)
- Random background chosen on page load only
- Generate button does not change background
- User can manually cycle background via a small icon near the title (to be implemented)
- Backgrounds are aesthetic, not semantic. They must never interfere with readability.

## What is frozen for v1

- No accounts, saving, sharing, or user profiles
- No season planning
- No multi sport expansion
- No paywall implementation yet, only design intent
- No major stack changes inside the current Replit v1

## What is allowed

- UI refinements inside index.js
- Contract refinements so parsing is reliable
- Validity gates for pool correctness
- Deterministic fallbacks when AI output is invalid
- Reroll logic improvements, but reroll must never break generation
- Optional advanced options UI, default stays basic
- Temporary logging for debugging, remove when stable
- Updates to this file and WORKING-METHOD-REPLIT.md

## Active files

Core:
- index.js
- project-state.md
- WORKING-METHOD-REPLIT.md

Supporting:
- replit.md

Design notes:
- COACH_DESIGN_NOTES.md

Reference only:
- working-method.md

Secrets:
- OPENAI_API_KEY exists as a Replit Secret

## Current system snapshot

App:
- Runs in Replit and serves a minimal UI

Inputs:
- Distance slider 500 to 10000, step 100
- Pool buttons: 25m, 50m, 25yd, Custom
- Custom length enabled only when Custom selected
- Optional threshold pace per 100 exists
- Advanced options exist as collapsible UI

Generation behaviour:
- Deterministic generation is the default direction for v1 speed and cost control
- Standard pools may use structured generation logic plus validity gates
- Custom pools must guarantee valid length math and end at the start end

UI rendering:
- Workout output is parsed and rendered as set cards
- Each card includes label, body, reroll button, and styling based on effort zone
- Total summary section renders after sets

Chips intent:
- Per set chips include distance, and optionally estimated time if threshold pace is provided
- Total section includes pool, requested, total, total lengths, and start end confirmation

## Invariants

Coach plausibility:
- Workouts should look like a real coach wrote them
- Warm up and cool down exist by default
- Drill, Kick, Pull, Cool down are typically single segment
- Warm up is one or two segments
- Main is one or two segments, more only when clearly structured
- Avoid odd distances in standard pools, prefer round numbers

Output parse contract:
- Each segment uses NxD format like 8x50, 4x100, 1x400
- Segment lines remain parseable so UI can compute distances and reroll targets
- Avoid free form ladders for v1

Pool validity:
- Pool length is first class
- Standard pools: 25m, 50m, 25yd
- Custom pools: any length in meters or yards
- Every set ends at the start end, and the full workout ends at the start end
- Standard pools match requested total exactly
- Custom pools may choose nearest valid total when exact is impossible, and must label requested versus total

Timing:
- If threshold pace per 100 is provided, estimate set time and total time
- Rest defaults are allowed, but should be coach plausible

## Known limitations

These are not bugs. They are realism and coaching depth gaps to address later.

- Drill sets can be too repetitive and too uniform in structure
- Some rep counts can feel coach unnatural, such as 11x50
- Drill realism needs improvement, but this is not blocking v1 ship
- Coaching cues and feedback loop are not yet implemented
- Premium AI coaching is not implemented

The authoritative coaching intent and realism rules live in COACH_DESIGN_NOTES.md.

## Current known issues

Workout algorithm produces some excellent sets and some clearly wrong ones.

Errors are conceptual, not structural:
- Disjointed progressions
- Incorrect effort placement
- Some drill and kick logic needs tightening

These issues are best fixed by iteratively refining rules, not by replacing the system.

## Observed failures

Fixed:
- buildOneSetBodyServer undefined, removed duplicate nested routes
- Home route not sending HTML response, fixed HTML assembly
- Minimal workout bug like 1x2000 easy, fixed allocation logic
- Drill Kick Pull multi segment outputs, now single segment
- Custom pools end at wrong end, forced even lengths and valid endings
- Reroll effort only changed once, fixed effort cycling
- Reroll counter reset after first click, persistent rerollCountMap
- Dolphin haze after spin, removed filter and cleared inline filter
- Dolphin reroll haze fixed (2026-01-13): Removed all `filter: drop-shadow(...)` from `@keyframes reroll-spin` and forced `filter: none !important` on `.reroll-dolphin` and `.reroll-dolphin.spinning`. Dolphin now stays crisp during spin.
- Card background did not update after first reroll, stable selector using data-effort, attribute updated

Remaining:
- Dice click can error if set distance cannot be parsed, or if reroll returns invalid output
- Some workouts are too similar across generations
- Drill realism needs improvement, but this is not blocking v1 ship

## Next step

Primary:
- Algorithm refinement and UI polish (Android packaging is far in the future)

Near-term roadmap (before Android):
- Algorithm refinement
- UI polish
- Background cycling control
- Save favourite workouts
- Session feedback and notes
- Tiering and ads logic
- Coach explanations per set

Immediate tasks:
- Remove Viewport Lab link before production
- Final mobile testing across a few screen sizes
- Stabilize dice reroll fallback so it never errors when parsing fails

Nice to have before ship:
- More workout name variety
- Reduce repetition of similar workouts

## Decisions

Only decisions that still matter.

2026-01-06
- v1 is a clean rebuild, not a refactor
- OPENAI_API_KEY is stored only as a secret
- Pool selection uses buttons, distance uses slider

2026-01-06
- Do not trust AI arithmetic for custom pools
- Custom pools are deterministic for validity

2026-01-07
- UI renders workouts as structured set cards, not raw text

2026-01-08
- Coach plausibility rules are first class
- Output must be parseable for UI and reroll
- Reroll must never fail, requires deterministic fallback when needed
- Basic mode first, advanced options must not degrade basic output

2026-01-09
- Effort based zone color system with five levels
- Main sets never green
- Viewport Lab is a temporary testing tool, remove before production

2026-01-12
- Pause In Action protocol formalized in WORKING-METHOD-REPLIT.md
- Android is the primary target, Expo path is recommended later

2026-01-13
- Reroll mechanism is stable: persistent rerollCountMap, effort cycles on every click, card updates every click, dolphin stays crisp
