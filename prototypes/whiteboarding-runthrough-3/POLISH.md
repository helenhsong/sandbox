# Whiteboarding Runthrough 3: polish pass

Checked in the rendered preview at 1280px and 375px (touch), including the size picker's choose, adding and added states. No horizontal scroll and no console errors at either width. `helen-copy` wasn't installed in the cloud session, so it was run in Review mode on Helen's Mac (rows 13 to 25) and the fixes applied here.

| # | Area | Before | After | Why | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Broken | Global `h2` rule made the size picker's library title 24px | Heading styles scoped to `main`; sheet title back to the library's 16px | Prototype CSS was overriding a library component | Fixed |
| 2 | Scrolling | Sheet body could grow past the viewport with no scroll region | Sheet shell `100dvh` + `overflow: hidden`; body `min-height: 0`, scrolls; footer stays put | One scroll surface, footer always reachable | Fixed |
| 3 | States | "Add to cart · $1,200" became "Adding…", so the button changed width | Library `Spinner` joins the unchanged label; `aria-busy` while adding | Loading keeps width and avoids double submits | Fixed |
| 4 | Typography | Five sizes (12, 14, 16, 24, 32) | Four: 12 meta, 14 body and h3, 24 h2/prices/stats, 32 hero h1 and big rating; slight negative tracking on the 32px h1 | Three-to-four-size limit | Fixed |
| 5 | Color | Sea-blue eyebrows, tinted feature icons and green stat icons all competed | Eyebrows, feature icons and stat icons neutral; accent kept for the Saltmoor compare column and scale values; green only for yes/verified | Accent on the most important info, not decoration | Fixed |
| 6 | States | Hover styles on nav links, review chips and size options weren't gated | Wrapped in `@media (hover: hover) and (pointer: fine)` | Taps don't leave a stuck hover | Fixed |
| 7 | States | Hero rating link looked like plain text at rest | Underlined at rest, darker underline on hover | Links must read as links before hover | Fixed |
| 8 | Mobile | Review filter chips were 32px tall on touch | 44px on coarse pointers | Tap target minimum | Fixed |
| 9 | Mobile | Compare table had a 520px min width, so it scrolled sideways on phones | Fits at 375px with tighter cell padding; headers shortened to "Saltmoor" / "Best-selling foam" | Side-by-side readable without horizontal scroll | Fixed |
| 10 | Copy | "back ache" | "backache" | Spelling | Fixed |
| 11 | Copy | "about a dollar a month more" ($105 over 10 years is $0.88/month) | "less than a dollar a month more, for a bed built to outlast it" | The claim was wrong | Fixed |
| 12 | Layout | Feature text column could overflow beside its icon | Icon `flex-shrink: 0`, text column `min-width: 0` | Long labels wrap instead of pushing layout | Fixed |
| 13 | Copy | Filter chips "All 6" beside "6,214 verified reviews" | Chip counts removed | Counts contradicted the review total | Fixed |
| 14 | Copy | "What your $1,200 supports" | "What your mattress supports" | $1,200 is only the Queen price | Fixed |
| 15 | Copy | Added sheet: "Your mattress is saved." | "The Queen is in your cart." (selected size) | One verb through the flow: add, added, in your cart | Fixed |
| 16 | Copy | Competitor called "foam bed", "most popular all-foam mattress", "Best-selling foam" | "best-selling foam mattress" everywhere; category is "all-foam mattresses" | One name per object | Fixed |
| 17 | Copy | "built to outlast it" | "built to outlast the foam one" | "it" was ambiguous | Fixed |
| 18 | Copy | Press eyebrow "What the reviewers say" | "What the experts say" | Collided with Customer reviews below | Fixed |
| 19 | Copy | Footer "Saltmoor Sleep" | "Saltmoor" | One brand name | Fixed |
| 20 | Copy | "Maybe not for you" | "Not ideal for" | Parallel with "Great for" | Fixed |
| 21 | Copy | "5 star" … "1 star" | "5 stars" … "1 star" | Plurals | Fixed |
| 22 | Copy | Eyebrows and press sources in all caps | Sentence case, weight and color for emphasis | No all caps unless the system uses it | Fixed |
| 23 | Copy | Filter chip "Clean materials" | "Eco-conscious" | Every other chip names a kind of shopper | Fixed |
| 24 | Copy | Empty filter: "No reviews for this filter yet." | "No reviews from {filter} yet." | Names what's filtered | Fixed |
| 25 | Copy | Prices via toLocaleString; $1,200, $1,095 and $105 hardcoded | `Intl.NumberFormat` currency; compare price and difference derived from shared constants | Locale formatting, no drifting figures | Fixed |

## Open decisions

- **Hero image on phones.** It sits below the copy, so the first phone screen shows no mattress. Recommendation: move the image above the headline on phones only, since you said the page needs an image and has to grab attention fast. Left as is because it changes the hero's order.
- **Press section on black.** It's the loudest band on the page and pulls attention from the features above it. Recommendation: keep it for now, since it makes the reputable reviews feel weighty; revisit if it competes with the CTA in testing.

## Held up

- One primary action per area, right-aligned: hero (outline "See how it compares", then primary "Choose your size"), closing CTA, and the sheet footer (Cancel, then Add to cart) below a full-width divider.
- Sibling cards (press, reviews, fit, feel, stats) share heights per row.
- Active header link sits flush on the header's bottom edge; review filter has counts and an empty state with a way back.
- Library components (Button, Badge, Sheet, Spinner) keep their own styling.
