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
// COUPLING 1: STATIC_CANONICAL, STATIC_ROBOTS, STATIC_TITLE, and STATIC_DESC below
// must match index.html lines 27, 28, 21, and 24 byte-for-byte (STATIC_TITLE
// includes a U+2014 em-dash). If those lines change, update these constants.
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

export const config: Config = { path: "/*" };

const SITE_ORIGIN = "https://cyrilica.com";

const STATIC_CANONICAL = '<link rel="canonical" href="https://cyrilica.com">';
const STATIC_ROBOTS    = '<meta name="robots" content="index, follow">';
const NOINDEX_ROBOTS   = '<meta name="robots" content="noindex, follow">';
const STATIC_TITLE     = '<title>Learn the Russian Alphabet Free — Cyrillic Tool | Cyrilica</title>';
const STATIC_DESC      = '<meta name="description" content="Free interactive tool to learn the Russian alphabet. Practice all 33 Cyrillic letters with instant feedback, pronunciation audio, and progress tracking. No signup required.">';
const NOINDEX_PATHS    = new Set(["/contact", "/privacy", "/about", "/terms", "/settings"]);

const HEADS = articleHeads as Record<string, { title: string; description: string }>;
const ARTICLE_PREFIX = "/articles/";

export default async function headRewrite(
  request: Request,
  context: Context,
): Promise<Response> {
  const response = await context.next();

  // Pass through non-200 or non-HTML responses (redirects, assets) unchanged.
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status !== 200 || !contentType.includes("text/html")) {
    return response;
  }

  // Clone now, before reading the body, so we have a fallback on error.
  const fallback = response.clone();

  try {
    const html = await response.text();

    const url  = new URL(request.url);
    // Strip trailing slash, then lowercase (slugs are all lowercase; odd-case
    // requests like /Articles/Foo would otherwise mint a mixed-case canonical).
    const path = url.pathname.replace(/\/$/, "").toLowerCase() || "";
    const canonicalHref = path === "" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;

    let body = html.replace(
      STATIC_CANONICAL,
      `<link rel="canonical" href="${canonicalHref}">`,
    );

    if (NOINDEX_PATHS.has(path)) {
      body = body.replace(STATIC_ROBOTS, NOINDEX_ROBOTS);
    }

    // Per-article title and meta description. Only for /articles/<slug> paths
    // whose slug is in the generated map; non-article routes, the /articles
    // listing, and the homepage keep the static shell head. Values in HEADS are
    // pre-HTML-escaped by the generator, so they drop in directly. Fail open on
    // any miss: the article simply keeps the shell head.
    if (path.startsWith(ARTICLE_PREFIX)) {
      const slug = path.slice(ARTICLE_PREFIX.length);
      const head = HEADS[slug];
      if (head) {
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
    // Fail open: return the unmodified response if transformation errors.
    return fallback;
  }
}
