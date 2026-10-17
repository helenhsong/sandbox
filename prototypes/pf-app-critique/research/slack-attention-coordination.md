# Slack desktop (2025–2026): evidence base for a product critique

Compiled 2026-10-17 from public sources only.

**Method and limits:** Direct page fetches of slack.com were blocked in this environment, so every fact below comes from web-search result extracts (snippets and summaries) of the listed URLs, not full-page reads. Exact UI labels should be checked in the app before quoting.

Labels:
- **[S]** directly sourced (a snippet or quote from the URL)
- **[S-3p]** sourced, but from a third party or a vendor blog
- **[I]** my inference

---

## 0. Current desktop navigation (the skeleton everything hangs on)

- **[S]** The left tab rail has **Home, DMs, Activity, Later, More**. Shortcuts: Ctrl/Cmd+1 Home, 2 DMs, 3 Activity, 4 Later, 0 More. **More** is an overflow menu for other browsers, and it also collects tabs that no longer fit when the window is narrow or zoomed.
  - https://slack.com/intl/en-in/help/articles/360000411963-Use-Slack-with-a-screen-reader
- **[S]** September 2025 change: canvases and lists moved into a new **Files** tab. Workflows, apps and channel templates moved into a new **Tools** tab (renamed from "Automations", per U-M IT). People, Channels, External Connections (and user groups) moved to a **Directories** page at the top of the Home sidebar.
  - A newer help article says that by default the **Home, DMs, Activity and Files** tabs are visible, and **Later and Tools sit behind More**.
  - Sources: https://slack.com/help/articles/115004846068-Slack-updates-and-changes · https://its.umich.edu/communication/collaboration/slack/support/updates · https://slack.com/help/articles/44134792609555
- **[S]** August 2026: custom sections in the Files tab, and Cmd/Ctrl-click Files opens it in a new window. Slackbot gets a **sidebar tab ("Big Mode")** for full-screen use, and is still reachable from the **Slackbot button at the top of the desktop app** for side-by-side use.
  - https://slack.com/help/articles/115004846068 · https://alternativeto.net/news/2026/9/slackbot-gets-big-mode-deep-research-and-skill-sets/
- **[S]** February 2026: **split view**, which pins a thread, channel, canvas etc. side-by-side while you navigate in the main panel. January 2026: **huddles open in their own window** by default so they no longer block the sidebar.
  - https://slack.com/help/articles/115004846068
- **[S]** May 2026: the **Today** view (daily briefing) and **Focus mode** launched. More in §1.
- **[I]** Net effect: urgency and triage are spread across at least six places (Today, Activity, Home/Unreads, DMs, Later, Slackbot), plus VIP and Recap entries in the sidebar. The *Later* tab, which holds the user's own commitments, is hidden behind More by default after the Sept 2025 change. That is a strong critique point: personal follow-ups are demoted below Files.

---

## 1. Surfacing the most urgent and important items

### Activity (tab): the triage inbox
- **What [S]:** A filterable, chronological feed of mentions, replies in threads you're part of, reactions to your messages, channel invitations, and app notifications.
  - https://slack.com/help/articles/19693583638803
- **Activity 2.0 [S]:** Began rolling out **January 2026**, gradually. It now also includes **DMs, messages from channels set to "All new posts", and personal reminders**.
  - Two layouts: **Detailed** (full previews) and **Dense** (scanning).
  - **Custom views** are saved as tabs at the top of the feed.
  - Items can be cleared one at a time, in bulk, or with mark-all-read.
  - New keyboard shortcuts.
  - The **DMs badge now counts unread conversations, not messages**.
  - https://slack.com/help/articles/46751260742035-Introducing-the-new-Activity-view-in-Slack
- **Filters [S]:**
  - All (default)
  - DMs, Mentions, Threads, Channels, Reactions, Invitations, Apps, Reminders
  - VIP (paid)
  - Cleared notifications
  - Specific channels or sidebar sections (paid)
  - "Unread messages" filter
  - Custom views and the Dense/Detailed switch are **desktop only**.
  - https://slack.com/help/articles/19693583638803
- **How reached:** the Activity tab in the left rail, or Ctrl/Cmd+3 **[S]**.
- **Key states [S, partly I]:** All vs filtered tab, unread vs read, cleared (recoverable through the "Cleared" filter), Detailed vs Dense.
- **Slack's positioning [S-3p, vendor]:**
  - Slack describes the old problem as "a wall of notifications... with no way to tell what actually needs your attention."
  - Pilot claim: **80% of users keep coming back to Activity; 60% of engaged users triage DMs from Activity.** No methodology was published.
  - The new Activity is "available across all Slack plans" (blog). The May 2026 feature drop says Pro, Business+ and Enterprise.
  - https://slack.com/blog/news/slack-activity-triage-for-notifications · https://slack.com/blog/news/feature-drop-may2026
