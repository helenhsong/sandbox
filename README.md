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

## The prototype window

Every prototype runs inside a macOS-style window with back, forward, reload and
a fast-forward button (the cursor icon): a light window on a light gray page
when it's opened on its own, and a dark one filling the slide when it's a live
page in a deck. Each prototype's `main.tsx` starts it with `mountPrototype`
from [`src/live-page`](src/live-page/mount.tsx), and uses the hooks in
[`src/live-page/index.ts`](src/live-page/index.ts):

- `useHistoryState` for the current screen and for each step of a flow (pass
  `nested: true` for a step inside a screen), instead of `useState`. The
  window's back and forward step through them. Don't use the browser's
  history (`pushState`, hash changes) for screens.
- `useDeckFill` on every screen a presenter needs to get through. The window's
  fast-forward button runs it, always along the happy path: fill in realistic
  values for whatever is still empty or invalid, load sample data into an
  empty screen, or finish a simulated wait with its successful outcome
  (approving a review, say).

Don't add sample, shortcut or "prototype only" controls to the prototype itself.

```tsx
import { useDeckFill, useHistoryState } from "../../../src/live-page";

const [step, setStep] = useHistoryState("step", 0, { nested: true });
useDeckFill(step === 0 ? () => update({ title: book.title || "The Lantern Keeper" }) : null);
```
