# CYRILICA.COM — Project Context

## Overview
**Site:** https://cyrilica.com — A free Cyrillic alphabet learning SPA
**Repo:** github.com/malcolm15/cyrillic-learner
**Owner:** Malc (malcolm15)
**Hosting:** GitHub Pages with custom domain, DNS through Cloudflare

## Stack
Vanilla JavaScript SPA, no frameworks, no build tools. Core files:
- `index.html` and `404.html` (mirror each other for SPA routing via GitHub Pages' 404 fallback)
- `css/styles.css` (~2,750+ lines)
- `js/core.js` (~60KB — navigation, SPA routing, structured data injection, ARTICLE_META, ARTICLE_ORDER, settings)
- `js/articles.js` (~300KB — all 26 articles as JS objects with HTML content strings)
- `js/article-scripts.js` (~34KB — quiz engine, copy-paste tool, text builder, interactive features)
- `images/` folder with 15 images (PNGs, SVGs, JPGs)
- `audio/` folder for pronunciation files
- `sitemap.xml` with image entries (xmlns:image namespace)
- `CNAME` file for custom domain

## Workflow
- Malc directs; Claude writes all code. Malc does NOT write code.
- Malc tests on live site and reports bugs with specific details
- Currently deploys via GitHub web UI (uploading files manually)
- Planning to transition to Claude Code in VS Code for faster iteration
- **Critical:** Upload all changed files together before testing — partial uploads cause false bug reports due to GitHub Actions canceling intermediate builds

## Current State (as of May 2026)

### Articles
- **26 active articles** across categories:
  - Learning Basics: getting-started, russian-alphabet-chart, cyrillic-alphabet-chart, common-mistakes, memory-tricks, false-friends, cyrillic-vs-latin, first-25-words, easy-russian-words, backwards-r-myth, cyrillic-tier-list
  - Writing & Typing: cyrillic-handwriting, practice-writing-cyrillic
  - History & Culture: history-of-cyrillic, lost-letters, glagolitic, cyrillic-pop-culture, cyrillic-vs-greek, letter-yo-story
  - Regional Alphabets: ukrainian-alphabet, bulgarian-alphabet, serbian-cyrillic-vs-latin, belarusian-alphabet, montenegrin-alphabet, cyrillic-names-europe, kazakhstan-latin-transition, latin-vs-cyrillic-slavic
  - Learning Tools & Resources: cyrillic-copy-paste, how-to-type-cyrillic, cyrillic-learning-resources

### Images (15 across 13 articles)
All images use absolute paths (`/images/filename`), 2x resolution PNGs for retina sharpness, `style="max-width: 500-650px"` to constrain display size, `loading="lazy"`, and cyrilica.com watermarks.

| Image File | Article | Type |
|---|---|---|
| russian-keyboard-layout.svg | how-to-type-cyrillic | SVG |
| russian-phonetic-keyboard-layout.svg | how-to-type-cyrillic | SVG |
| yo-letter-word-pairs.svg | letter-yo-story | SVG |
| yo-monument-ulyanovsk.jpg | letter-yo-story | JPG (CC BY-SA 4.0, Sergey M R) |
| kiev-missal-glagolitic.jpg | glagolitic | JPG (CC BY-SA 4.0, Zde) |
| cyrillic-memory-tricks.png | memory-tricks | PNG |
| cyrillic-false-friends.png | false-friends | PNG |
| cyrillic-tier-list.png | cyrillic-tier-list | PNG |
| history-of-cyrillic-timeline.png | history-of-cyrillic | PNG |
| lost-cyrillic-letters.png | lost-letters | PNG |
| cyrillic-handwriting-chart.png | practice-writing-cyrillic | PNG |
| backwards-r-myth.png | backwards-r-myth | PNG |
| cyrillic-vs-latin-countries.png | latin-vs-cyrillic-slavic | PNG |
| belarusian-vs-russian-alphabet.png | belarusian-alphabet | PNG |
| cyrillic-vs-greek-comparison.png | cyrillic-vs-greek | PNG |

Articles still without images: getting-started, russian-alphabet-chart, cyrillic-alphabet-chart, common-mistakes, cyrillic-vs-latin, first-25-words, easy-russian-words, cyrillic-handwriting, ukrainian-alphabet, bulgarian-alphabet, serbian-cyrillic-vs-latin, montenegrin-alphabet, cyrillic-names-europe, kazakhstan-latin-transition, cyrillic-copy-paste, cyrillic-learning-resources, cyrillic-pop-culture

### Interactive Features
- **Quiz engine:** Generic prefix-based system in article-scripts.js (QUIZ_CONFIGS). Supports multiple quizzes per article via DOM scanning with `initArticleQuizzes()`.
- **Copy-paste tool:** Text builder textarea at top of copy-paste article. Buttons append characters. Copy button + Ctrl+C detection with toast notifications. Includes standard Russian, accented vowels (combining acute U+0301), and pre-reform letters.
- **Mini quizzes:** Embedded in cyrillic-alphabet-chart (5 group quizzes, prefixes cg1-cg5) and memory-tricks article.
- **Quiz CTAs:** 11 contextual call-to-action boxes embedded mid-article across highest-traffic articles, each with unique copy and button text. Styled as dark blue gradient boxes with red buttons. Dark mode supported. Located in: getting-started, false-friends, memory-tricks, lost-letters, letter-yo-story, cyrillic-tier-list, backwards-r-myth, practice-writing-cyrillic, history-of-cyrillic, how-to-type-cyrillic, cyrillic-vs-greek.

### SEO & Structured Data
- Dynamic Article schema (JSON-LD) injection per article via `injectArticleSchema()` / `removeArticleSchema()` in core.js
- BreadcrumbList schema
- Dynamic meta tags (title, description, OG, Twitter, canonical) per article
- `ARTICLE_META` object in core.js with section, published/modified dates, keywords for all 26 articles
- Sitemap with `xmlns:image` namespace and image entries for all 15 images
- All articles have `relatedArticles` configured (3 related articles each)

### Security
- Hash validation: `/^#[a-zA-Z0-9_-]+$/` regex before querySelector
- VALID_PAGES whitelist for pageName
- `safeGetNavLink()` helper for nav queries
- Cloudflare: Bot Fight Mode enabled, DMARC record needs adding

### Analytics
- Google Analytics tracking: quiz_started, question_answered, question_skipped, quiz_reset, setting_changed events
- Settings interactions tracked including localStorage-persisted preferences

## Traffic & Performance (recent data)
- ~50-70 daily users baseline, ~600-700 monthly active users
- ~2,300 monthly page views (estimated)
- 16K events/week (quiz interactions, settings, clicks)
- 4-minute average engagement time
- Traffic sources: Direct (~45%), Organic Social/Reddit (~38%), Organic Search (~5%)
- Two successful Reddit posts in r/russian (lost letters: 11k views; letter Ё: 12k views, 28 upvotes)
- r/greek post for cyrillic-vs-greek article received mixed reception (60% upvote ratio) — lesson learned: don't explain a culture's own alphabet back to them

## Key Architecture Details
- SPA routing via hash-based URLs (e.g., cyrilica.com/articles/letter-yo-story)
- Articles added to FIVE places for each new article: articles.js (content), core.js (ARTICLE_META + ARTICLE_ORDER), index.html (listing), 404.html (listing), sitemap.xml (with image entries if applicable)
- Images use absolute paths (`/images/filename.png`), not relative paths — relative paths break because SPA URLs like `/articles/name` make the browser look for `articles/images/...`
- Mobile responsive: `@media (max-width: 768px)` breakpoint used throughout
- Mobile image fix: `.article-image img { max-width: 100% !important; }` in mobile media query to override inline max-width styles
- Card hover: uses border-color change + shadow (no transform, which caused border clipping bugs)
- Related articles: compact on mobile (description hidden, tighter padding, smaller titles)
- Static pages (About, Settings, Contact, Privacy): have 8px side margins on mobile

## Content Style Preferences
- Natural, human-sounding copy — not marketing language
- No em dashes in Reddit posts
- Honest assessments over optimism
- Concise explanations with clear file lists
- When writing articles: ~1,500-2,000 words, strong h3 structure, internal links to related articles, share buttons at bottom, quiz CTA mid-article
- Images: 2x resolution, max-width constrained, cyrilica.com watermark, detailed alt text, PNG preferred over SVG for Google Image ranking

## Image Creation Standards
- 2x resolution (scale=2) for retina sharpness using Pillow (PIL)
- `style="max-width: 500-650px"` inline to constrain display size on desktop
- CSS handles mobile: `max-width: 100% !important` override in mobile media query
- cyrilica.com watermark centered at bottom with breathing room
- Detailed alt text for Google Image search
- Add `<image:image>` entries to sitemap.xml for every new image
- PNG format preferred; SVGs acceptable for keyboard layouts
- File size target: under 200KB
- Dark background (#1a1a2e) with colored accents matching site brand
- Fonts: DejaVu Sans Bold for headings/letters, DejaVu Sans for body, DejaVu Sans Oblique for italics
- Sourced photos: must be Creative Commons (CC BY-SA 3.0/4.0), include attribution in figcaption with photographer name, Wikimedia link, and license link

## Monetization Status
- **AdSense:** Rejected twice. Planning to reapply soon — site has improved significantly since last attempt (26 articles, 15 images, interactive tools, structured data, quiz CTAs).
- **Ezoic:** Requires 250,000+ monthly users as of Feb 2026. Not eligible.
- **Mediavine:** Requires 50,000 sessions/month. Not eligible.
- Focus is on growing organic search traffic before monetizing.

## Reddit Marketing Strategy
- Two viral posts in r/russian (lost letters, letter Ё) — both 11-12k views
- r/greek post received pushback — lesson: don't explain a culture's own alphabet to native speakers
- r/languagelearning attempted but automod filtered single-language posts — need multi-script framing in titles
- Space posts 2-3 weeks apart per subreddit
- Frame as genuine curiosity/discovery, not promotion
- End with discussion questions that invite native speakers to share experiences
- No em dashes in post copy
- r/learnrussian, r/linguistics still untapped

## YouTube Creator Outreach
Three creators mentioned positively in cyrillic-learning-resources article. Outreach emails drafted but may not have been sent:
- **Be Fluent in Russian** (Fedor Shirin) — @befluentinrussian, ~200k subs
- **Learn Russian with Alfia** — russianwithalfia.com
- **Russian with Max** — russianwithmax.com, comprehensible input method

## Pending Work (Priority Order)
1. **More article images** — Ukrainian alphabet and Serbian comparison charts are next. 14 articles still without images.
2. **AdSense reapplication** — site is significantly improved; reapply within next 1-2 weeks
3. **New articles** — "Reading Cyrillic Road Signs: A Traveler's Guide" was brainstormed
4. **Reddit posts** — Cyrillic vs Greek article for r/languagelearning (draft ready, needs multi-script title framing); future posts for r/learnrussian, r/linguistics
5. **YouTube outreach** — send drafted emails to 3 creators
6. **DMARC DNS record** — add TXT record `_dmarc.cyrilica.com` with value `v=DMARC1; p=reject; sp=reject;` in Cloudflare
7. **Cloudflare** — consider enabling Block AI Bots / managed robots.txt
8. **Transition to Claude Code** — set up local dev environment with VS Code for faster iteration

## Sitemap Management
- Located at `/sitemap.xml` in repo root
- Uses `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` namespace
- Every new image must get an `<image:image>` entry inside its article's `<url>` block
- Resubmit to Google Search Console and Bing Webmaster Tools after updates
- Watch for duplicates (had issues with russian-alphabet-chart listed 4x and cyrillic-copy-paste listed 3x — cleaned up)
- Deleted articles must be removed (common-cyrillic-mistakes was removed but lingered in sitemap)
