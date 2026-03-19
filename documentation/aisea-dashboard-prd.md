# AI.SEA Member Dashboard — Product Requirements Document

**Version:** 0.1  
**Status:** Draft  
**Scope:** MVP (Phase 1) + Phase 2 overview  
**Audience:** Engineering, Design

---

## 1. Purpose & Context

The AI.SEA member dashboard is the logged-in experience for builders who have joined the network. It is not a social platform. It is a **mission control for a builder's trajectory within AI.SEA** — oriented around what they can do, build, and prove, not what others have posted.

The MVP centres on two surfaces: **Challenges** and **Builder Profile**. These are tightly coupled — challenges generate the submissions, and the profile is where submissions accumulate into a proof-of-work record.

The dashboard must feel like a natural extension of the existing public site: dark, high-signal, technical-but-human, Southeast Asian in context.

---

## 2. Design System

### 2.1 Aesthetic Direction

The dashboard inherits the public site's dark aesthetic and extends it into a **dense, utilitarian command interface** — think mission briefing room, not social feed. Every element should earn its place. Nothing decorative that doesn't also inform.

Reference points: Linear's interface density, Vercel's dark dashboard, Buildspace's builder-first tone.

### 2.2 Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0a0a0a` | Page background |
| `--bg-surface` | `#111111` | Cards, panels |
| `--bg-surface-raised` | `#1a1a1a` | Hover states, inputs |
| `--border` | `#222222` | Dividers, card borders |
| `--border-subtle` | `#1a1a1a` | Inner borders |
| `--text-primary` | `#f0f0f0` | Headings, key labels |
| `--text-secondary` | `#888888` | Supporting text, metadata |
| `--text-muted` | `#555555` | Timestamps, placeholders |
| `--accent` | `#e8ff47` | Primary CTA, active state, live badge — the "signal colour" |
| `--accent-dim` | `#c8df30` | Hover on accent |
| `--city-tag` | City-specific (see §2.5) | Node affiliation badges |
| `--destructive` | `#ff4444` | Errors only |

The accent (`#e8ff47` — electric yellow-green) should be used sparingly but deliberately. It marks the thing that matters right now.

### 2.3 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Hero | `Syne` (Google Fonts) | 800 | 28–40px |
| UI Labels / Nav | `DM Mono` (Google Fonts) | 400/500 | 11–13px |
| Body / Descriptions | `Inter` | 400 | 14–15px |
| Challenge Titles | `Syne` | 700 | 18–22px |
| Metadata / Tags | `DM Mono` | 400 | 11px |

DM Mono gives the interface a technical, terminal-adjacent feel that signals "builder tool" without being retro. Syne brings editorial energy to hierarchy moments.

### 2.4 Spacing & Grid

- Base unit: `4px`
- Content max-width: `1200px`
- Sidebar width: `220px` (fixed)
- Card padding: `20px`
- Section gaps: `32px`
- Border radius: `6px` on cards, `4px` on tags/badges, `0` on nav items

### 2.5 City Node Colours

Each city node gets a distinct accent used in tags and profile badges:

| City | Colour |
|---|---|
| Kuala Lumpur | `#00c2ff` |
| Singapore | `#ff6b35` |
| Jakarta | `#7c3aed` |
| Manila | `#f59e0b` |
| Ho Chi Minh City | `#10b981` |
| Bangkok | `#ec4899` |
| Other / Global | `#888888` |

### 2.6 Component Patterns

**Cards:** `1px solid var(--border)` border, `var(--bg-surface)` background, `6px` radius. On hover: border lifts to `var(--border-subtle)` with a brighter shade (`#333`), background shifts to `var(--bg-surface-raised)`. No box shadows — elevation is implied by border contrast alone.

**Tags / Badges:** Monospace, all-caps, `11px`, `4px` radius, `4px 8px` padding. Two variants: filled (for status) and outlined (for categories).

**Buttons:**
- Primary: `var(--accent)` background, `#0a0a0a` text, `DM Mono`, uppercase, `500` weight
- Secondary: transparent background, `var(--border)` border, `var(--text-primary)` text
- Ghost: no border, `var(--text-secondary)` text, hover reveals background

