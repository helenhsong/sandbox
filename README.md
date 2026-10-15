# Sandbox

Registry for Helen's standalone prototypes, including interview design
challenges, rapid product explorations, and client demos.

Portfolio projects that live under `helenhsong.com` are not tracked here.

Each prototype lives in this repository at `prototypes/<slug>/` as its own
page of one Vite app, and the home page lists every prototype as a link. The
`helen-prototype` skill sets the app up on first use.

- The site deploys to https://helenhsong.github.io/sandbox/ on every push to `main`.
- `projects.json` is the registry.
- `projects.schema.json` defines its format.
- New entries are normally added by the `helen-prototype` skill.


## Running it

```bash
npm install
npm run dev        # home page at /, each prototype at /<slug>/
npm run build      # type-checks, then builds every page into dist/
npm run typecheck
npm run lint
```

New prototypes start as a copy of `templates/prototype/`. They use the
`default` system from [`@helenhsong/ui`](https://github.com/helenhsong/ui)
unless their registry entry says otherwise.

## Prototypes in decks

A deck's live page shows a prototype in a macOS-style window with back, forward,
reload and a fill button. Every prototype supports them with the hooks in
[`src/live-page`](src/live-page/index.ts):

- `useHistoryState` for the current screen and for each step of a flow (pass
  `nested: true` for a step inside a screen), instead of `useState`. Back and
  forward then step through them, in the deck window and in the browser.
- `useDeckFill` on every screen with required input. Its function fills in
  realistic values for whatever is still empty or invalid, or loads sample
  data into an empty screen, so a flow can be walked through quickly. Don't
  add sample or shortcut buttons to the prototype itself.

```tsx
import { useDeckFill, useHistoryState } from "../../../src/live-page";

const [step, setStep] = useHistoryState("step", 0, { nested: true });
useDeckFill(step === 0 ? () => update({ title: book.title || "The Lantern Keeper" }) : null);
```
