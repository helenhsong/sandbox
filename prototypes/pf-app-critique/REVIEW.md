# PF App Critique: Review

Baseline evidence for the Current view. Source detail lives in `research/`. Tags: **[S]** sourced, **[S-3p]** third-party, **[I]** inference. Sources are public search extracts (slack.com pages could not be fetched directly), so exact UI labels are approximate until checked in the app.

## Surfaces inspected (from public sources)

- **Navigation [S]:** left rail Home, DMs, Activity, Files, More (Later, Tools). People live at Home → Directories → People.
- **Hover card [S]:** photo, short profile, Huddle / Call / Message.
- **Full profile [S]:** Contact information; People (org chart and collaborators, Atlas only); About Me. Pronouns and pronunciation if admins enable them. Admin-defined custom fields; SCIM-synced fields are locked.
- **Org chart [S]:** only with Slack Atlas (Enterprise, or a Business+ add-on), built from the manager field.
- **People directory [S]:** search by name, title, team, email; custom fields match only if the admin enables "Show up in Search". Only documented filter is account type.
- **What someone works on [S]:** no section on the profile. Workarounds: `from:@person`, `with:@person`, or prompting Slackbot (GA Jan 2026, Business+ and up) to rank people by contribution in relevant channels.
- **Expertise features [S]:** repeatedly retired (search "experts", Channel Expert retired May 2026).
- **Comparables [S]:** Microsoft 365 profile card shows org chart, people they work with, recent shared files, AI-inferred skills. Glean infers expertise from authored docs and tickets.

## What isn't working

_Pending Problem._

## Impact on users and the business

_Pending Problem._

## Why this problem

Problems considered so far (Helen's brainstorm, see FRAMING.md): fragmented search; hard to organize what needs attention; thin profile page (leaning).
