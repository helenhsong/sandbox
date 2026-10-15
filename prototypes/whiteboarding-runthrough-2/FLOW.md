# Flow

What the prototype window steps through (back and forward) and what fast-forward fills in.
Fast-forward always takes the happy path and only fills what's empty or invalid; the presenter
still presses each screen's own button. Keep this in sync with the code.

## Screens (`useHistoryState("screen")` in `App.tsx`)

| Screen | Reached from | Fast-forward |
| --- | --- | --- |
| Home | Start | Nothing to fill |
| Self-publishing landing | Home: Start your journey | Nothing to fill |
| Publish flow | Landing: Start publishing; a book's Edit | See steps below |
| Your books | After submitting, Save and exit | Empty: loads sample books. Book in review (open its sheet): approve the review |
| Published | A ready book: Publish | Nothing to fill |

## Publish flow steps (`useHistoryState("step", …, { nested: true })` in `PublishFlow.tsx`)

| Step | Required to continue | Fast-forward fills |
| --- | --- | --- |
| 1. Book details | Title, author name, manuscript, description | Title "The Lantern Keeper", author "Maya Chen", manuscript `the-lantern-keeper.docx`, a generated description |
| 2. Cover | Nothing (a template is preselected) | Nothing |
| 3. Audience and price | Audience, a price from $0.99 to $200 | Audience General, price $4.99 |
| 4. Review and submit | Review type, agree to the terms | AI review, ticks the terms |

## Simulated waits

- AI review approves itself after about 5 seconds. Human review waits; fast-forward on the
  book's sheet approves it.
