# AI.SEA Community Wiki — Product Requirements Document

**Version:** 0.2  
**Status:** Approved for implementation  
**Scope:** Phase 2  
**Audience:** Engineering, Design  
**Companion doc:** `aisea-dashboard-prd.md` (design system reference)

**v0.2 changes from v0.1:**  
- Information architecture replaced with a free-form page tree (Notion-style)  
- Fixed topic taxonomy removed; the original 11 topics become the initial seed pages in the tree  
- URL structure changed to flat slugs (`/wiki/p/[slug]`) — position in tree is navigation only, not URL  
- Persistent wiki tree sidebar added (second panel, left of main content, admin drag-and-drop)  
- `wiki_topics` table removed; `wiki_pages` replaces `wiki_articles` with `parent_id` + `sort_order`  

---

## 1. Purpose & Context

The AI.SEA Wiki is a community-maintained knowledge base for builders across the network. It is a **curated, living reference** built from the collective knowledge of people who have actually shipped AI in Southeast Asia.

The wiki lives inside the logged-in dashboard at `/wiki`. Reading is open to all logged-in members. Any member can contribute — articles must pass admin review before going live. Structure (page tree organisation) is managed by admins and super-admins only.

---

## 2. Design System

Inherits the full design system from the Dashboard PRD. Wiki-specific extensions follow.

### 2.1 Aesthetic Direction

Field manual aesthetic — dense but navigable. Not Notion-polished, not Confluence-raw. Structured enough to trust, honest enough to feel real.

### 2.2 Article Body Typography

| Element | Font | Size | Line Height | Max Width |
|---|---|---|---|---|
| Page title | `Syne` 800 | `32px` | `1.2` | — |
| Page subtitle / description | `Inter` 400 | `16px` | `1.6` | `680px` |
| Body text | `Inter` 400 | `15px` | `1.75` | `680px` |
| Code blocks | `DM Mono` 400 | `13px` | `1.6` | `680px` |
| Callouts / pull quotes | `Inter` 400 italic | `15px` | `1.7` | `680px` |
| Section headings (H2) | `Syne` 700 | `20px` | `1.3` | — |
| Section headings (H3) | `Inter` 600 | `15px` | `1.4` | — |
| Tree sidebar labels | `DM Mono` 400 | `12px` | `1.4` | — |

### 2.3 Wiki-Specific Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `--wiki-callout-bg` | `#141a0e` | Note / tip callout background |
| `--wiki-callout-border` | `#3a4a1a` | Callout left border |
| `--wiki-warning-bg` | `#1a1100` | Warning callout background |
| `--wiki-warning-border` | `#4a3300` | Warning callout left border |
| `--wiki-code-bg` | `#0f0f0f` | Inline code and code block background |
| `--wiki-draft-stripe` | `#1a1400` | Draft page banner background |
| `--wiki-pending-badge` | `#f59e0b` | Pending review badge |
| `--wiki-approved-badge` | `#10b981` | Approved / live badge |
| `--wiki-rejected-badge` | `#ff4444` | Rejected badge |
| `--contributor-tag` | `#7c3aed` | Contributor profile badge |
| `--wiki-tree-hover` | `rgba(255,255,255,0.04)` | Tree item hover background |
| `--wiki-tree-active` | `rgba(255,255,255,0.08)` | Active tree item background |
| `--wiki-tree-indent` | `16px` | Per-level indentation in tree |

### 2.4 Status Badge Variants

All status badges follow the existing tag pattern (`DM Mono`, all-caps, `11px`, `4px` radius):

| Status | Style |
|---|---|
| `LIVE` | Filled `--wiki-approved-badge`, dark text |
| `PENDING REVIEW` | Filled `--wiki-pending-badge`, dark text |
| `DRAFT` | Outlined `--border`, muted text |
| `REJECTED` | Outlined `--wiki-rejected-badge`, red text |
| `NEEDS UPDATE` | Outlined `--wiki-pending-badge`, amber text |

---

## 3. Information Architecture

### 3.1 Page Tree Model

Wiki content is organised as a **free-form tree of pages**. There is no fixed taxonomy — admins structure the tree however they want.

Every wiki item is a **page**. Pages can be:
- A root-level page (parent = null) — equivalent to a "topic" or "section"
- A child of any other page — any depth
- Both a container (with children) and content-bearing (with a body) simultaneously

**Initial seed structure (at launch):**  
The original 11 topic areas become the initial root-level pages. Admins can rename, reorder, add, remove, or nest them freely.

