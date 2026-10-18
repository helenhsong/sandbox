# Flow

What the prototype window steps through (back and forward) and what fast-forward fills in.
Fast-forward always takes the happy path and only fills what's empty or invalid; the presenter
still presses each screen's own button. Write this while building, and keep it in sync with the
code.

## Screens (`useHistoryState` key in `App.tsx`)

| Screen | Reached from | Fast-forward |
| --- | --- | --- |
| | | |

## Flow steps (`useHistoryState(…, { nested: true })`)

| Step | Required to continue | Fast-forward fills |
| --- | --- | --- |
| | | |

## Simulated waits

- None yet. (A review, payment or upload that would take time: how long the prototype waits,
  and that fast-forward completes it successfully.)