- **Design history [S]:** Activity was built in fall 2023 and is now Slack's **second most-used surface**. The original "showed many notifications but not all", and users "could only mark items as read, not act on them". Activity 2.0 is positioned as "the single place to catch up."
  - https://slack.design/articles/no-small-task-evolving-the-way-millions-catch-up-in-slack/
- **[I] Critique hooks:**
  - Activity is still a *notification* list, not a list of *obligations*. Reactions, invitations and app pings share one stream with requests aimed at you.
  - Saved views put the work of judging importance on the user.
  - Now that DMs are also in Activity, the same item can show up in both DMs and Activity, which raises the question of which badge to trust.

### Today (view): the AI daily briefing (new, May 2026)
- **[S]** A "personalised daily briefing that brings your priorities, calendar and most pressing tasks together." Sections:
  - **To-dos**, with an **AI Suggested** tab that surfaces "messages that may need a reply or may have been missed", which can be checked off.
  - **Agenda**, with **Prep for Meeting**.
  - Team highlights.
  - Sections can be hidden. It is meant to be the first thing you see when Slack opens.
  - https://slack.com/help/articles/51262305668371-Start-your-day-with-Today
- **Availability [S]:**
  - Open beta for Enterprise (May 6, 2026), then rolling out to Business+ V2, Enterprise+ V2 and AI-add-on plans.
  - The help center says Slack is not currently accepting new beta participants.
  - https://slack.com/blog/news/today-daily-briefing · https://slack.com/blog/news/feature-drop-may2026
- **Slack's model [S-3p vendor]:** "Orient in Today, triage in Activity, act with Slackbot."
- **[I]** Today is the first surface that tries to answer "who is waiting on me". It is gated to premium tiers, and where it sits in the sidebar is not documented in the extracts.

### Unreads view (Home sidebar)
- **[S]** From Home, click **Unreads** at the top of the sidebar. If it's missing, enable it in sidebar preferences.
  - Actions: **Mark as Read** for each conversation, **Mark All Messages Read** at the bottom, and **Undo**.
  - Sorting and filtering are desktop-only. Filtering by custom section is paid-only.
  - **Muted and archived channels are excluded.**
  - On mobile the equivalent is **Catch up** (a swipe-through card UI).
  - https://slack.com/help/articles/226410907-View-all-your-unread-messages
- **[I]** The Unreads view is organized by channel, not by priority. Unreads, Catch up, Activity and Today now overlap.

### Later (saved items and reminders)
- **[S]** Save a message with the bookmark/save icon on hover. For files, use More actions > **Save for Later**.
  - Three tabs: **In progress** (shows saved items plus upcoming and past-due reminders), **Archived**, **Completed**.
  - Desktop filter: "Show upcoming reminders".
  - Saved items are private.
  - Reminders set from a message's More actions menu land in In progress, where they can be completed or rescheduled.
  - https://slack.com/help/articles/360042650274
