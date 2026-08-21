#!/usr/bin/env node
//
// Deploy-time pre-rendering of article pages (Option B).
//
// Reads index.html as the template and, for each article in js/articles.js,
// emits articles/SLUG/index.html with the per-article head, the article body
// already in the DOM, prev/next navigation, the related-articles grid, and
// Article plus BreadcrumbList JSON-LD. Netlify serves these real files ahead
// of the non-forced /* /index.html 200 catch-all, so non-rendering crawlers
// see full article content in raw HTML.
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
        page = replaceOnce(page, T.articleTitle, '<h2 id="article-title">' + escapeHtml(article.title) + '</h2>', slug + '/article title');
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

        const outDir = path.join(OUT_ROOT, slug);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), page, 'utf8');
        emitted += 1;
    });

    console.log('Pre-rendered ' + emitted + ' article pages into articles/');
}

main();
