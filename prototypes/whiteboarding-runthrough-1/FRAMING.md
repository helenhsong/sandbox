# Whiteboarding Runthrough 1 — Framing

> **Prompt:** 81% of Americans want to write a book. In fact, 31% of al e-book slaes in the Kindle store are of self-published e-books. Design a product for self-publishing a book on Amazon, decreasing the entry barrier to self-publishing.

## 1. Purpose

- User need: writers face many barriers and a lot of time to get published. They want an easier way to publish and distribute their writing than going through a publishing company.
- Company need: Amazon sees a business opportunity. A lower barrier brings more people into self-publishing, which grows a revenue source for Amazon (Helen suggested publishing fees). The feature could also be a selling point for other Amazon offerings.
- In this session, we hope to: get a working prototype we could test with a client as if it were the real new experience.

## 2. Person

We are designing for **a first-time self-publisher who already knows they want to self-publish and has a finished book ready to go**, because they need a clear place to publish it.

- What matters most: a place to self-publish, with steps they can follow. Tracking sales and similar things can come at the end.
- Not the focus: returning users, and people who discover the feature before they have written anything and want to learn the process.

## 3. Present

**Book is ready to publish → looks for a way to self-publish on Amazon → finds nothing, so has nowhere to publish.**

There is no entry point to self-publishing today (in this net-new framing).

## 4. Problem

- **The person needs:** a place to self-publish, and to understand the steps.
- **The pain point is:** there is nowhere to publish, and they have never published a book, so they don't know the steps.
- **We assume:** this is a net-new Amazon feature; the user is a first-time publisher; most authors write on a laptop or computer.
- **We must work within:** web only for now (mobile out of scope); the entry point sits inside the existing Amazon experience; scope ends at publishing, and everything after (sales, listing management) is handled separately later.

> When **their book is finished and ready to publish**, **a first-time self-publisher** wants **a clear place on Amazon to publish it, with steps they can follow**, so they can **get the book in front of readers without going through a publishing company**.

> Business benefit: more self-published books on Amazon grows a revenue source (fees or a share of sales), and the feature can be a selling point for other Amazon offerings.

## Captured for later Ps

- Returning users publish rarely, so they probably experience the flow as if they were new again.
- Out of scope for now (team constraint): sales tracking and managing the listing after publishing.

## Confirmed

- Product: self-publishing a book on Amazon (Kindle store context).
- Goal stated in the prompt: decrease the entry barrier to self-publishing.

## Assumed

- Team assumption: this is a net new self-publishing feature on Amazon. Note: Kindle Direct Publishing already exists and earns through royalty share rather than upfront fees.

## Open


## Problem review (thoughts?)

- Framing is consistent: person, current path, and scope constraint line up.
- Of the two pain points, "doesn't know the steps" carries the problem; "no place to publish" goes away once the feature exists.
- Open: what "ready to publish" includes (manuscript only, or also cover, formatting, price).
- Open: which existing Amazon surface the entry point lives in.
- Open: success signal, to be set at Prototype & Proof.

## 5. Possibilities

Compared by impact (value to the first-time publisher, progress on clear steps, business benefit) and effort (complexity, dependencies, cost).

| Option (Helen's) | Impact | Effort |
| --- | --- | --- |
| A. Upfront "steps to publish" overview that feels simple and low-pressure | High: speaks directly to "doesn't know the steps" | Low |
| B. Guided publishing flow that collects everything needed to publish | High: it is the core of the feature | High |
| C. Entry points in several places near books | High: discoverability | Low to medium |
| D. Banner for the first few visits after launch, targeted at people interested in books and writing | Medium to high: discoverability for the right people | Medium: needs purchase and browsing signals |
| E. First-book promotion: a couple of free months of Kindle Unlimited | Medium: motivation, plus business acquisition | Low to medium: promo and billing |
| F. Dashboard of all published books | Medium: post-publish value | Medium |
| G. Author profile showing an author's other work | Medium: more sales for the author's other books | Medium |

- Hard constraint that could change the decision: F and G come after publishing, which the team scoped out for now.
- Helen's stated needs: good entry points in multiple places, a promotion, a clear view of the steps, and a walkthrough of everything needed to publish.

We chose **entry points in several places near books, an upfront steps overview, a guided publishing flow, and a first-book promotion** because a barrier that looks low makes first-time authors more willing to go ahead and feel less pressure (Helen). Trade-off: not stated.

- Set aside for now: dashboard of published books and author profile (after publishing, out of scope).
- Reasoning for ruling out other options: not stated.

## 6. Prototype & Proof

Helen's flow:

1. On Amazon, the user sees a promotion tile to self-publish a book, shown to people interested in writing, reading, or Kindles. CTA: "Start your journey."
2. Landing page breaks down self-publishing and its steps. It should feel simple.
3. CTA enters the publishing flow. The user adds book info. The description can be AI-generated. Covers come from templates or the user's upload. The book gets an audience rating: adults, children, or general.
4. The user submits the book for Amazon review: a standard check that content doesn't break the terms or include inappropriate material, and that the rating fits. An AI check is faster; writers who prefer can choose human review. A dashboard shows book status, sales, and more.
5. The user is notified by email and on Amazon that the book was submitted.
6. Within 24 hours the book is approved or denied (AI review may be faster). Once approved, the user clicks Publish. Content is locked after submission, so changes need a Resubmit.
7. The book is published, with confetti, and a confirmation screen. A button goes to the published-books dashboard to check sales and the listing.

**Storyboard:** Promotion tile → steps landing page → guided book setup → review submission → approval → Publish → confirmation and dashboard.

- Scope change: a published-books dashboard is back in, as the place to track review status and, after publishing, sales and the listing.
- Success signal: _open_ (not stated)
