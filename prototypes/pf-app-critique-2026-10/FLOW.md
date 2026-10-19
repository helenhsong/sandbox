# Flow

What the prototype window steps through (back and forward) and what fast-forward fills in.
Fast-forward always takes the happy path and only fills what's empty or invalid; the presenter
still presses each screen's own button. Write this while building, and keep it in sync with the
code.

## Screens (`useHistoryState` key in `App.tsx`)

All screen state lives in one key, `view`: `{ channel, profile, tab, thread, prev }`. Every change below adds a step. The right pane shows the thread when `thread` is set, otherwise the profile. `prev` is the pane this one replaced (a stack), which the pane's back arrow returns to.

Slack's top-bar back and forward (and ⌘[ / ⌘]) call the same history as the window's arrows, so every step is reachable from inside the product too. Channels and profile lists keep their scroll position per channel and per person and tab, and each person keeps their own search and filters, so going back lands where you left off.

| Screen | Reached from | Fast-forward |
| --- | --- | --- |
| Channel (#proj-harbor-launch, default) | Start; any channel or DM in the sidebar; Message on a profile; a result in another channel | Opens Priya's profile on Activity, sets the search to "staging" (if empty) and turns on "Involving you" |
| Profile panel (right pane; channel stays visible) | Any author name or avatar in a message; Manager on Info | Same as above: Priya's Activity, "staging", Involving you. Doesn't click a result. Not offered once that's all in place, so the button disappears |
| Profile tab (Info default, Activity, Shared) | Tabs; typing in search on Info switches to Activity; More → View files | — |
| Thread pane (right pane) | "N replies" on a channel message (including after a reply result highlighted it) | None (fast-forward is off while a thread is open) |

Closing the right pane (× or Escape) adds a step with `profile: null, thread: null, prev: null`. Whenever a pane replaces another (thread over profile, profile from a name in a thread, Manager), its header shows a back arrow ("Back to Priya's profile", "Back to thread") that returns to it with its tab, search and filters intact.

## Flow steps (`useHistoryState(…, { nested: true })`)

None. Search text, filters, expanded threads and the highlight are ordinary state.

| Step | Required to continue | Fast-forward fills |
| --- | --- | --- |
| Find a message (profile search) | Nothing required: results update as you type or filter | `query: "staging"`, `involving: true` |
| Jump to a result | Click a row in Activity, Shared or Pinned | — (the presenter clicks) |

Every result (Activity, Shared, Pinned) opens the same way: one history step that switches to the
message's channel if needed, scrolls to it and highlights it in yellow for 3 seconds, with the profile
staying open and the clicked row marked. A thread reply highlights its parent message and the parent's
"N replies"; clicking that opens the thread scrolled to the highlighted reply, with a back arrow to the
profile. Top-bar back returns to the channel you came from.

The profile footer (Message, Huddle, More) is fixed at the bottom of the profile pane. More: Copy display
name, View files, Copy member ID, Copy link to profile (each shows a "copied" toast), Hide.

Filters: Involving you (mentions, name mentions, DMs, threads Sam is in), Type (Messages, Threads,
Files; Activity only), Where (channels Priya posts in), Date (any, 7 or 30 days). Search and all
filters apply to Activity; Shared uses search, Where, Date and Involving you. Filters reset when
you open someone who isn't already in the pane's back stack; going back to a profile restores them.

## Simulated waits

- None.
