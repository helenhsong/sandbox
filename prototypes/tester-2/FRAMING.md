# tester #2: framing note

Anything marked (assumed) is a working assumption, not something Helen or the interviewer has confirmed. Interviewer context has not been shared yet.

## Prompt (as given)

A project page for a contractor managing multiple permit applications, tasks, and inspections across dependent lifecycles.

## Setup answers

- Purpose: design challenge
- Platform: desktop web
- Design library: helenhsong/ui default
- Fidelity: polished multi-flow demo
- Core scenario: one project overview with permits, tasks and inspections on a single dependency timeline, with blockers flagged

## Questions asked and answers

None yet.

## Problem statement

(assumed) A contractor tracks permits, site work and inspections in separate places, but each one gates the next: a permit must be approved before a trade can start, the work must be done before the city inspects it, and the inspection must pass before the next trade starts. When one link slips, nobody sees what it holds up until the schedule has already moved.

## Primary user

(assumed) A general contractor project manager or owner-operator running 3 to 6 residential jobs, juggling city permits, subcontractors and inspectors. Chosen because this person owns the schedule and is the one who gets the call when something upstream slips.

## Goal

(assumed) Fewer schedule slips caused by permit and inspection dependencies.

## Success metric and guardrail

- (assumed) Time to identify what is blocking the job and who owns it: under 10 seconds from the project page.
- (assumed) Reinspections scheduled the same day as a failure.
- Guardrail (assumed): no increase in missed inspection windows or permit expirations.

Where the prototype makes these observable: the "Needs attention" strip names each blocker, its date and how many items it holds; every item's drawer shows its owner; a failed result creates the reinspection immediately and offers scheduling.

## Context of use

(assumed) At a desk, at the start of the day and when a call from an inspector comes in.

## Constraints

- None stated by the interviewer yet.
- Design system: Inter 14px for all text, hierarchy by weight and color only, helenhsong/ui tokens and Button.
- Desktop layout aimed at 1280 to 1600 px, usable at 1024 px.
- Sample data only. The contractor, subcontractors, city and projects are fictional.

## Key assumptions

- Permits, tasks and inspections are one graph: permit, then task, then inspection, then the next task. Dates, the critical path, float and blocked chains are computed from that graph, not entered by hand.
- The schedule runs in working days (Monday to Friday), with no holidays.
- A permit in corrections is assumed to be resubmitted on its due date, then take 5 working days of review.
- An inspection can be booked ahead once its upstream task is in progress or ready to start.
- A failed inspection creates a correction task for the same subcontractor and a reinspection that needs one working day of notice; whatever waited on the inspection now waits on the reinspection.
- "Blocked" means directly waiting on a permit that is not approved. Everything further down that chain is shown as held.
- Schedule health compares the projected finish with the target completion: 3 or more working days late is "At risk", 1 to 2 is "Watch".

## Trade-offs

- One timeline with three swimlanes instead of separate permit, task and inspection views. It shows the cross-type dependencies, at the cost of density; the List view and filters are the fallback.
- Each item gets its own row so labels and connectors stay readable, which makes the timeline tall.
- Every status color is paired with a text label and the bar shape differs by type, so nothing depends on color alone.
- The impact preview shows float being used as well as dates moving, so "no change" is an explicit answer, not an empty table.
- Actions are immediate with Undo instead of confirm dialogs, except the failed result, which previews its impact first because it adds items and can move the finish date.

## Demo shortcuts

- Today is fixed at Mon, Oct 12, 2026. A result can be recorded for the Oct 15 rough electrical inspection without advancing the date.
- "Simulate city approval" stands in for the city's response.
- The first request for the earliest inspection window fails on purpose, to show the error and retry path.
- Switching projects shows a short loading skeleton in place of a real fetch. State resets on reload.

## Out of scope

- Submitting permits to city portals
- Billing
- Messaging subcontractors

## Open questions

- Is the user a GC project manager, an owner-operator, or office staff who handle permitting?
- Which matters more to the business: finishing on time, or not wasting subcontractor trips?
- How much of this data already exists (city portal status, a scheduling tool), and what would be entered by hand?
- Do inspectors give windows or exact times, and how far ahead can inspections be booked?
- Is mobile use on site in scope later?

## What to test next

- Can a PM name the top blocker and its owner within 10 seconds of landing on the project page?
- Do people read the connectors and the critical path correctly, or do they rely on the "Needs attention" strip and the drawer?
- Does the impact preview change what people do after a failed inspection (for example, booking the reinspection right away)?
- Is the portfolio triage enough to start the day, or do they open each project anyway?
