#!/usr/bin/env node
//
// Deploy-time pre-rendering of article pages (Option B).
//
// Reads index.html as the template and, for each article in js/articles.js,
// emits articles/SLUG.html (flat files, not SLUG/index.html: Netlify serves
// the extensionless /articles/SLUG from SLUG.html directly, while a directory
// index triggers a 301 to the trailing-slash form, which would put a redirect
// hop on every indexed article URL) with the per-article head, the article body
// already in the DOM, prev/next navigation, the related-articles grid, and
// Article plus BreadcrumbList JSON-LD. Netlify serves these real files at their
// extensionless paths, so non-rendering crawlers see full article content in
// raw HTML. (This used to depend on them winning against a non-forced /*
// catch-all; that catch-all was removed in Batch 50.)
//
// STANDALONE PAGES: scripts/standalone-pages.js lists indexable pages that are
// not articles (currently /teachers, emitted to teachers.html at the repo root).
// They reuse this template and the head substitutions below, and nothing else:
// they are absent from ARTICLES, ARTICLE_ORDER, ARTICLE_META, article-heads.ts,
// VALID_PAGES and the edge function, and every link on them is a plain href.
//
// SELF-CONTAINED DOCUMENTS: every other route's section (home, the articles
// listing, about, settings, contact, privacy, terms) is stripped from each
// emitted file, the article is wrapped in a <main> landmark, and its title is
// the document's only <h1>. Each URL then returns a document that represents
// that URL alone; without this, all 28 files shared a byte-identical block
// that was 60% of their text, under a heading structure that identified the
// homepage as the page. Cross-route navigation from these documents is a real
// page load: core.js showPage / showArticleIndex fall back to
// window.location.assign when a route's section is absent.
//
// PARITY RULES (all fail-loud):
// - Head title and description come from netlify/lib/article-heads.ts, the
//   same artifact the edge function imports, so the static file, the edge
//   function, and the JS render can never disagree. The description is also
//   re-derived here with the injectArticleSchema algorithm and asserted equal
//   to the artifact value.
// - #article-content is article.content verbatim: showArticle assigns
//   article.content to innerHTML with no transformation, so emitting the same
//   string byte-for-byte gives the same DOM.
// - The russian-alphabet-chart cards live in article.content as static HTML, so
//   the rule above puts all 33 letters in the served document and in the in-app
//   render, with no second render and no JS-built grid. Asserted below.
// - The cyrillic-copy-paste tiles work the same way, per container. Asserted
//   below against CYRILLIC_DATA and the COPY_* lists kept in this file.
// - The backwards-r-myth lookalike cards work the same way, with their
//   explainer text asserted against LOOKALIKES below.
// - Schema scripts are emitted with id="article-schema" and
//   id="breadcrumb-schema" so injectArticleSchema REPLACES them on hydration
//   instead of duplicating them.
//
// EVERY template replacement asserts exactly one match and exits nonzero on
// mismatch. A failed build keeps the last good deploy live, which is the
// correct failure mode: never ship a partially wrong pre-render.
//
// COUPLING: the exact-match needles below are tied to index.html markup and
// to the parsing of js/articles.js and js/core.js. If the shell or those
// structures change, this script fails the build loudly and must be updated.
// The needle for the static title line contains the em-dash that exists in
// index.html; it is a byte-for-byte match target, same as in head-rewrite.ts.
//
// Run from anywhere: node scripts/pre-render.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://cyrilica.com';
const OUT_ROOT = path.join(ROOT, 'articles');
// Build-time only, never served: _redirects answers /scripts/* with a 404.
const STANDALONE_PAGES = require('./standalone-pages.js');

// The end of the .container and .main-content wrappers, immediately before the
// footer. Both emitters close their <main> here, so it is declared once.
const FOOTER_TAIL = '\n            </div>\n        </div>\n\n    <!-- Footer -->';

function fail(msg) {
    console.error('PRE-RENDER FAILED: ' + msg);
    process.exit(1);
}

function countOccurrences(haystack, needle) {
    return haystack.split(needle).length - 1;
}

function replaceOnce(haystack, needle, replacement, label) {
    const n = countOccurrences(haystack, needle);
    if (n !== 1) {
        fail(label + ': expected exactly 1 occurrence of needle, found ' + n +
             '. Needle starts: ' + JSON.stringify(needle.slice(0, 80)));
    }
    return haystack.replace(needle, replacement);
}

// ---- share handlers and onclick attributes ----
//
// The no-backslash rule below prevents the escape mismatch found on 2026-10-10:
// pre-render.js copies the content template literal as written, while core.js
// assigns the evaluated string through innerHTML, so a backslash escape inside an
// onclick means the attribute differs between the static page and the hydrated
// DOM. With no backslash in any onclick, those attribute values are the same in
// both states. It does not make static and hydrated HTML equivalent in general;
// that is shown separately by comparing the two.
const SHARE_FNS = ['copyArticleLink', 'shareToBluesky', 'shareToReddit', 'nativeShare'];

// ---- the core script loading contract ----
//
// core.js, articles.js and article-scripts.js must stay present, in this order,
// exactly once each, as parser-blocking classic scripts. The order is load
// bearing: core.js defines the router, articles.js defines ARTICLES and
// article-scripts.js defines ArticleScripts, and showArticle needs all three.
//
// async would let them execute in any order, and possibly after
// DOMContentLoaded, so showArticle could run with ARTICLES missing and no
// listener left to replay it.
//
// defer is worse rather than better. Deferred scripts run after parsing but
// before DOMContentLoaded, with document.readyState already 'interactive', so
// showArticle's guard would not engage at all. Order is preserved, so core.js
// would still run first and read ARTICLES before articles.js had defined it:
// the race would become a certainty instead of a probability.
//
// type="module" defers by definition, so it carries the same problem, and
// module scope would also stop the three files sharing globals at all.
const CORE_SCRIPTS = ['/js/core.js', '/js/articles.js', '/js/article-scripts.js'];

// Double-quoted, single-quoted and unquoted attribute values all count. A
// single-quoted src must not hide a tag from this check, and type='module' or
// a bare type=module must not slip past the type rule.
const ATTR_SRC  = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;
const ATTR_TYPE = /\stype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

function assertScriptContract(html, label) {
    const tags = [];
    const re = /<script\b([^>]*)>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const attrs = m[1];
        const src = ATTR_SRC.exec(attrs);
        if (!src) continue;
        const srcVal = (src[1] !== undefined ? src[1] : src[2] !== undefined ? src[2] : src[3]).trim();
        if (CORE_SCRIPTS.indexOf(srcVal) === -1) continue;
        tags.push({ src: srcVal, attrs: attrs });
    }
    const order = tags.map(function (t) { return t.src; });
    CORE_SCRIPTS.forEach(function (want) {
        const n = order.filter(function (s) { return s === want; }).length;
        if (n !== 1) {
            fail(label + ': expected exactly one <script src="' + want + '">, found ' + n +
                 '. Script tags seen: ' + JSON.stringify(order));
        }
    });
    if (order.join(',') !== CORE_SCRIPTS.join(',')) {
        fail(label + ': the core scripts are in the wrong order. Expected ' +
             JSON.stringify(CORE_SCRIPTS) + ', found ' + JSON.stringify(order));
    }
    tags.forEach(function (t) {
        if (/\basync\b/i.test(t.attrs)) {
            fail(label + ': ' + t.src + ' carries async. The core scripts must execute in ' +
                 'document order; async may run them in any order and possibly after ' +
                 'DOMContentLoaded, when no listener is left to replay the article.');
        }
        if (/\bdefer\b/i.test(t.attrs)) {
            fail(label + ': ' + t.src + ' carries defer. Deferred scripts run before ' +
                 'DOMContentLoaded with readyState already "interactive", so the guard in ' +
                 'showArticle would never engage, and core.js would still run before ARTICLES exists.');
        }
        const type = ATTR_TYPE.exec(t.attrs);
        if (type) {
            const typeVal = (type[1] !== undefined ? type[1] : type[2] !== undefined ? type[2] : type[3]).trim();
            if (typeVal.toLowerCase() !== 'text/javascript') {
                fail(label + ': ' + t.src + ' has type=' + JSON.stringify(typeVal) + '. The core scripts must be ' +
                     'classic scripts sharing globals; only an absent type or text/javascript is allowed.');
            }
        }
    });
    return tags.length;
}

// Every onclick="..." attribute in `html`, as raw attribute text plus its offset.
// This is the strict matcher the two rules below read. It only recognises the one
// spelling the codebase uses, which is why onclickOccurrences() exists to prove
// that no other spelling slipped in.
function onclickAttrs(html) {
    const out = [];
    const re = /onclick="([^"]*)"/g;
    let m;
    while ((m = re.exec(html)) !== null) out.push({ attr: m[1], index: m.index });
    return out;
}

// Permissive count of onclick attribute occurrences: any case, optional
// whitespace around the equals sign, any quote style or unquoted. Restricted to
// positions inside a tag, so the word appearing in prose or a comment is not
// counted. On the current tree both counts agree exactly (174 in article content,
// 66 in index.html, 27 in an emitted page) and there are no incidental
// occurrences at all, so the restriction changes nothing today; it is there so a
// future article that merely writes the word cannot fail the build.
function onclickOccurrences(html) {
    const out = [];
    const re = /onclick\s*=/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const lt = html.lastIndexOf('<', m.index);
        const gt = html.lastIndexOf('>', m.index);
        if (lt > gt) out.push(m.index);
    }
    return out;
}

// Fails unless the strict matcher saw every occurrence the permissive counter
// found. Without this, an attribute written in any other spelling would be
// skipped by both rules below and the build would still pass.
function assertOnclickCoverage(html, label) {
    const strict = onclickAttrs(html);
    const loose = onclickOccurrences(html);
    if (strict.length === loose.length) return strict.length;
    const seen = {};
    strict.forEach(function (a) { seen[a.index] = true; });
    const missed = loose.filter(function (i) { return !seen[i]; });
    const at = missed.length ? missed[0] : loose[0];
    const around = html.slice(Math.max(0, at - 80), at + 80).replace(/\n/g, ' ');
    fail(label + ': onclick coverage mismatch. The permissive count found ' + loose.length +
         ' attribute occurrences but the strict matcher returned ' + strict.length +
         '. First unmatched occurrence at offset ' + at + ', around: ' + around);
}

// ---- internal links: every target must resolve ----
//
// Nothing else in this script looks at an href, so a mistyped slug ships as a
// 404 that only a crawler or a reader finds. The reference sets are read from
// source rather than restated here: article ids from js/articles.js, SPA routes
// from VALID_PAGES in js/core.js, rule sources from _redirects, and files from
// disk. A retired path such as /articles/cyrillic-handwriting is therefore
// accepted, because _redirects 301s it to a live article.
//
// A path that _redirects answers with 404 is denied before any accepting class
// is tried, because such a path is deliberately unreachable whether or not a
// file sits behind it: /CLAUDE.md is a real file on disk and still a dead link.
//
// href="#" is allowed. The Bluesky and Reddit share buttons are controls with no
// destination, which is the carve-out recorded in CLAUDE.md.
//
// This is a structural check against source, not a crawl of the live site.
// The file-on-disk class assumes a committed file is published; it does not
// prove Netlify serves it. Live reachability is checked separately, on the
// Deploy Preview and in production.
const ARTICLE_PATH = '/articles/';
// Both hostnames the site answers on. An absolute link to either is resolved
// like a root-relative path, so it cannot escape the checks below.
const SAME_ORIGIN_HOSTS = ['cyrilica.com', 'www.cyrilica.com'];
const ATTR_HREF    = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;
const ATTR_ONCLICK = /\sonclick\s*=\s*"([^"]*)"/i;
const ATTR_ID      = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

function attrValue(m) {
    return (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]).trim();
}

