# Contractor Permits: IA plan

## Summary

A logged-in desktop tool, already signed in. It's object-centric (permits)
with an action inbox as the default view, because the core task is "what needs
me today" and the metric is fewer missed deadlines. Five areas sit in a left
sidebar. Only Today and Permits are built fully; Jobs, Inspections and
Jurisdictions are shell pages with ghost states.

## Objects and actions

| Object | Key attributes shown | Relationships | Actions | How often |
| --- | --- | --- | --- | --- |
| **Action** (primary) | type, due date, days left | belongs to a Permit | open, mark done, snooze, undo | daily |
| Permit | number, type, status, submitted, expires, next deadline, last checked in portal | belongs to a Job and a Jurisdiction; has Actions and Correction comments | open, open city portal, update status | daily |
| Correction comment | date, reviewer, discipline, comment | belongs to a Permit | read | daily when open |
| Job | name, address | has many Permits | browse (shell) | weekly |
| Jurisdiction | name, portal | has many Permits | browse (shell) | rare |

Action types: Correction, Inspection, Renewal, Fee due, Document, Update
status.

## Sitemap

```
Today (default)          action list: Overdue, Today, This week
  └ Permit sheet         side sheet over the page
Permits                  one table, views: All (default), In review,
  └ Permit sheet           Corrections, Approved, Expiring soon
Jobs                     shell, ghost state
Inspections              shell, ghost state
Jurisdictions            shell, ghost state
```

Views: the coordinator's morning question ("what needs me?") is answered by
the Today list. Their lookup question ("where is this permit?") is answered by
the Permits table. Every permit opens the same sheet from either place.

## Navigation

- **Chosen:** left sidebar for the five areas. The sidebar controls where you
  are; tabs above the Permits table control which status you see.
- **Rejected:** a top bar. Five areas and dense daily use fit a sidebar
  better, and it leaves the full width for tables.

## Screens

| Screen | Job | Layout |
| --- | --- | --- |
| Today | Show only what needs action, ranked by deadline | Single column: stats, then one grouped list |
| Permit sheet | Everything needed to act on one permit | Right side sheet, fixed footer |
| Permits | Find any permit by status | Single column: tabs with counts, then one table |
| Jobs, Inspections, Jurisdictions | Hold the navigation's place | Shell with ghost blocks |

```
Today
┌ Title: Today · Monday, October 12                                     ┐
├ Stats: Overdue · Due today · Due this week · Open corrections         ┤
├ Action list, grouped: Overdue / Today / This week                     ┤
│   row: action badge · permit no. · type · job · jurisdiction · due ·  │
│        days (number) · [Open]                                         │
│   corrections flagged with a solid badge and a left rule              │
└ Empty state: "All clear"                                              ┘

Permit sheet
┌ Header: permit number · type                                  [Close] ┐
├ Status and key dates: status, submitted, expires, next deadline       ┤
├ Action needed: badge · what to do · due · days left                   ┤
├ City correction comments (list)                                       ┤
├ City portal: last checked N days ago         [Open city portal ↗]     ┤
├───────────────────────────────────────────────────────────────────────┤
│ Footer (fixed):                              [Snooze] [Mark done]*    │
└ Mark done asks for confirmation number and next date, then            ┘
  [Cancel] [Confirm done]*
* primary action
```

## Core flow (4 steps)

1. Today: open the top overdue correction.
2. Read the city's comments in the sheet.
3. Open the city portal and respond there.
4. Mark done with the confirmation number and next date. The row leaves the
   list and an Undo toast appears.

**Edge case shown:** MP-2026-05540 was last checked in the portal 8 days ago.
It shows up as an "Update status" action, and the sheet's primary button
becomes Update status.

## Wayfinding

- The active sidebar item and the page title show the location.
- The sheet sits over a dimmed page, and its header names the permit.
- Escape, the close button and the backdrop all return to the page, with focus
  back on the row that opened the sheet.

## Assumptions and open questions

- "This week" means through Sunday. Unconfirmed.
- Snooze hides an action until tomorrow. Whether corrections should be
  snoozable is open.
- A portal status counts as stale at 6 or more days. Unconfirmed.
- No search or filters yet on Permits; at 30 to 80 permits it will need them.
