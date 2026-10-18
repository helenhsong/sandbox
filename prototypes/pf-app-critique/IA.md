# PF App Critique — IA

## Summary

A logged-in desktop app (Slack), so the prototype starts signed in inside Slack's app shell: workspace sidebar on the left, the busy project channel in the middle, and the profile panel opening on the right. Kept from Helen's outline: the entry from a busy project channel, the fixed header (name, position, team, location), a person-scoped search at the top, and the Info, Activity and Shared tabs with their contents. The Shared tab shows everything by default with a "Shared with you" filter, and every item says where it was shared. Filled in (marked *added*): where the message summary sits, what clicking an item does, the private-item and empty states, and the expand icon's place. The rest of Slack (sidebar, other channels, the full expanded view) is not redesigned.

## Objects and actions

| Object | Key attributes shown | Relationships | Actions | How often |
| --- | --- | --- | --- | --- |
| **Person** (primary) | name, position, team, location, local time, contact | posts Messages, shares Files, pins items | open profile, search their stuff, message | many times a day for a new joiner |
| Message | snippet, where (DM / thread / #channel), time | by a Person, in a Conversation | jump to it | daily |
| File | name, type, where shared, date, shared with you or not | shared by a Person in a Conversation | jump to where it was shared | daily |
| Conversation | name, kind (channel, DM, thread) | holds Messages and Files | view (existing Slack) | constant |

## Sitemap

```
Slack (signed in, desktop)
└ #proj-onboarding (busy project channel)        ← entry, existing page
  └ Profile panel: Priya Raman (right side)
    ├ Search (scoped to Priya) → results: Messages, Files
    ├ Search filters (while searching, Slack's set): type ▾ · In ▾ | Includes me · Threads only · Last 7 days
    ├ Info (default)        contact, pinned, then "Ask Priya about" summary
    ├ Activity              recent topics summary (added) + recent messages
    └ Shared                All (default) | Shared with you
```

## Navigation

- Side navigation (Slack's sidebar) is for which conversation you're in; it stays as it is.
- The profile panel's tabs are for how you see the person: Info, Activity, Shared. The search above them looks across all three.
- One side panel at a time, as in Slack: a thread or a profile. Clicking a name inside a thread replaces the thread with that profile (Helen).
- Clicking a message or file in a channel or DM jumps the channel to it and highlights it, with the profile left open. Clicking one that lives in a thread opens that thread in the side panel (replacing the profile) with the reply highlighted, and a back arrow returns to the profile.
- Rejected: a full-page profile. It loses the channel the new joiner is reading and changes Slack's structure.

## Screens

- **Channel** (existing page): a busy #proj-onboarding with a day of messages, threads and files. Clicking a name or avatar opens the panel.
- **Profile panel** (side panel over the channel's right side): extends the message list, as Slack does today.

```
Profile panel
┌ [Expand] (hint only, not designed)                     [Close] ┐
├ Avatar · Priya Raman · Senior Product Designer                 ┤
│ Growth team · San Francisco · 2:14 PM local                    │
├ [Search Priya's messages and files]                            ┤
├ Tabs: Info* | Activity | Shared                                ┤
│ Info:     Contact (email, phone) · Pinned                      │
│           "Ask Priya about" (AI summary, with sources)         │
│ Activity: Recent topics (AI) · messages: snippet, where, time  │
│ Shared:   All 14 | Shared with you 9                           │
│           file rows: icon, name, where shared, date            │
│           locked row: "2 files in private channels"            │
└ Search results replace the tab content until cleared, with    ┘
  type and where filters above them

Thread panel (same slot)
┌ [Back to Priya's profile] Thread #proj-onboarding      [Close] ┐
├ Parent message · "3 replies" · replies (jumped-to one highlighted)┤
└ Reply composer                                                 ┘
```

States: search with no results, and no results for the current filters (with Clear filters); Shared with you empty for someone who hasn't shared anything with you (*added*); private items hinted as a locked row, never named (from the outline).

## Core flow (4 steps)

1. In #proj-onboarding, click Priya's name on one of her messages. The profile panel opens on Info.
2. Open **Shared** and switch to **Shared with you** (or type in the search at the top).
3. Find the file: "Onboarding flow v3", shared in a thread in #proj-onboarding.
4. Click it. The thread opens in the side panel with Priya's reply highlighted; the back arrow returns to her profile.

## Visual notes

- Matches Slack's desktop shell (aubergine rail and sidebar, white content card) and uses Lato, Slack's typeface, at 400 and 700.
- Message, Huddle and a ⋮ menu (copy display name, view files, copy member ID, copy link to profile, hide) sit in a fixed footer at the bottom of the profile panel (Helen). Huddle and Hide are hints only.
- On windows under 1000px the sidebar hides so the channel keeps its width; sidebar and panel widths scale with the window.
- Messages, files and pins in the panel are bordered cards with a gap between them, like Slack's search results (Helen); panel sections are divided by a rule.

## Assumptions and open questions

- Assumed: Info is the default tab, since it matches Slack's profile today.
- Assumed: the expand icon shows in the header but opens nothing.
- Added: the message summary sits at the top of Activity as "Recent topics".
- Open: where "projects they're involved in" lives (a success metric with no home yet).
- Open: guardrail metric.
