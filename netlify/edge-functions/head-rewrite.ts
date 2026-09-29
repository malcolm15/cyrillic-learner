import type { Config, Context } from "@netlify/edge-functions";
import articleHeads from "../lib/article-heads.ts";

// This function exists because non-rendering crawlers (Bing confirmed 2026-07-14)
// index the raw HTML before any JavaScript runs. The static shell serves the same
// canonical, robots, title, and meta description for every URL; the JS in core.js
// fixes those on render but is invisible to raw-HTML crawlers. This function makes
// the raw HTML per-route: correct canonical, noindex on the utility pages, and
// per-article <title> and <meta name="description"> so each article has unique
// head content instead of the identical shell head.
//
// It also refuses to bless a path the site does not have. The /* catch-all in
// _redirects answers every unknown URL with the homepage shell at 200, so without
// the isKnownPath check below every invented path became an indexable page that
// declared itself canonical.
//
// COUPLING 1: STATIC_CANONICAL, STATIC_ROBOTS, STATIC_TITLE, and STATIC_DESC below
// must match index.html's canonical link, robots meta, title and description tags
// byte-for-byte (STATIC_TITLE includes a U+2014 em-dash). If those tags change,
// update these constants.
//
// COUPLING 2: ../lib/article-heads.ts is generated from js/articles.js by
// scripts/generate-article-heads.js. It must be regenerated whenever any article
// title or opening paragraph changes, or crawlers get stale head content. Same
// coupling class as COUPLING 1. The generator guarantees the injected title and
// description are byte-identical (at the decoded-attribute level) to what the JS
// meta injection produces on render. It is imported as a standard ES module (not
// a JSON import), so a data-file problem can never fail the module load and
// regress the canonical / robots rewrites. It lives in netlify/lib/, not in
// netlify/edge-functions/, because Netlify treats every file in the edge-functions
// directory as its own function entry point.
//
// COUPLING 3: VALID_PAGES below must match VALID_PAGES in js/core.js. A page added
// to the SPA without being added here keeps working, but its raw HTML would carry
// noindex and no canonical, so crawlers would drop it.

// Runs on every path, because an unknown path is exactly the case this function
// has to handle. Assets are excluded instead: they are never HTML, so the
// function could only ever return them unchanged, and excluding them keeps it out
// of the request path for the large majority of requests.
export const config: Config = {
  path: "/*",
  excludedPath: [
    "/images/*",
    "/audio/*",
    "/css/*",
    "/js/*",
    "/scripts/*",
    "/netlify/*",
    "/*.png",
    "/*.jpg",
    "/*.svg",
    "/*.ico",
    "/*.mp3",
    "/*.txt",
    "/*.xml",
    "/*.webmanifest",
  ],
};

const SITE_ORIGIN = "https://cyrilica.com";

const STATIC_CANONICAL = '<link rel="canonical" href="https://cyrilica.com">';
const STATIC_ROBOTS    = '<meta name="robots" content="index, follow">';
const NOINDEX_ROBOTS   = '<meta name="robots" content="noindex, follow">';
const STATIC_TITLE     = '<title>Learn the Russian Alphabet Free — Cyrillic Tool | Cyrilica</title>';
const STATIC_DESC      = '<meta name="description" content="Free interactive tool to learn the Russian alphabet. Practice all 33 Cyrillic letters with instant feedback, pronunciation audio, and progress tracking. No signup required.">';
const NOINDEX_PATHS    = new Set(["/contact", "/privacy", "/about", "/terms", "/settings"]);

// The site's real pages, normalised the same way `path` is below: no trailing
// slash, lowercased, and the homepage as the empty string. Articles are checked
// separately against the generated head map.
const VALID_PAGES = new Set([
  "",
  "/articles",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/settings",
]);

const HEADS = articleHeads as Record<string, { title: string; description: string }>;
const ARTICLE_PREFIX = "/articles/";

// hasOwnProperty, never a bare lookup. HEADS["constructor"] resolves up the
// prototype chain to Object, which is truthy, and served <title>undefined</title>
// on /articles/constructor before this guard existed.
function hasHead(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(HEADS, slug);
}

function isKnownPath(path: string): boolean {
  if (VALID_PAGES.has(path)) return true;
  if (!path.startsWith(ARTICLE_PREFIX)) return false;
  return hasHead(path.slice(ARTICLE_PREFIX.length));
}

export default async function headRewrite(
  request: Request,
  context: Context,
): Promise<Response> {
  // Deliberately outside the try below. If the request chain itself fails there
  // is no upstream response to fall back to, and inventing one would serve a
  // blank page at a real URL. Let that surface.
  const response = await context.next();

  // Pass through non-200 or non-HTML responses (redirects, assets) unchanged.
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status !== 200 || !contentType.includes("text/html")) {
    return response;
  }

  let fallback: Response | null = null;

  try {
    // Clone before reading the body, so we have a fallback on error. Inside the
    // try because clone() buffers and can itself throw.
    fallback = response.clone();
    const html = await response.text();

    const url  = new URL(request.url);
    // Strip trailing slash, then lowercase (slugs are all lowercase; odd-case
    // requests like /Articles/Foo would otherwise mint a mixed-case canonical).
    const path = url.pathname.replace(/\/$/, "").toLowerCase() || "";
    const known = isKnownPath(path);
    const canonicalHref = path === "" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;

    // A path the site does not have gets no canonical at all: it must not
    // declare itself the canonical version of anything. A real page gets its own.
    let body = known
      ? html.replace(STATIC_CANONICAL, `<link rel="canonical" href="${canonicalHref}">`)
      : html.replace(STATIC_CANONICAL, "");

    if (!known || NOINDEX_PATHS.has(path)) {
      body = body.replace(STATIC_ROBOTS, NOINDEX_ROBOTS);
    }

    // Per-article title and meta description. Only for /articles/<slug> paths
    // whose slug is in the generated map; non-article routes, the /articles
    // listing, and the homepage keep the static shell head. Values in HEADS are
    // pre-HTML-escaped by the generator, so they drop in directly. Fail open on
    // any miss: the article simply keeps the shell head.
    if (path.startsWith(ARTICLE_PREFIX)) {
      const slug = path.slice(ARTICLE_PREFIX.length);
      if (hasHead(slug)) {
        const head = HEADS[slug];
        body = body
          .replace(STATIC_TITLE, `<title>${head.title}</title>`)
          .replace(
            STATIC_DESC,
            `<meta name="description" content="${head.description}">`,
          );
      }
    }

    const headers = new Headers(response.headers);
    headers.delete("content-length");

    return new Response(body, { status: response.status, headers });
  } catch {
    // Fail open. If the clone itself failed we have no fallback, so return the
    // original response: its body is still untouched at that point.
    return fallback ?? response;
  }
}