```
LLM Engineering
Agentic Systems
RAG
Fine-tuning
Deployment & Infra
Product
Data Engineering
Frontend
Hardware / Edge
Research
SEA Context          ← wiki-specific, highlighted with accent treatment
```

### 3.2 Page Types

Each page carries a type set by the contributor. Type affects display (card icon, badge):

| Type | Description |
|---|---|
| **Guide** | How to do something. Step-by-step, opinionated. |
| **Reference** | What something is. Definitions, comparisons, frameworks. |
| **Resource** | Curated links, tools, papers. |
| **Section** | Container page with no body — purely organisational. Admins only. |

`Section` pages are the organisational containers in the tree. They have a title and optional short description but no markdown body. Members cannot create Section pages.

### 3.3 Page Metadata

```
id                uuid, PK
slug              globally unique, auto-generated from title, editable by admin
parent_id         uuid → wiki_pages.id, nullable (null = root level)
sort_order        integer, position among siblings
type              guide | reference | resource | section
title             string, required
description       string, max 160 chars
body              text (markdown), nullable (sections have no body)
status            draft | pending_review | live | rejected | needs_update
author_id         uuid → auth.users.id
co_author_ids     uuid[]
reviewed_by       uuid → auth.users.id, nullable
reviewed_at       timestamptz, nullable
rejection_note    text, nullable
suggested_update_of  uuid → wiki_pages.id, nullable (update proposals)
created_at        timestamptz
updated_at        timestamptz
```

### 3.4 Attachments & Links

**`wiki_attachments`:**
```
id              uuid
page_id         uuid → wiki_pages.id
uploader_id     uuid → auth.users.id
filename        text
storage_path    text
bucket          wiki-public | wiki-private
file_size_bytes integer
mime_type       text
uploaded_at     timestamptz
```

**`wiki_links`:**
```
id              uuid
page_id         uuid → wiki_pages.id
url             text
title           text
description     text, max 120 chars
link_type       tool | paper | repo | video | other
added_by        uuid → auth.users.id
added_at        timestamptz
```

### 3.5 Tree Ordering & Nesting Rules

- Within any parent, pages are ordered by `sort_order` (integer, 0-indexed, contiguous)
- Moving a page updates `parent_id` and/or `sort_order` of affected siblings
- Maximum enforced nesting depth: **none** (unlimited)
- A page cannot be made a child of its own descendants (cycle prevention)
- Deleting a page with children: children are reparented to the deleted page's parent (not recursively deleted). Only super_admin can delete pages.

---

## 4. Storage Architecture

### 4.1 Buckets

**`wiki-public`**  
Public read access (no auth required). Write restricted to contributors and above. For downloadable assets — PDFs, reference packs, code examples.

**`wiki-private`**  
Auth-gated read (any logged-in member). Write restricted to admins only. For member-gated assets — internal playbooks, partner resources.

### 4.2 File Policies

| Policy | Value |
|---|---|
| Max file size | `50 MB` |
| Allowed MIME types | `application/pdf`, `image/*`, `text/plain`, `application/zip`, `application/vnd.openxmlformats-officedocument.*` |
| Video uploads | **Not allowed.** Embed YouTube or Loom links instead. |

### 4.3 Storage Path Convention

```
wiki-public/pages/[page-slug]/[filename].[ext]
wiki-private/pages/[page-slug]/[filename].[ext]
```

---

## 5. Layout

### 5.0 Overall Shell

Wiki pages use a **three-column layout** at desktop:

```
┌──────────────┬──────────────────┬────────────────────────────────┐
│ Dashboard    │  Wiki Tree       │  Page Content                  │
│ Sidebar      │  Panel           │                                │
│ 220px fixed  │  240px           │  flex-1                        │
│              │  collapsible     │  max-width 900px centred       │
└──────────────┴──────────────────┴────────────────────────────────┘
```

**Wiki tree panel** (240px):
- Persistent when on any `/wiki/*` route
- Contains: `WIKI` label + search input + page tree
- Collapsible via a `‹` toggle button at panel edge. Collapsed state: 0px (hidden), content shifts left
- Collapse state is stored in `localStorage`
- On screens < 1280px: hidden by default, toggleable via a button in the wiki topbar area

**Dashboard sidebar** stays 220px unchanged. Total left chrome at desktop: 460px when wiki tree is open.

At mobile (< 768px): both sidebars become drawers. Wiki tree drawer triggered by a `≡` icon in the page header.

### 5.1 Wiki Tree Panel (Component: `WikiTreePanel`)

