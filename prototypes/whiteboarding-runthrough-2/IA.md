# Whiteboarding Runthrough 2 — IA

## Summary

Both product types: a logged-in Amazon storefront (signed in, desktop web) that leads into a self-publishing area. The storefront is shown only as the entry point. The publishing area is hub and spoke: a steps landing page, a fullscreen guided publishing flow, and a "Your books" table that tracks every book from review to published.

Kept from Helen's outline: all seven steps, in order. Kept from the team's IA outline: storefront shell, hub-and-spoke publishing area, one Your Books table with status tabs and counts including Draft, a side sheet per book, a fullscreen four-step flow with a fixed footer, and Fix and resubmit for Needs changes. Filled in (marked ★ below): a "Your books" entry in the account menu and links between Your books and the landing page in both directions; prototype-only controls to fast-forward review timing.

## Objects and actions

| Object | Key attributes | Relationships | Actions | Frequency |
| --- | --- | --- | --- | --- |
| **Book** (primary) | title, author, cover, description, audience rating, price, status | has one Review | start, edit, submit, publish, resubmit | rare (a few times ever) |
| Review | type (AI or human), submitted, result, reason | belongs to Book | choose type, view result | once per submission |
| Notification | message, time, read | points to a Book | open | per status change |

Book status: Draft → In review → Ready to publish → Published, with Needs changes as the recovery branch.

## Sitemap

```
Amazon home (storefront shell, ghost content)
├ Promotion tile → Self-publishing landing (steps overview)
│   └ Publish flow (fullscreen stepper)
│       1 Book details  2 Cover  3 Audience & price  4 Review & submit
└ Account menu / notifications → Your books ★
    Views, in workflow order: All · Draft · In review · Needs changes · Ready to publish · Published (default: All; after an action, the view the book moved to)
    └ Book side sheet (status, review result; fixed footer below a full-width divider: Publish / Fix and resubmit / Continue draft)
        └ Published confirmation (confetti) → Your books
```

## Navigation

- Global: the storefront top bar (search, account menu with "Your books" ★, notifications bell). Top only; no sidebar, because the publishing area has two pages.
- Local: tabs with counts switch book status views in place on Your books.
- In the flow: global nav replaced by the flow name, a 4-step stepper, and a fixed footer.
- Rejected: a separate "Author dashboard" with a sidebar. Too heavy for someone who publishes a few times ever.

## Screens

| Screen | Job | Layout |
| --- | --- | --- |
| Amazon home | Show the promotion tile in context | Single column, ghost content |
| Self-publishing landing | Make publishing look simple; show the 4 steps and what you need | Single column, hero + steps + checklist |
| Publish flow | Collect everything needed to publish | Fullscreen workflow, form + live preview aside |
| Submitted | Confirm submission and what happens next | Lands on Your books with a confirmation banner |
| Your books | Track status, publish approved books, fix rejected ones | One table, status tabs with counts |
| Book sheet | Act on one book | Side sheet with a fixed footer below a full-width divider; actions Publish / Fix and resubmit / Continue draft |
| Published | Celebrate and point to the books table | Centered confirmation |

```
Landing
┌ Header: Publish your book on Amazon · first-book offer       [Start publishing]* ┐
├ 4 steps, each with time estimate                                                  ┤
├ What you'll need checklist │ How review works                                    ┤
└ Footer CTA                                                    [Start publishing]* ┘

Publish flow
┌ Publish your book · Step 2 of 4: Cover            stepper                         ┐
├ Form (current step)                                │ Book preview (cover, title)  ┤
└ [Save and exit]                                     [Back] [Continue / Submit]*   ┘

Your books
┌ Your books                                                     [Publish a book]  ┐
├ Tabs: All 5 · Draft 1 · In review 1 · Needs changes 1 · Ready to publish 1 · Published 1 ┤
└ Table: cover+title │ status badge │ review type │ submitted │ result due │ sales ┘
```

## Core flow (9 steps)

1. Home: click "Start your journey" on the promotion tile.
2. Landing: click "Start publishing."
3. Flow step 1: enter title, author, upload manuscript, generate a description with AI.
4. Flow step 2: pick a template cover or upload one.
5. Flow step 3: choose the audience rating and price.
6. Flow step 4: choose AI or human review, agree to the terms, Submit.
7. Your books: confirmation banner and notification; book shows In review.
8. Review completes: book moves to Ready to publish; open it and click Publish.
9. Published confirmation with confetti, then "Go to Your books."

Recovery: a book in Needs changes shows the reason and a Fix and resubmit action that reopens the flow with its details filled in. Save and exit keeps a Draft, which reopens from its sheet.

## Assumptions and open questions

- Assumed: the user is signed in to Amazon. Sign-in is out of scope.
- Assumed: the email notification is shown as a note, not designed.
- Assumed: review timing is simulated (AI about 5 seconds, human via a prototype control).
- Assumed: price is set during setup, since a book can't be published without one.
- Open: success signal (not stated). Working assumption: a first-time author gets from the tile to a submitted book without leaving the flow.
