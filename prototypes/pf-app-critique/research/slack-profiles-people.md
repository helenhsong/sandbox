# Slack desktop: people profiles and finding people (research, Oct 2026)

Tags: [S] Slack/vendor first-party source · [S-3p] third-party source · [I] inference.
Method note: WebFetch could not resolve slack.com, api.slack.com, or most other hosts (DNS ENOTFOUND, including the en-gb/en-au alternates). Everything below comes from search-engine extracts of the pages linked. Exact UI labels from 2025-26 builds could NOT be verified from screenshots. Treat button and menu names as approximate.

---

## 1. Profile surfaces

**Hover card / mini profile**
- [S] Hovering over or clicking a name opens a small card with the photo and a shortened profile, with buttons to start a **huddle, call, or DM**. It was introduced in the June 2022 profile redesign. https://slack.com/blog/news/profile-updates-hybrid-work-teams
- [S-3p] Computerworld coverage of the same redesign: https://www.computerworld.com/article/3662295/slack-revamps-user-profiles-for-better-connections.html
- [I] The mini card shows display name, full name, title, status/emoji, local time, and pronouns (if enabled). The 2025-26 desktop keeps the 2022 structure. Primary actions are Message and Huddle, plus a "View full profile" link.

**Full profile (right-side panel)**
- [S] The 2022 redesign organised the full profile into modules: **Contact information** (email, phone, other ways to reach someone), **People** (who the person works with, which is the org-chart entry point), and **About Me** (customisable fields such as start date, languages, pets, birthday). It also added **name pronunciation** as an audio recording plus text. Same blog URL as above.
- [S] Members can add a name recording, name pronunciation, phone number, and time zone. Fields marked with a lock icon can only be edited by an owner or admin. https://slack.com/help/articles/204092246 (Edit your profile)
- [S] **Pronouns** and **name pronunciation** fields can be shown or hidden by owners and admins. The pronoun field is hidden unless an admin turns it on. https://slack.com/intl/en-in/help/articles/1500011115781-Manage-pronoun-display-for-member-profiles
- [S] Admins add **custom profile fields** such as location, start date, and social links. A "Show up in Search" option makes a field searchable. Path: Admin → Workspace/Organization settings → People → Profiles (or "Atlas profiles"). Custom fields can't be edited on mobile. https://slack.com/help/articles/212281478-Customize-member-profiles
- [S] Slack Connect viewers (external orgs) see either "basic" details (name and photo only, the default) or "standard work details" (name, photo, title, status, local time, pronouns, DND state). https://slack.com/intl/en-gb/help/articles/4417558556691-Manage-profile-details-for-Slack-Connect
- [S] With Atlas, "Flexible Text" fields hold up to 5,000 rich-text characters (bios, bullets, links). Same 2022 blog.

**Buttons and menus on the profile**
- [S-3p] The full profile has a "⋮ / More" menu with **Copy member ID**. https://help.peoplebox.ai/hc/peoplebox-help-center/articles/1721797794-how-to-find-slack-member-id ; https://help.zapier.com/hc/en-us/articles/34634861619213
- [S] **Hide person** (July 2023) is a one-way, mute-like control from the profile. Hidden messages stay accessible to the user, and the hidden person notices nothing. Enterprise Grid admins can disable it. https://slack.com/blog/news/new-hide-person-feature
- [S] **VIP** (up to 300 people, apps, and workflows) is documented as managed in Preferences → VIP. DMs and mentions from VIPs go to a VIP unreads section. https://slack.com/help/articles/34963579361683 . Whether a VIP toggle also exists on the profile card is unconfirmed [I: likely in the ⋮ menu].
- [S-3p] A "View as" dropdown on your own profile previews how a coworker sees it. https://www.guideflow.com/tutorial/how-to-view-profile-as-a-coworker-at-a-workspace-in-slack
- [I] Common ⋮ items: View files, Copy display name, Copy member ID, Hide/Mute, Add to VIP, Open DM / Huddle. None of these could be confirmed against a 2025-26 help page except Copy member ID and Hide.

**AI on profiles**
- [S] No official Slack help page or release note was found for an **AI-generated profile summary** or an "Ask about this person" button. The Slack AI guide covers summaries of channels, threads, huddles, and search answers, not people. https://slack.com/help/articles/25076892548883-Guide-to-AI-features-in-Slack
- [S-3p] A vendor blog (Question Base, 2026) claims "profile summaries now show what a person does and their recent projects". This is unverified and should be treated as weak. https://www.questionbase.com/resources/blog/slack-ai-2026-enterprise-search-context-agents-future-of-work-chat
- [S-3p] Third-party apps fill the gap. Examples: "AI Profile for Slack" (`/whois @user`) https://www.producthunt.com/products/profile-for-slack/launches/ai-profile-for-slack and the CodeWords "Person Finder" template. https://docs.codewords.ai/templates/person-finder-from-slack
- [I] The person surface is the one place where Slack's new agentic Slackbot hasn't been visibly integrated. That makes it a gap and an opportunity.

