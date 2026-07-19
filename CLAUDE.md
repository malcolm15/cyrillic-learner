# CYRILICA.COM: Project Context

Orientation for Claude Code (CC). Read this at the start of every session.

## Overview
- **Site:** https://cyrilica.com, a free Cyrillic alphabet learning SPA
- **Repo:** github.com/malcolm15/cyrillic-learner
- **Owner:** Malc (malcolm15)
- **Goal:** organic search growth toward eventual Google AdSense monetization.

## Workflow and who does what
- Malc directs all strategy and editorial and is the sole decision-maker. He does
  not write code.
- Strategy, decision-framing, copywriting, and prompt preparation happen in a
  separate Claude.ai chat. Those prompts get relayed to CC.
- CC (you) executes: read the codebase, propose a scoped plan, show a diff, and apply
  only after Malc approves.
- Malc tests on the live site and reports back with specifics.

## Operating principles (firm)
- **Audit-first.** Read before you write. Show findings before changing anything. For
  structural work, run a read-only Phase 1 audit and stop at a gate for review before
  any Phase 2 build.
- **Exhaustive verification for structural or destructive changes.** For any
  change that deletes code, removes a function, or claims a complete inventory
  (e.g. "every occurrence of X", "all N instances", "this class is used nowhere
  else"), do not trust a reasoned scan. Use an exhaustive search (grep the whole
  file/repo for the literal string) and report the raw count. Before deleting any
  function or file, prove that whatever replaces or supersedes it actually covers
  every case the deleted code handled, case by case. This applies regardless of
  which model is running. (Context: audits have come back incomplete more than
  once when relying on a reasoned pass instead of an exhaustive one, and a "just
  delete it" recommendation would have broken direct article loading if not
  verified first.)
- **Show the diff before applying.** Never write or commit until approved.
- **One source of truth.** No duplicated data or functions that can drift. Reuse
  shared functions, tokens, and data.
- **Low risk tolerance.** Conservative, well-scoped changes. When in doubt, do less
  and confirm. Confirm a class or selector is not reused elsewhere before changing it.
- **No em-dashes anywhere**, including code comments, articles, and any copy. Use
  commas, periods, or parentheses. This applies to ALL article body prose, not
  only code and examples; approximately 300 em-dashes in article prose were
  removed in commit f03a815. Exception: five em-dashes are intentionally kept in
  how-to-type-cyrillic (lines approximately 3482 and 3530), where the OS keyboard
  layout names "Russian — Phonetic", "Russian — Mnemonic", and "Russian — PC"
  contain em-dashes as displayed in the Windows and macOS UI. Changing them would
  make the typing instructions inaccurate. Do not "fix" these.
- **Commit separately, push together.** Logically distinct changes get their own
  commits with clear messages, pushed as a batch.
- **Desktop and mobile are separate concerns.** Desktop-only changes go inside
  @media (min-width: 769px). Mobile uses @media (max-width: 768px). Do not alter
  mobile when the task is desktop-only.

## Stack
Vanilla JavaScript SPA. No frameworks, no build step, no bundler. Core files:
- `index.html`: the SPA shell and all page content (home, about, settings, contact,
  privacy, the articles list, the reference table). Pages are sections toggled by a
  `.active` class via `showPage()`.
- `css/styles.css`: all styles, including the dark mode token system.
- `js/core.js`: SPA router, settings, study-quiz data (`CYRILLIC_DATA`), article
  metadata (`ARTICLE_META`, `ARTICLE_ORDER`), dynamic SEO/schema injection, and audio
  playback (`playPronunciation`).
- `js/articles.js`: the `ARTICLES` array. Each article is one object: `id` (slug),
  `title`, `relatedArticles` (3 slugs), `content` (an HTML template literal).
- `js/article-scripts.js`: article-page interactivity: the quiz engine
  (`QUIZ_CONFIGS`, `initArticleQuizzes()`), the copy-paste tool, embedded mini
  quizzes, a separate audio function (`playAudio`), and all per-article interactive
  feature logic (printable chart, cursive engine).
