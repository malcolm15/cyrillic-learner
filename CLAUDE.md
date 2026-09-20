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
  removed in commit f03a815. Exception: four em-dashes are intentionally kept in
  how-to-type-cyrillic (in the layout-choice section and macOS Step 5), where the
  macOS keyboard layout names "Russian — Phonetic" and "Russian — PC" contain
  em-dashes as displayed in the macOS UI. Changing them would make the typing
  instructions inaccurate. Do not "fix" these. This count was five until
  September 2026: the fifth was "Russian — Mnemonic", which was never a real
  layout name (Microsoft calls the Windows layout "Russian Mnemonic", no dash), so
  it was an error rather than a deliberate exception and was removed. A grep that
  finds four, not five, is correct and is not a missed cleanup.
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
- `scripts/`: dependency-free node generators run by the Netlify build command
  (netlify.toml): generate-article-heads.js then pre-render.js. The articles/
  output directory is a gitignored deploy artifact, never committed.
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
- **Served files.** Netlify publishes the repo root (`publish = "."`), so every
  committed file is public unless blocked. Any new file at the repo root, and any new
  top-level folder, must be classified SITE (needed by visitors or crawlers) or
  INTERNAL (docs, scripts, build inputs, generated data). INTERNAL paths are added to
  the 404 block at the top of `_redirects` in the same commit. Netlify splats only
  work at the end of a path, so a new root file needs its own named rule. Blocking is
  case-sensitive while static files are served case-insensitively; case variants are
  an accepted residual risk because the repo is public and only the committed
  spelling is discoverable.
