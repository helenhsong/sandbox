# Whiteboarding Runthrough 3 — IA

## Summary

**Product type: public website (logged out), site shell.** A single-product, single-page marketing site for the Saltmoor Hybrid, a $1,200 (Queen) direct-to-consumer hybrid mattress. Responsive web, built mobile-first because the primary user taps through from a social post. One long scrolling landing page, a sticky header with a buy button, and a size picker sheet as the success step.

Kept from Helen's outline: all nine sections in her final order, a buy button in the hero and a closing CTA, only one product on the site, purchase steps out of scope. Filled in (marked ★): a sticky header with section links and a persistent buy button, a size picker sheet so the CTA has a real success state, a review filter by sleeper type, and the brand name.

## Objects and actions

| Object | Key attributes | Actions |
| --- | --- | --- |
| **Mattress** (primary) | name, price by size, thickness, firmness, layers, certifications | choose size, add to cart |
| Review | source (press or customer), rating, sleeper type, quote, date | read, filter by sleeper type ★ |
| Competitor | a best-selling all-foam mattress (unnamed), price, features | compare |

## Tasks and priority

| Task | Priority | Placement |
| --- | --- | --- |
| Decide it's worth $1,200 (conviction) | Core; what conversion measures | The page itself, in Helen's section order |
| Check it fits how I sleep (fit) | Supporting | Who it's for, Feel |
| Choose a size and add to cart | Core action | Buy button in hero, sticky header and closing CTA; zero navigation steps |
| Jump to a section on a return visit | Occasional | Sticky header links |

## Sitemap

```
Landing page (one product)
├ Sticky header ★: brand · Features · Reviews · Compare · [Choose your size]
├ 1 Hero: image, promise, rating, price, [Choose your size]
├ 2 Unique features (layer diagram + 4 features)
├ 3 Reputable-source reviews
├ 4 Customer reviews (summary + filter by sleeper type ★)
├ 5 Who it's for (great for / maybe not for you)
├ 6 Thickness, firmness, warmth
├ 7 Sustainability, health and values
├ 8 Side-by-side with a popular all-foam mattress
├ 9 Closing CTA [Choose your size]
└ Size picker sheet ★ (from any buy button) → Added to cart → Keep browsing
```

## Navigation

- Global: sticky header. Section links scroll in place (links, not buttons); the buy button opens the size picker. On phones the section links hide and only the brand and buy button stay.
- Location: the header link for the section in view shows as active.
- Rejected: a multi-page site (Product · Reviews · About). One product and a short-attention audience favor one scroll; extra pages add clicks before the buy button.
- No second page: the purchase flow is out of scope, so "Added to cart" confirms inside the sheet and returns to the page.

## Screens

| Screen | Job | Primary action |
| --- | --- | --- |
| Landing page | Catch attention in seconds, then build conviction and confirm fit | Choose your size |
| Size picker sheet | Pick a size, see its price, add to cart | Add to cart |
| Added to cart (sheet state) | Confirm success and offer a way back | Keep browsing |

```
┌ Saltmoor        Features  Reviews  Compare          [Choose your size]* ┐
├ Hero: promise · ★4.8 (6,214) · from $1,200 · [Choose your size]* │ image ┤
├ Unique features: layer diagram │ 4 features                              ┤
├ Press quotes (3)                                                         ┤
├ Customer reviews: summary │ filter chips │ review cards                  ┤
├ Who it's for: Great for │ Maybe not for you                              ┤
├ Feel: thickness · firmness scale · warmth scale                          ┤
├ Values: stats · certifications                                           ┤
├ Side-by-side: Saltmoor vs best-selling all-foam                          ┤
└ Closing CTA                                            [Choose your size]* ┘
```

## Core flow (4 steps)

1. Land from a social post on the hero.
2. Scroll through features, reviews and fit (or jump via the header).
3. Tap Choose your size (hero, header or closing CTA) → size picker sheet.
4. Pick a size → Add to cart → Added to cart → Keep browsing.

## States

- Size picker: Queen preselected; Add to cart shows a short loading state, then success.
- Review filter: empty state if a filter has no reviews, with a way back to All.

## Design system

`@helenhsong/ui`, Maia treatment (consumer product), Geist (Whiteboarding default), Lucide icons. Illustrations are drawn in CSS since no product photography exists.

## Wayfinding

- Where am I: active header link for the section in view; each section has a heading.
- Depth: the size picker is a right side sheet over a dimmed page, titled "Choose your size"; actions sit in a fixed footer below a full-width divider (Cancel, then Add to cart on the far right).
- Way out: Cancel, close button, Escape or backdrop click at every sheet state; Keep browsing after success returns to the same scroll position.

## Assumptions and open questions

- Assumed (Claude): brand name Saltmoor, all product facts, press outlets, reviews, stats and prices are sample content.
- Assumed (Claude): 100-night trial, free delivery and 10-year warranty, shown as assurances.
- Assumed (Claude): the popular competitor stays unnamed ("best-selling all-foam").
- Out of scope: checkout; the sheet ends at Added to cart.

## Proof

Conversion rate from social traffic (primary), time on page (attention), revenue from the page; guardrail: return rate doesn't rise.