- `netlify/edge-functions/`: server-side Deno edge functions. Currently one function,
  `head-rewrite.ts`. Deployed automatically with each push.
- `images/`, `audio/`, `sitemap.xml` (static, hand-maintained, uses an `xmlns:image`
  namespace).

Two cross-file gotchas:
- **Audio is triggered in two places:** `playPronunciation()` in core.js (study quiz
  and chart) and `playAudio()` in article-scripts.js (article pages). Changes to
  audio behavior usually need to be applied in both.
- Per-page meta, canonical, Open Graph, Twitter, and Article JSON-LD schema are
  injected dynamically by core.js based on the active page (`injectArticleSchema()` /
  `removeArticleSchema()`), plus BreadcrumbList schema.

## Hosting and deployment (current: Netlify)
- Served by **Netlify**, fronted by **Cloudflare for DNS only**.
- Deploys **automatically on every push to `main`**. A git push is the deploy. It is
  atomic, so there is no partial-upload problem (this is a change from the old GitHub
  Pages manual-upload era; ignore any older guidance about uploading files together).
- Routing: `_redirects` contains `/* /index.html 200`, so every route, including
  unknown paths, is served `index.html` with a real 200 status. A single article only
  needs `index.html` updated.
- **Cloudflare caches JS, CSS, and media files (the А audio swap required a purge).**
  After a push, a hard refresh or Cloudflare purge may be needed to see changes. If a
  code change appears not to have taken effect, suspect cache before suspecting the
  code, and verify the function actually loaded (check it in the browser console)
  before re-editing.

### Solved history: the SPA 404 problem (do not reintroduce)
The site was previously on GitHub Pages, which served `404.html` for every non-file
path and returned a 404 HTTP status to crawlers. Google saw 404s and indexed almost
nothing for months despite all the content existing. Migrating to Netlify on
2026-05-22 (the `/* /index.html 200` rule) fixed this; indexed pages jumped from 1 to
23 within a week. Lesson carried forward: when something is checkable (Search Console,
config files, live behavior), check it rather than reasoning from general claims like
"Google handles JavaScript fine." Those leftovers have since been cleaned up: `404.html`, the `CNAME` file, and a dead
`sessionStorage.getItem('redirect')` check in core.js whose matching relay script no
longer existed. All removed June 2026.

## Edge function (first server-side logic)

`netlify/edge-functions/head-rewrite.ts` intercepts every 200 text/html response
and rewrites two head tags before they reach the client: the canonical (set to the
actual request path) and the robots meta (switched to `noindex, follow` for
`/contact`, `/privacy`, `/about`). 301 responses and non-HTML assets pass through
untransformed. Fail-open: if transformation errors, the original response is returned.

Why it exists: non-rendering crawlers (Bing confirmed 2026-07-14) index raw HTML
before JavaScript runs. The static canonical at index.html line 28 said
`https://cyrilica.com` for every URL. The inline script at line 29 corrects it for
rendering browsers but is invisible to raw-HTML crawlers.

Three canonical layers that must stay consistent:
1. Edge function -- rewrites raw HTML per request (non-rendering crawlers).
2. Inline head script at index.html line 29 -- corrects on page load (rendering
   browsers).
3. `core.js` dynamic injection -- updates on SPA navigation within a session.

CRITICAL COUPLING: the function string-replaces lines 27-28 of index.html
byte-for-byte. If those lines ever change, update the match strings in
`head-rewrite.ts` or the function silently stops working.

## SPA routing and canonicals

Direct-load routing: `handleInitialURL()` in core.js, for article paths, no longer
routes through `showPage()`. That was resetting the canonical to the homepage
mid-init. It now activates the articles DOM directly, then calls `showArticle()`
after 100ms. That delay compensates for ARTICLES array load order; do not remove it.

