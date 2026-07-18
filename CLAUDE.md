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
  quizzes, and a separate audio function (`playAudio`).
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
- **Cloudflare caches JS and CSS.** After a push, a hard refresh or Cloudflare purge
  may be needed to see changes. If a code change appears not to have taken effect,
  suspect cache before suspecting the code, and verify the function actually loaded
  (check it in the browser console) before re-editing.

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
   `ARTICLE_ORDER` in the correct category group.
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
Articles end with the standard quiz-cta and share-section blocks; copy the
share-section Bluesky SVG verbatim from an existing article rather than retyping the
path. Images use absolute paths (`/images/file.png`), not relative (relative paths
break under SPA URLs like `/articles/name`).

## Security and analytics
- Hash validation regex before querySelector, a `VALID_PAGES` whitelist, and a
  `safeGetNavLink()` helper.
- Google Analytics events: quiz_started, question_answered, question_skipped,
  quiz_reset, setting_changed.

## Monetization status
AdSense has been rejected roughly four times, all of which happened before the site's
pages were meaningfully indexed (the GitHub Pages 404 problem above). The site is now
far stronger (29 articles, indexed, structured data, interactive tools, cleaned-up
canonicals). Plan: reapply, but deliberately wait until the recent SEO improvements
have settled and been recrawled rather than reapplying immediately after the prior
rejections.

## Current state and open threads
Recently completed: migration to Netlify (fixing indexing), AMOLED dark mode replacing
Matrix mode, homepage quick-start strip redesign, desktop compaction on home and
static pages, privacy policy cleanup (AdSense/consent copy removed until ads are
live), audio fixes for Й (wiring) and Ь (playback rate), a new article on Cyrillic
letters not in Russian, noindexing of the contact/privacy/about pages, removal of
dead GitHub-era artifacts (404.html, CNAME, the sessionStorage redirect check), and
re-recorded letter А pronunciation audio.

Open or upcoming: Possible future work: a faux Cyrillic decoder article, a travel-signage
reference article, audio for non-Russian letters, and AdSense reapplication once
readiness justifies it. The `/articles` page has one remaining benign
duplicate-canonical entry in Search Console that is intentionally left alone.

## Starting a session
Confirm the current task, read the relevant files before proposing anything, and
propose a scoped plan with a diff preview. Do not apply or commit until Malc approves.
