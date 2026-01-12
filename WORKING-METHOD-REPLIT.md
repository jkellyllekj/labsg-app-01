Working Method, Replit Agent Edition

Last updated: 2026-01-12
Status: Authoritative

Purpose

This document defines how we work inside Replit using Agent so we move fast without breaking the project.

Core truth

GitHub is the source of truth.

Replit is the workspace where Agent edits and runs code.

Chat is for planning, review, and decisions.

Documents

We keep two docs only.

PROJECT_STATE.md
This includes a short Decisions section inside it.

WORKING_METHOD_REPLIT.md
This file.

Agent must keep PROJECT_STATE.md current.

Session start rule

At the start of every Agent session, Agent must do this in order.

Read PROJECT_STATE.md and this Working Method.

State the current phase and the next task in one paragraph.

State what files it expects to touch.

Only then start editing.

If Agent skips this, stop and restart the session.

Change size rule

Agent must work in small changes.

One goal per change.

Touch as few files as possible.

No refactors unless PROJECT_STATE.md explicitly allows it.

Testing rule, non negotiable

Agent must not claim something works unless it tested it.

For every change, Agent must do the relevant checks and report results.

Run the app, or run the dev server, or run the test command.

If there are no tests, Agent must at least run the app and confirm the expected screen or output.

If the change cannot be tested in Replit, Agent must say why and what manual step is required.

For UI changes, Agent must generate a sample output (e.g., generate a workout) and visually verify the result looks correct before marking the change complete.

Thorough testing checklist

Before completing any task, Agent must:

1. Restart the workflow if code was changed.
2. Generate a sample output and verify it visually (screenshot or API test).
3. Check console/workflow logs for errors.
4. Update PROJECT_STATE.md with what changed.
5. Only then mark the task complete.

Definition of done for each change

A change is done only when all are true.

Code change is made.

App or tests have been run.

Any errors are fixed or clearly listed.

PROJECT_STATE.md is updated with what changed.

Context decay control

When the session feels confused, repeating, or risky:

Stop.

Re read PROJECT_STATE.md.

Summarise what is currently true.

Continue with one small change only.

New project intake, first session only

When starting a new app, Agent must ask and record answers in PROJECT_STATE.md.

What platforms must be supported now. Android, iOS, web.

What platforms might be needed later.

Is this a prototype or a long term product.

Do we need login, payments, push notifications, offline, sync, background tasks.

Data and storage needs. Local only, cloud, database.

Deployment target. App store, web hosting, internal only.

Team size. Solo or shared.

Then Agent must recommend a stack and write the decision into PROJECT_STATE.md.

Safety rails

Agent must never do these without asking first.

Delete databases.

Delete large folders.

Replace the whole app structure.

Migrate frameworks.

If something big is needed, Agent proposes a plan and waits.

Pause In Action protocol

Invoked by saying "Pause In Action" or "pause in action".

When invoked, Agent must immediately:

1. Stop problem-solving. Halt current work.

2. Lock repo truth. Ensure all changes are saved and committed.

3. Update PROJECT_STATE.md. This is critical. The following sections must reflect the current reality:

   - Next single step section. Update with what was completed this session and what remains.
   
   - Decisions section. Add any new decisions made during this session.
   
   - Vision section. Add any new ideas, initiatives, or future directions discussed (pricing tiers, App Store plans, advertising, new features, etc). Ideas must never be lost.
   
   - Observed failures section. Add any new bugs discovered or fixed.

4. Produce a Handover Message. This is mandatory. Without it, the pause is invalid.

The Handover Message must include:

- What was done this session. List the changes made.

- Current state. What is working, what is not.

- Outstanding initiatives. Big picture items still to do (App Store, pricing, advertising, features discussed but not built, etc).

- Next steps. What should be tackled in the next session.

- Any blockers or decisions needed.

- Files touched. List the key files that were modified.

5. Produce a Next Agent Prompt. A ready-to-use message that the next agent (or fresh session) can use to pick up exactly where we left off. This prompt should reference the updated PROJECT_STATE.md and summarize the immediate context.

The purpose is to preserve all ideas and context so nothing is lost between sessions. PROJECT_STATE.md is the living document that accumulates everything. The handover message and next agent prompt ensure continuity.

Note: WORKING-METHOD-REPLIT.md (this file) is stable and rarely changes. PROJECT_STATE.md is continuously updated and is the source of truth for current progress, ideas, and goals.