**Inputs:** `var(--bg-surface-raised)` background, `var(--border)` border, `var(--text-primary)` text, `DM Mono` font. Focus: border becomes `var(--accent)` with no box shadow.

---

## 3. Layout Architecture

### 3.1 Shell

```
┌─────────────────────────────────────────────┐
│  TOPBAR (48px)                              │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ SIDEBAR  │        MAIN CONTENT              │
│ (220px)  │        (flex, scrollable)        │
│          │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

The layout is a fixed sidebar + scrollable main content area. No right rail in MVP — it adds visual complexity before content density justifies it.

### 3.2 Topbar

Height: `48px`. Sticky.

Contents (left to right):
- AI.SEA wordmark (links to dashboard home)
- Breadcrumb: current section name in `DM Mono`, `var(--text-muted)`
- Spacer
- City node badge (e.g. `🇲🇾 KL`) — monospace tag, city colour
- Notification bell — icon only, dot indicator if unread
- Avatar / profile dropdown

The topbar should be visually minimal. `1px solid var(--border)` bottom border. No background blur — just `var(--bg-base)`.

### 3.3 Sidebar

Width: `220px`. Fixed, not collapsible in MVP.

```
[AI.SEA mark]        ← 16px padding top

HOME                 ← DM Mono, 11px, uppercase, muted when inactive
CHALLENGES           ← accent colour when active, left 2px border accent
PROFILE

──────────────       ← 1px divider

[City node section]
  KL                 ← your home node
  
──────────────

SETTINGS
```

Nav items: `36px` tall, `16px` horizontal padding, full-width. Active state: `2px left border var(--accent)`, text becomes `var(--text-primary)`. Hover: `var(--bg-surface-raised)`.

No icons in MVP sidebar. Labels only — cleaner, forces good naming.

---

## 4. Screens

### 4.1 Home (Dashboard)

**Purpose:** Orientation. What's live, what's new, what should I do next.

**Layout:** Single column, content max-width `760px` centred in the main area.

**Sections (top to bottom):**

**Welcome Header**
```
Good morning, [Name].           ← Syne, 28px
[City node badge]  [Member since date]
```

**Active Challenges Strip**  
A horizontal row of 2–3 challenge cards (see §4.2 for card anatomy). Label: `LIVE NOW` in accent. If no challenges are live: a single card with "Nothing live right now — check back soon" in muted text. No empty state illustrations — just honest text.

**Your Activity**  
A compact timeline of the builder's recent actions: submissions made, challenges joined, profile updates. `DM Mono`, `13px`. Each item: `[timestamp]  [action]`. Maximum 5 items, then a "See all" link.

**City Node Feed**  
3–5 recent signal items from the builder's city node: new challenges, upcoming events (deep-linked to Luma), notable submissions by other KL builders. This is not a social feed — each item is a single line with a timestamp and a link. No avatars, no likes, no comments.

---

### 4.2 Challenges

**Purpose:** Browse, join, and submit to challenges.

**Layout:** Two-column grid for challenge cards at `≥1024px`, single column below.

**Challenge Card Anatomy:**

```
┌─────────────────────────────────────┐
│  [STATUS BADGE]          [DAYS LEFT]│
│                                     │
│  Challenge Title                    │  ← Syne, 18px
│  Short description (2 lines max)    │  ← Inter, 14px, secondary
│                                     │
│  [Difficulty tag]  [Domain tag]     │
│                                     │
│  [Partner logo if sponsored]        │
│                                     │
│  [N builders]           [CTA btn →] │
└─────────────────────────────────────┘
```

**Status badges:**
- `LIVE` — accent background, dark text
- `UPCOMING` — outlined, muted text
- `CLOSED` — muted background, muted text
- `YOU SUBMITTED` — outlined accent

**Difficulty tags:** `STARTER` / `BUILDER` / `HARDCORE` — outlined, monospace

**CTA states:**
- Not joined: "Take the Challenge →" (primary button)
- Joined, not submitted: "Continue →" (secondary button)
- Submitted: "View Submission" (ghost)

**Challenge Detail Page:**

Full-width layout with a sticky right panel for submission CTA on desktop.

Left column (main):
- Status + time remaining (countdown if <48hrs)
- Challenge title + one-liner
- `---` divider
- **The Brief** — the actual problem statement. Formatted in markdown. This is the most important content on the page.
- **Constraints** — bullet list, `DM Mono`, `13px`
- **Resources** — links to tools, credits, docs
- **Judging Criteria** — how submissions are evaluated
- **Submissions Gallery** — appears after challenge closes; cards showing submitted projects

Right panel (sticky, `300px`):
- Deadline countdown
- Sponsor (if any) — logo + "Powered by" label
- Participants count
- Primary CTA (join / submit / view)
- Share link

**Submission Flow:**

Modal, not a new page. Three fields:
1. Project name
2. Demo link (required) — URL input
3. Write-up (required) — what you built, what you learned, what would you do differently. Markdown input. Min 100 words.

Optional: repo link, additional links.

On submit: confirmation state within modal, then redirects to challenge page where their submission appears in the gallery.

---

### 4.3 Builder Profile

**Purpose:** Proof-of-work record. Public-facing (other builders can view it), also your personal home.

**URL pattern:** `aisea.builders/u/[handle]`

**Layout:**

```
┌──────────────────────────────────────────────────┐
│  [Avatar]  [Name]                                │
│            [Handle]  [City badge]  [Member since]│
│            [Bio — 2 lines max]                   │
│                                                  │
│  [Edit Profile]                    ← own profile │
└──────────────────────────────────────────────────┘