// Strict matcher plus a permissive counter, the same pairing as the onclick
// rules above: if any anchor escapes the matcher the two counts disagree and the
// build fails rather than skipping that link in silence.
function anchorTags(html) {
    const out = [];
    const re = /<a\b([^>]*)>/gi;
    let m;
    while ((m = re.exec(html)) !== null) out.push({ attrs: m[1], index: m.index });
    return out;
}

function anchorOccurrences(html) {
    const out = [];
    const re = /<a\b/gi;
    let m;
    while ((m = re.exec(html)) !== null) out.push(m.index);
    return out;
}

function idsIn(html) {
    const out = Object.create(null);
    ATTR_ID.lastIndex = 0;
    let m;
    while ((m = ATTR_ID.exec(html)) !== null) out[attrValue(m)] = true;
    return out;
}

// A root-relative path naming a real committed file. This is the last class
// tried. It refuses anything resolving outside the repo, and anything this
// script writes: articles/SLUG.html and teachers.html exist only after a build,
// so without that exclusion the same link would pass on a built tree and fail on
// a clean one. `outputs` is derived from the write paths themselves, never
// restated, so a new output is excluded the moment it is added.
function isFileOnDisk(p, outputs) {
    let decoded;
    try { decoded = decodeURIComponent(p); } catch (e) { return false; }
    const abs = path.resolve(ROOT, '.' + decoded);
    if (abs !== ROOT && abs.indexOf(ROOT + path.sep) !== 0) return false;
    for (let i = 0; i < outputs.length; i++) {
        if (abs === outputs[i] || abs.indexOf(outputs[i] + path.sep) === 0) return false;
    }
    try { return fs.statSync(abs).isFile(); } catch (e) { return false; }
}

// Cross-page fragments cannot be checked while a page is being built, because
// the id lives in another document that may not be emitted yet. They are
// recorded during the per-page pass and resolved once every document exists,
// against ids collected from the documents themselves rather than a list.
function resolveCrossPageFragments(pending, idsByPath) {
    pending.forEach(function (f) {
        const ids = idsByPath[f.target];
        if (!ids) {
            fail(f.from + ': <a href="' + f.href + '"> points at a fragment on ' + f.target +
                 ', but no document was collected for that path, so the id cannot be checked.');
        }
        if (!ids[f.frag]) {
            fail(f.from + ': <a href="' + f.href + '"> points at #' + f.frag + ' on ' + f.target +
                 ', but that document has no element with id="' + f.frag + '".');
        }
    });
    return pending.length;
}

function assertInternalLinks(html, label, refs) {
    const strict = anchorTags(html);
    const loose = anchorOccurrences(html);
    if (strict.length !== loose.length) {
        fail(label + ': anchor coverage mismatch. The permissive count found ' + loose.length +
             ' <a tags but the strict matcher returned ' + strict.length +
             '. An anchor whose opening tag contains ">" would be skipped by the checks below.');
    }
    const ids = idsIn(html);
    let checked = 0;
    strict.forEach(function (a) {
        const hrefMatch = ATTR_HREF.exec(a.attrs);
        // The shell's prev/next controls carry no href until pre-render adds one.
        if (!hrefMatch) return;
        const href = attrValue(hrefMatch);
        checked += 1;
        const onclickMatch = ATTR_ONCLICK.exec(a.attrs);
        const onclick = onclickMatch ? onclickMatch[1] : '';
        const where = label + ': <a href="' + href + '">';

        // 1. The href and the router call must agree. A link whose onclick opens
        //    something other than its href behaves one way on a left-click and
        //    another on a middle-click, and only one of the two can be right.
        const navArticle = /\bnavTo\(\s*event\s*,\s*null\s*,\s*'([^']*)'\s*\)/.exec(onclick) ||
                           /\bnavToArticle\(\s*event\s*,\s*'([^']*)'\s*\)/.exec(onclick);
        if (navArticle && href !== ARTICLE_PATH + navArticle[1]) {
            fail(where + ' opens article ' + JSON.stringify(navArticle[1]) +
                 ' but its href is not ' + ARTICLE_PATH + navArticle[1] + '.');
        }
        const navPage = /\bnavTo\(\s*event\s*,\s*'([^']*)'\s*,\s*null\s*\)/.exec(onclick);
        if (navPage) {
            const want = navPage[1] === 'home' ? '/' : '/' + navPage[1];
            if (href !== want) {
                fail(where + ' opens page ' + JSON.stringify(navPage[1]) +
                     ' but its href is not ' + want + '.');
            }
        }

        // 2. Resolve the target.
        if (href === '#') return;
        if (href.charAt(0) === '#') {
            const frag = href.slice(1);
            if (!ids[frag]) {
                fail(where + ' is a same-page fragment but no element in this document has id="' + frag + '".');
            }
            return;
        }
        if (/^(?:mailto:|tel:)/i.test(href)) return;

        let target = href;
        if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
            if (!/^https?:/i.test(href)) {
                fail(where + ' uses a scheme that is neither http, https, mailto nor tel.');
            }
            let u = null;
            try {
                u = new URL(href);
            } catch (e) {
                fail(where + ' is not a parsable URL: ' + e.message);
            }
            if (SAME_ORIGIN_HOSTS.indexOf(u.hostname.toLowerCase()) === -1) return;
            // Same-origin absolute: resolved exactly like a root-relative path,
            // so an absolute link to a page the site does not have cannot pass.
            target = u.pathname + u.hash;
        } else if (href.charAt(0) !== '/') {
            fail(where + ' is relative. Article URLs live one directory deep, so a ' +
                 'relative href resolves differently on /articles/SLUG than on the shell.');
        }

        const hashAt = target.indexOf('#');
        const frag = hashAt === -1 ? '' : target.slice(hashAt + 1);
        if (hashAt !== -1) target = target.slice(0, hashAt);
        const queryAt = target.indexOf('?');
        if (queryAt !== -1) target = target.slice(0, queryAt);

        // No normalization: a trailing slash is a different URL from the canonical
        // one, and canonical URLs on this site have none. There are zero such hrefs
        // today.
        if (target.length > 1 && target.slice(-1) === '/') {
            fail(where + ' has a trailing slash. Canonical URLs on this site have none.');
        }
        const clean = target;

        // Denied before anything can accept it.
        const deniedBy = refs.denied.filter(function (d) {
            return d.exact !== undefined ? clean === d.exact : clean.indexOf(d.prefix) === 0;
        })[0];
        if (deniedBy) {
            fail(where + ' is covered by the _redirects rule "' + deniedBy.rule +
                 '", which answers 404. That path is deliberately unreachable, so the link is ' +
                 'dead even though a file sits behind it.');
        }

        // Record the fragment only for the three classes whose documents this
        // build produces. A _redirects source resolves to somewhere else and a
        // file on disk is an asset, so neither has ids to check here.
        const accept = function () {
            if (frag) refs.pendingFragments.push({ from: label, target: clean, frag: frag, href: href });
        };
        if (refs.routes[clean]) return accept();
        if (refs.standalone[clean]) return accept();
        if (clean.indexOf(ARTICLE_PATH) === 0 && refs.articles[clean.slice(ARTICLE_PATH.length)]) return accept();
        if (refs.redirectSources[clean]) return;
        if (isFileOnDisk(clean, refs.outputs)) return;
        fail(where + ' does not resolve to anything the site has. Tried: an article slug in ' +
             'ARTICLE_ORDER, an SPA route in VALID_PAGES, a standalone page in ' +
             'scripts/standalone-pages.js, a _redirects source, and a file on disk.');
    });
    return checked;
}

// Every share handler call in `content`, with the function name and the first
// argument. The first-argument pattern tolerates escapes so that malformed input
// is reported by the checks below rather than skipped by the matcher.
function shareHandlersIn(content) {
    const out = [];
    SHARE_FNS.forEach(function (fn) {
        const re = new RegExp(fn + "\\('((?:[^'\\\\]|\\\\.)*)'", 'g');
        let m;
        while ((m = re.exec(content)) !== null) {
            out.push({ fn: fn, id: m[1].replace(/\\(.)/g, '$1') });
        }
    });
    return out;
}

// An onclick attribute is the body of an event handler function, so `return` at
// the top level is legal there. Compiling it as a function body is what the
// browser does, and is why this uses Function rather than vm.Script.
function onclickParses(attr) {
    try {
        new Function(attr);
        return null;
    } catch (e) {
        return e.message;
    }
}

// ---- JSON-LD inspection, for the breadcrumb assertions below ----
//
// The breadcrumb invariant is about JSON-LD objects, not about how the JSON
// happens to be serialised, so these parse the blocks rather than grepping for
// a spelling. A future reformat of index.html or of the emitted schema cannot
// defeat them.
//
// Attribute order and quote style both vary in practice: the shell writes
// <script type="application/ld+json"> while the emitted article schema writes
// <script id="article-schema" type="application/ld+json">. Our generated JSON-LD
// does not contain a literal </script>, so a lazy match to the closing tag is
// safe for these controlled build inputs.
const LD_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

function ldAttr(attrs, name) {
    const m = new RegExp('\\b' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'i').exec(attrs);
    if (!m) return null;
    return m[1] !== undefined ? m[1] : m[2];
}

// Every application/ld+json block in `html`, parsed. A block that does not
// parse fails the build rather than being skipped: a block that cannot be
// parsed cannot be counted, and skipping it would let a broken page satisfy
// the count.
function ldBlocks(html, label) {
    const out = [];
    let m;
    LD_SCRIPT.lastIndex = 0;
    while ((m = LD_SCRIPT.exec(html)) !== null) {
        const type = ldAttr(m[1], 'type');
        if (!type || type.trim().toLowerCase() !== 'application/ld+json') continue;
        let data;
        try {
            data = JSON.parse(m[2]);
        } catch (e) {
            fail(label + ': the application/ld+json block at character offset ' +
                 m.index + ' does not parse as JSON: ' + e.message);
        }
        out.push({ offset: m.index, id: ldAttr(m[1], 'id'), data: data });
    }
    return out;
}

function isBreadcrumb(node) {
    if (!node || typeof node !== 'object') return false;
    const t = node['@type'];
    return Array.isArray(t) ? t.indexOf('BreadcrumbList') !== -1 : t === 'BreadcrumbList';
}

// BreadcrumbList objects inside one parsed payload: a bare object, each object
// of a top-level array, and each object of a top-level "@graph" array. Those
// are the shapes this check covers. A BreadcrumbList nested as a property of
// another object (for example WebPage.breadcrumb) is not counted.
function breadcrumbNodes(payload) {
    const found = [];
    const roots = Array.isArray(payload) ? payload : [payload];
    roots.forEach(function (root) {
        if (isBreadcrumb(root)) found.push(root);
        if (root && typeof root === 'object' && Array.isArray(root['@graph'])) {
            root['@graph'].forEach(function (n) { if (isBreadcrumb(n)) found.push(n); });
        }
    });
    return found;
}

// Remove everything from startMarker (inclusive) to endMarker (exclusive).
// Both markers must occur exactly once and in order, else the build fails.
function cutBetween(haystack, startMarker, endMarker, label) {
    const ns = countOccurrences(haystack, startMarker);
    const ne = countOccurrences(haystack, endMarker);
    if (ns !== 1) fail(label + ': start marker expected once, found ' + ns);
    if (ne !== 1) fail(label + ': end marker expected once, found ' + ne);
    const s = haystack.indexOf(startMarker);
    const e = haystack.indexOf(endMarker);
    if (e <= s) fail(label + ': markers out of order');
    return haystack.slice(0, s) + haystack.slice(e);
}

