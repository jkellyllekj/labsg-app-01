# Working Method, Replit Agent Edition

Last updated: 2026-01-15  
Status: Authoritative

## Purpose

This document defines how we work inside Replit using the Agent so we move fast, avoid context decay, and do not waste time or money.

This is a reusable working method intended to apply to any project.

## Core truth

GitHub is the source of truth for code history and rollback.

Replit is the workspace where the Agent edits and runs code.

## Context decay control

- After the main files are loaded into the chat (the project’s designated project state file, WORKING-METHOD-REPLIT.md, and the current runtime file such as index.js), the assistant must NOT rewrite or re output the entire runtime file for small changes.
- Instead, the assistant must provide precise, targeted edit instructions for the Replit Agent: file path, the exact function or location to change, and the exact replacement snippet.
- Only output full file replacements when explicitly requested, or when a change is so large that a partial edit would be riskier.
- This avoids context decay and reduces wasted Replit Agent usage costs.

Chat is for planning, reasoning, review, and decisions.

The Agent is an execution tool, not the primary thinker.

## Documents

We keep three documents only.

Project state file  
This is the authoritative, living record of the project. It contains vision, constraints, decisions, known limitations, and next steps.

The filename is project specific and must begin with `PROJECT_STATE_`  
Example: `PROJECT_STATE_CAPISCO.md`

WORKING-METHOD-REPLIT.md  
This file. It defines how we collaborate with the Agent.

COACH_DESIGN_NOTES.md or other design notes  
Optional, project specific, deep intent documents. These are not required reading for the Agent unless explicitly instructed.

The Agent must keep the project’s designated project state file current when instructed.

## Agent operating mode

Default mode is EXECUTION ONLY.

The Agent does not own planning, architecture, or product decisions unless explicitly asked.

The human plus ChatGPT do the thinking.  
The Agent does the edits, runs the app, and reports results.

## Session start rule

At the start of every Agent session, the Agent must do this in order.

1. Read the project’s designated project state file and this Working Method.
2. State the current phase and the next task in one short paragraph.
3. State which files it expects to touch.
4. Wait for confirmation or proceed only if explicitly told to execute.

If the Agent skips this, stop and restart the session.

## Planning rule

Planning is done in chat, not by the Agent.

The Agent must not generate its own plans unless explicitly asked to do so.

If a task is already well defined, the Agent must skip planning and execute directly.

## Change size rule

Agent must work in small, bounded micro changes.

One goal per micro change.

An Agent run may include up to 3 micro changes if they are fully independent and low risk.  
Each micro change must be committed separately.

Touch as few files as possible.

No refactors unless the project’s designated project state file explicitly allows it.

## Testing rule, non negotiable

The Agent must not claim something works unless it was tested.

For every change, the Agent must perform the relevant checks and report results.

This includes one of the following, depending on the task.

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

## Context decay control

When the session feels confused, repetitive, or risky.

Stop.

Re read the project’s designated project state file.

Summarise what is currently true.

Continue with one small change only.

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

The project’s designated project state file is the memory.  
The handover and prompt preserve continuity between sessions.

## Stability note

This document should change rarely.

The project’s designated project state file changes often.

If this document needs to change, it should be discussed and agreed deliberately.
