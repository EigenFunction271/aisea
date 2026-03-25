# aisea.builders — SEO & AEO Audit Report
*March 2026*

---

## Summary

The site is well-written and technically sound, but it has almost no SEO or AEO surface area. Three indexable pages, no structured data, no meta descriptions, no external content presence. The content that does exist is high quality — the problem is structural, not editorial. Most of these fixes are low-effort, high-return.

---

## Critical Issues (Fix First)

### 1. No meta descriptions on any page

Every page returns an empty meta description. Search engines write their own snippets, which are usually bad. This is a 10-minute fix.

**Fix:** Add a unique meta description to each page.

```html
<!-- Homepage -->
<meta name="description" content="AI.SEA is Southeast Asia's largest grassroots AI builder network — 10,000+ builders across KL, Jakarta, Manila, HCMC, Bangkok and beyond. Join us." />

<!-- Work With Us -->
<meta name="description" content="Reach 10,000+ active AI builders across Southeast Asia. Bounties, challenges, pilot builds, and infrastructure partnerships. Trusted by Anthropic, Cursor, ElevenLabs and more." />

<!-- Residency -->
<meta name="description" content="The AI.SEA Residency is a 3-month selective program for exceptional builders in Southeast Asia. No pitches, no demo days — just serious builders doing serious work." />
```

---

### 2. Homepage H1 is just "AISEA"

The H1 is the highest keyword-weighted element on a page. "AISEA" wastes it entirely.

**Fix:** Change to a descriptive phrase that includes target keywords.

```html
<!-- Before -->
<h1>AISEA</h1>

<!-- After -->
<h1>Southeast Asia's largest AI builder community</h1>
```

---

### 3. No structured data (schema.org)

Google and AI engines (Perplexity, ChatGPT, Gemini, Claude) use structured data to build factual knowledge about entities. The site has none. This is a copy-paste fix.

**Fix:** Add the following JSON-LD block to the homepage `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AI.SEA",
  "alternateName": "AISEA",
  "url": "https://www.aisea.builders",
  "description": "Southeast Asia's largest grassroots AI builder network, connecting 10,000+ builders across Malaysia, Indonesia, Vietnam, Philippines, Thailand, and Singapore.",
  "foundingLocation": {
    "@type": "Place",
    "name": "Kuala Lumpur, Malaysia"
  },
  "areaServed": ["Malaysia", "Indonesia", "Vietnam", "Philippines", "Thailand", "Singapore"],
  "memberOf": [],
  "sameAs": [
    "https://www.linkedin.com/company/ai-sea-week/",
    "https://x.com/AI__SEA",
    "https://www.instagram.com/aisea.builders/",
    "https://www.youtube.com/@AISEABUILDERS"
  ],
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "value": 10000,
    "description": "Active community members"
  }
}
```

Also add `FAQPage` schema to the Work With Us page to make the accordion content parseable:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What makes AI.SEA different?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AI.SEA is federated infrastructure, not a brand-first community. We connect local builder groups regionally rather than centralising everything under one umbrella."
      }
    }
  ]
}
```

---

### 4. FAQ accordion content is invisible to crawlers

The Work With Us page has a FAQ section, but the answers are in a collapsed accordion. The crawled HTML shows question headings only — answers are not in the initial DOM.

**Fix:** Either render FAQ answers server-side (visible in HTML on load), or use a `<details>`/`<summary>` HTML pattern which is crawlable in its closed state. Do not rely on JS-rendered accordions for content you want indexed.

---

### 5. Title tags are identical across all pages

All three pages share the same title: `AISEA | Southeast Asia's Largest AI Builder Movement`. This gives Google no signal to differentiate pages and compete for different queries.

**Fix:** Unique, keyword-targeted titles per page.

| Page | Recommended Title |
|---|---|
| Homepage | `AI.SEA — Southeast Asia's Largest AI Builder Community` |
| Work With Us | `Partner with AI.SEA — Reach 10,000+ Builders in Southeast Asia` |
| Residency | `AI.SEA Residency — 3-Month Builder Program in Southeast Asia` |

---

## Structural Issues (High Impact, Medium Effort)

### 6. Only 3 indexable pages exist

This is the root cause of poor SEO and AEO performance. The site has almost no crawlable surface area. Every additional page is a new keyword target, a new entry point, and more evidence for AI engines that AI.SEA is a real, factual entity.

**Fix:** Create the following page types:

**City pages** — one per active node.
Each page covers: city name, community lead, number of members, recent events, next event. These pages target queries like "AI builders community Kuala Lumpur" or "AI hackathon Jakarta".

Example URL structure:
```
/cities/kuala-lumpur
/cities/jakarta
/cities/ho-chi-minh-city
/cities/manila
/cities/singapore
/cities/bangkok
```

**Event recap pages** — one per significant past event.
The Anthropic/Cursor hackathon (2,000 signups, 700 senior builders in one day) and the Lovable hackathon (200+ non-coders) are legitimately remarkable events. They should each be standalone pages, not slides on the homepage.

Example URL structure:
```
/events/cursor-anthropic-hackathon-2024
/events/elevenlabs-hackathon-2024
/events/lovable-hackathon-2024
```

Each page should include: date, partners, attendance numbers, outcomes, photos, and a brief write-up. These pages target long-tail queries and are the type of specific factual content AI engines quote.

**Case study pages** — expand what's currently slides on the Work With Us page.
The three case studies (Lovable, Cursor/Anthropic, ElevenLabs) are among the best content on the site. They are currently locked in a carousel that is difficult for crawlers to fully parse.