[Stats bar]
Challenges completed: 4  |  Submissions: 6  |  Node: KL

[Skills tags]  ← user-set, from a fixed taxonomy

──────────────────────────────────────────────────

SUBMISSIONS                           ← tab
ABOUT                                 ← tab (links, background)
```

**Submission cards on profile:**
Compact. Challenge name, submission date, status (completed / judged / winner). Clicking opens the submission write-up.

**Skills taxonomy (fixed list, user selects up to 8):**
`LLM Engineering` / `Agentic Systems` / `RAG` / `Fine-tuning` / `Deployment & Infra` / `Product` / `Data Engineering` / `Frontend` / `Hardware/Edge` / `Research`

**Empty state (new member):**  
"No submissions yet. Take your first challenge →" — plain text, accent link. No illustrations.

---

## 5. Phase 2 — Wiki

Deferred from MVP but designed for. The wiki grows organically from challenge content — each challenge can produce a wiki article as a canonical write-up of what the community learned.

**Structure:** Topic-based (not flat doc list). Topics map to the skills taxonomy. Pages are edited by designated contributors (city leads, challenge winners). Read-only for all other members.

**Key decision deferred:** whether wiki pages are linked to specific challenge outputs automatically, or manually curated. Recommend manual curation initially.

---

## 6. Navigation Map

```
/dashboard              → Home
/challenges             → Challenge list
/challenges/[slug]      → Challenge detail
/challenges/[slug]/submit → Submission modal (on detail page)
/profile                → Own profile (redirect to /u/[handle])
/u/[handle]             → Public builder profile
/settings               → Account settings (Phase 1: name, bio, city, handle, skills)
```

---

## 7. MVP Scope — What's In / Out

### In
- Auth (login / signup)
- Home screen (active challenges strip, activity timeline, city feed)
- Challenge list + detail + submission flow
- Builder profile (public) with submission history
- Settings (basic account info)

### Out (Phase 1)
- Bounties
- Wiki
- Notifications (bell icon present but non-functional)
- Builder directory / search
- Partner portal
- Challenge creation UI (challenges seeded manually via admin)
- Comments / reactions on submissions
- Leaderboards

---

## 8. Key Open Questions

1. **Auth provider** — Supabase Auth (already in stack) with email magic link? Or add Google OAuth?
2. **Challenge creation** — who can create challenges at launch? Admin-only is safest. When does partner self-serve become necessary?
3. **Submission visibility** — are submissions public immediately, or only after the challenge closes? Recommend: closed until deadline, then public.
4. **City node assignment** — self-selected at signup, or verified? Self-selected with ability to change is simplest.
5. **Handle generation** — auto-generated from name with manual override, or required at signup?
