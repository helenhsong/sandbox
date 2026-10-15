# Flow

What the prototype window steps through (back and forward) and what fast-forward fills in.
Fast-forward always takes the happy path and only fills what's empty or invalid; the presenter
still presses each screen's own button. Keep this in sync with the code.

## Screens (`useHistoryState("view")` in `App.tsx`)

| Screen | Reached from | Fast-forward |
| --- | --- | --- |
| Home | Start | Nothing to fill |
| Self-Publishing landing | Home: Start your journey | Nothing to fill |
| Publish flow | Landing: Start publishing; a book's Edit | See steps below |
| Your books | After submitting, Save and exit | Book in review (open its sheet): approve the review |
| Published | A ready book: Publish | Nothing to fill |

## Publish flow steps (`useHistoryState("step", 0, { nested: true })` in `PublishFlow.tsx`)

| Step | Required to continue | Fast-forward fills |
| --- | --- | --- |
| 1. Book details | Title, author name, category, manuscript | Title "The Lantern Keeper", author "Maya Chen", category Fiction, manuscript `the-lantern-keeper.docx` |
| 2. Cover | Nothing (a template is preselected) | Nothing |
| 3. Audience & price | Audience, a price above $0 | Audience General, price $4.99 |
| 4. Review & submit | Confirm the rights to publish | Ticks the confirmation |

## Simulated waits

- AI review approves itself after about 6 seconds. Human review waits; fast-forward on the
  book's sheet approves it.