Example URL structure:
```
/case-studies/lovable
/case-studies/cursor-anthropic
/case-studies/elevenlabs
```

**Blog or Dispatch** — even 1 post per month compounds dramatically.
Content targeting corporate buyers (e.g. "Why DevRel programs fail in Southeast Asia", "How to measure AI adoption beyond usage metrics") builds topical authority and generates the kind of content that gets cited and linked externally.

---

### 7. /en/ locale prefix with no alternate language versions

All URLs are prefixed `/en/` but there are no `/ms/`, `/id/`, or other language variants. This fragments PageRank into a locale subdirectory with no payoff.

**Fix (option A):** Remove the locale prefix and serve English at root (`/work-with-us`, not `/en/work-with-us`). Add 301 redirects from `/en/*` to `/*`.

**Fix (option B):** If multilingual support is planned, implement `hreflang` tags correctly and add actual translated variants. Half-implementing i18n is worse than not implementing it.

---

### 8. Conversion forms are off-site (Airtable)

All CTAs — "Join us", "Work with us", "Apply to residency" — link out to Airtable forms. This means:
- Conversion events happen off-domain (no Google Analytics goal tracking)
- Bounce signals go to Airtable's domain, not yours
- Users who abandon the form are lost entirely

**Fix:** Embed Airtable forms in iframes on the site, or migrate to a native form solution (Typeform embed, Tally, or a custom form posting to a backend). At minimum, ensure UTM parameters are passed through the Airtable link so you can track source attribution.

---

## AEO-Specific Issues

### 9. AI engines cannot verify AI.SEA as a factual entity

When someone asks ChatGPT, Perplexity, or Claude "what is AI.SEA" or "best AI builder communities in Southeast Asia", the answer is drawn from:
1. Training data (crawled web content before the model's cutoff)
2. Real-time web search results
3. Structured knowledge signals (schema.org, Wikipedia, Wikidata)

AI.SEA is currently thin on all three. The site is the primary source about itself. There are no third-party articles, no Wikipedia entry, no Crunchbase/F6S profile.

**Fix:**
- Create a Crunchbase organization profile
- Create an F6S or Angelist profile
- Submit a Wikipedia article (requires notability — the 2,000-signup Anthropic/Cursor event is likely sufficient)
- Ensure Luma event pages link back to aisea.builders explicitly
- Pitch coverage to Tech in Asia, KrAsia, or e27 — even one article establishes external factual authority

---

### 10. Factual claims are in marketing copy, not structured facts

The site contains genuinely impressive numbers: 10,000+ builders, 8 countries, $200k+ committed, 700 senior builders onboarded in a single day. But these are written as promotional copy, not structured data that AI engines can confidently extract and cite.

**Fix:** Create an "About" or "Facts" section (or page) with clean, scannable factual statements. Example format:

```
Founded: 2023
Headquarters: Kuala Lumpur, Malaysia
Active builders: 10,000+
Countries: Malaysia, Indonesia, Vietnam, Philippines, Thailand, Singapore, Japan, Australia
City nodes: KL, Jakarta, Tangerang, Bali, Ho Chi Minh City, Da Nang, Hanoi, Bangkok, Manila, Singapore
Partners: Anthropic, Cursor, ElevenLabs, Lovable, Groq, 11labs, OpenAI, Apify, Mobbin, Sunway
Notable events: Cursor × Anthropic Hackathon KL (2,000 signups, ~1,000 in-person); ElevenLabs 2-hour hackathon (150+ builders)
```

This gives AI engines clean, attributable facts rather than forcing them to parse marketing prose.

---

### 11. No external content about AI.SEA

A search for "aisea.builders" or "AI.SEA builders" returns almost exclusively the site itself and its Luma events calendar. No press, no blog mentions, no community write-ups.

**Fix:** Create a systematic external content strategy:
- Publish post-event recaps on LinkedIn (long-form, then link to site)
- Submit guest articles to regional tech publications (Tech in Asia, e27, KrAsia)
- Encourage partners (Anthropic, Cursor, ElevenLabs) to link to AI.SEA in their own case studies or blog posts
- Get listed in AI community directories (There's An AI For That, Future Tools, etc.)

Every external mention that includes a link to aisea.builders increases both domain authority (SEO) and the probability of AI engines encountering and retaining facts about the organisation (AEO).

---

## Quick Wins Summary

These can be done in under a day and have immediate impact:

| Task | Effort | Impact |
|---|---|---|
| Add meta descriptions to 3 pages | 15 min | High |
| Fix homepage H1 | 5 min | High |
| Add Organization schema JSON-LD | 30 min | High |
| Unique title tags per page | 15 min | Medium |
| Fix FAQ accordion to render server-side | 1–2 hrs | Medium |
| Create Crunchbase/F6S profile | 30 min | Medium (AEO) |
| Remove /en/ prefix or add hreflang | 1 hr | Medium |

---

## Longer-Term Roadmap

| Task | Effort | Impact |
|---|---|---|
| City pages (6–8 pages) | 1–2 days | Very High |
| Event recap pages (3–5 pages) | 1 day | High |
| Standalone case study pages | 1 day | High |
| Blog/dispatch (monthly cadence) | Ongoing | Very High (compounds) |
| Press coverage in regional tech media | Ongoing | Very High (AEO) |
| Embed Airtable forms on-site | 2–3 hrs | Medium |
| Wikipedia entry for AI.SEA | 2–3 hrs | High (AEO) |

---

*Audit conducted March 2026. Based on direct crawl of aisea.builders homepage, /en/work-with-us, and /en/residency pages.*
