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
- **Browser tests against production.** Automated browser tests against
  production must block Google Analytics, Google Tag Manager, and Google
  advertising network requests, including applicable subdomains. Verify analytics
  instrumentation locally through dataLayer where possible, without sending
  synthetic page views or events to Google. Report any test that requires an
  exception.
- **Shell commands.** The shell on this machine is zsh, which does not split an
  unquoted variable into words: `cmd $LIST`, `set -- $OUT` and `for x in $FILES`
  all pass one argument, and the failure is usually silent. Quote every
  variable. When a command needs several arguments, put them in an array
  (`args=(a b c); cmd "${args[@]}"`); that is the standard. `${=VAR}` forces
  splitting and is only for the rare case where splitting is deliberate, with a
  comment saying why. Start any multi-command shell workflow with
  `set -o pipefail` so a failure earlier in a pipe is not hidden by a later
  command that succeeds, and take an exit status from the command that matters.
  Give every wait loop a timeout. Anything that parses fields or makes decisions
  is safer as a short node or python script than as inline shell.
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
- **Edit CSS a whole block at a time.** When editing an existing CSS rule, replace
  the complete selector block (old block to new block). Never substitute a bare
  declaration such as `color: inherit` or `vertical-align: top`, even with a count
  limit. Every batch that touches the stylesheet prints the full CSS diff before
  commit. This rule exists because unanchored declaration substitutions silently
  changed the wrong rule twice: `.related-article-card` in Batch 41 and
  `.comparison-table td` in Batch 42.

**Reports put everything in the message body.** Whatever a prompt asks a report
to show (diffs, file listings, commit messages, command output, test results)
must appear in the message body itself. Tool output is not visible to the person
reviewing the report, so "printed in my tool output above" does not count as
shown. If something is too long to include, say so and ask before abbreviating;
never summarise a diff or file that was asked for in full.

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
- `scripts/images/`: Pillow (Python) generators for four comparison images
  (Ukrainian, Bulgarian, and the two Serbian ones). Run by hand, never by the
  build. Each resolves the repo root from its own path and writes into images/,
  so it can be run from any directory. The `/scripts/*` 404 rule in _redirects
  keeps them off the live site.
  `scripts/images/layout.py` is the shared layout helper: `baseline_row()` draws
  mixed fonts on one baseline using Pillow's `anchor="ls"`, and
  `stacked_row_lines()` implements the row-308 rule, where every band in a row
  shares one ink-top line set below the deepest ink in that row. New or rebuilt
  image scripts import from it and must not reimplement either rule.
- `images/`, `audio/`, `sitemap.xml` (static, hand-maintained, uses an `xmlns:image`
  namespace).

Two cross-file gotchas:
- **Audio is triggered in two places:** `playPronunciation()` in core.js (study quiz
  and chart) and `playAudio()` in article-scripts.js (article pages). Changes to
  audio behavior usually need to be applied in both.
- Per-page meta, canonical, Open Graph, Twitter, and Article JSON-LD schema are
  injected dynamically by core.js based on the active page (`injectArticleSchema()` /
  `removeArticleSchema()`), plus the article BreadcrumbList. Both removal paths look
  the blocks up by `id` (`article-schema`, `breadcrumb-schema`), so any JSON-LD
  without one of those ids can never be removed or replaced on render.
- **The shell carries no BreadcrumbList.** One `index.html` serves all seven SPA
  routes, so any trail baked into it is wrong for at least six of them. Articles
  carry exactly one, with `id="breadcrumb-schema"`, emitted by
  `scripts/pre-render.js` and replaced one for one by `injectArticleSchema()`.
  The build asserts both: zero BreadcrumbList objects in `index.html`, exactly one
  per emitted article and inside that id. The site-wide SoftwareApplication,
  WebSite and Organization blocks in the shell are separate and unaffected.
- **No backslash escapes inside `onclick` attributes in article content.** Use a
  typographic apostrophe (U+2019) in share labels, never `\'`. pre-render.js copies
  the content template literal as written, while core.js assigns the evaluated
  string through `innerHTML`, so an escape makes the attribute differ between the
  static page and the hydrated DOM. The build enforces this, and also that each
  article has exactly four share handlers (`copyArticleLink`, `shareToBluesky`,
  `shareToReddit`, `nativeShare`), each passing its own slug, 108 in total, and
  that every `onclick` in every emitted page parses as JavaScript.