Not-found state: when `showArticle()` receives a slug not in ARTICLES, it renders a
friendly error, resets the canonical to `/articles`, hides the prev/next bar and
related-articles section, and returns without injecting schema. The success path
explicitly restores the prev/next display in case a prior not-found visit hid it.

`_redirects` 301s for retired slugs (beyond the catch-all):
- `/articles/cyrillic-alphabet-chart` -> `/articles/russian-alphabet-chart`
- `/articles/cyrillic-handwriting` -> `/articles/practice-writing-cyrillic`
- `/articles/common-cyrillic-mistakes` -> `/articles/common-mistakes`
- `/articles/cyrillic-vs-latin` -> `/articles/false-friends`

Navigation behaviors:
- Quiz-CTA buttons call `showPage('home')` and land at the top of the page (no
  `scrollIntoView`).
- `showPage('home')` while a quiz is mid-session on home calls `newSession()` to
  restore the character-selection view rather than leaving a broken mid-quiz state.

## Dark mode (AMOLED)
Toggled by the `body.dark-mode` class, persisted in localStorage under `darkMode`
(`'true'`/`'false'`). Semantic tokens in `:root`:
- `--dark-bg` #000000 (true black page)
- `--dark-surface` #121214 (cards and tiles)
- `--dark-text` #DCDCDC (primary text)
- `--dark-text-dim` #9A9A9C (secondary text)
- `--dark-border` #262628 (hairline borders)
- `--dark-accent` #FF5C5C (red accent)
- `--dark-accent-bright` #FF7A7A (hover/active)
- `--dark-accent-dim` #C25A5A (dimmed accent)

Light-mode brand tokens include `--dark-blue` #1A237E and `--cream` #F5F1E8.

History: dark mode was formerly a green "Matrix mode" with a falling-character rain
animation. It was deliberately replaced with this AMOLED theme. The rain
implementation is preserved in `docs/matrix-rain.md` if ever wanted again. Do not
reintroduce the green palette or the rain unless asked.

## Fonts
Loaded from Google Fonts: IBM Plex Mono (base/body monospace), Bebas Neue (condensed
all-caps display font for the logo, most headings, and buttons), and Merriweather
(loaded but effectively unused). Article listing titles on the Articles page
deliberately use IBM Plex Mono for legibility rather than Bebas Neue.

## Adding an article (checklist)
A new article touches FOUR places, all using the identical slug:
1. `js/articles.js`: the article object (`id`, `title`, `relatedArticles`, `content`).
2. `js/core.js`: an `ARTICLE_META` entry (`section`, `published`, `modified`,
   `keywords`; all four required or schema injection breaks) and the slug placed in
   `ARTICLE_ORDER` in the correct category group. Bump `modified` whenever you
   meaningfully change an article's content.
3. `index.html`: an `.article-item` block in the right category group.
4. `sitemap.xml`: a new `<url>` entry (add an `<image:image>` entry too if the
   article has an image).

Categories (exact strings): `Getting Started`, `Alphabet Variants`,
`History & Culture`, `Learning Tools & Resources`.

Conventions: `relatedArticles` is always exactly 3 slugs. Internal navigation links
use real hrefs, never `href="#"`. Three patterns:
- Article-to-article links: `<a href="/articles/SLUG" onclick="navTo(event, null, 'SLUG')">text</a>`
- Homepage quick-start strip (two-step navigation): `<a href="/articles/SLUG" onclick="navToArticle(event, 'SLUG')">text</a>`
- Page links (about, settings, etc.): `<a href="/PAGE" onclick="navTo(event, 'PAGE', null)">label</a>`

The real href is required so right-click, middle-click, and Cmd/Ctrl-click open in a
new tab. `navTo` and `navToArticle` intercept plain left-clicks for fast in-app SPA
navigation; modifier-clicks fall through to the browser. In-article section
headings are `<h3>`. Comparison tables use the `.comparison-table` class with
`.big-letter` spans for Cyrillic characters (light, dark, and mobile styles exist).
Prefer crisp HTML card grids over raster images for text-heavy graphics; the pattern
lives in `.false-friends-grid` / `.ff-card` (false-friends article).
Articles end with the standard quiz-cta and share-section blocks; copy the
share-section Bluesky SVG verbatim from an existing article rather than retyping the
path. Images use absolute paths (`/images/file.png`), not relative (relative paths
break under SPA URLs like `/articles/name`).

