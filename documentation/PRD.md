# PRD: AI.SEA Builder Directory & Discord Bot

**Author:** Brendan (Co-founder, AI.SEA)  
**Status:** Draft  
**Last Updated:** February 2026

---

## Overview

AI.SEA is Southeast Asia's largest grassroots AI builder community. This PRD covers the design and implementation of a **public builder directory** on aisea.builders. Builders can create and edit profiles **on the site** (authenticated) or via a **Discord bot** — the bot can be invoked from any channel and then DMs the user to run the flow.

---

## Problem Statement

AI.SEA's most active builders are on Discord, but there is currently no central, public-facing place to discover who is building, what they are working on, and how active they are. This limits visibility for individual builders and makes it harder for partners, collaborators, and hackathon organizers to find and engage with the right people across the region.

---

## Goals

- Give builders a public profile page on aisea.builders with minimal friction — create/edit **on the site** or via the Discord bot
- Surface real build activity automatically via GitHub integration
- Lay the data foundation for faster hackathon registration in future
- Keep Discord as an option — bot allows profile and project submission without leaving the server

---

## Non-Goals

- Educational courses or content hosting (future consideration)
- Private profiles (all directory profiles are public; auth is for creating/editing your own)
- A full-featured portfolio builder
- Replacing Discord as the community hub

---

## User Stories

**As a builder,** I want to create my profile either on the site or by chatting with the Discord bot so that I can choose the path that fits me.

**As a builder,** I want my GitHub commit activity to automatically appear on my profile so that my profile stays current without manual effort.

**As a builder,** I want to submit my project via Discord so that it appears on the public directory and is visible to collaborators and partners.

**As a visitor or partner,** I want to browse a directory of active SEA builders filtered by city, skills, contribution count, and project count so that I can find the right people to collaborate with or recruit for events.

**As an event organizer,** I want builder profiles to eventually pre-fill hackathon registration so that sign-up is faster and data is consistent. *(Out of scope for initial launch — see Milestones.)*

---

## Features

### 1. Discord Bot — Profile Creation

The bot guides builders through a short conversational flow to collect profile information. The interaction should be fast and feel natural — not like a form.

**Fields collected:**
- **Handle** (chosen username, unique, used in profile URL `/builders/[handle]`)
- Name
- City
- Skills / what they build (**fixed list**, multi-select)
- GitHub handle
- One-liner bio (max 160 chars — enforced in bot/UI)
- (Optional) LinkedIn or personal URL

**Bot flow:**
1. Builder triggers bot with `/profile create` or a prompt in **any channel**
2. Bot DMs the user and asks questions one at a time in that DM
3. On completion, bot writes profile to Supabase and posts a confirmation with a link to the public profile page
4. Builder can update any field at any time with `/profile update`

---

### 2. Discord Bot — Project Submission

Builders can submit projects they are working on or have shipped.

**Fields collected:**
- Project name
- One-line description (max 280 chars — enforced in bot/UI)
- Tech stack / tools used (**fixed list**, multi-select)
- Stage (idea / in progress / shipped)
- GitHub repo URL (optional)
- Demo or live link (optional)

**Bot flow:**
1. Builder triggers with `/project submit` in any channel (or in DM)
2. Bot collects fields via DM
3. Project is linked to the builder's profile in Supabase
4. Appears on the builder's profile and on the dedicated project listing page

---

### 3. Public Builder Directory — aisea.builders/builders

A public-facing page on the existing Next.js site showing all builder profiles.

**Features:**
- Filter by city, skills, **contribution count bands**, and **project count**
- Sort by recently active (based on GitHub commit recency)
- Each card shows: name, city, skills, bio, GitHub activity indicator, and projects
- Links through to individual profile pages

**Scope:** v1 is **English only** (no next-intl for /builders surfaces).

---

### 4. Dedicated Project Listing — aisea.builders/builders/projects

A public page listing all projects across builders, with filters (e.g. stage, tech stack) and links to builder profiles. v1 English only.

---

### 5. Individual Profile Pages — aisea.builders/builders/[username]

A dedicated page per builder. The URL slug **`[username]`** is the builder's **chosen handle** (unique). Page shows:
- Bio and basic info
- GitHub contribution graph (fetched via GitHub public API)
- Last active date (from GitHub)
- Listed projects with links
- Skills / tags

