# PF App Critique — Framing

> **Prompt:** You'll be critiquing Slack. It's intentional! We want to see how you respond to a product that shares some of the same challenges we think about at PermitFlow: surfacing the most urgent and important items, coordinating inputs from multiple users, and bringing structure to messy, complex communication.
> Brainstorm a few focused areas for improvement, then choose one to explore in depth. Share your point of view on:
>
> * What isn't working: Identify the core problem and where the experience falls short.
> * Impact on users and the business: Explain how it affects user experience, task success, confidence, or efficiency, as well as relevant business outcomes.
> * Why this problem: Briefly share the other problems you considered and why you chose to focus on this one.

## 1. Purpose

- User need: people working on projects, often with small teams or specific individuals, need to find the right context (how things connect, what someone said or shared) without digging through channels and search. This is hardest on larger teams and for new joiners.
- Company need: Slack's job is to make finding context more efficient. It wants to provide the correct context for people, and in the future for agents, so they can suggest better team structures or staffing.
- In this session, we hope to: brainstorm a few focused areas for improvement in Slack, choose one, and share a point of view on what isn't working, its impact on users and the business, and why this problem over the others considered (from the prompt).

## 2. Person

We are designing for **a new joiner at a startup who was dropped into the middle of a project**, because they have to ramp up quickly without context on the people around them.

- What matters most: quickly learning who's responsible for what, who's most expert at what, what resources have been shared, and which questions they can take to which person.
- Not the focus (for now): team leads.

## 3. Present

**Remembers a conversation where a teammate shared something with them → searches their DMs → isn't sure whether it came in a DM, a thread, or a message to the whole team, so doesn't know where to look.**

- Context: the new joiner is taking in a lot very quickly and may have spoken to this person only once or twice.

## 4. Problem

- **The person needs:** to find something a specific teammate shared with them, starting from the person they remember.
- **The pain point is:** they remember who shared it, but not where (DM, thread, or team channel), and search makes them pick a place first.
- **We assume:** Open.
- **We must work within:** desktop only; no IA changes to the rest of Slack; scope limited to what's in the profile page; no designs for pages it leads to elsewhere in the product, except a "view all" style view.

> When **they remember a teammate shared something with them but not where**, **a new joiner dropped into the middle of a startup project** wants to **find it starting from the person they remember**, so they can **get up to speed quickly without digging through DMs, threads, and channels**.

> Business benefit: Slack becomes more usable and people get more value out of it, which should show up in CSAT and NPS.

### Success metrics (Helen)

- Time to find a specific message or file from a person.
- Time to find all the projects someone is involved in.
- Time to find all the files someone has shared with a specific person.
- Profile page usage: how long people spend on it and interacting with it, and how often they use it. A sign of usability, usefulness, and people relying on Slack more for context.
- Business: CSAT, NPS.
- Guardrail: Open.

## 5. Possibilities

Options Helen is exploring (none chosen yet):

| # | Option | Impact | Effort | Note |
| --- | --- | --- | --- | --- |
| 1 | **Tabs** on the profile: switch between the person's activity and their static info (team, etc.) | Medium-high: activity is one click away without crowding the basics | Low-medium | |
| 2 | **Expanded full-screen profile** with search that's pre-filtered to this person | High for finding one exact message or file | High | Overlaps with Slack search (Helen: more flexible here). Fits the "view all" exception |
| 3 | **Sections** stacked on the page | Medium | Low | Helen dislikes the scrolling |
| 4 | **Nested sections**, like a messaging app's contact page: what they've shared with you plus contact info | Medium-high: familiar pattern | Low-medium | A direction Helen is leaning toward |
| 5 | **Profile panel stays open** while you follow a link to a specific page and keep navigating | Medium: keeps the person's context while you jump to the item | Medium | Touches navigation; check against "no IA changes" |
| 6 | **Search inside the profile panel**, scoped to this person | Medium-high: find one exact item without leaving the panel | Medium | |

**Chosen direction (Helen):** nested sections in the profile panel. Clicking a section opens a nested view inside the panel where you can search (combines options 4 and 6). An expand icon hints at a full expanded view (option 2), but the expanded view itself is not designed.

- Rejected: stacked sections, because Helen doesn't want to add length to the panel.

Combination noted in "thoughts?": nested sections on the panel, with "view all" opening the pre-filtered view. Open: which leads on the profile, what they shared with you or the projects they're in?

## 6. Prototype & Proof

**Busy project channel → click a teammate's name → profile panel opens → switch tabs to find what they shared.**

Helen's outline:

- **Scenario:** a new joiner in a very busy project channel. Lots of messages every day, and people sometimes forget to tag them in threads, so things get missed.
- **Entry:** in the channel, they click a specific person's profile, which opens the profile panel.
- **Header:** basic info: name, position, team, location.
- **Tabs below it:**
  - **Info:** pinned files or messages, plus standard profile info (email, phone, etc.).
  - **Activity:** all their recent activity, like DMs or posts.
  - **Shared:** all their shared attachments. A toggle switches to what they've shared with you specifically instead of the team (any type of file attachment).
- **Also:** a summary of their messages; things they've pinned to their profile shown on top.
- **Privacy:** anything gated (shared in a private channel) is hinted at but not exposed.
- **Proof:** the success metrics above (time to find a message or file, projects, shared files).

Open in the outline: where the message summary sits; whether pins sit at the top of the panel or the top of Info; whether the in-panel search and expand icon from the chosen direction stay.

## Captured for later Ps

- Perspective: a startup employee (Helen).
- Problem area Helen wants to address: how people find context as they use Slack. Surface important context when it's needed instead of forcing people to search, starting with the user profile page.
- Current path (from Helen): you look someone up because you remember something they said or a file they shared, then dig through search and filters to get to the exact thing.
- Today's profile page: fairly static. At larger companies it shows useful info like team and manager. Opportunity Helen sees: also show work they've done, how they've interacted with others, and what they have context on.
- Other problems considered (for "Why this problem"):
  - Sidebar organization: Slack organizes thoroughly by section and channel, but people often think by project. Team and project channels get mixed together, and it's not clear how things connect, especially on larger teams.
  - Search fragmentation: several ways to search (channels, whole product, per page) with some filtering.
- Lenses from the prompt: surfacing the most urgent and important items; coordinating inputs from multiple users; bringing structure to messy, complex communication.

## Confirmed

- Product under critique: Slack.
- Mode: Whiteboarding (Helen).
- Problem area: surfacing important context about people on the user profile page.

## Assumed

## Open