```
WIKI                            ← DM Mono, 10px, uppercase, muted
[Search pages…]                 ← input, DM Mono, 12px

─────────────────────────────

▶ LLM Engineering               ← collapsed node (▶ = has children)
▼ RAG                           ← expanded node
    Chunking Strategies         ← child page (leaf, indented 16px)
    Embedding Models            ← child page
    ▶ Advanced RAG              ← child with grandchildren
▶ Deployment & Infra
  SEA Context                   ← no children, leaf

─────────────────────────────
[+ New page]                    ← visible to all members (creates draft)
```

**Tree item anatomy:**
```
[▶/▼ or spacer]  [Page icon]  [Title]          [···]
```

- `▶/▼` — expand/collapse toggle if page has children; `spacer` (16px) if leaf
- `Page icon` — small icon by type: Guide=📄, Reference=📋, Resource=🔗, Section=📁 (or simple SVG equivalents in the design system style)
- `Title` — `DM Mono`, `12px`, truncated with ellipsis at 160px
- `[···]` — context menu, visible on hover: `New child page`, `Rename`, `Copy link` | (admin only) `Move`, `Delete`
- Active page: `--wiki-tree-active` background, accent left border

**Admin drag-and-drop:**
- Drag handle (⠿) appears on left of item on hover — visible only to admin/super_admin
- Drop targets: between-item lines (reorder) and on-item highlight (reparent as child)
- Visual feedback: `2px` accent-coloured insertion line between siblings; target parent highlights with `--wiki-tree-hover`
- Drag is committed on drop — immediate optimistic update + background DB write
- If DB write fails: tree reverts to previous state with an error toast
- Implementation: `@dnd-kit/core` + `@dnd-kit/sortable` (tree plugin)

**Tree search:**
- Filters the visible tree to matching page titles only (client-side, no new DB query)
- Non-matching items hidden; matching items shown with their ancestors expanded for context
- Clears on Escape

---

### 5.2 Wiki Home (`/wiki`)

Rendered in the main content area when no specific page is selected.

```
COMMUNITY WIKI                  ← DM Mono, 11px, uppercase, muted
The builder's field manual.     ← Syne, 32px
[Write a page →]                ← Ghost button, right-aligned (any member)

─────────────────────────────

RECENTLY UPDATED                ← DM Mono, 11px, uppercase, muted

[TYPE BADGE]  Page title              → [Parent page]  @author  [date]
[TYPE BADGE]  Page title              → [Parent page]  @author  [date]
...  (max 8 rows)

─────────────────────────────

[Full-width search bar]         ← DM Mono, placeholder: "Search pages…"
                                  Searches title + description only (MVP)
```

The topic grid from v0.1 is removed — the tree panel serves as the navigation structure. The home page is the entry point and recent-activity feed.

---

### 5.3 Page View (`/wiki/p/[slug]`)

Two-column layout within the main content area (tree panel still visible on left):

```
Left content (~680px max-width):

← [Parent page title]              ← DM Mono, muted, breadcrumb (links to parent)

[TYPE BADGE]  [STATUS BADGE]

Page Title                         ← Syne, 32px
Description                        ← Inter, 16px, secondary

[Avatar]  @handle  [city badge]  [date]   ← DM Mono, 11px

──────────────────────────────────

[Markdown body — rendered]

──────────────────────────────────

SUBPAGES                           ← if page has children, show compact list
  ▸ Child page title               ← links, DM Mono, 12px

──────────────────────────────────

[Attachments section — if any]
[External links section — if any]

──────────────────────────────────

Was this helpful?  [👍]  [👎]


Right sticky sidebar (260px):

[Edit this page →]           ← author or admin only
[Suggest an update →]        ← all other members

─────────────────

ON THIS PAGE     ← DM Mono, 11px, muted
[TOC — H2/H3 headings]

─────────────────

CONTRIBUTED BY
[Author card — avatar, handle, city badge, contributor tag]

─────────────────

LAST UPDATED
[date]
```

**Markdown rendering rules:**
- H2 headings: `1px solid var(--border)` top border, `32px` top margin
- Code blocks: `--wiki-code-bg`, `DM Mono`, `13px`, horizontal scroll, copy button top-right
- Callouts `> [!NOTE]`: `--wiki-callout-bg` background, `--wiki-callout-border` left border
- Callouts `> [!WARNING]`: `--wiki-warning-bg` background, `--wiki-warning-border` left border
- Images: max-width `100%`, `6px` radius, centred
- External links: open in new tab, small `↗` icon appended
- Internal wiki links (`[[page-slug]]` or standard markdown `[text](/wiki/p/slug)`): routed internally

