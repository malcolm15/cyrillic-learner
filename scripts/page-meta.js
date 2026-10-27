// Reads PAGE_META out of js/core.js as text, without evaluating any of it.
//
// PAGE_META is the one source of truth for the head of the seven SPA routes
// (title, description, url). scripts/generate-article-heads.js turns it into
// netlify/lib/page-heads.ts for the edge function, and scripts/pre-render.js
// re-reads it to assert that artifact has not drifted. Both go through this
// parser, so there is exactly one reading of the literal.
//
// It is deliberately fail-closed. It accepts only the exact shape the literal
// has today: one entry per line, a bare key, then title, desc and url as
// single-quoted string literals with no backslash and no embedded single quote
// (home may use the DEFAULT_TITLE and DEFAULT_DESC constants instead), and
// exactly the seven keys listed below. Anything else throws, and both callers
// turn that into a failed build. A route added to PAGE_META is therefore a
// deliberate edit here too, which is the point: a route with no head entry
// would silently serve the homepage's head to crawlers.
//
// No dependencies.

'use strict';

const SITE = 'https://cyrilica.com';

const EXPECTED_KEYS = ['home', 'about', 'contact', 'privacy', 'settings', 'articles', 'terms'];

// A single-quoted JS string literal holding neither a backslash nor a quote,
// so its value is exactly the text between the quotes.
const LIT = "'([^'\\\\]*)'";
const ENTRY = new RegExp(
    '^ {4}([a-z]+):\\s*\\{ title: (?:(DEFAULT_TITLE)|' + LIT + '),\\s*desc: (?:(DEFAULT_DESC)|' + LIT + '),\\s*url: ' + LIT + ' \\},$'
);

const OPEN = '\nconst PAGE_META = {\n';
const CLOSE = '\n};';

// Returns { routes: [{ key, path, title, desc, url }] } for every entry except
// home, in source order. Throws an Error naming the first problem.
function parsePageMeta(coreSrc) {
    const start = coreSrc.indexOf(OPEN);
    if (start === -1) throw new Error('could not find "const PAGE_META = {" on its own line');
    if (coreSrc.indexOf(OPEN, start + 1) !== -1) throw new Error('found more than one PAGE_META literal');
    const bodyStart = start + OPEN.length;
    const end = coreSrc.indexOf(CLOSE, bodyStart);
    if (end === -1) throw new Error('could not find the closing "};" of PAGE_META');
    const lines = coreSrc.slice(bodyStart, end).split('\n');

    const seen = {};
    const routes = [];
    lines.forEach(function (line, i) {
        const m = ENTRY.exec(line);
        if (!m) {
            throw new Error('entry ' + (i + 1) + ' does not have the expected shape (key, then title, desc and url as ' +
                            "single-quoted literals with no backslash or embedded quote): " + JSON.stringify(line));
        }
        const key = m[1];
        if (seen[key]) throw new Error('duplicate key "' + key + '"');
        seen[key] = true;
        const isHome = key === 'home';
        const titleConst = m[2];
        const title = m[3];
        const descConst = m[4];
        const desc = m[5];
        const url = m[6];
        if (isHome) {
            if (titleConst !== 'DEFAULT_TITLE' || descConst !== 'DEFAULT_DESC') {
                throw new Error('home must use DEFAULT_TITLE and DEFAULT_DESC');
            }
        } else {
            if (titleConst || descConst) throw new Error('"' + key + '" must use string literals, not the DEFAULT_ constants');
            if (!title) throw new Error('"' + key + '" has an empty title');
            if (!desc) throw new Error('"' + key + '" has an empty desc');
        }
        const expectedUrl = isHome ? SITE + '/' : SITE + '/' + key;
        if (url !== expectedUrl) throw new Error('"' + key + '" url is ' + JSON.stringify(url) + ', expected ' + JSON.stringify(expectedUrl));
        if (!isHome) routes.push({ key: key, path: '/' + key, title: title, desc: desc, url: url });
    });

    const keys = Object.keys(seen).sort();
    const expected = EXPECTED_KEYS.slice().sort();
    if (keys.join(',') !== expected.join(',')) {
        throw new Error('expected exactly the keys ' + expected.join(', ') + ' (' + expected.length + '), found ' +
                        keys.join(', ') + ' (' + keys.length + '). A new SPA route is a deliberate change to scripts/page-meta.js as well.');
    }
    return { routes: routes };
}

module.exports = { parsePageMeta: parsePageMeta, EXPECTED_KEYS: EXPECTED_KEYS };