- **History entries.** showPage, showArticle and showArticleIndex push a history
  entry by default. Any code reacting to a URL the browser has already changed
  (popstate) must pass { push: false }. Intermediate steps that are not
  destinations (navToArticle's listing step) also pass { push: false }. Pushing on
  Back/Forward erases forward history and records page views the visitor never
  chose.
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
and rewrites head tags before they reach the client: the canonical (set to the
actual request path), the robots meta (switched to `noindex, follow` for
`/contact`, `/privacy`, `/about`), and, for `/articles/<slug>` paths, the `<title>`
and `<meta name="description">` (set to the per-article values so each article has
unique raw-HTML head content instead of the identical shell head). 301 responses
and non-HTML assets pass through untransformed. Fail-open: if transformation errors,
or an article slug is not found, the original response is returned unchanged.

Why it exists: non-rendering crawlers (Bing confirmed 2026-07-14) index raw HTML
before JavaScript runs. The static canonical link in index.html's head said
`https://cyrilica.com` for every URL. The inline script right after it corrects it
for rendering browsers but is invisible to raw-HTML crawlers.

Three canonical layers that must stay consistent:
1. Edge function -- rewrites raw HTML per request (non-rendering crawlers).
2. Inline head script, right after the canonical link in index.html -- corrects on
   page load (rendering browsers).
3. `core.js` dynamic injection -- updates on SPA navigation within a session.

CRITICAL COUPLING 1: the function string-replaces four tags in index.html's head
byte-for-byte: the canonical link, the robots meta, the title and the description
(the title constant includes a U+2014 em-dash). If those tags change, update the
match strings in `head-rewrite.ts` or the function silently stops working.

CRITICAL COUPLING 2: the per-article title and description come from
`netlify/lib/article-heads.ts`, generated from js/articles.js by
`scripts/generate-article-heads.js`. The manual regeneration step is RETIRED:
the Netlify build command regenerates it on every deploy (and pre-render.js
cross-asserts it against a fresh derivation, failing the build on drift).
Regenerating locally after editing an article title or opening paragraph is
still good hygiene so the committed copy stays truthful, but deploys no longer
depend on it. Same coupling class as COUPLING 1. The
generator derives title and description with the identical logic core.js uses on
render, so raw HTML and rendered agree exactly; it HTML-escapes the values and skips
(with a loud warning) any article whose first paragraph could diverge from the
browser (block-level tag or unknown entity), leaving that article on the shell head.
The data is a TypeScript module imported normally by head-rewrite.ts (not a JSON
import), so a data-file problem cannot fail the module load and regress the
canonical / robots rewrites. It lives in netlify/lib/, not netlify/edge-functions/,
because Netlify treats every file in the edge-functions directory as its own
function entry point (this is the mistake that broke the first b4cf079 deploy).

## Article pre-rendering (deploy-time)

Every push, the Netlify build command (netlify.toml) runs
scripts/generate-article-heads.js then scripts/pre-render.js. The pre-renderer
reads index.html as the template and emits articles/SLUG.html (flat files: a
SLUG/index.html directory layout makes Netlify 301 the extensionless URL to the
trailing-slash form, adding a redirect hop on every indexed article URL) for all
27 articles: per-article head (title, description, canonical, og and twitter),
article body in the DOM, prev/next, related-articles grid, and Article plus
BreadcrumbList JSON-LD with id="article-schema" / id="breadcrumb-schema" so the
JS render replaces them instead of duplicating. Netlify serves these real files
ahead of the non-forced /* catch-all, so crawlers get full article content in
raw HTML. The /articles listing, homepage, and utility pages stay SPA-shell
(their content is already static in index.html).

Fail-loud by design: every template replacement is an exact-match assertion and
any mismatch fails the build, which keeps the last good deploy live. This is a
deliberate coupling to index.html markup structure: shell changes that touch the
generator's needles break the build loudly and the needles must be updated.

Each emitted page carries data-prerendered="SLUG" on body. handleInitialURL in
core.js checks it and skips hiding the article view on boot (no flash);
everything else, including the full showArticle re-render and ArticleScripts
init, runs exactly as on a shell page.

Emitted articles are self-contained documents: the generator strips every other
route's section (home, the articles listing, about, settings, contact, privacy,
terms), wraps the article in a <main> landmark, and makes the article title the
document's only <h1>. Rationale: each URL should return a document that
represents that URL; before this, all 28 files shared a byte-identical block
that was 60% of their text under a heading structure whose only h1 was the
homepage's. Consequence for the SPA: core.js boot code is null-guarded (the
on / setToggle / setDisplay helpers), and showPage / showArticleIndex fall back
to a real page load (window.location.assign) when a route's section is absent.
On shell routes every element exists, so those guards are no-ops there.
Article-to-article navigation on a pre-rendered page stays client-side.

The edge function is unchanged and verified no-op on pre-rendered pages: their
heads no longer contain its byte-for-byte match targets, so every replace
misses safely. It still does real work for the homepage, /articles, utility
noindex, and any path that falls through to the shell.

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

History: the green "Matrix mode" and its rain animation are archived in git (`git show 61e2368:docs/matrix-rain.md`). Do not reintroduce the green palette or the rain unless asked.

## Fonts
Loaded from Google Fonts: IBM Plex Mono (base/body monospace), Bebas Neue (condensed
all-caps display font for the logo, most headings, and buttons), and Merriweather
(loaded but effectively unused). Article listing titles on the Articles page
deliberately use IBM Plex Mono for legibility rather than Bebas Neue.

## Adding an article (checklist)
A new article touches FIVE places, all using the identical slug:
1. `js/articles.js`: the article object (`id`, `title`, `relatedArticles`, `content`).
2. `js/core.js`: an `ARTICLE_META` entry (`section`, `published`, `modified`,
   `keywords`; all four required or schema injection breaks) and the slug placed in
   `ARTICLE_ORDER` in the correct category group. Bump `modified` whenever you
   meaningfully change an article's content.
3. `index.html`: an `.article-item` block in the right category group.
4. `sitemap.xml`: a new `<url>` entry (add an `<image:image>` entry too if the
   article has an image).
5. Nothing manual for heads or pre-rendering: the deploy build regenerates
   `netlify/lib/article-heads.ts` and pre-renders the article automatically.
   Optionally run `node scripts/generate-article-heads.js` locally to keep the
   committed artifact current.

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

**The snippet-change test.** When editing anywhere near the start of an article's
opening paragraph, the question is whether ANY character inside the first 155
changes, not whether the claim being corrected sits there. An edit that starts at
character 136 moves the snippet even if the error it fixes is at character 200.
(This was learned the hard way in September 2026: a fix to lost-letters corrected
a claim well past the cutoff, but the rewritten sentence began inside it.)

**The guard.** Compare the md5 of `netlify/lib/article-heads.ts` before and after
regenerating it, on every content change. That byte comparison is what actually
catches an unintended snippet change; the reasoning check above is a convenience,
not the protection. If the heads change and you did not intend it, rework the edit
so the first 155 characters survive. If the change is intended, record the before
and after description text so a later click-through shift can be traced to it.

**The modified-date check.** After any content edit, confirm the edited article's
`ARTICLE_META.modified` in `js/core.js` and its `<lastmod>` in `sitemap.xml` both
equal the date of the commit. The two fields move together. If one changes and the
other does not, or if either shows an older date, stop and find out why before
pushing. A commit that leaves both files unexpectedly unchanged is the warning sign.

**Why.** Nothing else verifies a date field. In September 2026 the date-bump helper
silently wrote a hardcoded 2026-09-16 for two days across 22 articles, and it only
surfaced because a commit came back with those files unexpectedly unchanged. That
was luck, not a check.

**Homepage and /articles lastmod.** Bump the home `<lastmod>` in sitemap.xml
whenever visible homepage body copy changes, and the `/articles` `<lastmod>`
whenever visible listing copy on /articles changes, in the same push. Both live in
index.html: the homepage is `#home-page`, the listing is `#articles-page`.

**The ledger.** Audit findings, fixes and their sources are tracked in the
audit ledger at https://claude.ai/artifact/M46nX3e969NgxikPqtVWQD. "A source
cited in the ledger" below means a source named in one of its rows.

**The claim guard.** A CLAIM is anything a reader could check and find false:
facts, rankings, causes, dates, counts, statements about what people do, feel or
notice, and interpretations of a work stated as fact ("the film uses X as Y").
Every claim added or reworded by a commit needs a source in that commit or an
existing source cited in the ledger. OPINION is an evaluative word in the site's
own voice ("memorable", "worth a look") that is not presented as consensus. It
needs no source and is logged as OPINION. A commit that removes or replaces an
unsourced claim must not add any new claim without a source in the same commit.
Attributing a view more widely than the source does is a claim error: "scholars
say" when the source says "others", or "known for" when the source describes a
criticism. Standard dictionary glosses of common words are covered by
Wiktionary, cited once in the ledger. A statement about where or how a word is
used still needs its own source.

**The claim table.** Every Phase 2 report includes a claim table: each sentence
the draft adds or rewords, classified as SOURCED (cite it), TRUE BY
CONSTRUCTION, OPINION, NOT A CLAIM or UNSOURCED. A draft with any UNSOURCED row
does not ship. This applies to wording Claude.ai suggests, not only to wording
you write.

**Gates.** If an instruction says to show something before doing it, treat it as
a STOP and wait for approval. When unsure whether something is a gate, stop.

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
far stronger (27 articles, indexed, structured data, interactive tools, cleaned-up
canonicals). Plan: reapply, but deliberately wait until the recent SEO improvements
have settled and been recrawled rather than reapplying immediately after the prior
rejections.

## Current state and open threads
Recently completed: migration to Netlify (fixing indexing), AMOLED dark mode,
homepage quick-start strip redesign, desktop compaction on
home and static pages, privacy policy cleanup (AdSense and consent copy removed;
the AdSense script was removed in batch 20, ads.txt kept), audio fixes for Й (wiring) and Ь (playback rate), new article on
Cyrillic letters not in Russian, noindexing contact/privacy/about, removal of dead
GitHub-era artifacts, re-recorded letter А audio, alphabet chart card redesign
(whole-card audio tap target, no Listen buttons), quiz-CTA scroll fix (land at top),
home/logo mid-quiz fix (newSession restores character selection), canonical
direct-load fix (handleInitialURL bypasses showPage), meta description truncation
(155 chars at word boundary), dead-slug 301s and graceful not-found state, printable
chart generator, cursive stroke-order section (six letters, rAF engine), edge
function for per-route canonical and robots in raw HTML, /reference page retired
with a 301 to russian-alphabet-chart and homepage link re-pointed to the chart.

Open: AdSense reapplication. Reapplying requires re-adding the adsbygoogle script
AND restoring an ad-cookie disclosure on the privacy page first, because the script
sets third-party advertising cookies (IDE on .doubleclick.net, measured
2026-09-18). Deliberate wait for recent SEO improvements to settle and be
recrawled. Possible cursive phase B (more
letters or a tracing mode) if engagement data justifies it. Audio for non-Russian
letters is deferred and viable. Explicitly ruled out (do not re-propose): a faux
Cyrillic decoder (brand risk, alienates the educator audience, entrenched
competition) and travel-signage or vocabulary content (crosses from teaching the
script into teaching the language, outside the site's lane). The /articles page has
one remaining benign duplicate-canonical entry in Search Console, intentionally left
alone.

2026-10-11: compare backwards-r-myth click-through rate against ledger row 284's
baseline. Row 284 records the query "backwards r" at 5,093 impressions, 0 clicks,
position ~8 for the three months to 2026-09-19; the page total over the same window
was 18,573 impressions, 14 clicks, position 8.2. Compare like with like: query
against query, page against page.

## Starting a session
Confirm the current task, read the relevant files before proposing anything, and
propose a scoped plan with a diff preview. Do not apply or commit until Malc approves.