- **Reached by [S]:** the Later tab (Ctrl/Cmd+4). Since Sept 2025 it sits **behind More by default** (https://slack.com/help/articles/44134792609555).
- **Reminders [S]:**
  - `/remind [#channel] [what] [when]`
  - Personal reminders, reminders on a message or file, and channel reminders.
  - Reminders in canvases and lists are **desktop only**.
  - https://slack.com/help/articles/208423427-Set-a-reminder
  - Personal reminders now also appear in Activity 2.0 [S].

### VIPs
- **[S]** You can mark people, apps and workflows as VIPs (up to **300**, external ones included).
  - Their DMs and mentions show in a **VIP unreads section at the top of the sidebar**, and their Activity notifications go into a **VIP tab/filter**.
  - VIPs can have a custom sound (Preferences).
  - VIPs can be set to notify you even when notifications are paused.
  - https://slack.com/help/articles/34963579361683
- **[I]** VIP status depends on the *person*, not on what the *request* is. A low-value ping from a VIP still outranks an urgent request from a peer.

### Sidebar sections
- **[S]** Custom sections are **paid plans (Pro and up), desktop-only to create**, and private to you.
  - Each section can override show/sort settings. On desktop: Home > click the section name > Show and Sort.
  - With fewer than 30 channels, the default shows "All your conversations".
  - https://slack.com/help/articles/360043207674 · https://slack.com/help/articles/212596808-Adjust-your-sidebar-preferences

### Notification settings
- **[S]** Preferences > Notifications:
  - Global "everything vs mentions/DMs" choice.
  - **Notification schedule**: notifications pause outside the set hours.
  - **Channel keywords**: case-insensitive, exact match, highlighted in yellow.
  - "What to show in Activity", for example including channels set to All new posts.
  - Per-channel overrides are set through the channel's own notification menu. That path is **[I]** and could not be verified in the extracts.
  - https://slack.com/help/articles/201355156
- **[S]** **Pause notifications**: set ad hoc or on a schedule. Other people see a snooze icon, and **DM senders can override the pause once a day** for something urgent.
  - https://slack.com/help/articles/214908388
- **[S]** **Focus mode** (May 2026, all plans): reduces visual distraction, silences non-urgent notifications, and signals that you're heads-down.
  - https://slack.com/blog/news/feature-drop-may2026
- **[S]** Developer changelog: desktop notifications now take their text from message blocks first (July 13, 2026).
  - https://docs.slack.dev/changelog/

### AI recaps, summaries and Catch up
- **[S]** **Channel/DM summaries**: three-dot menu > **Summarize channel/conversation**. Scope can be **unreads only**, last 7 days, or a custom range (custom range is desktop-only).
- **[S]** **Thread summaries**: a **Summarize** button at the top of the thread. "More details" shows the sources.
  - https://slack.com/help/articles/25076892548883
- **[S]** **Recap** (daily AI digest):
  - Open **Recap from the sidebar** and pick channels. AI suggests channels "you visit often but rarely post in" and encourages muting them.
  - A new recap arrives every morning.
  - Add a channel by right-clicking it in the sidebar > **Add to recap**.
  - Admins can disable recaps.
  - https://trailhead.salesforce.com/content/learn/modules/slack-ai/get-to-know-slack-ai
- **[S]** Plan changes (June 2025):
  - **AI is bundled into Business+** (recaps, translation, AI search, workflow generation). Business+ went **$12.50 → $15** per user per month (annual).
  - From **July 17, 2025**, conversation and thread summaries and huddle notes are on paid plans without an add-on.
  - The Slack AI add-on is no longer sold.
  - AI is enabled by default.
  - https://slack.com/blog/news/june-2025-pricing-and-packaging-announcement · https://slack.com/help/articles/39264531104275
- **[I]** Summaries are pull-based and scoped to one conversation. Recap pushes only channels the user has already chosen, so it cannot catch something important in a channel nobody added.

### Slackbot (personal agent)
- **[S]**
  - Jan 2026: Slackbot became a "personal AI agent... that understands... your entire workspace".
  - Dreamforce Oct 2025: Slack repositioned as an "agentic OS".
  - Aug 2026: Big Mode, deep research, skills.
  - Oct 2026: workflows can start a Slackbot or agent conversation.
  - https://slack.com/blog/news/feature-drop-jan26 · https://slack.com/intl/en-gb/blog/news/dreamforce-slack-native-ai · https://slack.com/help/articles/115004846068

---

## 2. Coordinating inputs from multiple people

### Threads and "Also send to #channel"
- **[S-3p]** When replying in a thread, an **"Also send to #channel"** checkbox posts the reply to the channel as well. Guides recommend using it for conclusions or status updates.
  - To follow a thread: More actions (…) > **Get notified about new replies**.
  - **Threads view** in the sidebar lists followed threads, newest first.
  - https://itsourcecode.com/slack/how-to-use-slack-threads-effectively-2026/ · https://apps.apple.com/pl/mac/story/id1574375253
- Since 2026, thread replies also arrive in **Activity > Threads** filter **[S]**.
- **[S]** Reliability: on **Jan 27, 2025** an incident caused delayed thread notifications and repeated notifications for thread messages already read.
  - https://slack-status.com/2025-01-27
- **[I]**
  - A thread has no states such as open/resolved, decided, or waiting on X.
  - "Also send to channel" is the only way to promote a result, and it duplicates the message instead of marking it as the outcome.

### Huddles and AI huddle notes
- **[S]** AI notes use the live audio and the thread messages to write a **canvas posted in the huddle thread**, covering attendees, topics and **action items**.
  - Someone has to turn it on, or it can be set to auto-start for certain channels. Participants are notified.
  - It is **not available with external people or guests**.
  - Transcripts are embedded in the canvas but excluded from search.
  - https://slack.com/help/articles/31377193680019
- **[S]** Huddles open in a separate window by default (Jan 2026).
- **[I]** Action items in the notes canvas are text, not assigned List items or reminders. No source was found for converting them automatically.

### Canvases
- **[S]** A built-in surface for formatted, long-lived content such as plans and notes. Reachable from the **Files** tab (since Sept 2025) and as **channel header tabs**.
  - Channel templates bundle canvases, lists and workflows as header tabs. The template gallery is under **More/Tools**.
  - https://slack.com/help/articles/203950418-Use-a-canvas-in-Slack · https://slack.com/help/articles/34237742189715 · https://slack.com/help/articles/33223290843667

### Lists
- **[S]** Structured items with fields.
  - Default fields: **Completion, Name, Assignee, Due date**. Status, priority and others can be added.
  - Table or **board** views, and filters.
  - Shared with people or channels with view/edit permissions.
  - Items assigned to you appear under **"Assigned to you"** on the Lists page, now inside **Files**.
  - https://slack.com/help/articles/14455427318291 · https://slack.com/help/articles/27588021944339
- Plan availability for Lists was **not confirmed** in the sources. At launch (June 2024), Lists was paid-first [S-3p, TechRepublic].

### Workflows and approvals
- **[S]** **AI workflow generation**: describe a workflow in natural language and Slack drafts one to edit and publish.
  - AI steps include an "AI answer" step grounded in canvases or channel history, and a "summarize channel" step.
  - https://slack.com/help/articles/32843655109395
- **[S-3p]** Approvals are not a dedicated object. They are built in Workflow Builder as a message with **Approve/Deny buttons** plus conditional branching. The workflow then updates the original thread.
  - https://clearfeed.ai/blogs/slack-approval-workflow-guide · slack.dev workshop
- Workflows now live in the **Tools** tab (Sept 2025) **[S]**.

### Polls and emoji-reaction voting
- **[S-3p]** **Slack has no built-in poll.** Teams use emoji reactions (one emoji per option, with a count under each) or Marketplace apps such as **Simple Poll** or **Polly**.
  - Reaction voting is not anonymous, not exclusive (one person can vote for every option), and has no deadline or close.
  - https://zapier.com/blog/how-to-create-a-poll-in-slack/ · https://www.trychaser.com/blog/how-to-create-a-poll-in-slack
- **[I]** Nothing shows *who hasn't voted or responded*.
  - Slack has no read receipts or "seen by" in channels. This comes from my product knowledge and the absence of any feature in the sources. No official Slack statement was found.

---

## 3. Bringing structure to messy communication

### Search
- **[S]** Modifiers:
  - `in:`, `from:`, `with:` (threads and DMs with a person)
  - `is:thread`
  - `-` to exclude
  - A Filters control after search on desktop
  - https://slack.com/help/articles/202528808-Search-in-Slack
- **[S-3p]** Also: `has:` (reaction or pin), `during:`, `is:saved`.
  - https://www.uctoday.com/unified-communications/how-to-search-for-a-message-in-slack-using-slack-search/
- **[S]** **AI search answers**: answers to natural-language questions, with citations to messages, files and canvases. They respect each user's permissions.
- **[S]** **Enterprise search**: connectors such as Google Drive and GitHub, with SharePoint, OneDrive and Jira "coming soon" as of Dec 2025. Real-Time Search API and MCP server support were announced Oct 2025.
  - https://slack.com/blog/productivity/ai-enterprise-search-top-features-and-tools-in-2025 · Dreamforce blog above
- **[S]** Slack's own framing (Mar 2025, "The Hidden Knowledge Crisis"): information is everywhere, but workers struggle to find and apply it.
  - https://slack.com/blog/productivity/the-hidden-knowledge-crisis

### Channel sprawl
- **[S-3p]**
  - "Thousands of channels, many dormant, slow search, and bury the conversations that matter" (Stitchflow).
  - Duplicate channels such as #proj-xyz and #project-xyz (ClearFeed).
  - Channels are rarely archived (G2 review).
  - Scaling Slack means "more and more channels", and people miss discussions "especially in threads" (Substack critique).
  - https://www.stitchflow.com/blog/slack-license-management · https://clearfeed.ai/blogs/best-practices-to-organize-your-slack-for-maximum-productivity · https://www.g2.com/discussions/how-do-large-slack-workspaces-manage-channel-sprawl · https://liorn.substack.com/p/the-problem-with-slack
- **[S] Counterpoint:** Slack's own guidance warns that a large team with **too few** channels is the danger.
  - https://slack.com/blog/collaboration/advice-for-large-teams-on-slack

### Structure tools, recapped
- Canvases (documents), Lists (tasks), channel templates (bundles), workflows (process), huddle notes (meeting capture), summaries and Recap (compression), Today (AI to-dos).
- **[I]** None of these links back to a *specific decision in a thread*. Users move content between them by hand: copy into a canvas, add to a list, "Also send to channel".

---

## 4. Publicly reported pain points

| Pain point | Evidence | Type |
|---|---|---|
| Notification overload: you can't tell what needs attention | Slack's own Activity blog: "a wall of notifications... no way to tell what actually needs your attention" | [S] vendor admission |
| Old Activity incomplete and passive | Slack Design: it showed "many notifications but not all", and items could only be marked read | [S] |
| Not knowing where to start after a meeting | Slack Design opening premise | [S] |
| Decisions buried in threads and old channel history | Atomic Object, "Losing Context": a channel view favors recent messages, so last week's thread gets buried. Discourse blog: 40 minutes searching Slack for an 8-month-old decision | [S-3p] https://spin.atomicobject.com/issues-slack-how-to-cope/ · https://meta.discourse.org/t/the-death-of-community-memory/388184 |
| "Lost in threads" / content hidden behind clicks | Kotlin Slack: "threads are the worst thing to happen to slack". Blind: comments get lost in channels of 500+ people | [S-3p] anecdotal |
| Missed or duplicate thread notifications | Jan 27, 2025 incident; The Verge: repeated notifications for threads already read | [S] |
| Channel sprawl | See §3 | [S-3p] |
| Unclear who still needs to respond or vote | No read receipts, polls or "awaiting response" state found. Today's AI to-dos ("messages that may need a reply") are Slack's partial answer, on premium tiers only | [I] grounded in a gap in the sources |
| "78% feel overwhelmed by Slack alerts" | Supportbench (a vendor). Unverified, so **do not cite as fact** | [S-3p] weak |

---

## 5. Public stats

- **Slack Workforce Index (Apr–May 2025; n=5,156 desk workers, 6 countries, run by Qualtrics):**
  - Daily AI use **up 233%** in 6 months.
  - About 60% use AI, and 40% have used agents.
  - Daily AI users report **64%** higher productivity, **58%** better focus and **81%** higher job satisfaction (self-reported correlation).
  - https://www.salesforce.com/news/stories/daily-ai-workforce-use-growth/
- **Slack State of Work 2023 (n=18,149, 9 countries):**
  - Desk workers spend **32% of their time on "performative work"** (about 12.8 h a week).
  - **43% of meetings** could be eliminated.
  - Automation saves about **3.6 h a week**.
  - https://fortune.com/2023/05/04/employees-waste-time-looking-busy-productivity · Salesforce stat one-pager
- **Microsoft Work Trend Index special report (June 2025)**, a cross-industry benchmark rather than Slack data:
  - The average worker gets **117 emails and 153 Teams messages a day**.
  - Workers are **interrupted about every 2 minutes** in core hours.
  - The heaviest 20% of users get about 275 pings a day.
  - https://www.techradar.com/pro/microsoft-study-finds-whats-stopping-us-from-being-productive-at-work-is-work
- **Slack Activity pilot:** 80% return to Activity repeatedly, and 60% of engaged users triage DMs there (vendor data, no method published).
- **Not found:** a reliable Slack-specific "messages per user per day" figure. The 1.5B messages per day vs per month claims conflict, so don't use them.

---

## 6. Synthesis for the critique ([I] unless noted)

1. **Too many "start here" surfaces.** Today, Activity, Unreads/Catch up, DMs, Later, VIP section, Recap and Slackbot all compete. Slack's answer is to orient in Today, triage in Activity, act in Slackbot [S]. Today, though, is beta and premium-only, and Later is hidden behind More.
2. **Notifications are not obligations.** Activity ranks by type and time. VIP ranks by person. Nothing ranks by "someone is waiting on me" except AI-suggested to-dos on premium plans [S].
3. **Coordination has no state.** Threads, reaction-votes and approvals have no open/closed, quorum, or who's-pending view. Polls need third-party apps [S-3p].
4. **Outputs don't link back.** Huddle notes, canvases, lists and summaries each capture decisions separately. Promoting a thread's conclusion means copying it ("Also send to channel").
5. **AI compresses, but doesn't structure.** Summaries and recaps cut down reading time. They don't produce durable records such as decisions, owners and due dates, except huddle-notes action items in canvas text [S].