## 2. Org chart and reporting line
- [S] The org chart is part of **Slack Atlas**. It is built entirely from each member's `managerId` (a user ID, email, or username), set through the SCIM API (some regional pages also say the Web API). There is no separate "direct reports" field: reports are derived. https://slack.com/intl/en-gb/help/articles/22467765879315-Customise-profiles-with-Slack-Atlas
- [S] Atlas: "searchable profiles and an interactive org chart", fed from HRIS via SCIM, described as "a source of truth for organizational structure and reporting relationships". It also supports **view-only profiles** for employees without a Slack account (`[[profile-only]]` userType suffix). https://slack.com/atlas ; https://slack.com/features/atlas
- [S] Packaging: Atlas is included with Enterprise Grid/Enterprise+ and is a paid add-on for Business+. Atlas pages and the help article above.
- [S] Atlas is not on the feature-retirement list as of 2026. The most recent retirement listed is Channel Expert (May 2026). https://slack.com/help/articles/4426294050451-Slack-feature-retirements
- [I] Without Atlas (Pro, or Business+ without the add-on) there is no org chart or Reports-to line. Admins can only approximate one with a text custom field such as "Manager".

## 3. Seeing what someone has worked on
- [S] The profile has **no "recent activity", "shared channels", or "recent work" section** in any documentation found. The 2022 "People" module shows collaborators/org, not work artefacts. Same 2022 blog.
- [S] The substitute is search modifiers. `from:@person` finds what they posted, and `with:@person` finds threads and DMs you've had with them. These combine with `in:#channel` and date modifiers. https://slack.com/intl/en-gb/help/articles/202528808-Search-in-Slack ; https://trailhead.salesforce.com/en/content/learn/modules/asynchronous-work-with-slack/find-the-information-you-need
- [I] "View files" (⋮ menu) runs a files search scoped to that person. Shared channels, canvases, and lists are not summarised on the profile. You must pivot to search, which shows raw messages rather than a synthesis of "what they work on".

## 4. Finding a person by expertise
**People directory**
- [S] Path: **Home → Directories → People** (if Directories is missing, try the More menu in the sidebar). Search by **name, job title, team, or email**. Sort/Filter panel: the only documented filter is **account type** (guest, deactivated, owner/admin), and Slack Connect people can also appear. Mobile: Search → Browse People. https://slack.com/intl/en-gb/help/articles/360003534892-Browse-people-and-user-groups-in-Slack
- [S] Directories also holds **User Groups** (Directories → User Groups → ⋮ → Edit group details). https://slack.com/help/articles/29873996048019 . The new navigation's "More" menu opens dedicated views for channels, people, and user groups.
- [S] Custom fields with "Show up in Search" enabled are matched by keyword in people search, so a "Skills" field is findable only if admins create it and people fill it in. https://slack.com/help/articles/212281478
- [S-3p] Process Street claims filters for department, team, online status, and skills. This is not confirmed by Slack docs and is likely overstated. https://www.process.st/?p=84764
- [I] There is no documented time-zone or title *filter* (title is only a search term). Could not confirm the "Directories since Sept 2025" date from release notes.

**AI / enterprise search**
- [S] Enterprise search launched in March 2025 (Enterprise Grid with Slack AI), searching across connected apps (Drive, Jira, GitHub, Salesforce...). It is permission-aware. https://slack.com/blog/news/slack-enterprise-search-uncover-knowledge-work-smarter
- [S-3p] At Dreamforce Oct 2025, Slackbot was rebuilt as an AI assistant. It reached GA on **Jan 13, 2026** for Business+/Enterprise+ and can find info, draft, and schedule. https://techcrunch.com/2026/01/13/slackbot-is-an-ai-agent-now ; https://www.salesforceben.com/3-slack-announcements-from-dreamforce-25-whats-new/
- [S] Slack's own developer blog ("Dear Slackbot", updated Apr 2026) recommends prompting Slackbot to **identify SMEs by ranking who contributes most to relevant discussions in named channels**. Expert-finding is an emergent prompt pattern, not a dedicated feature. https://slack.dev/dear-slackbot/
- [S] **Channel Expert** (legacy AI agent) was retired in May 2026, with Slackbot as the replacement. https://slack.com/intl/es-es/help/articles/43686587570963-Use-Channel-Expert-in-Slack--legacy-
- [S-3p] History: Slack shipped "expert" recommendations in search in 2017 (people who often discuss a topic). They later disappeared. https://qz.com/973989/slack-can-now-identify-your-companys-resident-expert-in-everything-even-westworld
- [S-3p] A Guru community post (Oct 2025) asks whether an "ask an expert" message action has gone. https://community.getguru.com/q-a-5/ask-an-expert-via-slack-missing-7823

