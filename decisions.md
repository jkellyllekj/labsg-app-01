<!-- __START_FILE_DECISIONS_D000__ -->

# Decision Log

Purpose: capture decisions that constrain future work.  
Rule: short, dated, and only decisions that still matter.

Last updated: 2026-01-06  
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

- Decisions are **dated** and **short**
- Only decisions that still matter
- No long reasoning
- No copying chat transcripts

<!-- __END_DL_FORMAT_RULES_DL010__ -->

---

<!-- __START_DL_DECISIONS_DL100__ -->

## Decisions

### 2026-01-06 — v1 is a clean rebuild (not a refactor)
We are building **Swim Workout Generator v1** as a clean minimal app inside Replit, keeping the old prototype as reference only.

### 2026-01-06 — Secrets are environment-only
OpenAI key must be stored as Replit Secret named: `OPENAI_API_KEY`.  
Never hardcode keys into code or commits.

### 2026-01-06 — Standard vs non-standard pool display rule
- Standard pools: `25m`, `50m`, `25yd`  
  → show conventional distances only (e.g. `10x100`), **no** “(lengths)” annotations.
- Non-standard pools (custom length)  
  → include “(lengths)” annotations **when needed** to preserve clarity.

### 2026-01-06 — Do not trust LLM arithmetic for non-standard pools
For custom pools, the model may output **internally inconsistent** distance/length math.

### 2026-01-06 — v1 UI input strategy (fast + swimmer-intuitive)
- Pool selection uses **buttons** (25m / 50m / 25yd / Custom)
- Distance uses a **slider** (500–10,000) snapping to **100**.

### 2026-01-06 — v1 scope discipline
We are not building accounts, saving, season planning, multi-sport, watch integration, or workout libraries in v1.  
We are building a **single-session generator** that is **pool-valid** and **coach-plausible**.

### 2026-01-06 — Custom pools are deterministic-only in v1
To guarantee pool-valid maths and speed, **custom pool workouts are generated deterministically**.

### 2026-01-07 — UI renders workouts as structured set cards
Workout output is rendered as **set cards** in the UI, not raw text:
- Each set has a label, body, and optional per-set goal
- Labels are normalised and grouped
- Totals render as a separate section at the end

This structure is considered **v1-stable**.

<!-- __END_DL_DECISIONS_DL100__ -->



<!-- __END_FILE_DECISIONS_D000__ -->
