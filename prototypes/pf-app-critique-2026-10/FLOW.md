# Flow

What the prototype window steps through (back and forward) and what fast-forward fills in.
Fast-forward always takes the happy path and only fills what's empty or invalid; the presenter
still presses each screen's own button. Write this while building, and keep it in sync with the
code.

## Screens (`useHistoryState` key in `App.tsx`)

All screen state lives in one key, `view`: `{ channel, profile, tab, thread }`. Every change below adds a step. The right pane shows the thread when `thread` is set, otherwise the profile.

| Screen | Reached from | Fast-forward |
| --- | --- | --- |
| Channel (#proj-harbor-launch, default) | Start; any channel or DM in the sidebar; Message on a profile; a result in another channel | Opens Priya's profile on Activity, sets the search to "staging" (if empty) and turns on "Involving you" |
| Profile panel (right pane; channel stays visible) | Any author name or avatar in a message; Manager on Info | Same as above: Priya's Activity, "staging", Involving you. Doesn't click a result |
| Profile tab (Info default, Activity, Shared) | Tabs; typing in search on Info switches to Activity; More → View files | — |
| Thread pane (right pane) | "N replies" on a channel message; a thread-reply result in a profile | None (fast-forward is off while a thread is open) |

Closing the right pane (× or Escape) adds a step with `profile: null, thread: null`. The thread pane's back arrow (shown when it was opened over a profile) returns to the profile with its search, filters and tab intact.

## Flow steps (`useHistoryState(…, { nested: true })`)

None. Search text, filters, expanded threads and the highlight are ordinary state.

| Step | Required to continue | Fast-forward fills |
| --- | --- | --- |
| Find a message (profile search) | Nothing required: results update as you type or filter | `query: "staging"`, `involving: true` |
| Jump to a result | Click a row in Activity, Shared or Pinned | — (the presenter clicks) |

Jumping to a result switches the channel if needed (one history step). A channel message scrolls into
view in the channel and highlights in yellow for 3 seconds, with the profile staying open and the clicked
row marked. A thread reply opens the Thread pane in place of the profile, scrolls to the reply and
highlights it, while the parent message in the channel keeps Slack's open-thread tint.

The profile footer (Message, Huddle, More) is fixed at the bottom of the profile pane. More: Copy display
name, View files, Copy member ID, Copy link to profile (each shows a "copied" toast), Hide.

Filters: Involving you (mentions, name mentions, DMs, threads Sam is in), Type (Messages, Threads,
Files; Activity only), Where (channels Priya posts in), Date (any, 7 or 30 days). Search and all
filters apply to Activity; Shared uses search, Where, Date and Involving you. Filters reset when
a different person's profile opens.

## Simulated waits

- None.