**Section pages** (type = `section`): no markdown body. Page view shows title, description, and a card grid of direct children only. The "Was this helpful?" block is omitted.

---

### 5.4 Write / Edit Page (`/wiki/new`, `/wiki/p/[slug]/edit`)

Full-width editor. The wiki tree panel is hidden in editor mode (focus). Back arrow in topbar exits without saving.

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back   [DRAFT]   [Save Draft]   [Submit for Review]          │  ← topbar
├───────────────────────────────────┬──────────────────────────────┤
│  EDITOR                           │  PREVIEW                     │
│                                   │                              │
│  [Title]                          │  [Live rendered output]      │
│  [Description]  [160 char count]  │                              │
│  [Parent page selector]           │                              │
│  [Type: Guide | Reference |       │                              │
│         Resource]                 │                              │
│                                   │                              │
│  [Markdown body — DM Mono input]  │                              │
│                                   │                              │
│  ─────────────────────────        │                              │
│  ATTACHMENTS                      │                              │
│  [Drop zone or browse]            │                              │
│  [Uploaded file list]             │                              │
│                                   │                              │
│  EXTERNAL LINKS                   │                              │
│  [+ Add link row]                 │                              │
└───────────────────────────────────┴──────────────────────────────┘
```

**Inputs:**
- **Title:** `Syne`, `24px`. Required.
- **Description:** `Inter`, `14px`. Max 160 chars with counter. Required before submission.
- **Parent page:** Searchable dropdown of all live pages and section pages. Defaults to root (no parent). Members can pick any live page or section as parent — position can be changed by admin later.
- **Type:** Radio tabs — Guide / Reference / Resource. (Section type not available to members.)
- **Body:** Markdown-only. `DM Mono` input font. Basic toolbar: bold, italic, H2, H3, code, link, image URL. Min 150 words to enable submission (enforced client-side with live counter).
- **Attachments:** File drop zone. Uploads immediately on drop. Size/type limits from §4.2.
- **External links:** Per-link row: URL (required), title (required), description (optional), type selector.

**Auto-save:** DB upsert every 30 seconds while editor open. "Save Draft" saves immediately. Browser `beforeunload` warn if unsaved changes.

**Submit for Review:** Disabled until title, description, parent, type, and body (≥ 150 words) filled. On click: status → `pending_review`.

**`/wiki/new?parent=[slug]`** — pre-sets the parent page picker (used by tree "New child page" action).

---

### 5.5 Admin Review Queue (`/wiki/admin`)

Access: admin and super_admin only. Reachable via admin section in sidebar.

**Layout:** Full-width table.

```
[Title]  [Type]  [Parent page]  [Author]  [Submitted]  [Status]  [Review →]
```

Default sort: oldest pending first.

**Review split-screen (opened on "Review →"):**

Left: Full rendered page preview as it would appear live.

Right panel:
```
SUBMITTED BY
[Author handle]  [city badge]  [member since]

─────────────────

UPDATE PROPOSAL FOR              ← shown only for update proposals
[Original page title →]         ← links to the current live page

─────────────────

REVIEW ACTIONS

[Approve & Publish]              ← primary, accent
[Request Changes]                ← secondary
[Reject]                         ← ghost, destructive

─────────────────

NOTE TO CONTRIBUTOR              ← shown for Request Changes / Reject
[Textarea]                       ← required for Reject, optional for changes
[Send →]
```

**On Approve:** status → `live`, page visible at its URL, `is_wiki_contributor = true` on builder if first-ever approval.

**On Request Changes:** status → `needs_update`, note stored in `rejection_note`, contributor can edit and resubmit.

**On Reject:** status → `rejected`, note stored, page visible only to author and admins.

---

## 6. Contribution Flow

### 6.1 States & Transitions

```
[Member writes]
      ↓
   DRAFT  ──── auto-saved, visible only to author + admins
      ↓  [Submit for Review]
PENDING REVIEW  ──── in admin queue
      ↓
   ┌──────────────────────────────┐
   ↓                              ↓
  LIVE                     NEEDS UPDATE ──── author edits → PENDING REVIEW
   ↑                              ↓
   └──────── resubmit ────────────┘
                                  ↓  [Reject]
                               REJECTED  ──── author + admins only
