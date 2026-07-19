import type { Config, Context } from "@netlify/edge-functions";

// This function exists because non-rendering crawlers (Bing confirmed 2026-07-14)
// index the raw HTML before any JavaScript runs. The static canonical at line 28
// of index.html reads https://cyrilica.com for every URL; the inline script at
// line 29 fixes that for rendering browsers and stays as-is. This function
// covers raw-HTML crawlers by rewriting canonical per request path.
//
// Dependency: STATIC_CANONICAL and STATIC_ROBOTS below must match lines 27-28
// of index.html byte-for-byte. If those lines ever change, update these too.

export const config: Config = { path: "/*" };

const SITE_ORIGIN = "https://cyrilica.com";

const STATIC_CANONICAL = '<link rel="canonical" href="https://cyrilica.com">';
const STATIC_ROBOTS    = '<meta name="robots" content="index, follow">';
const NOINDEX_ROBOTS   = '<meta name="robots" content="noindex, follow">';
const NOINDEX_PATHS    = new Set(["/contact", "/privacy", "/about"]);

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

    const headers = new Headers(response.headers);
    headers.delete("content-length");

    return new Response(body, { status: response.status, headers });
  } catch {
    // Fail open: return the unmodified response if transformation errors.
    return fallback;
  }
}