// textContent semantics for emitted text nodes and attribute values.
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Reverse of the heads generator's escapeForHtml (only these four are applied).
function decodeHeads(s) {
    return s
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

// Browser textContent equivalent for article content: verified to contain no
// HTML entities and no script/style blocks, so a tag strip is exact. Fail if
// that verification ever stops holding.
function textContentOf(html) {
    if (/&[a-zA-Z#][a-zA-Z0-9]*;/.test(html)) {
        fail('article content now contains an HTML entity; textContent parity in pre-render.js needs an entity decoder');
    }
    if (/<script|<style/i.test(html)) {
        fail('article content now contains a script or style block; textContent parity in pre-render.js is no longer a plain tag strip');
    }
    return html.replace(/<[^>]+>/g, '');
}

// Identical to injectArticleSchema in core.js.
function deriveDescription(content) {
    const m = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
    if (!m) return '';
    const firstParaText = textContentOf(m[1]).trim();
    let desc = firstParaText.substring(0, 155);
    if (firstParaText.length > 155) {
        desc = desc.substring(0, desc.lastIndexOf(' ')) + '...';
    }
    return desc;
}

// Identical to injectArticleSchema in core.js.
function deriveWordCount(content) {
    return textContentOf(content).replace(/\s+/g, ' ').trim().split(' ').length;
}

// Identical to the related-card preview in showArticle (core.js).
function derivePreview(content) {
    const m = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
    const text = m ? textContentOf(m[1]) : '';
    return text.substring(0, 120).trim() + '...';
}

function main() {
    const template = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    let scriptContractChecked = assertScriptContract(template, 'index.html');
    const articlesSrc = fs.readFileSync(path.join(ROOT, 'js', 'articles.js'), 'utf8');
    const coreSrc = fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8');
    const headsSrc = fs.readFileSync(path.join(ROOT, 'netlify', 'lib', 'article-heads.ts'), 'utf8');
    // Read once here: both the internal-link assertion (before anything is
    // written) and the routing checks (after) need it.
    const redirectsSrc = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
    const notFoundSrc = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
    const edgeSrc = fs.readFileSync(path.join(ROOT, 'netlify', 'edge-functions', 'head-rewrite.ts'), 'utf8');
    const redirectRules = redirectsSrc.split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l && l.charAt(0) !== '#'; })
        .map(function (l) {
            const f = l.split(/\s+/);
            const raw = f[2] || '';
            return { source: f[0], target: f[1] || '', status: raw.replace('!', ''), forced: raw.indexOf('!') !== -1 };
        });

    // ---- data: shared head artifact (same file the edge function imports) ----
    const headsMatch = headsSrc.match(/=\s(\{[\s\S]*\});\n\nexport default/);
    if (!headsMatch) fail('could not extract the object literal from article-heads.ts');
    const HEADS = JSON.parse(headsMatch[1]);

    // ---- data: articles ----
    const objRe = /id: '([^']+)',\s*\n\s*title: '((?:[^'\\]|\\.)*)',\s*\n\s*relatedArticles: \[([^\]]*)\],\s*\n\s*content: `([\s\S]*?)`/g;
    const articles = [];
    let m;
    while ((m = objRe.exec(articlesSrc)) !== null) {
        articles.push({
            id: m[1],
            title: m[2].replace(/\\(.)/g, '$1'),
            relatedArticles: m[3].split(',').map(function (s) { return s.trim().replace(/^'|'$/g, ''); }).filter(Boolean),
            content: m[4],
        });
    }
    if (articles.length !== Object.keys(HEADS).length) {
        fail('parsed ' + articles.length + ' articles but article-heads.ts has ' + Object.keys(HEADS).length + ' entries');
    }
    const byId = {};
    articles.forEach(function (a) { byId[a.id] = a; });

    // ---- data: ARTICLE_META and ARTICLE_ORDER from core.js ----
    const metaMatch = coreSrc.match(/const ARTICLE_META = \{[\s\S]*?\n\};/);
    const orderMatch = coreSrc.match(/const ARTICLE_ORDER = \[[\s\S]*?\n\];/);
    if (!metaMatch || !orderMatch) fail('could not extract ARTICLE_META or ARTICLE_ORDER from core.js');
    const ARTICLE_META = eval('(' + metaMatch[0].replace('const ARTICLE_META = ', '').replace(/;$/, '') + ')');
    const ARTICLE_ORDER = eval('(' + orderMatch[0].replace('const ARTICLE_ORDER = ', '').replace(/;$/, '') + ')');
    if (ARTICLE_ORDER.length !== articles.length) {
        fail('ARTICLE_ORDER has ' + ARTICLE_ORDER.length + ' slugs but ' + articles.length + ' articles were parsed');
    }

    // ---- data: VALID_PAGES from core.js ----
    // Used by the internal-link assertion below and by the routing checks at the
    // end. core.js stays the one source of truth for the route list.
    const validMatch = coreSrc.match(/const VALID_PAGES = \[([^\]]*)\]/);
    if (!validMatch) fail('could not read VALID_PAGES from js/core.js');
    const validPages = validMatch[1].split(',')
        .map(function (x) { return x.trim().replace(/^'|'$/g, ''); })
        .filter(Boolean);

    // ---- chart parity: the 33 letter cards are static HTML, not built by JS ----
    // js/articles.js carries the cards so they reach the served document; the
    // client script only enhances them. Nothing else checks that the markup and
    // CYRILLIC_DATA still describe the same alphabet, so assert it here and fail
    // the build loudly rather than shipping a chart with a letter missing.
    const RUSSIAN_LETTERS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');
    const dataMatch = coreSrc.match(/const CYRILLIC_DATA = \{[\s\S]*?\n\};/);
    if (!dataMatch) fail('could not extract CYRILLIC_DATA from core.js');
    const CYRILLIC_DATA = eval('(' + dataMatch[0].replace('const CYRILLIC_DATA = ', '').replace(/;$/, '') + ')');
    const audioLetters = new Set();
    Object.keys(CYRILLIC_DATA).forEach(function (groupKey) {
        Object.keys(CYRILLIC_DATA[groupKey].chars).forEach(function (ch) { audioLetters.add(ch); });
    });

    // Letter names and IPA shown on each card. Source: Wikipedia "Russian alphabet",
    // Letters table, Name column; where it offers two respellings the first is used,
    // and a respelling appears only where the source gives one. О's IPA comes from
    // Wikipedia "O (Cyrillic)" ("In Russian and Serbo-Croatian, it represents the
    // sound /o/"), because the Letters table's own IPA for О is a Cyrillic о typo.
    const LETTER_NAMES = [
        { letter: 'А', name: 'а (ah)', ipa: 'a' },
        { letter: 'Е', name: 'е', ipa: 'je' },
        { letter: 'Ё', name: 'ё', ipa: 'jo' },
        { letter: 'И', name: 'и (ee)', ipa: 'i' },
        { letter: 'О', name: 'о', ipa: 'o' },
        { letter: 'У', name: 'у (oo)', ipa: 'u' },
        { letter: 'Ы', name: 'ы', ipa: 'ɨ' },
        { letter: 'Э', name: 'э (e)', ipa: 'ɛ' },
        { letter: 'Ю', name: 'ю (ew)', ipa: 'ju' },
        { letter: 'Я', name: 'я', ipa: 'ja' },
        { letter: 'Б', name: 'бэ (be)', ipa: 'bɛ' },
        { letter: 'В', name: 'вэ (ve)', ipa: 'vɛ' },
        { letter: 'Г', name: 'гэ (ghe)', ipa: 'ɡɛ' },
        { letter: 'Д', name: 'дэ (de)', ipa: 'dɛ' },
        { letter: 'Ж', name: 'жэ', ipa: 'ʐɛ' },
        { letter: 'З', name: 'зэ (ze)', ipa: 'zɛ' },
        { letter: 'Й', name: 'и краткое', ipa: 'ˈi ˈkratkəjə' },
        { letter: 'К', name: 'ка', ipa: 'ka' },
        { letter: 'Л', name: 'эль', ipa: 'ɛlʲ' },
        { letter: 'М', name: 'эм (em)', ipa: 'ɛm' },
        { letter: 'Н', name: 'эн (en)', ipa: 'ɛn' },
        { letter: 'П', name: 'пэ (pe)', ipa: 'pɛ' },
        { letter: 'Р', name: 'эр (err)', ipa: 'ɛr' },
        { letter: 'С', name: 'эс (es)', ipa: 'ɛs' },
        { letter: 'Т', name: 'тэ (te)', ipa: 'tɛ' },
        { letter: 'Ф', name: 'эф (ef)', ipa: 'ɛf' },
        { letter: 'Х', name: 'ха', ipa: 'xa' },
        { letter: 'Ц', name: 'цэ (tse)', ipa: 'tsɛ' },
        { letter: 'Ч', name: 'че', ipa: 'tɕe' },
        { letter: 'Ш', name: 'ша', ipa: 'ʂa' },
        { letter: 'Щ', name: 'ща', ipa: 'ɕːa' },
        { letter: 'Ъ', name: 'твёрдый знак', ipa: 'ˈtvʲɵrdɨj znak' },
        { letter: 'Ь', name: 'мягкий знак', ipa: 'ˈmʲæxʲkʲɪj znak' },
    ];

    const chart = byId['russian-alphabet-chart'];
    if (!chart) fail('russian-alphabet-chart article not found; the static chart assertion cannot run');
    const cardLetters = [];
    const cardRe = /<button[^>]*class="letter-card[^"]*"[^>]*data-letter="([^"]+)"[^>]*>/g;
    let cardMatch;
    while ((cardMatch = cardRe.exec(chart.content)) !== null) cardLetters.push(cardMatch[1]);

    if (cardLetters.length !== 33) {
        fail('russian-alphabet-chart: expected 33 .letter-card elements in the article HTML, found ' + cardLetters.length);
    }
    const seen = new Set();
    const dupes = cardLetters.filter(function (ch) {
        if (seen.has(ch)) return true;
        seen.add(ch);
        return false;
    });
    if (dupes.length) fail('russian-alphabet-chart: duplicate data-letter values: ' + dupes.join(' '));
    const missing = RUSSIAN_LETTERS.filter(function (ch) { return !seen.has(ch); });
    const extra = [...seen].filter(function (ch) { return RUSSIAN_LETTERS.indexOf(ch) === -1; });
    if (missing.length) fail('russian-alphabet-chart: letters missing from the chart: ' + missing.join(' '));
    if (extra.length) fail('russian-alphabet-chart: letters in the chart that are not Russian: ' + extra.join(' '));
    const noAudio = cardLetters.filter(function (ch) { return !audioLetters.has(ch); });
    if (noAudio.length) fail('russian-alphabet-chart: card letters absent from CYRILLIC_DATA (no audio): ' + noAudio.join(' '));

    // Every card carries exactly one name line and one IPA line, with the expected text.
    const nameById = {};
    LETTER_NAMES.forEach(function (entry) { nameById[entry.letter] = entry; });
    if (LETTER_NAMES.length !== 33) fail('LETTER_NAMES has ' + LETTER_NAMES.length + ' entries, expected 33');
    const chartCardRe = /<button[^>]*class="letter-card[^"]*"[^>]*data-letter="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g;
    let chartCard;
    let checkedNames = 0;
    while ((chartCard = chartCardRe.exec(chart.content)) !== null) {
        const letter = chartCard[1];
        const html = chartCard[2];
        const want = nameById[letter];
        if (!want) fail('russian-alphabet-chart: no expected name for card ' + letter);
        function lineText(cls) {
            const m = html.match(new RegExp('<div class="' + cls + '">([^<]*)</div>'));
            return m ? m[1] : null;
        }
        if (countOccurrences(html, 'class="letter-name"') !== 1) {
            fail('russian-alphabet-chart: ' + letter + ' does not have exactly one letter-name line');
        }
        if (countOccurrences(html, 'class="letter-ipa"') !== 1) {
            fail('russian-alphabet-chart: ' + letter + ' does not have exactly one letter-ipa line');
        }
        if (lineText('letter-name') !== want.name) {
            fail('russian-alphabet-chart: ' + letter + ' name is "' + lineText('letter-name') + '", expected "' + want.name + '"');
        }
        if (lineText('letter-ipa') !== '/' + want.ipa + '/') {
            fail('russian-alphabet-chart: ' + letter + ' IPA is "' + lineText('letter-ipa') + '", expected "/' + want.ipa + '/"');
        }
        checkedNames += 1;
    }
    if (checkedNames !== 33) fail('russian-alphabet-chart: checked ' + checkedNames + ' cards for names, expected 33');

    // ---- copy tiles: the cyrillic-copy-paste grids are static HTML too ----
    // Same rule as the chart above. The expected sets live here because the build
    // is their only consumer: the markup is what ships, and these lists are the
    // guard that it still says what we intend. COPY_SPECIAL, COPY_ACCENT_VOWELS
    // and COPY_PREREFORM are not derivable from CYRILLIC_DATA. Ё is deliberately
    // absent from the accented vowels: it is always stressed, so a stress-marked
    // Ё would contradict the letter-yo-story article.
    const COMBINING_ACUTE = '\u0301';
    const COPY_SPECIAL = ['Ё', 'ё', 'Ъ', 'ъ', 'Ь', 'ь', 'Ы', 'ы', 'Э', 'э', 'Ю', 'ю', 'Я', 'я'];
    const COPY_ACCENT_UPPER = ['А', 'Е', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'];
    const COPY_ACCENT_LOWER = ['а', 'е', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я'];
    const COPY_PREREFORM = ['Ѣ', 'ѣ', 'Ѳ', 'ѳ', 'І', 'і', 'Ѵ', 'ѵ'];

    const copyPaste = byId['cyrillic-copy-paste'];
    if (!copyPaste) fail('cyrillic-copy-paste article not found; the copy tile assertion cannot run');

    const upperAll = [];
    const lowerAll = [];
    Object.keys(CYRILLIC_DATA).forEach(function (groupKey) {
        const chars = CYRILLIC_DATA[groupKey].chars;
        Object.keys(chars).forEach(function (ch) {
            upperAll.push(chars[ch].upper);
            lowerAll.push(chars[ch].lower);
        });
    });
    function sortedUnique(arr) {
        return [...new Set(arr)].sort();
    }
    const notSpecial = function (ch) { return COPY_SPECIAL.indexOf(ch) === -1; };

    const expectedTiles = {
        'uppercase-container': sortedUnique(upperAll).filter(notSpecial),
        'lowercase-container': sortedUnique(lowerAll).filter(notSpecial),
        'special-container': COPY_SPECIAL,
        'accented-upper-container': COPY_ACCENT_UPPER.map(function (ch) { return ch + COMBINING_ACUTE; }),
        'accented-lower-container': COPY_ACCENT_LOWER.map(function (ch) { return ch + COMBINING_ACUTE; }),
        'prereform-container': COPY_PREREFORM,
    };

    Object.keys(expectedTiles).forEach(function (containerId) {
        const expected = expectedTiles[containerId];
        const open = '<div id="' + containerId + '" class="copy-grid">';
        const at = copyPaste.content.indexOf(open);
        if (at === -1) fail('cyrillic-copy-paste: container "' + containerId + '" not found in the article HTML');
        const closeAt = copyPaste.content.indexOf('</div>', at);
        if (closeAt === -1) fail('cyrillic-copy-paste: container "' + containerId + '" is not closed');
        const inner = copyPaste.content.slice(at + open.length, closeAt);

        const chars = [];
        const tileRe = /<button[^>]*class="copy-char-btn"[^>]*data-char="([^"]+)"[^>]*>/g;
        let tile;
        while ((tile = tileRe.exec(inner)) !== null) chars.push(tile[1]);

        if (chars.length !== expected.length) {
            fail('cyrillic-copy-paste: ' + containerId + ' has ' + chars.length +
                 ' character tiles, expected ' + expected.length);
        }
        const dupes = chars.filter(function (ch, i) { return chars.indexOf(ch) !== i; });
        if (dupes.length) fail('cyrillic-copy-paste: ' + containerId + ' has duplicate tiles: ' + dupes.join(' '));
        const wrong = chars.filter(function (ch, i) { return ch !== expected[i]; });
        if (wrong.length) {
            fail('cyrillic-copy-paste: ' + containerId + ' tiles do not match the expected set.' +
                 ' Expected: ' + expected.join(' ') + ' | found: ' + chars.join(' '));
        }
        const spaces = countOccurrences(inner, 'class="copy-char-btn copy-space-tile"');
        if (spaces !== 1) {
            fail('cyrillic-copy-paste: ' + containerId + ' has ' + spaces + ' space tiles, expected exactly 1');
        }
    });

    // ---- lookalike strip: static cards in backwards-r-myth ----
    // Same rule as the chart and the copy tiles. The explainer text is asserted
    // too, not just the letters: a count-only check would let the visible
    // "like R . says ya" drift away from the letter it describes.
    const LOOKALIKES = [
        { letter: 'Я', looks: 'R', says: 'ya', hint: 'yard' },
        { letter: 'И', looks: 'N', says: 'ee', hint: 'see' },
        { letter: 'Д', looks: 'A', says: 'd', hint: 'dog' },
        { letter: 'Ш', looks: 'W', says: 'sh', hint: 'shop' },
        { letter: 'Ц', looks: 'U', says: 'ts', hint: 'cats' },
        { letter: 'Г', looks: 'r', says: 'g', hint: 'go' },
        { letter: 'Ф', looks: 'O', says: 'f', hint: 'fox' },
        { letter: 'Ё', looks: 'E', says: 'yo', hint: 'yolk' },
    ];

    const backwardsR = byId['backwards-r-myth'];
    if (!backwardsR) fail('backwards-r-myth article not found; the lookalike assertion cannot run');
    const stripOpen = '<div class="false-friends-grid lookalike-strip" id="lookalike-strip">';
    const stripAt = backwardsR.content.indexOf(stripOpen);
    if (stripAt === -1) fail('backwards-r-myth: the lookalike strip container was not found');
    const stripInner = backwardsR.content.slice(stripAt + stripOpen.length);

    const lookalikeRe = /<div class="ff-card lookalike-card" data-letter="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>/g;
    const lookalikeCards = [];
    const cards = lookalikeCards;
    let lookalikeMatch;
    while ((lookalikeMatch = lookalikeRe.exec(stripInner)) !== null && cards.length <= LOOKALIKES.length) {
        cards.push({ letter: lookalikeMatch[1], html: lookalikeMatch[2] });
    }

    if (cards.length !== LOOKALIKES.length) {
        fail('backwards-r-myth: expected ' + LOOKALIKES.length + ' lookalike cards, found ' + cards.length);
    }
    const seenLetters = new Set();
    cards.forEach(function (card) {
        if (seenLetters.has(card.letter)) fail('backwards-r-myth: duplicate lookalike card for ' + card.letter);
        seenLetters.add(card.letter);
    });
    LOOKALIKES.forEach(function (want, i) {
        const card = cards[i];
        if (card.letter !== want.letter) {
            fail('backwards-r-myth: lookalike card ' + (i + 1) + ' is "' + card.letter + '", expected "' + want.letter + '"');
        }
        if (!audioLetters.has(want.letter)) {
            fail('backwards-r-myth: lookalike letter ' + want.letter + ' is absent from CYRILLIC_DATA (no audio)');
        }
        function textOf(cls) {
            const m = card.html.match(new RegExp('<span class="' + cls + '">([^<]*)</span>'));
            return m ? m[1] : null;
        }
        if (textOf('ff-wrong') !== want.looks) {
            fail('backwards-r-myth: ' + want.letter + ' says it looks like "' + textOf('ff-wrong') + '", expected "' + want.looks + '"');
        }
        if (textOf('ff-right') !== want.says) {
            fail('backwards-r-myth: ' + want.letter + ' says it sounds like "' + textOf('ff-right') + '", expected "' + want.says + '"');
        }
        if (textOf('lookalike-hint') !== ' (' + want.hint + ')') {
            fail('backwards-r-myth: ' + want.letter + ' hint is "' + textOf('lookalike-hint') + '", expected " (' + want.hint + ')"');
        }
        if (countOccurrences(card.html, 'lookalike-listen') !== 1) {
            fail('backwards-r-myth: ' + want.letter + ' does not have exactly one listen button');
        }
        if (countOccurrences(card.html, 'lookalike-copy') !== 1) {
            fail('backwards-r-myth: ' + want.letter + ' does not have exactly one copy button');
        }
    });

    // ---- study groups: the six selectable groups are static HTML in index.html ----
    // Same rule as the chart, the copy tiles and the lookalike strip, but this one
    // lives in the shell rather than an article. The romans are asserted against
    // CYRILLIC_DATA as well as against this list, because a drifted romanization
    // would show a visitor one answer while the quiz marks another one correct.
    const STUDY_GROUPS = [
        { key: 'vowels_1', title: 'Vowels 1', letters: ['А', 'Е', 'И', 'О', 'У'], romans: ['a', 'ye', 'i', 'o', 'u'] },
        { key: 'vowels_2', title: 'Vowels 2', letters: ['Ё', 'Ы', 'Э', 'Ю', 'Я'], romans: ['yo', 'y', 'e', 'yu', 'ya'] },
        { key: 'consonants_1', title: 'Consonants 1', letters: ['Б', 'В', 'Г', 'Д', 'Ж', 'З'], romans: ['b', 'v', 'g', 'd', 'zh', 'z'] },
        { key: 'consonants_2', title: 'Consonants 2', letters: ['К', 'Л', 'М', 'Н', 'П', 'Р'], romans: ['k', 'l', 'm', 'n', 'p', 'r'] },
        { key: 'consonants_3', title: 'Consonants 3', letters: ['С', 'Т', 'Ф', 'Х', 'Ц', 'Ч'], romans: ['s', 't', 'f', 'kh', 'ts', 'ch'] },
        { key: 'consonants_4', title: 'Consonants 4', letters: ['Ш', 'Щ', 'Ъ', 'Ь', 'Й'], romans: ['sh', 'shch', '"', '\'', 'y'] },
    ];

    const shellGroupsOpen = '<div id="reference-container">';
    const sgAt = template.indexOf(shellGroupsOpen);
    if (sgAt === -1) fail('index.html: #reference-container not found');
    const sgInner = template.slice(sgAt);
    const sectionRe = /<div class="reference-section" data-group="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>/g;
    const sections = [];
    let sgMatch;
    while ((sgMatch = sectionRe.exec(sgInner)) !== null && sections.length <= STUDY_GROUPS.length) {
        sections.push({ key: sgMatch[1], html: sgMatch[2] });
    }
    if (sections.length !== STUDY_GROUPS.length) {
        fail('index.html: expected ' + STUDY_GROUPS.length + ' study groups, found ' + sections.length);
    }
    const sgSeenGroups = new Set();
    const sgSeenLetters = new Set();
    STUDY_GROUPS.forEach(function (want, i) {
        const got = sections[i];
        if (got.key !== want.key) fail('index.html: study group ' + (i + 1) + ' is "' + got.key + '", expected "' + want.key + '"');
        if (sgSeenGroups.has(got.key)) fail('index.html: duplicate study group ' + got.key);
        sgSeenGroups.add(got.key);
        const titleMatch = got.html.match(/<div class="section-title">([^<]*)<\/div>/);
        if (!titleMatch || titleMatch[1] !== want.title) {
            fail('index.html: ' + want.key + ' title is "' + (titleMatch ? titleMatch[1] : 'missing') + '", expected "' + want.title + '"');
        }
        const letters = [];
        const romans = [];
        const itemRe = /<span class="char-ref-cyrillic">([^<]*)<\/span><span class="char-ref-roman">([^<]*)<\/span>/g;
        let item;
        while ((item = itemRe.exec(got.html)) !== null) { letters.push(item[1]); romans.push(item[2]); }
        if (letters.join(' ') !== want.letters.join(' ')) {
            fail('index.html: ' + want.key + ' letters are "' + letters.join(' ') + '", expected "' + want.letters.join(' ') + '"');
        }
        if (romans.join(' ') !== want.romans.join(' ')) {
            fail('index.html: ' + want.key + ' romans are "' + romans.join(' ') + '", expected "' + want.romans.join(' ') + '"');
        }
        letters.forEach(function (ch, j) {
            if (sgSeenLetters.has(ch)) fail('index.html: letter ' + ch + ' appears in more than one study group');
            sgSeenLetters.add(ch);
            const data = CYRILLIC_DATA[want.key] && CYRILLIC_DATA[want.key].chars[ch];
            if (!data) fail('index.html: ' + ch + ' is not in CYRILLIC_DATA group ' + want.key);
            if (data.roman !== romans[j]) {
                fail('index.html: ' + ch + ' shows roman "' + romans[j] + '" but CYRILLIC_DATA says "' + data.roman + '"');
            }
        });
    });
    if (sgSeenLetters.size !== 33) fail('index.html: study groups cover ' + sgSeenLetters.size + ' letters, expected 33');
    RUSSIAN_LETTERS.forEach(function (ch) {
        if (!sgSeenLetters.has(ch)) fail('index.html: letter ' + ch + ' is missing from the study groups');
    });

    // ---- static template needles (byte-for-byte from index.html) ----
    const T = {
        title: '<title>Learn the Russian Alphabet Free — Cyrillic Tool | Cyrilica</title>',
        desc: '<meta name="description" content="Free interactive tool to learn the Russian alphabet. Practice all 33 Cyrillic letters with instant feedback, pronunciation audio, and progress tracking. No signup required.">',
        canonical: '<link rel="canonical" href="https://cyrilica.com">',
        ogUrl: '<meta property="og:url" content="https://cyrilica.com/">',
        ogTitle: '<meta property="og:title" content="Learn the Russian Alphabet Free — Cyrillic Tool | Cyrilica">',
        ogDesc: '<meta property="og:description" content="Free interactive tool to learn the Russian alphabet. Practice all 33 Cyrillic letters with instant feedback, pronunciation audio, and progress tracking. No signup required.">',
        twUrl: '<meta property="twitter:url" content="https://cyrilica.com/">',
        twTitle: '<meta property="twitter:title" content="Learn the Russian Alphabet Free — Cyrillic Tool | Cyrilica">',
        twDesc: '<meta property="twitter:description" content="Free interactive tool to learn the Russian alphabet. Practice all 33 Cyrillic letters with instant feedback, pronunciation audio, and progress tracking. No signup required.">',
        headClose: '</head>',
        body: '<body>',  // replaced with the data-prerendered marker
        homePage: '<div id="home-page" class="page-content active">',
        articlesPage: '<div id="articles-page" class="page-content">',
        articlesIndex: '<div id="articles-index" class="articles-view active">',
        articleView: '<div id="article-view" class="articles-view" style="display: none;">',
        navHome: '<li><a href="/" class="active" onclick="navTo(event, \'home\', null)">Home</a></li>',
        navArticles: '<li><a href="/articles" onclick="navTo(event, \'articles\', null)">Articles</a></li>',
        articleTitle: '<h2 id="article-title"></h2>',
        contentBlock: '<div class="article-content content-text" id="article-content">\n' +
            '                                <!-- Article content loaded here -->\n' +
            '                            </div>',
        relatedOpen: '<div class="related-articles" id="related-articles-section" style="display: none;">',
        relatedPlaceholder: '<!-- Related articles loaded here by JavaScript -->',
        prevBtn: '<a class="btn nav-btn" id="prev-article" onclick="navigateArticle(event, \'prev\')">',
        nextBtn: '<a class="btn nav-btn" id="next-article" onclick="navigateArticle(event, \'next\')">',
        prevTitle: '<span class="nav-title" id="prev-article-title"></span>',
        nextTitle: '<span class="nav-title" id="next-article-title"></span>',
    };
    // Validate every needle against the template once, up front, so a shell
    // change fails the build with a clear message before any file is written.
    Object.keys(T).forEach(function (key) {
        const n = countOccurrences(template, T[key]);
        if (n !== 1) fail('template needle "' + key + '": expected exactly 1 occurrence in index.html, found ' + n);
    });

    // The shell must carry no BreadcrumbList at all. One file serves all seven
    // SPA routes, so any trail baked into it is wrong for at least six of them,
    // and because the shell block carried no id the JS render could not replace
    // it. Articles get their own trail below, with id="breadcrumb-schema".
    const templateBreadcrumbs = ldBlocks(template, 'index.html')
        .reduce(function (acc, b) { return acc + breadcrumbNodes(b.data).length; }, 0);
    if (templateBreadcrumbs !== 0) {
        fail('index.html must contain zero BreadcrumbList objects, found ' + templateBreadcrumbs +
             '. The shell serves seven routes from one file and cannot carry a correct trail for them.');
    }

    // ---- internal links: the shell, then every emitted page below ----
    // Every path this script writes, derived from the write paths themselves so
    // the file-on-disk class cannot answer differently on a built tree.
    const scriptOutputs = [OUT_ROOT].concat(STANDALONE_PAGES.map(function (sp) {
        return path.join(ROOT, sp.slug + '.html');
    }));
    // ids per document, filled as each one is built, for cross-page fragments.
    const idsByPath = Object.create(null);
    const templateIds = idsIn(template);

    const linkRefs = {
        articles: Object.create(null),
        routes: Object.create(null),
        standalone: Object.create(null),
        redirectSources: Object.create(null),
        denied: [],
        outputs: scriptOutputs,
        pendingFragments: [],
    };
    ARTICLE_ORDER.forEach(function (slug) { linkRefs.articles[slug] = true; });
    // /teachers is a valid target because scripts/standalone-pages.js says so,
    // not because this list says so.
    STANDALONE_PAGES.forEach(function (sp) { linkRefs.standalone['/' + sp.slug] = true; });
    validPages.forEach(function (p) {
        const route = p === 'home' ? '/' : '/' + p;
        linkRefs.routes[route] = true;
        // Every shell route is served from index.html, so its ids are the
        // template's ids.
        idsByPath[route] = templateIds;
    });
    redirectRules.forEach(function (r) {
        // A source that is a full URL (the Netlify subdomain rule) is not a path.
        if (r.source.charAt(0) !== '/') return;
        if (r.status === '404') {
            // Deny, do not accept. A /x/* source denies by path prefix, keeping
            // the slash so /netlify/* cannot also deny /netlify.toml.
            if (r.source.slice(-2) === '/*') {
                linkRefs.denied.push({ rule: r.source, prefix: r.source.slice(0, -1) });
            } else if (r.source.indexOf('*') === -1) {
                linkRefs.denied.push({ rule: r.source, exact: r.source });
            }
            return;
        }
        // A wildcard source names no single path, so it validates nothing.
        if (r.source.indexOf('*') !== -1) return;
        linkRefs.redirectSources[r.source] = true;
    });
    let internalLinksChecked = assertInternalLinks(template, 'index.html', linkRefs);

    // ---- share handlers: coverage, then the no-backslash source rule ----
    //
    // Coverage is asserted before the content rule so that a missing or malformed
    // handler is reported rather than passed over by the matcher. The content is
    // the raw template-literal text from js/articles.js, read before any
    // evaluation or unescaping, because the escape is exactly what is being
    // checked for.
    let shareHandlerTotal = 0;
    let contentOnclickTotal = 0;
    ARTICLE_ORDER.forEach(function (slug) {
        const article = byId[slug];
        if (!article) fail('share handlers: ARTICLE_ORDER slug "' + slug + '" not found in articles.js');
        const found = shareHandlersIn(article.content);
        shareHandlerTotal += found.length;
        if (found.length !== SHARE_FNS.length) {
            fail(slug + ': expected ' + SHARE_FNS.length + ' share handlers, found ' + found.length +
                 ' (' + found.map(function (h) { return h.fn; }).join(', ') + ')');
        }
        SHARE_FNS.forEach(function (fn) {
            const n = found.filter(function (h) { return h.fn === fn; }).length;
            if (n !== 1) fail(slug + ': expected exactly 1 ' + fn + ' share handler, found ' + n);
        });
        found.forEach(function (h) {
            if (h.id !== slug) {
                fail(slug + ': share handler ' + h.fn + ' passes article id "' + h.id + '", expected "' + slug + '"');
            }
        });
        contentOnclickTotal += assertOnclickCoverage(article.content, slug + ' (article content)');
        onclickAttrs(article.content).forEach(function (o) {
            const attr = o.attr;
            if (attr.indexOf('\\') !== -1) {
                fail(slug + ': onclick attribute in article content contains a backslash, which makes the ' +
                     'static and hydrated attribute values differ. Use a typographic apostrophe (U+2019) ' +
                     'instead of an escape. Attribute: ' + attr);
            }
        });
    });
    // Consistency between the two lists only. Proof that the parser found every
    // article stays where it is, in the parsed-count versus article-heads.ts check.
    const orderSet = {}, parsedSet = {};
    ARTICLE_ORDER.forEach(function (s) {
        if (orderSet[s]) fail('share handlers: ARTICLE_ORDER contains duplicate slug "' + s + '"');
        orderSet[s] = true;
    });
    articles.forEach(function (a) { parsedSet[a.id] = true; });
    const missingFromOrder = Object.keys(parsedSet).filter(function (s) { return !orderSet[s]; });
    const missingFromArticles = Object.keys(orderSet).filter(function (s) { return !parsedSet[s]; });
    if (missingFromOrder.length || missingFromArticles.length) {
        fail('share handlers: ARTICLE_ORDER and the parsed articles disagree.' +
             (missingFromArticles.length ? ' In ARTICLE_ORDER but not parsed: ' + missingFromArticles.join(', ') + '.' : '') +
             (missingFromOrder.length ? ' Parsed but not in ARTICLE_ORDER: ' + missingFromOrder.join(', ') + '.' : ''));
    }
    if (shareHandlerTotal !== ARTICLE_ORDER.length * SHARE_FNS.length) {
        fail('share handlers: expected ' + (ARTICLE_ORDER.length * SHARE_FNS.length) +
             ' handlers across all articles, found ' + shareHandlerTotal);
    }
    console.log('Share handler checks passed: ' + ARTICLE_ORDER.length + ' articles, ' +
                shareHandlerTotal + ' handlers, 0 backslashes in any onclick, ' +
                contentOnclickTotal + ' onclick attributes in article content covered.');

    // ---- emit each article ----
    fs.mkdirSync(OUT_ROOT, { recursive: true });
    let emitted = 0;
    let pageOnclickTotal = 0;
    // Every emitted document, so the inbound-link assertion can check all of
    // them without reading them back off disk.
    const emittedPages = [];
    ARTICLE_ORDER.forEach(function (slug, i) {
        const article = byId[slug];
        if (!article) fail('ARTICLE_ORDER slug "' + slug + '" not found in articles.js');
        const head = HEADS[slug];
        if (!head) fail('slug "' + slug + '" missing from article-heads.ts');
        const meta = ARTICLE_META[slug];
        if (!meta) fail('slug "' + slug + '" missing from ARTICLE_META');

        // Cross-artifact parity: the heads artifact must equal what the JS
        // render derives, or the three layers would disagree.
        const jsTitle = article.title + ' | Cyrilica';
        if (decodeHeads(head.title) !== jsTitle) {
            fail(slug + ': article-heads.ts title does not match articles.js title. Regenerate article-heads.ts.');
        }
        const description = deriveDescription(article.content);
        if (decodeHeads(head.description) !== description) {
            fail(slug + ': article-heads.ts description does not match the derived description. Regenerate article-heads.ts.');
        }

        const articleUrl = SITE + '/articles/' + slug;
        const escTitleAttr = head.title; // already HTML-escaped by the generator

        // Schema objects: field order and values identical to injectArticleSchema.
        const articleSchema = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': article.title,
            'description': description,
            'url': articleUrl,
            'mainEntityOfPage': { '@type': 'WebPage', '@id': articleUrl },
            'image': 'https://cyrilica.com/og-image.png',
            'datePublished': meta.published,
            'dateModified': meta.modified,
            'author': { '@type': 'Organization', 'name': 'Cyrilica', 'url': 'https://cyrilica.com' },
            'publisher': {
                '@type': 'Organization', 'name': 'Cyrilica', 'url': 'https://cyrilica.com',
                'logo': { '@type': 'ImageObject', 'url': 'https://cyrilica.com/favicon.svg' },
            },
            'articleSection': meta.section,
            'wordCount': deriveWordCount(article.content),
            'inLanguage': 'en',
            'isAccessibleForFree': true,
            'educationalLevel': 'Beginner',
            'keywords': meta.keywords.join(', '),
            'about': {
                '@type': 'Thing',
                'name': 'Cyrillic alphabet',
                'description': 'Writing system used for Russian, Ukrainian, Bulgarian, Serbian, and other Slavic languages',
            },
        };
        const breadcrumbSchema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://cyrilica.com' },
                { '@type': 'ListItem', 'position': 2, 'name': 'Articles', 'item': 'https://cyrilica.com/articles' },
                { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': articleUrl },
            ],
        };
        const schemaScripts =
            '    <script id="article-schema" type="application/ld+json">' + JSON.stringify(articleSchema) + '</script>\n' +
            '    <script id="breadcrumb-schema" type="application/ld+json">' + JSON.stringify(breadcrumbSchema) + '</script>\n';

        // Prev/next with looping, identical to showArticle.
        const prevIndex = i > 0 ? i - 1 : ARTICLE_ORDER.length - 1;
        const nextIndex = i < ARTICLE_ORDER.length - 1 ? i + 1 : 0;
        const prevArticle = byId[ARTICLE_ORDER[prevIndex]];
        const nextArticle = byId[ARTICLE_ORDER[nextIndex]];

        // Related-articles cards, mirroring the showArticle card structure.
        const relatedCards = article.relatedArticles.slice(0, 3).map(function (relatedId) {
            const rel = byId[relatedId];
            if (!rel) fail(slug + ': related article "' + relatedId + '" not found');
            return '<a class="related-article-card" href="/articles/' + relatedId + '" onclick="navTo(event, null, \'' + relatedId + '\')">\n' +
                '                                        <h4>' + escapeHtml(rel.title) + '</h4>\n' +
                '                                        <p>' + escapeHtml(derivePreview(rel.content)) + '</p>\n' +
                '                                    </a>';
        }).join('\n                                    ');

        // ---- assemble the page ----
        let page = template;
        page = replaceOnce(page, T.title, '<title>' + escTitleAttr + '</title>', slug + '/title');
        page = replaceOnce(page, T.desc, '<meta name="description" content="' + head.description + '">', slug + '/description');
        page = replaceOnce(page, T.canonical, '<link rel="canonical" href="' + articleUrl + '">', slug + '/canonical');
        page = replaceOnce(page, T.ogUrl, '<meta property="og:url" content="' + articleUrl + '">', slug + '/og:url');
        page = replaceOnce(page, T.ogTitle, '<meta property="og:title" content="' + escTitleAttr + '">', slug + '/og:title');
        page = replaceOnce(page, T.ogDesc, '<meta property="og:description" content="' + head.description + '">', slug + '/og:description');
        page = replaceOnce(page, T.twUrl, '<meta property="twitter:url" content="' + articleUrl + '">', slug + '/twitter:url');
        page = replaceOnce(page, T.twTitle, '<meta property="twitter:title" content="' + escTitleAttr + '">', slug + '/twitter:title');
        page = replaceOnce(page, T.twDesc, '<meta property="twitter:description" content="' + head.description + '">', slug + '/twitter:description');
        page = replaceOnce(page, T.headClose, schemaScripts + '</head>', slug + '/schema');
        page = replaceOnce(page, T.homePage, '<div id="home-page" class="page-content">', slug + '/home-page state');
        page = replaceOnce(page, T.articlesPage, '<div id="articles-page" class="page-content active">', slug + '/articles-page state');
        page = replaceOnce(page, T.articlesIndex, '<div id="articles-index" class="articles-view active" style="display: none;">', slug + '/articles-index state');
        page = replaceOnce(page, T.articleView, '<div id="article-view" class="articles-view" style="display: block;">', slug + '/article-view state');
        page = replaceOnce(page, T.navHome, '<li><a href="/" onclick="navTo(event, \'home\', null)">Home</a></li>', slug + '/nav home');
        page = replaceOnce(page, T.navArticles, '<li><a href="/articles" class="active" onclick="navTo(event, \'articles\', null)">Articles</a></li>', slug + '/nav articles');
        page = replaceOnce(page, T.articleTitle, '<h1 id="article-title">' + escapeHtml(article.title) + '</h1>', slug + '/article title');
        page = replaceOnce(page, T.contentBlock,
            '<div class="article-content content-text" id="article-content">' + article.content + '</div>',
            slug + '/article content');
        page = replaceOnce(page, T.relatedOpen, '<div class="related-articles" id="related-articles-section" style="display: block;">', slug + '/related section state');
        page = replaceOnce(page, T.relatedPlaceholder, relatedCards, slug + '/related cards');
        page = replaceOnce(page, T.body, '<body data-prerendered="' + slug + '">', slug + '/body marker');
        page = replaceOnce(page, T.prevBtn, '<a class="btn nav-btn" id="prev-article" href="/articles/' + ARTICLE_ORDER[prevIndex] + '" onclick="navigateArticle(event, \'prev\')" data-article-id="' + ARTICLE_ORDER[prevIndex] + '">', slug + '/prev link');
        page = replaceOnce(page, T.nextBtn, '<a class="btn nav-btn" id="next-article" href="/articles/' + ARTICLE_ORDER[nextIndex] + '" onclick="navigateArticle(event, \'next\')" data-article-id="' + ARTICLE_ORDER[nextIndex] + '">', slug + '/next link');
        page = replaceOnce(page, T.prevTitle, '<span class="nav-title" id="prev-article-title">' + escapeHtml(prevArticle.title) + '</span>', slug + '/prev title');
        page = replaceOnce(page, T.nextTitle, '<span class="nav-title" id="next-article-title">' + escapeHtml(nextArticle.title) + '</span>', slug + '/next title');

        // ---- the prev/next bar must be crawlable, and must point where
        // ARTICLE_ORDER says. Buttons gave crawlers no links between articles;
        // if the bar ever regresses to a button, or an href drifts from the
        // order, fail the build rather than ship a dead end.
        const prevHref = '/articles/' + ARTICLE_ORDER[prevIndex];
        const nextHref = '/articles/' + ARTICLE_ORDER[nextIndex];
        [['prev', 'prev-article', prevHref], ['next', 'next-article', nextHref]].forEach(function (pair) {
            const dir = pair[0], id = pair[1], href = pair[2];
            const tag = '<a class="btn nav-btn" id="' + id + '" href="' + href + '"';
            const n = countOccurrences(page, tag);
            if (n !== 1) {
                fail(slug + '/' + dir + ' link: expected exactly 1 occurrence of ' + tag +
                    ', found ' + n + '. ARTICLE_ORDER says ' + dir + ' is ' + href);
            }
            if (countOccurrences(page, '<button class="btn nav-btn" id="' + id + '"') !== 0) {
                fail(slug + '/' + dir + ' link: the bar still emits a <button>, which gives crawlers no link');
            }
        });

        // ---- the other three navigation controls in every article: the two
        // Back links and the tool CTA. Same rule as the bar: a control whose
        // job is reaching a URL ships as <a href>, never a <button>.
        [
            ['back link (header)', '<a class="article-back-btn" href="/articles"',
                                   '<button class="article-back-btn"'],
            ['back link (bar)',    '<a class="btn back-to-articles" href="/articles"',
                                   '<button class="btn" onclick="showArticleIndex()">Back to Articles</button>'],
            ['tool CTA',           '<a class="btn tool-cta-btn" href="/"',
                                   '<button class="btn tool-cta-btn"'],
        ].forEach(function (control) {
            const label = control[0], link = control[1], button = control[2];
            const n = countOccurrences(page, link);
            if (n !== 1) {
                fail(slug + '/' + label + ': expected exactly 1 occurrence of ' + link + ', found ' + n);
            }
            if (countOccurrences(page, button) !== 0) {
                fail(slug + '/' + label + ': still emits a <button>, which gives crawlers no link');
            }
        });

        // The theme has to be applied before anything is laid out, or a visitor
        // with a saved dark preference sees the light theme painted first. That
        // depends on the pre-paint snippet and the header control surviving into
        // every emitted article, so assert both here.
        if (countOccurrences(page, 'window.FOLLOW_SYSTEM_THEME = ') !== 1) {
            fail(slug + ': the pre-paint theme snippet is missing from the emitted page');
        }
        if (countOccurrences(page, '<button class="theme-toggle" id="theme-toggle"') !== 1) {
            fail(slug + ': the header theme toggle is missing from the emitted page');
        }

        // ---- self-contained document: drop every other route's section ----
        page = cutBetween(page,
            '                <!-- HOME PAGE -->',
            '                <!-- ARTICLES PAGE -->',
            slug + '/strip home');
        page = cutBetween(page,
            '                    <!-- Articles Index -->',
            '<div id="article-view" class="articles-view" style="display: block;">',
            slug + '/strip listing');
        page = cutBetween(page,
            '                <!-- ABOUT PAGE -->',
            FOOTER_TAIL,
            slug + '/strip about through terms');

        // <main> wraps the articles page, which now holds only the article.
        page = replaceOnce(page,
            '                <!-- ARTICLES PAGE -->\n                <div id="articles-page" class="page-content active">',
            '                <main>\n                <div id="articles-page" class="page-content active">',
            slug + '/main open');
        page = replaceOnce(page, FOOTER_TAIL, '\n                </main>' + FOOTER_TAIL, slug + '/main close');

        // Structural assertions on the finished document.
        ['home-page', 'articles-index', 'about-page', 'settings-page', 'contact-page', 'privacy-page', 'terms-page'].forEach(function (id) {
            if (page.indexOf('id="' + id + '"') !== -1) fail(slug + ': stripped section #' + id + ' still present');
        });
        // Exactly one BreadcrumbList, and it must be the element the JS render can
        // replace. The shell used to carry a second, id-less BreadcrumbList
        // (Home > About > Contact, index.html, added 2026-02-13 in df27e39).
        // Neither removal path in core.js could ever remove it, because both look
        // the block up by id="breadcrumb-schema", so every article shipped two and
        // Google displayed the generic one in place of the real trail.
        const ld = ldBlocks(page, slug);
        const bcHolders = ld.filter(function (b) { return breadcrumbNodes(b.data).length > 0; });
        const bcCount = ld.reduce(function (acc, b) { return acc + breadcrumbNodes(b.data).length; }, 0);
        if (bcCount !== 1) {
            fail(slug + ': expected exactly one BreadcrumbList object in the emitted page, found ' + bcCount);
        }
        const bcScripts = ld.filter(function (b) { return b.id === 'breadcrumb-schema'; });
        if (bcScripts.length !== 1) {
            fail(slug + ': expected exactly one script with id="breadcrumb-schema", found ' + bcScripts.length);
        }
        if (bcHolders[0].id !== 'breadcrumb-schema') {
            fail(slug + ': the BreadcrumbList is not inside id="breadcrumb-schema" (it is in ' +
                 (bcHolders[0].id === null ? 'a block with no id' : 'id="' + bcHolders[0].id + '"') +
                 '), so injectArticleSchema would duplicate it instead of replacing it');
        }
        // Every onclick in the emitted page must parse as a handler body. This is
        // the static half of the pair: the source rule above covers the text in
        // js/articles.js, this covers what is actually served.
        pageOnclickTotal += assertOnclickCoverage(page, slug + ' (emitted page)');
        onclickAttrs(page).forEach(function (o) {
            const attr = o.attr;
            const err = onclickParses(attr);
            if (err) {
                fail(slug + ': onclick attribute in the emitted page does not parse as JavaScript: ' +
                     err + '. Attribute: ' + attr);
            }
        });
        const h1s = countOccurrences(page, '<h1');
        if (h1s !== 1) fail(slug + ': expected exactly one <h1>, found ' + h1s);
        if (countOccurrences(page, '<main>') !== 1 || countOccurrences(page, '</main>') !== 1) fail(slug + ': expected exactly one <main> element');

        scriptContractChecked += assertScriptContract(page, slug + ' (emitted page)');
        internalLinksChecked += assertInternalLinks(page, slug + ' (emitted page)', linkRefs);
        idsByPath[ARTICLE_PATH + slug] = idsIn(page);
        emittedPages.push({ label: slug + ' (emitted page)', html: page });

        fs.writeFileSync(path.join(OUT_ROOT, slug + '.html'), page, 'utf8');
        emitted += 1;
    });

    // ---- standalone pages ----
    //
    // Same template, same head needles, same inherited chrome as an article, and
    // none of the article furniture: the three cuts below remove the home
    // section, the whole articles page (listing, article view, back links, tool
    // CTA, related grid and prev/next bar) and about through terms, leaving the
    // nav, the theme control, the footer and the three core scripts. The page's
    // own content then goes in where those sections were.
    const sitemapSrc = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    const standaloneNames = [];
    const standaloneFooterLinks = [];
    let standaloneEmitted = 0;

    STANDALONE_PAGES.forEach(function (sp) {
        const url = SITE + '/' + sp.slug;
        const escTitle = escapeHtml(sp.title);
        const escDesc = escapeHtml(sp.description);

        // ---- separation from everything article-shaped, asserted from source ----
        if (ARTICLE_ORDER.indexOf(sp.slug) !== -1) fail(sp.slug + ': a standalone page must not be in ARTICLE_ORDER');
        if (Object.prototype.hasOwnProperty.call(ARTICLE_META, sp.slug)) fail(sp.slug + ': a standalone page must not be in ARTICLE_META');
        if (Object.prototype.hasOwnProperty.call(HEADS, sp.slug)) fail(sp.slug + ': a standalone page must not be in article-heads.ts');
        if (byId[sp.slug]) fail(sp.slug + ': a standalone page must not be an article in js/articles.js');
        if (fs.existsSync(path.join(OUT_ROOT, sp.slug + '.html'))) {
            fail(sp.slug + ': articles/' + sp.slug + '.html exists; a standalone page is not an article');
        }
        if (validPages.indexOf(sp.slug) !== -1) {
            fail(sp.slug + ': "' + sp.slug + '" is in VALID_PAGES in js/core.js. A standalone page must stay out ' +
                 'of the router, or handleInitialURL hands it to showPage, which resets the head, and the ' +
                 '_redirects coupling check then demands a shell rewrite at /' + sp.slug + '.');
        }

        // ---- the page's own source must not touch the router ----
        if (/onclick=/.test(sp.bodyHtml)) fail(sp.slug + ': the page body carries an onclick attribute; standalone pages use plain hrefs only');
        if (/\bnavTo\(|\bnavToArticle\(|\bshowPage\(|\bshowArticle\(/.test(sp.bodyHtml)) {
            fail(sp.slug + ': the page body calls the SPA router. showArticle reads #article-view unguarded and ' +
                 'would throw on this document, and showPage would reset the head.');
        }

        // ---- JSON-LD: its own WebPage and a two-step trail ----
        const pageSchema = {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': sp.title,
            'headline': sp.h1,
            'description': sp.description,
            'url': url,
            'inLanguage': 'en',
            'isAccessibleForFree': true,
            'isPartOf': { '@type': 'WebSite', 'name': 'Cyrilica', 'url': SITE },
            'publisher': {
                '@type': 'Organization', 'name': 'Cyrilica', 'url': SITE,
                'logo': { '@type': 'ImageObject', 'url': SITE + '/favicon.svg' },
            },
            'datePublished': sp.published,
            'dateModified': sp.modified,
            'audience': { '@type': 'EducationalAudience', 'educationalRole': 'teacher' },
            'about': {
                '@type': 'Thing',
                'name': 'Russian alphabet',
                'description': 'The 33 letters of the Russian Cyrillic alphabet',
            },
        };
        const breadcrumbSchema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE },
                { '@type': 'ListItem', 'position': 2, 'name': sp.breadcrumbName, 'item': url },
            ],
        };
        // Ids deliberately unlike the article ones: removeArticleSchema() in
        // core.js deletes #article-schema and #breadcrumb-schema and resets the
        // head. It cannot run on this document, and these ids put a second lock
        // on that door.
        const schemaScripts =
            '    <script id="page-schema" type="application/ld+json">' + JSON.stringify(pageSchema) + '</script>\n' +
            '    <script id="page-breadcrumb-schema" type="application/ld+json">' + JSON.stringify(breadcrumbSchema) + '</script>\n';

        // ---- assemble ----
        let page = template;
        page = replaceOnce(page, T.title, '<title>' + escTitle + '</title>', sp.slug + '/title');
        page = replaceOnce(page, T.desc, '<meta name="description" content="' + escDesc + '">', sp.slug + '/description');
        page = replaceOnce(page, T.canonical, '<link rel="canonical" href="' + url + '">', sp.slug + '/canonical');
        page = replaceOnce(page, T.ogUrl, '<meta property="og:url" content="' + url + '">', sp.slug + '/og:url');
        page = replaceOnce(page, T.ogTitle, '<meta property="og:title" content="' + escTitle + '">', sp.slug + '/og:title');
        page = replaceOnce(page, T.ogDesc, '<meta property="og:description" content="' + escDesc + '">', sp.slug + '/og:description');
        page = replaceOnce(page, T.twUrl, '<meta property="twitter:url" content="' + url + '">', sp.slug + '/twitter:url');
        page = replaceOnce(page, T.twTitle, '<meta property="twitter:title" content="' + escTitle + '">', sp.slug + '/twitter:title');
        page = replaceOnce(page, T.twDesc, '<meta property="twitter:description" content="' + escDesc + '">', sp.slug + '/twitter:description');
        page = replaceOnce(page, T.headClose, schemaScripts + '</head>', sp.slug + '/schema');
        // data-standalone, never data-prerendered: that attribute means "an
        // article is already painted here" and is read by handleInitialURL.
        page = replaceOnce(page, T.body, '<body data-standalone="' + sp.slug + '">', sp.slug + '/body marker');
        // No nav entry, so Home simply loses its active state and nothing gains it.
        page = replaceOnce(page, T.navHome,
            '<li><a href="/" onclick="navTo(event, \'home\', null)">Home</a></li>',
            sp.slug + '/nav home');

        page = cutBetween(page, '                <!-- HOME PAGE -->', '                <!-- ARTICLES PAGE -->', sp.slug + '/strip home');
        page = cutBetween(page, '                <!-- ARTICLES PAGE -->', '                <!-- ABOUT PAGE -->', sp.slug + '/strip articles page');
        page = cutBetween(page, '                <!-- ABOUT PAGE -->', FOOTER_TAIL, sp.slug + '/strip about through terms');
        // The container id is never "<slug>-page": handleInitialURL looks up
        // getElementById(pageName + '-page') for /<slug> and would hand the
        // document to showPage if it found one.
        const containerOpen = '<div id="' + sp.slug + '-content" class="page-content active">';
        page = replaceOnce(page, FOOTER_TAIL,
            '\n                <main>\n' +
            '                ' + containerOpen + '\n' +
            sp.bodyHtml + '\n' +
            '                </div>\n' +
            '                </main>' + FOOTER_TAIL,
            sp.slug + '/main');

        // ---- head assertions on the emitted bytes ----
        const expectHead = [
            ['title', '<title>' + escTitle + '</title>'],
            ['description', '<meta name="description" content="' + escDesc + '">'],
            ['canonical', '<link rel="canonical" href="' + url + '">'],
            ['robots', '<meta name="robots" content="index, follow">'],
        ];
        expectHead.forEach(function (pair) {
            const n = countOccurrences(page, pair[1]);
            if (n !== 1) fail(sp.slug + ': expected exactly 1 ' + pair[0] + ' tag ' + JSON.stringify(pair[1]) + ', found ' + n);
        });
        if (countOccurrences(page, 'noindex') !== 0) fail(sp.slug + ': the emitted page carries noindex; it must be indexable');

        // ---- body assertions ----
        if (countOccurrences(page, '<h1>' + escapeHtml(sp.h1) + '</h1>') !== 1) {
            fail(sp.slug + ': expected exactly one <h1>' + sp.h1 + '</h1> in the emitted page');
        }
        if (countOccurrences(page, sp.keySentence) !== 1) {
            fail(sp.slug + ': the key sentence is not in the emitted raw HTML exactly once: ' + JSON.stringify(sp.keySentence));
        }
        // Parsed out of the emitted bytes, not compared against containerOpen:
        // asserting the generator's own string against itself could never catch
        // the active class being dropped.
        const containerRe = new RegExp('<div id="' + sp.slug + '-content" class="([^"]*)">', 'g');
        const containerMatches = page.match(containerRe) || [];
        if (containerMatches.length !== 1) {
            fail(sp.slug + ': expected exactly one <div id="' + sp.slug + '-content" class="...">, found ' + containerMatches.length);
        }
        const containerClasses = /class="([^"]*)"/.exec(containerMatches[0])[1].split(/\s+/);
        if (containerClasses.indexOf('page-content') === -1 || containerClasses.indexOf('active') === -1) {
            fail(sp.slug + ': #' + sp.slug + '-content carries class="' + containerClasses.join(' ') +
                 '". It must have both page-content and active: .page-content is display:none without active, ' +
                 'so the page would render blank with JavaScript off, which is the one thing it exists to avoid.');
        }
        if (countOccurrences(page, 'id="' + sp.slug + '-page"') !== 0) {
            fail(sp.slug + ': the emitted page contains id="' + sp.slug + '-page", which handleInitialURL would hand to showPage');
        }
        const h1s = countOccurrences(page, '<h1');
        if (h1s !== 1) fail(sp.slug + ': expected exactly one <h1>, found ' + h1s);
        if (countOccurrences(page, '<main>') !== 1 || countOccurrences(page, '</main>') !== 1) {
            fail(sp.slug + ': expected exactly one <main> element');
        }

        // ---- no article furniture, no other route's section ----
        ['article-content', 'article-title', 'related-articles-section', 'prev-article', 'next-article',
         'home-page', 'articles-page', 'articles-index', 'article-view', 'about-page', 'settings-page',
         'contact-page', 'privacy-page', 'terms-page', 'reference-container'].forEach(function (id) {
            if (page.indexOf('id="' + id + '"') !== -1) fail(sp.slug + ': the emitted page still contains id="' + id + '"');
        });
        ['data-prerendered', 'class="article-item"', 'related-article-card', 'navigateArticle('].forEach(function (needle) {
            if (page.indexOf(needle) !== -1) fail(sp.slug + ': the emitted page contains article-only markup: ' + needle);
        });

        // ---- JSON-LD assertions, by parsing rather than grepping ----
        const spBlocks = ldBlocks(page, sp.slug + ' (emitted page)');
        const byLdId = {};
        spBlocks.forEach(function (b) { if (b.id) byLdId[b.id] = b; });
        if (!byLdId['page-schema']) fail(sp.slug + ': no script with id="page-schema"');
        if (!byLdId['page-breadcrumb-schema']) fail(sp.slug + ': no script with id="page-breadcrumb-schema"');
        if (byLdId['page-schema'].data['@type'] !== 'WebPage') fail(sp.slug + ': page-schema is not a WebPage');
        if (byLdId['page-schema'].data.url !== url) fail(sp.slug + ': page-schema url is ' + byLdId['page-schema'].data.url + ', expected ' + url);
        if (byLdId['page-schema'].data.dateModified !== sp.modified) {
            fail(sp.slug + ': page-schema dateModified is ' + byLdId['page-schema'].data.dateModified + ', expected ' + sp.modified);
        }
        const spBreadcrumbs = spBlocks.reduce(function (acc, b) { return acc.concat(breadcrumbNodes(b.data)); }, []);
        if (spBreadcrumbs.length !== 1) fail(sp.slug + ': expected exactly one BreadcrumbList, found ' + spBreadcrumbs.length);
        const trail = spBreadcrumbs[0].itemListElement || [];
        if (trail.length !== 2) fail(sp.slug + ': expected a two-step breadcrumb trail, found ' + trail.length);
        if (trail[0].name !== 'Home' || trail[0].item !== SITE) fail(sp.slug + ': breadcrumb step 1 is not Home -> ' + SITE);
        if (trail[1].name !== sp.breadcrumbName || trail[1].item !== url) {
            fail(sp.slug + ': breadcrumb step 2 is not ' + sp.breadcrumbName + ' -> ' + url);
        }
        const bcInBreadcrumbScript = breadcrumbNodes(byLdId['page-breadcrumb-schema'].data).length;
        if (bcInBreadcrumbScript !== 1) fail(sp.slug + ': the BreadcrumbList is not inside id="page-breadcrumb-schema"');

        // ---- the sitemap must agree with the source dates ----
        const locNeedle = '<loc>' + url + '</loc>';
        if (countOccurrences(sitemapSrc, locNeedle) !== 1) {
            fail(sp.slug + ': sitemap.xml must contain exactly one ' + locNeedle);
        }
        const entryAt = sitemapSrc.indexOf(locNeedle);
        const entryEnd = sitemapSrc.indexOf('</url>', entryAt);
        const lastmodMatch = /<lastmod>([^<]*)<\/lastmod>/.exec(sitemapSrc.slice(entryAt, entryEnd));
        if (!lastmodMatch) fail(sp.slug + ': the sitemap entry for ' + url + ' has no lastmod');
        if (lastmodMatch[1] !== sp.modified) {
            fail(sp.slug + ': sitemap lastmod is ' + lastmodMatch[1] + ' but the page says modified ' + sp.modified +
                 '. The JSON-LD dateModified and the sitemap lastmod must be the same date.');
        }

        // ---- inherited chrome, same rules as an article ----
        if (countOccurrences(page, 'window.FOLLOW_SYSTEM_THEME = ') !== 1) fail(sp.slug + ': the pre-paint theme snippet is missing from the emitted page');
        if (countOccurrences(page, '<button class="theme-toggle" id="theme-toggle"') !== 1) fail(sp.slug + ': the header theme toggle is missing from the emitted page');
        pageOnclickTotal += assertOnclickCoverage(page, sp.slug + ' (standalone page)');
        onclickAttrs(page).forEach(function (o) {
            const err = onclickParses(o.attr);
            if (err) fail(sp.slug + ': onclick attribute in the emitted page does not parse as JavaScript: ' + err + '. Attribute: ' + o.attr);
        });
        const mainOpenAt = page.indexOf('<main>');
        const mainBlock = page.slice(mainOpenAt, page.indexOf('</main>'));
        if (countOccurrences(mainBlock, 'onclick=') !== 0) fail(sp.slug + ': the emitted page body carries an onclick attribute');
        scriptContractChecked += assertScriptContract(page, sp.slug + ' (standalone page)');
        internalLinksChecked += assertInternalLinks(page, sp.slug + ' (standalone page)', linkRefs);
        idsByPath['/' + sp.slug] = idsIn(page);
        emittedPages.push({ label: sp.slug + ' (standalone page)', html: page });

        fs.writeFileSync(path.join(ROOT, sp.slug + '.html'), page, 'utf8');
        standaloneNames.push(sp.slug + '.html');
        standaloneFooterLinks.push('<a href="/' + sp.slug + '">' + sp.breadcrumbName + '</a>');
        standaloneEmitted += 1;
    });

    // ---- the inbound links, in the shell and in every emitted document ----
    //
    // A standalone page has no nav entry, so the footer link and the one
    // contextual link on the About page are how a reader and a crawler reach it.
    // The link markup is derived from the page's own slug and breadcrumb name.
    const aboutStart = template.indexOf('<div id="about-page"');
    const aboutEnd = template.indexOf('<!-- SETTINGS PAGE -->');
    if (aboutStart === -1 || aboutEnd === -1 || aboutEnd < aboutStart) fail('index.html: could not locate the About page section');
    const aboutSection = template.slice(aboutStart, aboutEnd);
    STANDALONE_PAGES.forEach(function (sp, i) {
        const footerLink = standaloneFooterLinks[i];
        if (countOccurrences(template, footerLink) !== 1) {
            fail('index.html: expected exactly one footer link ' + footerLink);
        }
        if (countOccurrences(notFoundSrc, footerLink) !== 1) {
            fail('404.html: expected exactly one footer link ' + footerLink);
        }
        if (countOccurrences(aboutSection, 'href="/' + sp.slug + '"') !== 1) {
            fail('index.html: expected exactly one contextual link to /' + sp.slug + ' on the About page');
        }
        emittedPages.forEach(function (rec) {
            if (countOccurrences(rec.html, footerLink) !== 1) {
                fail(rec.label + ': expected exactly one footer link ' + footerLink);
            }
        });
    });

    // ---- serving: the standalone page must never be a shell route ----
    STANDALONE_PAGES.forEach(function (sp) {
        const shellRule = redirectRules.filter(function (r) {
            return r.source === '/' + sp.slug && r.target === '/index.html';
        });
        if (shellRule.length) {
            fail('_redirects: /' + sp.slug + ' is rewritten to the shell. The whole point of a standalone page is ' +
                 'that its raw HTML is its own; a 200 rewrite to index.html serves the SPA shell there instead.');
        }
        const htmlRule = redirectRules.filter(function (r) {
            return r.source === '/' + sp.slug + '.html' && r.target === '/' + sp.slug && r.status === '301' && r.forced;
        });
        if (htmlRule.length !== 1) {
            fail('_redirects: expected exactly one forced 301 from /' + sp.slug + '.html to /' + sp.slug + ', found ' + htmlRule.length +
                 '. Without it the .html path serves a byte-for-byte duplicate at 200.');
        }
        if (edgeSrc.indexOf('"/' + sp.slug + '"') === -1 || edgeSrc.indexOf('"/' + sp.slug + '.html"') === -1) {
            fail('netlify/edge-functions/head-rewrite.ts: /' + sp.slug + ' and /' + sp.slug + '.html must both be in ' +
                 'excludedPath. The function treats an unknown path as noindex, and it would rewrite this page\'s ' +
                 'robots meta on every request.');
        }
    });

    const fragmentsChecked = resolveCrossPageFragments(linkRefs.pendingFragments, idsByPath);

    // ---- routing: _redirects must agree with the router and with disk ----
    //
    // There is no /* catch-all any more, so a route missing from _redirects is
    // a real 404, not a silent fallback to the shell. That is the failure mode
    // that cost this site its indexing on GitHub Pages, so it fails the build
    // here instead of reaching production. VALID_PAGES in js/core.js is the one
    // source of truth; this asserts against it rather than keeping a second list.
    const expectedRoutes = validPages.map(function (p) { return p === 'home' ? '/' : '/' + p; }).sort();

    const shellRewrites = redirectsSrc.split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l && l.charAt(0) !== '#'; })
        .map(function (l) { return l.split(/\s+/); })
        .filter(function (f) { return f[1] === '/index.html' && f[2] === '200'; })
        .map(function (f) { return f[0]; })
        .sort();

    if (shellRewrites.join(' ') !== expectedRoutes.join(' ')) {
        fail('_redirects SPA rewrites do not match VALID_PAGES in js/core.js.\n' +
             '  _redirects: ' + shellRewrites.join(' ') + '\n' +
             '  VALID_PAGES: ' + expectedRoutes.join(' '));
    }
    // A catch-all is a rule whose SOURCE path is exactly /*. Checking for the
    // substring would also match /scripts/* and /netlify/*, which are fine.
    const ruleSources = redirectsSrc.split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l && l.charAt(0) !== '#'; })
        .map(function (l) { return l.split(/\s+/)[0]; });
    if (ruleSources.indexOf('/*') !== -1) {
        fail('_redirects still contains a /* catch-all; unknown paths must reach 404.html');
    }

    // Every article the router can reach must exist as a file, or its clean URL
    // 404s now that nothing catches it.
    ARTICLE_ORDER.forEach(function (slug) {
        if (!fs.existsSync(path.join(OUT_ROOT, slug + '.html'))) {
            fail('article "' + slug + '" is in ARTICLE_ORDER but no file was emitted for it');
        }
    });
    STANDALONE_PAGES.forEach(function (sp) {
        if (!fs.existsSync(path.join(ROOT, sp.slug + '.html'))) {
            fail('standalone page "' + sp.slug + '" produced no ' + sp.slug + '.html, so /' + sp.slug + ' would 404');
        }
    });

    // ---- the 404 page ----
    const notFound = notFoundSrc;
    if (countOccurrences(notFound, 'adsbygoogle') !== 0) {
        fail('404.html carries the AdSense script; Google does not allow ads on error screens');
    }
    if (countOccurrences(notFound, '<link rel="canonical"') !== 0) {
        fail('404.html declares a canonical; it stands for no URL of its own');
    }
    if (countOccurrences(notFound, '<meta name="robots" content="noindex, follow">') !== 1) {
        fail('404.html is missing its noindex robots meta');
    }
    // The theme snippet is inline in both files on purpose (a blocking external
    // script would cost every page a round trip). This is what stops the two
    // copies drifting.
    const snippet = /window\.FOLLOW_SYSTEM_THEME[\s\S]*?\}\)\(\);/;
    const inIndex = template.match(snippet);
    const in404 = notFound.match(snippet);
    if (!inIndex || !in404) fail('could not find the pre-paint theme snippet in index.html and 404.html');
    if (inIndex[0] !== in404[0]) {
        fail('the pre-paint theme snippet in 404.html does not match index.html byte for byte');
    }

    const totalEmitted = emitted + standaloneEmitted;
    console.log('Pre-rendered ' + emitted + ' article pages into articles/');
    console.log('Pre-rendered ' + standaloneEmitted + ' standalone page' + (standaloneEmitted === 1 ? '' : 's') +
                ' into the site root: ' + standaloneNames.join(', '));
    console.log('Onclick coverage: ' + pageOnclickTotal + ' attributes across the emitted pages, strict and permissive counts equal on every page.');
    console.log('Script contract passed: ' + scriptContractChecked + ' core script tags across index.html and ' +
                totalEmitted + ' emitted pages, all three present once each, in order, classic, no async or defer.');
    console.log('Internal links passed: ' + internalLinksChecked + ' anchors across index.html and ' +
                totalEmitted + ' emitted pages, every target resolves, every navTo slug matches its href, and ' +
                fragmentsChecked + ' cross-page fragment' + (fragmentsChecked === 1 ? ' resolves' : 's resolve') + ' to a real id.');
    console.log('Routing checks passed: ' + expectedRoutes.length + ' SPA routes match VALID_PAGES, ' +
                ARTICLE_ORDER.length + ' article files on disk, ' + standaloneEmitted + ' standalone file' +
                (standaloneEmitted === 1 ? '' : 's') + ' on disk, 404.html clean.');
}

main();