## 5. Who edits what, and profile staleness
- [S] Three ways to fill a profile: SCIM from the IdP, the Web API, or manual edits by members. Atlas help and https://slack.com/help/articles/212281478
- [S] SCIM-synced attributes become **locked**. Members can't edit or delete them, though admins can hide them. Org owners can lock the photo and full name, and SSO settings can lock email and display name. Locked fields keep syncing from the IdP. https://slack.com/intl/en-gb/help/articles/5836076140691-Manage-profile-settings-on-Enterprise-Grid ; https://docs.slack.dev/reference/scim-api/
- [S] A lock icon on a field means admin-only. Self-entered fields cover display name (unless locked), status, pronouns, pronunciation, phone, time zone, About-me custom fields, and title (unless synced). https://slack.com/help/articles/204092246
- [S] Workday + Slack: the official partnership offers a *conversational lookup* of coworker title, manager, department, and location in Slack. It is not a profile-field sync. https://slack.com/blog/productivity/slack-and-workday-get-the-hr-information-you-need-when-you-need-it
- [S-3p] Staleness anecdote: in Northwestern's Garage workspace, "most of the 600 students … don't have profile pictures or titles". https://www.thegarage.northwestern.edu/news/a-guide-to-the-garage-slack
- [S-3p] Directory vendors note that incomplete or outdated profiles make people search return wrong results. https://www.clearpeople.com/blog/limitations-of-the-standard-employee-directory-in-microsoft-365 ; https://www.apps365.com/employee-directory/
- [I] Pattern: HR-synced fields (name, title, dept, manager) are accurate but thin. Self-entered expertise fields ("Ask me about", skills) are optional and decay. No public Slack data on completion rates was found.

## 6. Pain points and competitors
**Pain points**
- [S-3p] McKinsey via Pebb: about **1.8 h/day** is spent searching for information or the right coworker. APQC via Pebb: about **1.7 h/week** goes to finding the right person for answers or expertise. These are secondhand figures, so verify the originals. https://pebb.io/articles/benefits-searchable-employee-directory-large-teams
- [I] Recurring themes: titles don't reveal ownership ("who owns X?"); expertise lives in message history rather than profiles; the profile gives no "what are they working on now"; and search `from:` returns noise, not synthesis.

**Microsoft 365 / Teams**
- [S] The M365 **profile card** has sections for **organization chart, people they work with, recent files shared with you, and LinkedIn**. https://support.microsoft.com/office/profile-cards-in-microsoft-365-e80f931f-5fc4-4a59-ba6e-c1e35a85b501
- [S] Teams org chart redesign (MC1151242): a centered focal person, fewer clicks, and back/forward navigation between people. Rollout ran late 2025 into early 2026. https://mc.merill.net/message/MC1151242
- [S] Delve retired Dec 16, 2024, and its profile properties moved to M365 profile cards and pages. https://learn.microsoft.com/sharepoint/delve-retirement
- [S] **People Skills** (2025): a 16k+ skill library, AI-inferred skills shown on the profile card (including Teams), and used by Copilot and people search. https://learn.microsoft.com/en-us/viva/skills/skills-overview ; https://mc.merill.net/message/MC1060842

**Glean**
- [S] Glean distinguishes **people/profile search** (profile fields) from **Expert Search**. Expert Search infers expertise from document authorship, ticket assignments, and other activity. https://docs.glean.com/actions/glean/expert-search
- [S] Glean's people data powers its directory, and the "Enterprise Graph" models people, projects, and data. https://help.glean.com/en/articles/6821750-admin-guide-setting-up-people
- [I] A Glean person page links the person to the documents and projects they touch (the "works on" concept). No public doc confirmed the exact label.

**Notion / Linear** [I]
- Notion: people pages are minimal, and expertise is found via teamspace and page-authorship search or Notion AI Q&A.
- Linear: the profile shows assigned and created issues and team membership. It is activity-based "what they work on" with no expertise field.

## Takeaways for design [I]
1. Slack's profile is **identity-centric** (who and how to reach them), not **work-centric** (what they own or are working on). M365 and Glean both put activity (files, docs, tickets) on the person surface.
2. Expertise discovery in Slack is split across three weak paths: a directory keyword match on optional fields, a `from:` search, and ad-hoc Slackbot prompts. None of them is exposed on the profile itself.
3. Org chart and reporting line are paywalled behind Atlas and depend on SCIM `managerId` hygiene.
4. The most recent native "expert" features (2017 search experts, Channel Expert) were both removed. The space is open for a Slackbot-on-profile experience ("what is X working on / ask about X").
