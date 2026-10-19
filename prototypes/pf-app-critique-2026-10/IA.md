# PF App Critique: IA

## Summary

This is a logged-in desktop app. The prototype recreates Slack's existing shell (workspace rail, a narrow channel sidebar, a channel view) and only changes the **profile panel** that opens on the right when you click a person. The team's outline stands as given: a compact header, search with filters, and Info, Activity and Shared tabs.

Added to fill essential gaps (marked *added*):
- An entry point in the channel (avatar or name on a message) and a way out (close button, Escape).
- Clicking a result always works the same way: the profile stays open, and the channel switches to where the message lives and highlights it. A thread reply highlights its parent and the parent's "N replies"; opening the thread lands on the reply, with a back arrow to the profile.
- A way back from everywhere: Slack's top-bar back and forward (⌘[ and ⌘]) step through every view, including channel changes from a result, and land each channel and list where it was scrolled. When you navigate from inside the profile (Manager, or the "N replies" a profile result highlighted), the new pane gets a back arrow to that profile, with its tab, search and filters intact. Opening a profile or thread from the channel or a thread starts a fresh pane with no back arrow.
- Empty and no-results states.
- An "Involving you" highlight inside Activity, carried over from the problem statement.

Visual direction (from Helen's screenshots): Slack's aubergine rail and sidebar, keeping the sidebar narrow (about 220px), and Lato, the font Slack uses, in place of Geist for this prototype.

## Objects and actions

| Object | Key attributes shown | Relationships | Actions | Frequency |
| --- | --- | --- | --- | --- |
| **Person (primary)** | avatar, name, title, team, location, local time, status | posts Messages, shares Files, is in Channels | open profile, message, huddle | many times a day |
| Message | author, text, channel or DM, thread or not, time, mentions you | belongs to Channel/DM/Thread | open in context | daily |
| File | name, type, size, where shared, time | shared in a Message | open, jump to where shared | daily |
| Pin | item pinned to the profile | Message or File | open | weekly |
| Channel | name, members | contains Messages | view | daily |

## Sitemap

```
Workspace shell (rail + narrow sidebar)
└ #proj-harbor-launch (channel, busy)            ← start
  └ Profile panel (right pane; channel stays visible)
     ├ Header: avatar + status dot (hover = status), name, title · team · location, [Expand*] [×]
     ├ Search this person's activity + [Filters] (Type, Where, Date, Involving you)
     ├ Tabs
     │  ├ Info (default when opened)
     │  ├ Activity
     │  └ Shared
     └ Fixed footer: [Message] [Huddle ▾] [More ⋮]
  └ Thread pane (right pane, replaces the profile; back arrow returns to it)
  A pane shows a back arrow only when it was opened from the profile; × or Escape closes the pane and clears that stack.
```

* Expand is a cue only; it shows a "Full profile coming soon" tooltip.

## Navigation

- **Workspace rail and sidebar** control where you are (channel). Unchanged from Slack.
- **Top-bar back and forward** (Slack's, ⌘[ and ⌘]) return to any earlier view: channel, pane, tab. Same history as the prototype window's arrows.
- **Right-pane back arrow** returns to the profile you navigated from ("Back to Priya's profile"). It appears only after navigating from the profile, never when a pane is opened fresh from the channel or a thread.
- **Profile tabs** control which view of this person you see. Search and filters sit above the tabs and apply to Activity and Shared. Typing in search from Info switches to Activity.
- Rejected: a full-page profile. The new joiner needs to stay in the busy channel, and Slack's right pane already keeps context visible.

## Screens

**Channel (two-column: channel + right pane).** Channel header with name, topic, member count, and Messages / Files & links / Pins tabs. Message list with threads, file attachments and reactions. Composer at the bottom.

**Profile panel (right pane, about 400px)**

```
┌ Profile                                         [Expand] [×] ┐
├ Avatar(status dot) Name · title · team · location · local time │
├ [Search Priya's messages and files…]              [⚙ Filters] │
├ Info | Activity | Shared                                       │
├ Info: Contact → Pinned → AI "Ask Priya about"                  │
├ Activity: AI "Working on" summary → Involving you →            │
│   message rows (channel/DM chip, thread tag, time, snippet)    │
├ Shared: file rows (icon, name, type, where shared, date)       │
├ Empty / no-results: "No messages match" + [Clear filters]      │
├──────────────────────────────────────────────────────────────── ┤
└ Fixed footer:                     [Message] [Huddle ▾] [⋮ More] ┘
```

More menu: Copy display name · View files · Copy member ID, Copy link to profile · Hide (destructive).

**Thread pane (right pane).** Header with a back arrow (only when opened from a profile result), "Thread", the channel, and Close. The profile header gets the same back arrow only when opened from another profile (Manager). Parent message, "N replies" divider, replies, reply composer.

Primary action on the panel: finding and opening a message or file. Message and Huddle stay as Slack has them, in the footer.

## Core flow (4 steps)

1. In #proj-harbor-launch, click Priya's name or avatar.
2. The profile opens on Info. Switch to Activity, or type in search ("staging").
3. Narrow with a filter (Involving you, or Threads).
4. Click the message. The profile stays open; the channel scrolls to it and highlights it. Priya's staging reply is in a thread, so its parent and "3 replies" highlight; clicking that opens the thread on the reply, with a back arrow to her profile. Top-bar back returns to the channel Sam started in.

## Assumptions

- Sample workspace, people and content are invented for the prototype.
- AI summaries are static sample text with an "AI summary" label.
- Only messages the viewer has access to appear (channels they're in, DMs with them, public threads).
- The profile only shows what the viewer can already access; private channels they aren't in, including their names, never appear.