- **Share labels and index cards may differ from the article title.**
  Batch 56 Phase 1 checked all 27 articles and found 6 differing labels, on
  `lost-letters`, `belarusian-alphabet`, `bulgarian-alphabet`,
  `montenegrin-alphabet`, `history-of-cyrillic` and `how-to-type-cyrillic`. Every
  one of the 6 was never the article's title field at any commit in the file's
  history, so a difference is not, by itself, evidence of a stale label.

## Hosting and deployment (current: Netlify)
- Served by **Netlify**, fronted by **Cloudflare for DNS only**.
- Deploys **automatically on every push to `main`**. A git push is the deploy. It is
  atomic, so there is no partial-upload problem (this is a change from the old GitHub
  Pages manual-upload era; ignore any older guidance about uploading files together).
- **Routing. There is no `/*` catch-all.** `_redirects` has an explicit
  `/<route> /index.html 200` rewrite for each of the seven SPA routes, and
  `scripts/pre-render.js` fails the build if that set does not match `VALID_PAGES`
  in `js/core.js` exactly, so the two cannot disagree without failing the build. Articles are
  not listed: `articles/<slug>.html` is a real file and Netlify serves an HTML file
  at its extensionless path by default, so `/articles/<slug>` resolves with no rule.
  Everything matching no rule and no file gets a real 404 from `404.html`, which
  Netlify picks up automatically for a `404.html` at the site root.
  (A `/* /index.html 200` catch-all held this together until Batch 50. It was
  removed because it answered every unknown URL with the homepage shell at 200,
  which made each one a soft 404 and, worse, served the AdSense script and fired a
  real ad request on screens Google's publisher policy calls dead ends.)
- **Adding a new SPA page:** add it to `VALID_PAGES` in `js/core.js` AND add a
  `/<name> /index.html 200` line to `_redirects`. The build fails if the two
  disagree, so a forgotten rewrite is caught before deploy rather than becoming a
  404 on a real route.
- **Why the `.html` article redirect lives in the edge function.** Both places
  could do it: `_redirects` would need 27 forced rules, one per slug, generated at
  build time. The edge function needs none, because it already imports the
  generated `HEADS` map and can test a slug against it, so the redirect set tracks
  the article set with no second list to keep in step. That is a maintenance
  argument, not a capability one: no measurement in Batch 50 showed `_redirects`
  unable to do the job.
- **`404.html` rules.** No AdSense script (policy: no Google-served ads on error
  screens), no canonical, `noindex, follow`, and its pre-paint theme snippet
  byte-identical to the one in `index.html`. All four are asserted by the build.
- **Post-deploy check after any routing change.** Confirm all 27 article URLs
  return 200 with their pre-rendered body, not the shell. Extensionless resolution
  is default Netlify behaviour that the article URLs depend on, and it is not
  something this repo controls, so it is checked rather than assumed:
  `curl -s -o /dev/null -w "%{http_code} " https://cyrilica.com/articles/<slug>`
  for each slug, and confirm one body contains `data-prerendered=`.
- **Served files.** Netlify publishes the repo root (`publish = "."`), so every
  committed file is public unless blocked. Any new file at the repo root, and any new
  top-level folder, must be classified SITE (needed by visitors or crawlers) or
  INTERNAL (docs, scripts, build inputs, generated data). INTERNAL paths are added to
  the 404 block at the top of `_redirects` in the same commit. Netlify splats only
  work at the end of a path, so a new root file needs its own named rule. Blocking is
  case-sensitive while static files are served case-insensitively; case variants are
  an accepted residual risk because the repo is public and only the committed
  spelling is discoverable.
- **Content containers.** Any list or table a reader should see must be static HTML
  in articles.js, guarded by a pre-render assertion. Scripts attach to existing
  markup; they do not build readable content into empty containers.
- **Navigation controls are links.** Controls whose purpose is navigating to a
  crawlable page or URL are real `<a href>` elements in the served HTML. Actions
  (opening settings, starting a quiz round, toggling state) stay `<button>`. Any
  in-app link handler returns early through `isModifiedClick()` so browser-native
  link behaviours pass through. The article prev/next bar is asserted in
  pre-render.
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
23 within a week. That catch-all was retired in Batch 50 and replaced with explicit
route rewrites plus a real 404 page, with build assertions that fail if a declared
SPA route loses its rewrite or an article loses its emitted file. Lesson carried forward: when something is checkable (Search Console,
config files, live behavior), check it rather than reasoning from general claims like
"Google handles JavaScript fine." Those leftovers have since been cleaned up: the GitHub-era `404.html`, the `CNAME`
file, and a dead `sessionStorage.getItem('redirect')` check in core.js whose matching
relay script no longer existed. All removed June 2026. The `404.html` at the repo root
today is not that file: it was written in Batch 50 and is served for paths that match
no rule and no file on disk.

### Solved history: the shell breadcrumb Google displayed (do not reintroduce)

A BreadcrumbList listing Home, About, Contact was added to `index.html` on
2026-02-13 in `df27e39` ("Further SEO optimization") and never edited again. It
had no `id`, so neither removal path in core.js could see it, and because
pre-render.js uses index.html as its template every one of the 27 article pages
shipped it alongside the correct `id="breadcrumb-schema"` trail. Both blocks were
present and valid in the static HTML and in the rendered DOM on all 27, with the
generic one first in document order, and Google displayed "cyrilica.com > About >
Contact" on live result pages for at least two articles. Found 2026-10-06 and
removed in Batch 54. Why Google chose that block over the correct one was not
verified; only that it was present and first. Nothing in the codebase read or
depended on the generic shell block: no build needle, shell constant or
edge-function match targeted it or its distinctive Home, About, Contact content.

### Solved history: the share-button apostrophe escapes (do not reintroduce)

Found 2026-10-10: 16 share-button `onclick` attributes across 4 articles were
broken by an escaped apostrophe in the title label. pre-render.js copies the
content template literal as written while core.js uses the evaluated string, so
one backslash level is resolved in the hydrated DOM and not in the static HTML.
`montenegrin-alphabet`, `cyrillic-letters-not-in-russian` and
`kazakhstan-latin-transition` used `\'` and were invalid after hydration, which is
the state users click in; `letter-yo-story` used `\\'` and was invalid only in the
static HTML. Fixed in Batch 56 by replacing the escape with U+2019 so no backslash
remains, plus the build assertions described above.

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
JS render replaces them instead of duplicating. Those ids are load-bearing: a
block without one is never replaced. The pre-renderer parses the emitted JSON-LD
and fails the build unless each article has exactly one BreadcrumbList object and
it sits inside id="breadcrumb-schema", and unless index.html has none. Netlify
serves these real files at their extensionless paths (there has been no /*
catch-all since Batch 50), so crawlers get full article content in raw HTML. The
/articles listing, homepage, and utility pages stay SPA-shell (their content is
already static in index.html).

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
noindex, and the seven SPA routes that are rewritten to the shell.

## Standalone pages

A standalone page is an indexable URL that is not an article and not an SPA
route. The first one is `/teachers`.

**Where they live.** `scripts/standalone-pages.js`, build time only. Each entry
carries `slug`, `title`, `description`, `h1`, `keySentence`, `published`,
`modified`, `breadcrumbName` and `bodyHtml`. The file is never served
(`_redirects` answers `/scripts/*` with a 404) and never loaded by a browser, so
the copy costs no runtime bytes. `js/articles.js` stays articles only.

**How they are emitted.** `scripts/pre-render.js` builds them from the same
`index.html` template as articles, reusing the same head needles. Three
`cutBetween` calls remove the home section, the whole articles page (listing,
article view, back links, tool CTA, related grid, prev/next bar) and about
through terms. What survives is the nav, the pre-paint theme snippet, the theme
toggle, the footer and the three core scripts. The page's content goes in where
those sections were, inside a single `<main>`. Output is `<slug>.html` at the
site root, gitignored beside `articles/` and rebuilt on every deploy.

**They stay out of the router.** `slug` must never enter `VALID_PAGES` in
`js/core.js`. Two things break if it does. `handleInitialURL()` looks up
`getElementById(pageName + '-page')` and would hand the document to
`showPage()`, which calls `removeArticleSchema()` and resets the title,
description, og, twitter and canonical to the shell defaults, with no
`PAGE_META` entry to restore them. And the build asserts that the `_redirects`
shell rewrites match `VALID_PAGES` exactly, so adding the slug there forces a
`/<slug> /index.html 200` rule, which serves the SPA shell at that URL and
destroys the only reason the page exists. For the same reason the content
container is `id="<slug>-content"`, never `id="<slug>-page"`, and it carries
`class="page-content active"`, because `.page-content` is `display: none`
without `active` and the page would render blank with JavaScript off.

**They stay out of the edge function.** `/<slug>` and `/<slug>.html` go in
`excludedPath` in `netlify/edge-functions/head-rewrite.ts`, not in its
`VALID_PAGES` copy. The static file already carries its own canonical, robots,
title, description and JSON-LD, so the function has nothing to add and one thing
to get wrong: an unknown path gets its robots meta rewritten to `noindex`, and a
standalone page inherits `index.html`'s `index, follow` tag byte for byte.
Excluding it also keeps that `VALID_PAGES` copy an exact mirror of `js/core.js`.

**Plain hrefs only.** Nothing on a standalone page may call `navTo`,
`navToArticle`, `showPage` or `showArticle`. `showArticle` reads
`#article-view` unguarded and throws on a document that has no article
containers; `showPage` resets the head. The build asserts the page body has no
`onclick` attribute and no router call. Links out of the page through the
inherited nav and footer are fine: those call `showPage`, which finds no section
and falls back to `window.location.assign`.

**Lists.** The global reset at the top of `css/styles.css` removes the browser's
list padding and `.content-text` does not restore it, so `css/styles.css` gives
every `ul` and `ol` inside `.content-text` on a page whose body carries
`data-standalone` the same 30px left indent article lists get (selectors
`body[data-standalone] .content-text ul` and
`body[data-standalone] .content-text ol`). Without it, outside list markers are
painted left of the card's content box and clipped at its edge. The
`data-standalone` body attribute is therefore also a CSS hook: do not rename or
remove it.

**Media.** Video and images a standalone page embeds live in `media/<slug>/`,
committed as inputs, not build output, and every filename carries a version
(`quiz-demo-wide-v1.mp4`). A changed clip ships under a new name, so the bytes
behind a URL never change, which is what makes the immutable `Cache-Control` in
`_headers` for `/media/*` safe. `/media/*` is also in `excludedPath` in the edge
function: a video is fetched with byte-range requests and a function that
rewrites the response body cannot pass a 206 and its `Content-Range` through.
The build asserts, off the emitted bytes, that every `src` and `poster` exists
on disk and is within its limit (1.5 MB for video, 50 KB for a poster), that
each video element carries `muted`, `loop`, `playsinline`, `preload="none"` and
numeric `width` and `height`, that none carries `autoplay`, and that the edge
exclusion, the caching rule and the absence of any matching `_redirects` rule
are all in place. `autoplay` is banned rather than discouraged: it begins the
download before any script can decide and `prefers-reduced-motion` cannot stop
it, so playback is started from the page's own inline script, which also means a
visitor who asked for reduced motion downloads no video at all and sees the
poster plus a Play button. Where two clips exist for two widths, the breakpoint
lives in exactly one place, the CSS media query; the script asks the layout
which element is visible rather than keeping a second copy of the number.

**Demo clips.** The `/teachers` clips are regenerated with one command,
`scripts/demo/make-demo.sh <output-dir>`, which launches a throwaway headless
Chrome on 127.0.0.1, records both widths against production, encodes them with
AVFoundation, makes the posters, and verifies the holds, the rest at the end and
the loop seam. It needs four things: Google Chrome, `swift` from the Command
Line Tools, `node` and `python3`, and it checks for them before it starts. There
is no ffmpeg and nothing to install. None of these tools ever deletes or
overwrites a file, so give the script a fresh or empty output directory each
run; if anything it would write is already there it refuses before Chrome
starts. It writes to the directory you give it and never into `media/`, so
copying the output in under the next version number stays a deliberate step.
Nothing under `scripts/demo/` is referenced by the build or served:
`_redirects` answers `/scripts/*` with a 404.

**Serving.** `<slug>.html` at the root is served by Netlify at `/<slug>` at 200,
and at `/<slug>.html` at 200 as well, so `_redirects` carries a forced
`/<slug>.html /<slug> 301!`. The trailing-slash form needs no additional rule,
based on Netlify's observed behavior for file-backed paths
(`/articles/getting-started/` returned a 301 to `/articles/getting-started` on
production on 2026-10-19). Verify that `/<slug>/` redirects to `/<slug>` on the
Deploy Preview for every new standalone page.

**Dates.** `published` and `modified` are the local date of the commit that adds
or changes the page. The build asserts that `modified` equals the JSON-LD
`dateModified` and the page's `lastmod` in `sitemap.xml`, so the three cannot
drift. Adding a link to a standalone page from the footer is not body copy, so
it does not bump any other page's `lastmod`.

**JSON-LD.** Two blocks, `id="page-schema"` (a `WebPage`) and
`id="page-breadcrumb-schema"` (a two-step `BreadcrumbList`, Home then the page).
The ids deliberately differ from the article ones, because
`removeArticleSchema()` deletes `#article-schema` and `#breadcrumb-schema`.

**Inbound links.** A standalone page has no nav entry, so the footer link and one
contextual link are how readers and crawlers reach it. The build asserts the
footer link appears exactly once in `index.html`, exactly once in `404.html` and
exactly once in every emitted document, and that the contextual link appears
exactly once in the About section.

## SPA routing and canonicals

Direct-load routing: `handleInitialURL()` in core.js, for article paths, no longer
routes through `showPage()`. That was resetting the canonical to the homepage
mid-init. It now activates the articles DOM directly and calls `showArticle()`
straight away.

Deferred start: `showArticle()` returns early while `document.readyState` is
`loading`, recording the requested slug in a single pending slot and arming one
`DOMContentLoaded` listener that replays it. It has to, because `js/articles.js`
and `js/article-scripts.js` load after `core.js`, so `ARTICLES` and
`ArticleScripts` do not exist yet. Last request wins, and `showPage()` and
`showArticleIndex()` clear the slot, so an article waiting on the gap never
opens on top of a route the reader picked instead. This replaced a 100ms timer
that lost the race on 80 of 80 throttled loads, taking every per-article
initialiser down with it because the throw happened at the top of
`showArticle()`.

Script loading contract: `index.html` and every emitted article page must load
`/js/core.js`, `/js/articles.js` and `/js/article-scripts.js`, exactly once
each, in that order, as classic scripts with no `async` and no `defer`. The
order and the parser-blocking execution are what make the deferred start
correct. `scripts/pre-render.js` checks all of this on the shell and on each
emitted page and fails the build otherwise.

Not-found state: when `showArticle()` receives a slug not in ARTICLES, it renders a
friendly error, resets the canonical to `/articles`, hides the prev/next bar and
related-articles section, and returns without injecting schema. The success path
explicitly restores the prev/next display in case a prior not-found visit hid it.

`_redirects` 301s for retired slugs:
- `/articles/cyrillic-alphabet-chart` -> `/articles/russian-alphabet-chart`
- `/articles/cyrillic-handwriting` -> `/articles/practice-writing-cyrillic`
- `/articles/common-cyrillic-mistakes` -> `/articles/common-mistakes`
- `/articles/cyrillic-vs-latin` -> `/articles/false-friends`

Navigation behaviors:
- Quiz-CTA buttons call `showPage('home')` and land at the top of the page (no
  `scrollIntoView`).
- `showPage('home')` while a quiz is mid-session on home calls `newSession()` to
  restore the character-selection view rather than leaving a broken mid-quiz state.

## Theme architecture (dark mode)
Toggled by the `body.dark-mode` class, persisted in localStorage under `darkMode`
(`'true'`/`'false'`). The key name is load-bearing: existing visitors' saved
preferences depend on it.

**Role tokens.** Every dark-mode rule references a token from `:root`; no
dark-mode rule carries a literal colour. Tokens are named for what a colour is
*for*, not what it looks like, so the palette can change without re-triaging 150
rules. The roles:
- surfaces, back to front: `--dark-bg`, `--dark-surface`, `--dark-raised`, `--dark-border`
- text: `--dark-text`, `--dark-text-dim`, `--dark-text-muted`, `--dark-heading`, `--dark-heading-sub`
- links: `--dark-link`, `--dark-link-hover`
- accents: `--dark-accent` (red, small accents only), `--dark-accent-2` (brand gold)
- calls to action: `--dark-cta-bg`, `--dark-cta-bg-hover`, `--dark-cta-text`
- states: `--dark-focus`, `--dark-ok`, `--dark-warn`, `--dark-bad`
- one-offs: `--dark-quiz-bg`, `--dark-shadow`, `--dark-scrim`

Light-mode brand tokens include `--dark-blue` #1A237E and `--cream` #F5F1E8. The
`--dark-` prefix on `--dark-blue` is historical: it is the brand navy, and it has
nothing to do with the dark theme.

Two rules keep the theme from drifting back: **red never fills a large area**
(it is for CTA fills, small accents and error states), and **headings take the
text colour, links take the link colour**. Before this split one token was the
heading colour, the link colour, the logo, the nav fill, the button text and the
focus ring all at once, which is what made the theme read as "red on black".

**Applied before first paint.** An inline script is the first element inside the
opening body tag in `index.html`. It has to stay there: `document.body` already
exists at that point and nothing has painted, so a saved dark preference never
shows a flash of the light theme. Putting it in `<head>` instead would mean
moving the class to `<html>` and rewriting all 150 `body.dark-mode` selectors.
Two constraints on that script: its comment must not spell the opening body tag,
because `scripts/pre-render.js` asserts exactly one occurrence of it in the file;
and the pre-render also asserts the snippet and the header toggle survive into
every emitted article, because the no-flash guarantee depends on both.

**`FOLLOW_SYSTEM_THEME`** is defined once, in that snippet, and read by
`js/core.js`. `false` (current) means a visitor with no saved preference gets the
light theme, exactly as the site has always behaved. `true` hands that decision
to `prefers-color-scheme`. Turning it on is a one-line change; the Settings
checkbox sync and the `setting_source: 'system'` analytics path are already built
and tested for it.

**One entry point.** `setTheme(dark, source)` in `js/core.js` is the only thing
that changes the theme. Both controls call it (the header button and the Settings
checkbox), so they cannot drift apart, and every change is recorded in GA as
`setting_changed` / `setting_name: 'dark_mode'` with `setting_source` naming the
control. `loadSettings()` reads the theme back off the body rather than
recomputing it, so the controls can never disagree with what is on screen.

History: the green "Matrix mode" and its rain animation are archived in git
(`git show 61e2368:docs/matrix-rain.md`). Do not reintroduce the green palette or
the rain unless asked. The palette before the Batch 45 overhaul was an AMOLED
true-black background with a single bright red accent (`#FF5C5C`); it is in git
at `5ce633d`.

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
   For link-only edits that wrap existing words in internal anchors without
   changing visible text or substantially restructuring navigation, leave
   `ARTICLE_META.modified` and the sitemap `<lastmod>` unchanged by default. Bump
   both dates together if the change materially alters the page's content or
   navigation. Either way, state the decision and the reason in the commit body.
   (Decided in Batch 57, 2026-10-11.)
3. `index.html`: an `.article-item` block in the right category group.
4. `sitemap.xml`: a new `<url>` entry (add an `<image:image>` entry too if the
   article has an image).
5. Nothing manual for heads or pre-rendering: the deploy build regenerates
   `netlify/lib/article-heads.ts` and pre-renders the article automatically.
   Optionally run `node scripts/generate-article-heads.js` locally to keep the
   committed artifact current.

Categories (exact strings): `Getting Started`, `Alphabet Variants`,
`History & Culture`, `Learning Tools & Resources`.

Conventions: `relatedArticles` is always exactly 3 slugs. Every link that navigates
uses a real href, never `href="#"`. The one carve-out is a control that performs an
action with no destination: the Bluesky and Reddit share buttons in each article's
share-section use `href="#"` because they have no URL for a modifier-click to open.
Three patterns:
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

**The modified-date check.** After any content edit not covered by the link-only
default above, confirm the edited article's `ARTICLE_META.modified` in
`js/core.js` and its `<lastmod>` in `sitemap.xml` both equal the date of the
commit. The two fields move together. If one changes and the other does not, or
if either shows an older date, stop and find out why before pushing. A commit
that leaves both files unexpectedly unchanged is the warning sign.

**Why.** Nothing else verifies a date field. In September 2026 the date-bump helper
silently wrote a hardcoded 2026-09-16 for two days across 22 articles, and it only
surfaced because a commit came back with those files unexpectedly unchanged. That
was luck, not a check.

**IndexNow baseline before every production merge.** Cyrilica tells Bing (and
Yandex, Naver, Seznam, Yep; not Google) which URLs changed, through
`scripts/indexnow.js`. The list is computed by comparing production before and
after the merge, so the baseline has to be captured while production still
serves the old commit. Run `node scripts/indexnow.js baseline` before merging
and confirm the recorded `commitRef` matches the current `origin/main`. **No
production merge happens until the baseline is captured.** Baselines live in
`~/.cyrilica/indexnow/`, named `baseline-<commit_ref>.json`, and `diff` and
`submit` select the one whose `commitRef` is parent 1 of the merge commit and
refuse if none matches.

After the production checks pass, run `node scripts/indexnow.js submit
<merge-sha>` to see the classified list (CHANGED, ADDED, REMOVED, DEINDEXED,
REDIRECTED, UNEXPECTED), then re-run with `--send`. Any UNEXPECTED row blocks
the send: it usually means a URL left the sitemap but is still live and
indexable, so the sitemap edit was the mistake, or a page is in the sitemap and
carries noindex at the same time. Record the response code in the batch report.
A 200 means the list was received, not that anything was indexed.

Every run that reaches the submission stage ends with one line,
`INDEXNOW RESULT: <label>`, where the label is `SUBMITTED` for 200,
`ACCEPTED_PENDING_VALIDATION` for 202, `FAILED_RETRY_REQUIRED` for any non-2xx,
timeout or network error, or `NOTHING_TO_SUBMIT` for an empty list. Record that
label. A noindex directive counts when the meta name is `robots`, `bingbot` or
`msnbot`, since those remove the page from Bing; `googlebot` does not, because
Google does not consume IndexNow.

**A failed submission must be retried by hand.** Nothing retries it
automatically, and a later batch's diff only covers what that batch changed, so
the missed URLs will not reappear on their own. On failure the script writes the
failed list to `~/.cyrilica/indexnow/failed-<timestamp>.json` and prints a
ready-to-run `submit --urls <list> --send` command; run that command. A failed
submission never blocks or reverts a batch, which is why it exits 0: it is one
search engine missing one notification, not a reason to undo verified work.

**The key.** The key is 32 lowercase hex characters and is public by design. It
exists in exactly one place, the name of the `<key>.txt` file at the repo root,
and the script derives both the key and its `keyLocation` from that filename, so
the served file and the submitted key cannot drift apart. **That file must
contain the key and nothing else: no trailing newline, no BOM, no whitespace.**
Create it with `printf '%s'`, never `echo`, and check afterwards that it is
exactly 32 bytes. Before sending, the script fetches the live key file and
requires its body to equal the key byte for byte with no trimming; that check is
deliberately stricter than Bing may be, so it fails visibly on a doubtful key
file rather than sending and hoping. No build check validates this file, so that
preflight is what prevents an avoidable invalid-key submission. It does not
replace the API's own answer: if a 403 comes back anyway, the run reports it
like any other failure.

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

Open: AdSense reapplication. Two commits, privacy page first: disclose the
AdSense cookie use, then restore the adsbygoogle script (client
ca-pub-5821564771189825, ads.txt already matches). The script sets third-party
advertising cookies (IDE on .doubleclick.net, measured 2026-09-18), which is why
the disclosure ships first. Requirement quoted in the ledger row for batch 35,
from support.google.com/adsense/answer/1348695. A Google certified consent
message for EEA, UK and Switzerland is already published in AdSense (Privacy and
messaging, European regulations, cyrilica.com, published 2026-02-10). It is
delivered by the adsbygoogle tag, so it only runs while that tag is on the site.
If the tag is ever removed again, EEA traffic loses its consent prompt with it.
Possible cursive phase B (more
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
