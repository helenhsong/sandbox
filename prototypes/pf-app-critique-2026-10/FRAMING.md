# PF App Critique: Framing

## Purpose

**Prompt:**

> You'll be critiquing Slack. It's intentional! We want to see how you respond to a product that shares some of the same challenges we think about at PermitFlow: surfacing the most urgent and important items, coordinating inputs from multiple users, and bringing structure to messy, complex communication.
> Spend time using Slack if you aren't already familiar with it. A free account is enough. Focus on the core desktop experience.
> Slack is a business communication platform used by teams of all sizes to collaborate through channels, direct messages, and integrations. It serves a wide range of users, from small startups to enterprise organizations, and is built around real-time and async messaging, file sharing, and workflow automation. Its core job is to reduce email and centralize team communication in one place.
> Constraints
>
> * This exercise is desktop only. Mobile is out of scope.
> * Focus on improvements, not overhauls. No full redesigns.
>
>
> Brainstorm a few focused areas for improvement, then choose one to explore in depth. Share your point of view on:
>
> * What isn't working: Identify the core problem and where the experience falls short.
> * Impact on users and the business: Explain how it affects user experience, task success, confidence, or efficiency, as well as relevant business outcomes.
> * Why this problem: Briefly share the other problems you considered and why you chose to focus on this one.
>
>
> Brainstorm a few ways you could fix the problem, then land on one final recommendation. Expect to share the following:
>
> * The options you considered and why you landed on your final approach.
> * What you'd design to fix the problem.
> * How you would know this worked.
> * How you leveraged AI in preparing today.
>
> Use one of these to guide your thinking, not as a menu you need to cover all of:
>
> * Workflow improvement — reduce friction in a core task.
> * New micro-feature — add a small but meaningful feature that solves a real need.
> * Redesign a specific interaction or mini-flow — pick a contained step (filtering, confirmation, commenting, a form step) and redesign it in a way that addresses your identified problem.
>
> We recommend a low-fidelity sketch or wireframe to help explain your solution. You're also welcome to use tools like Figma, AI tools like Claude Design or Claude Code, or a no-code prototyping tool like Lovable, but this is optional.

**Confirmed from the prompt**

- Product: Slack, core desktop experience. Mobile is out of scope.
- Improvement, not overhaul. No full redesign.
- Themes that matter to PermitFlow: surfacing the most urgent and important items, coordinating inputs from multiple users, bringing structure to messy, complex communication.
- Deliverables: brainstormed problem areas, one chosen problem with impact and rationale, options considered, final recommendation, a success measure, and how AI was used. A low-fidelity sketch or prototype is welcome.

**Areas considered (brainstorm)**

- **Project organization in the sidebar.** Channels sit in sections with no connection between them, so there's no hierarchy linking people to teams and teams to projects. Set aside as too big a problem for this exercise (it would push toward an overhaul).
- **Search.** There are many ways to search: global search with filters, search within a page, and sidebar filtering. Finding context means a lot of digging.
- **Context while working.** Context doesn't show up in the moment you need it, for example when you're new to a project or team, or want to get to know teammates.
- **Remembering where you saw something.** Messages or files someone sent you have to be found again through search and filters.
- **Context on people.** Slack is a collection of people's interactions, but there's no easy way to see how a person interacts with the rest of the team: who to go to for help, what they've shared, how they work.

**Chosen focus:** making context on people show up as you use Slack, starting with the profile page. Today it's static and mostly contact information (location, email, team).

User need: **Finding context means digging through search results yourself. People need to understand who someone is, what they've shared and how they work with the team, without hunting for it.**