Meta descriptions auto-generate from the article's first `<p>`, truncated to 155
characters at a word boundary. The opening paragraph of every article is its search
snippet; edit it with care.

## Interactive features

**Printable chart generator** (russian-alphabet-chart): `buildPrintChart()` and
`printChart()` in article-scripts.js. The `@media print` block in styles.css is the
only print CSS in the project. Output is one page; forces light-mode rendering even
in dark mode. GA event: `chart_printed`.

**Cursive stroke-order** (practice-writing-cyrillic): `CURSIVE_STROKES` in
article-scripts.js is the single source of truth for the six letterform paths
(т и ш л м д). Engine uses rAF stroke-dashoffset animation with a moving pen-tip
dot, applied to SVG paths in a `skewX(-10)` group for cursive slant. Respects
`prefers-reduced-motion`. GA event: `cursive_animation_played`. The letterforms were
drafted from published propisi descriptions and are not yet verified by a native
speaker; corrections are deliberate one-path edits in `CURSIVE_STROKES`.

**Alphabet chart cards** (russian-alphabet-chart): the full card is the audio tap
target (`button` elements, `.letter-card` class, dark mode handled). No separate
Listen buttons.

## Security and analytics
- Hash validation regex before querySelector, a `VALID_PAGES` whitelist, and a
  `safeGetNavLink()` helper.
- Google Analytics events: quiz_started, question_answered, question_skipped,
  quiz_reset, setting_changed, chart_printed, cursive_animation_played.

## Monetization status
AdSense has been rejected roughly four times, all of which happened before the site's
pages were meaningfully indexed (the GitHub Pages 404 problem above). The site is now
far stronger (28 articles, indexed, structured data, interactive tools, cleaned-up
canonicals). Plan: reapply, but deliberately wait until the recent SEO improvements
have settled and been recrawled rather than reapplying immediately after the prior
rejections.

## Current state and open threads
Recently completed: migration to Netlify (fixing indexing), AMOLED dark mode
replacing Matrix mode, homepage quick-start strip redesign, desktop compaction on
home and static pages, privacy policy cleanup (AdSense/consent copy removed until
ads are live), audio fixes for Й (wiring) and Ь (playback rate), new article on
Cyrillic letters not in Russian, noindexing contact/privacy/about, removal of dead
GitHub-era artifacts, re-recorded letter А audio, alphabet chart card redesign
(whole-card audio tap target, no Listen buttons), quiz-CTA scroll fix (land at top),
home/logo mid-quiz fix (newSession restores character selection), canonical
direct-load fix (handleInitialURL bypasses showPage), meta description truncation
(155 chars at word boundary), dead-slug 301s and graceful not-found state, printable
chart generator, cursive stroke-order section (six letters, rAF engine), edge
function for per-route canonical and robots in raw HTML.

Open: /reference page: re-point the homepage link to russian-alphabet-chart (likely
win), and decide whether to retire /reference with a 301 to the chart page after
checking its Search Console numbers. AdSense reapplication: deliberate wait for
recent SEO improvements to settle and be recrawled. Possible cursive phase B (more
letters or a tracing mode) if engagement data justifies it. Audio for non-Russian
letters is deferred and viable. Explicitly ruled out (do not re-propose): a faux
Cyrillic decoder (brand risk, alienates the educator audience, entrenched
competition) and travel-signage or vocabulary content (crosses from teaching the
script into teaching the language, outside the site's lane). The /articles page has
one remaining benign duplicate-canonical entry in Search Console, intentionally left
alone.

## Starting a session
Confirm the current task, read the relevant files before proposing anything, and
propose a scoped plan with a diff preview. Do not apply or commit until Malc approves.
