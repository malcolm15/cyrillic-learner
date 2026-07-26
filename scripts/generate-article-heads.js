#!/usr/bin/env node
//
// Generates netlify/edge-functions/article-heads.ts: a per-slug map of the
// { title, description } that the edge function injects into raw HTML for
// non-rendering crawlers. Values are pre-HTML-escaped and ready to drop into
// <title>...</title> and content="...".
//
// It is emitted as a TypeScript data module (export default { ... }), not JSON,
// so the edge function imports it as a plain ES module. A JSON import
// (with { type: "json" }) that failed would take down the whole function,
// regressing the canonical and robots rewrites too; a standard ES import removes
// that import-time failure mode entirely.
//
// The title and description MUST match exactly what the JS meta injection in
// core.js (injectArticleSchema) produces on render, or a crawler would see one
// thing and the rendered page another. To guarantee that, this script is itself
// JavaScript and reuses the identical substring/lastIndexOf logic the browser
// uses. The only non-browser step is turning the first paragraph's HTML into its
// textContent value (tag strip plus entity decode); the parity guards below
// refuse to emit an entry whenever that step could diverge from the browser.
//
// REGENERATION COUPLING: this module is derived from js/articles.js. It must be
// regenerated (node scripts/generate-article-heads.js) whenever any article
// title or opening paragraph changes. This is the same coupling class as the
// STATIC_CANONICAL / STATIC_ROBOTS dependency on index.html lines 27-28 that is
// documented in head-rewrite.ts. A stale module silently serves old head content
// to crawlers.
//
// No dependencies. Run from the repo root.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARTICLES_SRC = path.join(ROOT, 'js', 'articles.js');
const OUT_FILE = path.join(ROOT, 'netlify', 'edge-functions', 'article-heads.ts');

const TITLE_SUFFIX = ' | Cyrilica';

// Block-level (or otherwise p-closing) tags that, if found inside the first
// paragraph, mean the browser would have auto-closed the <p> earlier than our
// regex does. Their presence flags a divergence between this extraction and the
// browser's querySelector('p').textContent, so we skip the entry.
const BLOCK_TAG = /<\/?(?:div|p|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|blockquote|h[1-6]|section|article|header|footer|figure|figcaption|hr|pre|form|nav|aside|main|dl|dt|dd)\b/i;

// Named entities we can faithfully decode to their textContent value. Anything
// outside this map (other than numeric references) trips the parity guard.
const NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    nbsp: ' ', mdash: '—', ndash: '–', hellip: '…',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
    copy: '©', reg: '®', trade: '™', deg: '°',
    middot: '·', bull: '•', times: '×', divide: '÷',
    eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç',
    ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä',
};

// Decode HTML entities to the string a browser's textContent would yield.
// Returns { text, unknown }: unknown is the first unrecognized entity, or null.
function decodeEntities(s) {
    let unknown = null;
    const text = s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, body) => {
        if (body[0] === '#') {
            const cp = (body[1] === 'x' || body[1] === 'X')
                ? parseInt(body.slice(2), 16)
                : parseInt(body.slice(1), 10);
            if (!Number.isFinite(cp)) { if (!unknown) unknown = m; return m; }
            return String.fromCodePoint(cp);
        }
        if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body)) {
            return NAMED_ENTITIES[body];
        }
        if (!unknown) unknown = m;
        return m;
    });
    return { text, unknown };
}

// Escape a resolved text value for safe embedding in HTML (attribute or RCDATA).
// A crawler decoding these recovers the exact literal the JS setAttribute /
// document.title path holds at runtime.
function escapeForHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Turn a single-quoted JS string literal's captured body into its real value
// (e.g. \' becomes ').
function unescapeJsString(s) {
    return s.replace(/\\(.)/g, '$1');
}

function main() {
    const src = fs.readFileSync(ARTICLES_SRC, 'utf8');

    // Match each article object's id, title, and content template literal.
    // Content literals contain no backticks (verified), so [\s\S]*? stops at
    // the first closing backtick.
    const objRe = /id:\s*'([^']+)',\s*\n\s*title:\s*'((?:[^'\\]|\\.)*)',[\s\S]*?content:\s*`([\s\S]*?)`/g;

    const heads = {};
    let total = 0;
    let emitted = 0;
    const skipped = [];

    let m;
    while ((m = objRe.exec(src)) !== null) {
        total += 1;
        const slug = m[1];
        const rawTitle = m[2];
        const content = m[3];

        // Extract the first <p ...>...</p>, mirroring querySelector('p').
        const pMatch = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
        if (!pMatch) {
            skipped.push(`${slug}: no <p> in content (browser would set empty description)`);
            continue;
        }
        const inner = pMatch[1];

        // Parity guard 1: block-level tag inside the first paragraph means the
        // browser auto-closes <p> earlier than this regex does.
        if (BLOCK_TAG.test(inner)) {
            skipped.push(`${slug}: first paragraph contains a block-level tag, extraction may diverge from the browser`);
            continue;
        }

        // textContent: strip inline tags (no added whitespace), then decode.
        const stripped = inner.replace(/<[^>]+>/g, '');
        const { text: decoded, unknown } = decodeEntities(stripped);

        // Parity guard 2: an entity we cannot faithfully decode.
        if (unknown) {
            skipped.push(`${slug}: unrecognized HTML entity ${unknown} in first paragraph`);
            continue;
        }

        // Identical to core.js injectArticleSchema. This file is JS, so
        // substring / lastIndexOf behave exactly as they do in the browser.
        const firstParaText = decoded.trim();
        let description = firstParaText.substring(0, 155);
        if (firstParaText.length > 155) {
            description = description.substring(0, description.lastIndexOf(' ')) + '...';
        }

        const title = unescapeJsString(rawTitle) + TITLE_SUFFIX;

        heads[slug] = {
            title: escapeForHtml(title),
            description: escapeForHtml(description),
        };
        emitted += 1;
    }

    // Emit as a TypeScript data module. JSON.stringify produces a valid TS object
    // literal for the initializer (quoted keys, quoted string values).
    const banner =
        '// GENERATED FILE. Do not edit by hand.\n' +
        '// Regenerate with: node scripts/generate-article-heads.js\n' +
        '// Source of truth: js/articles.js. See head-rewrite.ts COUPLING 2.\n\n';
    const moduleBody =
        'const ARTICLE_HEADS: Record<string, { title: string; description: string }> = ' +
        JSON.stringify(heads, null, 2) +
        ';\n\nexport default ARTICLE_HEADS;\n';

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, banner + moduleBody, 'utf8');

    console.log(`Parsed ${total} articles, emitted ${emitted}, skipped ${skipped.length}.`);
    if (skipped.length) {
        console.warn('\nSKIPPED (these keep the shell head, fail-open):');
        for (const s of skipped) console.warn('  ! ' + s);
    }
    console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
}

main();
