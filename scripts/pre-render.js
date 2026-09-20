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
// Article plus BreadcrumbList JSON-LD. Netlify serves these real files ahead
// of the non-forced /* /index.html 200 catch-all, so non-rendering crawlers
// see full article content in raw HTML.
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
    const articlesSrc = fs.readFileSync(path.join(ROOT, 'js', 'articles.js'), 'utf8');
    const coreSrc = fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8');
    const headsSrc = fs.readFileSync(path.join(ROOT, 'netlify', 'lib', 'article-heads.ts'), 'utf8');

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
        prevBtn: '<button class="btn nav-btn" id="prev-article" onclick="navigateArticle(\'prev\')">',
        nextBtn: '<button class="btn nav-btn" id="next-article" onclick="navigateArticle(\'next\')">',
        prevTitle: '<span class="nav-title" id="prev-article-title"></span>',
        nextTitle: '<span class="nav-title" id="next-article-title"></span>',
    };
    // Validate every needle against the template once, up front, so a shell
    // change fails the build with a clear message before any file is written.
    Object.keys(T).forEach(function (key) {
        const n = countOccurrences(template, T[key]);
        if (n !== 1) fail('template needle "' + key + '": expected exactly 1 occurrence in index.html, found ' + n);
    });

    // ---- emit each article ----
    fs.mkdirSync(OUT_ROOT, { recursive: true });
    let emitted = 0;
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
        page = replaceOnce(page, T.prevBtn, '<button class="btn nav-btn" id="prev-article" onclick="navigateArticle(\'prev\')" data-article-id="' + ARTICLE_ORDER[prevIndex] + '">', slug + '/prev button');
        page = replaceOnce(page, T.nextBtn, '<button class="btn nav-btn" id="next-article" onclick="navigateArticle(\'next\')" data-article-id="' + ARTICLE_ORDER[nextIndex] + '">', slug + '/next button');
        page = replaceOnce(page, T.prevTitle, '<span class="nav-title" id="prev-article-title">' + escapeHtml(prevArticle.title) + '</span>', slug + '/prev title');
        page = replaceOnce(page, T.nextTitle, '<span class="nav-title" id="next-article-title">' + escapeHtml(nextArticle.title) + '</span>', slug + '/next title');

        // ---- self-contained document: drop every other route's section ----
        const FOOTER_TAIL = '\n            </div>\n        </div>\n\n    <!-- Footer -->';
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
        const h1s = countOccurrences(page, '<h1');
        if (h1s !== 1) fail(slug + ': expected exactly one <h1>, found ' + h1s);
        if (countOccurrences(page, '<main>') !== 1 || countOccurrences(page, '</main>') !== 1) fail(slug + ': expected exactly one <main> element');

        fs.writeFileSync(path.join(OUT_ROOT, slug + '.html'), page, 'utf8');
        emitted += 1;
    });

    console.log('Pre-rendered ' + emitted + ' article pages into articles/');
}

main();