```

### 6.2 Permissions

| Action | Member | Contributor | Admin | Super-Admin |
|---|---|---|---|---|
| Read live pages | ✓ | ✓ | ✓ | ✓ |
| Submit new page | ✓ | ✓ | ✓ | ✓ |
| Create Section pages | — | — | ✓ | ✓ |
| Edit own live page | — | ✓ | ✓ | ✓ |
| Edit any live page | — | — | ✓ | ✓ |
| Upload to wiki-public | — | ✓ | ✓ | ✓ |
| Upload to wiki-private | — | — | ✓ | ✓ |
| Review queue access | — | — | ✓ | ✓ |
| Approve / reject | — | — | ✓ | ✓ |
| Drag-and-drop tree | — | — | ✓ | ✓ |
| Delete pages | — | — | — | ✓ |

*City Lead: deferred to post-v1.*

**Contributor status** is auto-granted when a member's first article is approved. It is not revoked.

### 6.3 Update Proposals

Any logged-in member can propose an update via "Suggest an update" on the page sidebar. Opens the editor pre-filled with current content. The proposal is a new `pending_review` row with `suggested_update_of` pointing to the original page.

On admin approval of an update proposal: original page's body, attachments, and links are replaced; `updated_at` refreshed; proposer added to `co_author_ids`. Original page stays live throughout.

---

## 7. Profile Integration

### 7.1 Contributor Badge

On first article approval: `CONTRIBUTOR` badge on public profile (purple, `--contributor-tag`).  
5+ approved articles: badge label upgrades to `SENIOR CONTRIBUTOR`.

### 7.2 Profile Wiki Stats Block

Shown once member has at least one approved article (below challenge stats bar):

```
WIKI
[N] articles  ·  [topics/parents list]  ·  Last contributed [date]
```

### 7.3 Profile Tabs Update

```
SUBMISSIONS  |  WIKI  |  ABOUT
```

**Wiki tab (public view):** Flat list of member's approved pages. Each row: `[Type badge]  [Title]  [Parent page]  [Date]`.

**Own profile only — "Your Drafts" section (private, above public list):**
```
YOUR DRAFTS
[DRAFT]        Page title             [Continue editing →]
[PENDING]      Page title             [View →]
[REJECTED]     Page title             [View feedback →]  [Edit & Resubmit →]
[NEEDS UPDATE] Page title             [View feedback →]  [Edit & Resubmit →]
```

---

## 8. URL Structure

| Route | Purpose |
|---|---|
| `/wiki` | Wiki home (recent activity + search) |
| `/wiki/p/[slug]` | Page view (any depth in tree) |
| `/wiki/new` | New page editor |
| `/wiki/new?parent=[slug]` | New page editor, parent pre-set |
| `/wiki/p/[slug]/edit` | Edit page (author or admin) |
| `/wiki/admin` | Admin review queue |

All wiki routes are under `/dashboard/wiki/*` in the Next.js file system.  
Moving a page in the tree does **not** change its URL (flat slug, not path-based).

---

## 9. Navigation

**Dashboard sidebar additions:**

```
HOME
CHALLENGES
WIKI              ← new, between CHALLENGES and PROFILE
PROFILE
SETTINGS

─────────────── (admin section)
ADMIN › CHALLENGES
ADMIN › WIKI      ← new
```

**Wiki tree panel** replaces the topic grid as the primary navigation within wiki.

---

## 10. Scope

### In (Phase 2 launch)
- Wiki home with recent activity and search
- Persistent wiki tree panel with expand/collapse
- Admin drag-and-drop reorder and reparent
- Page view (markdown rendered, attachments, links, TOC sidebar)
- Section pages (container-only, admin-created)
- New page editor: markdown, file upload, link management, parent selector
- Draft auto-save (DB, 30s interval)
- Submit for review flow (≥ 150 words)
- Admin review queue with approve / reject / request changes
- Contributor tag + profile wiki tab + your drafts section
- Update proposal flow

### Out (Post-launch)
- Notifications (on-site inbox) — stubs emitted but inbox UI deferred
- Full-text body search (title + description only at launch)
- Article version history / diff view
- Comment threads
- Article analytics
- Contributor leaderboard
- RSS / email digest
- Cross-page backlinks graph
- City Lead role

---

## 11. Open Questions

1. **Review SLA** — expected turnaround for admin review queue?
2. **Article ownership on departure** — articles stay live with authorship preserved; author shown as "inactive."
3. **Attachment cleanup** — recommend 30-day grace period after rejection before storage purge (via cron).
4. **Word minimum by type** — 150 words blanket minimum may be too low for Guides (recommend 400+). Type-specific minimums are a post-launch refinement.
5. **Co-author contributor credit** — co-author credit counts toward contributor badge (honour system at v1).
6. **Section page children on delete** — children reparented to grandparent; not recursively deleted.
