# Contractor Permits: framing

## The prompt, as given

> we are creating a web platform that allows a contractor to manage construction permits

## Who I'm designing for

A permit coordinator or office manager at a mid-size general contractor. They
track 30 to 80 permits across 10 or more jobs, and today they do it in a
spreadsheet.

I chose them first because they own the deadlines and feel every miss. Owners
of small contracting firms and project managers come later.

## The job to be done

When I start my day, I want to know exactly which permits need action and by
when, so no job stalls on a lapsed permit or a missed correction.

## How they do it today

A spreadsheet, plus calendar reminders, plus logging into each city portal to
check for changes.

## Goal and how I'd measure it

- **Goal:** efficiency and retention.
- **Success metric:** fewer missed deadlines and expirations.
- **Guardrail:** no city comments or corrections are missed.

## The constraint that shapes the design

Each jurisdiction has its own forms, fees and portal, and there is no shared
API. So the product hands off to the portal, and the coordinator records the
outcome. The prototype makes that visible: every permit has an "Open city
portal" link and a "Last checked in portal" line.

## Direction: an action inbox

The one good idea: the product shows only what needs you, ranked by deadline,
so an empty list means you're done.

Alternatives I considered:

- **A portfolio tracker table.** That's the spreadsheet again. It shows
  everything and leaves the coordinator to find what matters.
- **Autopilot portal scraping.** Not feasible without APIs, and it's a trust
  risk if a scrape silently fails.

## What must be true for this to work

1. Data is entered once per permit.
2. Deadlines are computed correctly.
3. The coordinator trusts the inbox enough to stop checking portals. **This is
   the riskiest link, and it's what the prototype tests.**
4. They come back every morning.

## Context of use

First thing in the morning, at a desk, before the field calls start.

## Trade-offs made

- The inbox hides permits that need nothing. The Permits table is the place to
  look up everything else.
- Corrections are flagged more strongly than any other action, because missing
  one is the guardrail.
- Marking an action done asks for a confirmation number and a next date. That
  costs a few seconds, and it's what keeps the inbox trustworthy without an
  API.
- A permit whose portal status hasn't been checked in 6 or more days gets its
  own "Update status" action, so stale data shows up as work to do.

## Out of scope

- The full application wizard
- Fees and payments
- A mobile field view
- Permissions for subcontractors and owners

## Assumptions (unconfirmed)

- The coordinator is one person, or a very small team, with a single shared
  list.
- A week runs Monday to Sunday, and "this week" is the right planning horizon.
- Six days without a portal check is the point where a status counts as stale.
- A confirmation number exists for most outcomes (a resubmittal, a payment, a
  scheduled inspection).
- Permits are already in the product. How they get there (import, manual
  entry) is not designed here.

## Open questions (unconfirmed)

- Should corrections be snoozable at all, given the guardrail?
- Who else needs to see the list: project managers, superintendents?
- How does the product learn about a new city comment between portal checks?
  Email forwarding from the jurisdiction is one option.
- Do deadlines differ enough per jurisdiction that rules need to be set up per
  city?
- What does the coordinator need on days they're out, such as a handoff or a
  digest?

## What to test next

- Do coordinators stop opening portals "just to check" after a week with the
  inbox?
- Does "Last checked in portal" build trust, or add worry?
- Is the confirmation step fast enough to do every time?
