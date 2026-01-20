# Working Method, Replit Agent Edition
Last updated: 2026-01-20  
Status: Authoritative

## Purpose
This document defines how we work inside Replit using the Agent so we move fast, avoid context decay, and do not waste time or money. This is a reusable working method intended to apply to any project.

## Core truth
GitHub is the source of truth for code history and rollback. Replit is the workspace where the Agent edits and runs code.

## Git first workflow
We now use a Git first workflow so ChatGPT can read files directly from GitHub and we do not need to upload zips or paste large files.

Rules:
- GitHub is the single source of truth.
- Replit is a working copy only.
- ChatGPT reads project files directly from GitHub.
- Replit Agent is execution only.

File link formats:
- Preferred for ChatGPT reading: GitHub file links with `?plain=1`
  Example: `.../blob/main/index.js?plain=1`
- Also acceptable: raw links
  Example: `https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/main/index.js`

Pinning for stability:
- For precise debugging, pin links to a commit hash so the file cannot change under us.
- On a GitHub file page, pressing `y` converts the URL to a commit pinned permalink.

Standard flow:
1. ChatGPT reviews files on GitHub and decides the next change.
2. ChatGPT writes an execution only prompt for the Replit Agent, or the human edits manually.
3. Replit Agent makes the change and tests exactly what was requested.
4. Commit and push to GitHub.
5. ChatGPT re reads the updated GitHub files.

## Context decay control
- After the main files are loaded into the chat (the project’s designated project state file, WORKING-METHOD-REPLIT.md, and the current runtime file such as index.js), the assistant must NOT rewrite or re output the entire runtime file for small changes.
- Instead, the assistant must provide precise, targeted edit instructions for the Replit Agent: file path, the exact function or location to change, and the exact replacement snippet.
- Only output full file replacements when explicitly requested, or when a change is so large that a partial edit would be riskier.
- This avoids context decay and reduces wasted Replit Agent usage costs.

Chat is for planning, reasoning, review, and decisions. The Agent is an execution tool, not the primary thinker.

## Documents
We keep three documents only.

### Project state file
This is the authoritative, living record of the project. It contains vision, constraints, decisions, known limitations, and next steps.

The filename is project specific and must begin with `PROJECT_STATE_`  
Example: `PROJECT_STATE_CAPISCO.md`

### WORKING-METHOD-REPLIT.md
This file. It defines how we collaborate with the Agent.

### COACH_DESIGN_NOTES.md or other design notes
Optional, project specific, deep intent documents. These are not required reading for the Agent unless explicitly instructed.

The Agent must keep the project’s designated project state file current when instructed.

## Agent operating mode
Default mode is EXECUTION ONLY. The Agent does not own planning, architecture, or product decisions unless explicitly asked. The human plus ChatGPT do the thinking. The Agent does the edits, runs the app, and reports results.

## Agent scope, execution only
By default, the Agent must not read project state or working method files. These documents are for the human and ChatGPT.

The Agent must only do what it is explicitly instructed to do in the current message. The Agent must not update docs, propose next steps, or infer intent unless explicitly instructed.

If the Agent is asked to run tests, it must run exactly the specified test and report only the requested output.

## Instruction format rule
ALL instructions sent from ChatGPT to the agent MUST:
- Be enclosed in a single code block
- Begin with "START MESSAGE TO AGENT"
- End with "FINISH MESSAGE TO AGENT"
- Contain all actions, tests, and reporting requirements inline
- Never rely on prose outside the code block

This rule is mandatory and overrides informal instructions.

## Session start rule
At the start of every Agent session, the Agent must do this in order.
1. Wait for explicit instructions.
2. Execute only what is requested.
3. Do not add commentary, next steps, or doc updates unless asked.

If the Agent skips this, stop and restart the session.

## Planning rule
Planning is done in chat, not by the Agent. The Agent must not generate its own plans unless explicitly asked to do so. If a task is already well defined, the Agent must skip planning and execute directly.

## Change size rule
Agent must work in small, bounded micro changes. One goal per micro change.

An Agent run may include up to 3 micro changes if they are fully independent and low risk. Each micro change must be committed separately.

Touch as few files as possible. No refactors unless the project’s designated project state file explicitly allows it.

## Testing rule, non negotiable
The Agent must not claim something works unless it was tested. For every change, the Agent must perform the relevant checks and report results. This includes one of the following, depending on the task.
- Restart the workflow and run the app.
- Generate a sample output and visually verify it.
- Run the relevant command or test if applicable.

If something cannot be tested in Replit, the Agent must say why and describe the required manual step.

## Definition of done
A change is done only when all of the following are true.
- Code change is made.
- App or tests have been run.
- Errors are fixed or clearly listed.
- The project’s designated project state file is updated if instructed.

## Context decay control, recovery
When the session feels confused, repetitive, or risky:
1. Stop.
2. Re read the project’s designated project state file.
3. Summarise what is currently true.
4. Continue with one small change only.

## New project intake, first session only
When starting a new project, the Agent must ask and record answers in the project’s designated project state file.
- Target platforms now.
- Platforms possibly needed later.
- Prototype or long term product.
- Login, payments, ads, notifications, offline, sync.
- Data and storage needs.
- Deployment target.
- Team size.

Only then may the Agent recommend a stack and record the decision.

## Safety rails
The Agent must never do the following without explicit permission.
- Delete databases.
- Delete large folders.
- Replace the whole app structure.
- Migrate frameworks.

If something big is needed, the Agent proposes and waits.

## Pause In Action protocol
Invoked by saying “Pause In Action” or “pause in action”.

When invoked, the Agent must immediately do the following.
1. Stop problem solving and halt work.
2. Ensure code is saved and in a stable state.
3. Update the project’s designated project state file with current reality, including:
   - Next steps
   - Decisions made
   - Vision updates
   - Observed failures
4. Produce a Handover Message that includes:
   - What was done this session
   - Current state
   - Outstanding initiatives
   - Next steps
   - Blockers
   - Files touched
5. Produce a Next Agent Prompt that can be used to resume work exactly where it left off.

The project’s designated project state file is the memory. The handover and prompt preserve continuity between sessions.

## Stability note
This document should change rarely. The project’s designated project state file changes often. If this document needs to change, it should be discussed and agreed deliberately.

## Agent Instruction Boundaries (Snapping + Regeneration Logic)
Effective Jan 2026, the Agent must follow these rules when working on snapping, set math, or regeneration logic:
- DO NOT use any fallback methods like `safeSimpleSetBody()` to force totals.
- DO NOT allow templates that mismatch the section's assigned distance.
- DO NOT use plus or minus range matching in `pickTemplate()` or `findBestFit()`. Only exact matches are valid.
- DO NOT inject single line fillers (example: 1x50 easy) to close gaps.
- DO NOT reintroduce per pool snapping logic. All pools use a shared engine.
- All regeneration (Main, Drill, etc.) must:
  - Retain original snapped allocation
  - Match math exactly
  - Snap to 2 times poolLength
