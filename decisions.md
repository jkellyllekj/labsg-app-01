<!-- __START_FILE_DECISIONS_D000__ -->

# Decision Log

Purpose: capture decisions that constrain future work.  
Rule: short, dated, and only decisions that still matter.

Last updated: 2026-01-08  
Status: **Authoritative**

---

<!--
============================================================================
BLOCK INDEX
DL010 — FORMAT_RULES
DL100 — DECISIONS
============================================================================
-->

<!-- __START_DL_FORMAT_RULES_DL010__ -->

## Format rules

- Decisions are dated and short
- Only decisions that still matter
- No long reasoning
- No copying chat transcripts

<!-- __END_DL_FORMAT_RULES_DL010__ -->

---

<!-- __START_DL_DECISIONS_DL100__ -->

## Decisions

### 2026-01-06 — v1 is a clean rebuild, not a refactor
We are building Swim Workout Generator v1 as a clean minimal app inside Replit, keeping the old prototype as reference only.

### 2026-01-06 — Secrets are environment only
OpenAI key must be stored as Replit Secret named `OPENAI_API_KEY`.  
Never hardcode keys into code or commits.

### 2026-01-06 — v1 UI input strategy
- Pool selection uses buttons, 25m, 50m, 25yd, Custom
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

<!-- __END_DL_DECISIONS_DL100__ -->

<!-- __END_FILE_DECISIONS_D000__ -->