Company need: **Open.** (Prompt context: PermitFlow cares about surfacing what's important, coordinating input from multiple people, and bringing structure to messy communication.)

In this session, we hope to **Open**.

## Person

We are designing for **a new joiner dropped into the middle of a very busy project, where lots of people are sharing files and messages**, because **they have a lot to digest and need to quickly understand a person's context beyond contact info: what that person has been working on, what they've shared with the team, how they work with the team, and their past interactions with the new joiner**.

Secondary (not designed for first): team leads who need context on who worked on what, and who send new hires to a resource or person while onboarding them.

## Present

Situation (chosen): the new joiner is in a very busy project channel, overwhelmed, and remembers that a teammate said something to them, but not where. It could have been a DM, a thread they weren't tagged in, or a channel message.

Current path: **Remembers what a teammate said → clicks the person's name in the channel; the profile shows little beyond contact info, DMs and maybe files → falls back to the search bar, filtering everything and picking specific channels, which takes longer and pulls them out of what they were doing**.

## Problem

- **The person needs:** to find what a specific teammate said and shared, starting from that person and without leaving the channel they're working in.
- **The pain point is:** the profile is static (contact info, DMs, maybe files), so the only way to retrace someone's words is search, which means filtering everything and choosing channels by hand.
- **We assume:** people would rather see this context surfaced on the profile than search for it themselves in the product search bar, and that retracing what someone said is a real pain point (both unvalidated).
- **We must work within:** desktop only; an improvement to the existing profile, not a redesign; privacy: the profile only shows what the viewer can already access; private channels they aren't in, including their names, never appear.

**Problem statement:** When a new joiner is in a busy project channel and remembers something a teammate said but not where, they want to retrace that teammate's recent messages and shares that involve them, right from the person's profile, so they can find it without leaving their work or filtering search by hand.

Business benefit: **people rely on Slack more, because they find files and relevant information faster, and things that were shared get found and reused faster.**

Success signals named (for Proof): time to find something (primary, speed); speed of finding something shared via someone's profile; CSAT or NPS for the feature; profile engagement (how often profiles are opened, how long people look).

## Possibilities

Compared by impact (value to the new joiner, progress toward faster finding, business benefit) and effort (complexity, dependencies, cost).

| Option (from the team) | Impact | Effort |
| --- | --- | --- |
| A. Activity on the profile: the person's general recent activity | Medium | Medium |
| B. Shared files and attachments on the profile | Medium | Low |
| C. Pinned items on a profile | Low to medium | Low |
| D. Where this person interacts with others (channels, threads, DMs) | Medium | Medium |
| E. All activity, with what's relevant to the viewer highlighted (for example, messages in channels the new joiner is in) | High | Medium to high |
| F. AI summaries in sections, such as what this person does and what their activity shows | High | Medium |
| G. Search within the profile across its tabs, with the same filters as Slack's main search | High | Medium |
| H. Tabs on the profile: Info, Activity, Shared | Medium | Low |

We chose **a combination of all the options: a richer profile with compact basics, a search bar with filters, and Info, Activity and Shared tabs that include pinned items and AI summaries** because **it covers both getting to know the person and retracing what they said, all from the profile**, accepting **more effort and a denser profile panel**.

Reasons for ruling out other options: not stated (the team combined them).

## Prototype & Proof

**Storyboard:** busy project channel → click a teammate's name → profile opens → search or browse Activity/Shared → click a message → jump to that spot in Slack.

**Team outline**
1. Start in a very busy project channel, with people writing threads and sharing attachments.
2. Clicking a person opens their profile.
3. Top: compact basics (profile picture, name, team, location) and a status indicator that shows the status on hover.
4. Above the tabs: a search bar with filters.
5. Tabs:
   - **Info:** contact information, then pinned items, then an AI section on what this person can help with.
   - **Activity:** an AI summary of what they've been working on, then their messages. Clicking one goes directly to that spot in Slack.
   - **Shared:** attachments.
   - Activity and Shared have filters, which work with search.
6. Hint that the profile can expand (cue only).

**It works if** the new joiner finds what a teammate said or shared faster than with Slack's search bar (time to find). Backups: CSAT or NPS, and profile engagement.

## Open

- Company need (beyond the business benefit above).
- Session goal.
