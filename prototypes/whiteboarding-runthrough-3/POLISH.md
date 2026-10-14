# Whiteboarding Runthrough 3: polish pass

Checked in the rendered preview at 1280px and 375px (touch), including the size picker's choose, adding and added states. No horizontal scroll and no console errors at either width. `helen-copy` isn't available in this environment, so the copy pass followed helen-polish's Copy and content checklist.

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

## Open decisions

- **Hero image on phones.** It sits below the copy, so the first phone screen shows no mattress. Recommendation: move the image above the headline on phones only, since you said the page needs an image and has to grab attention fast. Left as is because it changes the hero's order.
- **Press section on black.** It's the loudest band on the page and pulls attention from the features above it. Recommendation: keep it for now, since it makes the reputable reviews feel weighty; revisit if it competes with the CTA in testing.

## Held up

- One primary action per area, right-aligned: hero (outline "See how it compares", then primary "Choose your size"), closing CTA, and the sheet footer (Cancel, then Add to cart) below a full-width divider.
- Sibling cards (press, reviews, fit, feel, stats) share heights per row.
- Active header link sits flush on the header's bottom edge; review filter has counts and an empty state with a way back.
- Library components (Button, Badge, Sheet, Spinner) keep their own styling.
