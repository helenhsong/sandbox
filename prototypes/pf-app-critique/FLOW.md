# Flow

What the prototype window steps through (back and forward) and what fast-forward fills in.
Fast-forward always takes the happy path and only fills what's empty or invalid; the presenter
still presses each screen's own button.

## Screens (`useHistoryState` keys in `App.tsx`, all nested so they keep each other)

| Screen | Key | Reached from | Fast-forward |
| --- | --- | --- | --- |
| Conversation (#proj-onboarding by default) | `conv` | Sidebar item, or jumping to an item from the profile | Nothing (null) while no profile is open |
| Profile panel | `profile` | Clicking a person's name or avatar on any message | Fills the panel search with "onboarding flow" when it's empty |
| Profile tab (Info, Activity, Shared), per person | `tab:<person>` | Tabs under the panel search | Same as the panel |
| Shared filter (All, Shared with you), per person | `filter:<person>` | Toggle at the top of Shared | Same as the panel |
| Jump target (highlighted message, thread opened) | `target` | Clicking a pinned item, message, file or search result in the panel | Same as the panel |

The panel search text is ordinary state; clearing it (X or Escape) returns to the tabs.

## Flow steps

Core flow: click Priya Raman's name → Shared → Shared with you → "Onboarding flow v3" → the
channel opens that thread and highlights her reply. Nothing is required to continue at any step;
there's no validation.

## Simulated waits

- None.