**Web profile creation/edit:** Builders can also create and edit their profile on the site (authenticated). Discord bot is an alternative path; both write to the same Supabase data.

---

### 6. GitHub Integration

GitHub commit activity is pulled from the public GitHub API and refreshed on a scheduled basis.

**Data fetched:**
- Public contribution count (last 12 months)
- Last contribution date
- Pinned or public repositories (optional, for profile enrichment)

**Refresh cadence:** Daily via a Vercel Cron Job

No elevated GitHub permissions required — public API only.

---

## Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (existing site on Vercel) |
| Database | Supabase (PostgreSQL + REST API) |
| Discord Bot | Discord.js (Node.js) |
| GitHub Data | GitHub Public REST API |
| Scheduled Jobs | Vercel Cron Functions |
| Web auth (profile create/edit) | Supabase Auth |

**Fixed lists:** Skills (profile) and tech stack (project) are chosen from curated fixed lists. Define in config or a small reference table; bot and web UI both use the same lists. *(Exact lists to be specified in implementation.)*

---

### Data Schema (Supabase)

**builders**

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| username | string | **Chosen handle**, unique, used in profile URL |
| discord_id | string | Unique, used when creating/updating via bot; nullable if profile created on web only |
| name | string | |
| city | string | |
| bio | string | Max 160 chars (enforced in bot/UI) |
| skills | string[] | From fixed list |
| github_handle | string | |
| linkedin_url | string | Optional |
| personal_url | string | Optional |
| github_contributions | integer | Refreshed daily |
| github_last_active | date | Refreshed daily |
| created_at | timestamp | |
| updated_at | timestamp | |

**projects**

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| builder_id | uuid | Foreign key → builders.id |
| name | string | |
| description | string | Max 280 chars (enforced in bot/UI) |
| tech_stack | string[] | From fixed list |
| stage | enum | idea / in_progress / shipped |
| github_url | string | Optional |
| demo_url | string | Optional |
| created_at | timestamp | |

---

### Discord Bot Architecture

- Hosted as a lightweight Node.js service (can be deployed on Railway, Fly.io, or a small VPS)
- Communicates with Supabase via the Supabase JS client
- Uses Discord.js interaction handlers for slash commands
- **Trigger:** profile/create and project/submit can be triggered from **any channel** (or in DM); the bot then DMs the user and runs the Q&A flow in DM to keep channels clean

---

### GitHub Data Refresh

A Vercel Cron Function runs daily and:
1. Fetches all builders with a GitHub handle from Supabase
2. Calls the GitHub API for each handle to retrieve contribution data
3. Updates `github_contributions` and `github_last_active` fields

Rate limits: GitHub's unauthenticated API allows 60 requests/hour per IP. For larger builder counts, a GitHub OAuth App token should be used to raise the limit to 5,000 requests/hour.

---

## Future Considerations

- **Hackathon registration:** Builder profiles in Supabase can pre-fill event sign-up forms, reducing friction for repeat participants. This can be implemented by linking a hackathon event table to builder IDs.
- **Bounties and project listings:** Projects could be tagged as open for collaborators or looking for specific skills, turning the directory into a lightweight matchmaking layer.
- **Community leaderboard:** Surfacing most active builders by city or skill to celebrate contributions and drive engagement.
- **Builder profiles as cross-community identity:** As AI.SEA expands to more cities, a shared profile standard could allow builders to carry their identity across local chapters.

---

## Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Profiles created via Discord bot | 200+ |
| Projects submitted | 100+ |
| Monthly unique visitors to /builders | 1,000+ |
| % of profiles with GitHub linked | >70% |
| Profile creation completion rate | >80% |

---

## Milestones

| Milestone | Description |
|---|---|
| M1 — Bot MVP | Discord bot can collect profile info (incl. handle, fixed skills list) and write to Supabase |
| M2 — Directory | Public /builders page live (filters: city, skills, contribution bands, project count); web profile create/edit (auth) |
| M3 — GitHub Integration | Contribution data syncing daily on all profiles |
| M4 — Project Submissions | Bot supports project submission (fixed tech stack list); dedicated /builders/projects page |
| M5 — Hackathon Hook | *Out of scope for initial launch.* Builder profiles usable for faster event registration (future). |
