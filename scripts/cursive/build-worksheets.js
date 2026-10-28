#!/usr/bin/env node
//
// Builds printable cursive worksheets (PDF) from a worksheet spec, using
// scripts/cursive/shapes.json for the letterforms and the stroke plans
// (build-strokes.js) for where each stroke starts. One HTML source and one
// PDF per paper size, printed by headless Chrome (chrome.js).
//
// The spec (JSON) holds a version, the footer, one instruction line per page
// type and a list of sets; each set is one document (its own HTML and PDF per
// paper, named <set name>-<paper>-v<version>) with a title and pages, and each
// page has a title and rows, all of one type:
//   { "type": "trace", "letter": "и" [, "traces": 3] [, "dotsOnly": 2] }
//       any of the 63 forms in shapes.json, capitals included. For a form with
//       a stroke plan: the model with its stroke starts numbered, then faint
//       copies to trace, then copies showing only the start dots, then blank
//       guide lines. For a form with no plan: the model, faint copies and
//       blank guide lines only, with no start dots, numbers or arrows, so
//       nothing implies an unverified stroke order (a dots-only request for
//       such a form is refused);
//   { "type": "word", "text": "мама" }
//       the word in PRINTED Cyrillic, then blank guide lines for the learner to
//       write it joined.
// shapes.json holds isolated letterforms, not verified joined writing, so
// this generator never sets cursive letters side by side as a word: a word is
// only ever printed type, and a spec that asks for a cursive word model fails.
// Copies of one letter in a trace row are spaced apart and checked not to
// overlap.
//
// "No plan" means the form has no entry in stroke-plans.json at all. A form
// that has an entry is validated with build-strokes.js's own checks
// (planLetter), and any failure stops the run with the letter and the
// reason; it never falls back to the static row.
//
// The layout is computed from the paper size (US Letter, A4): row width from
// the printable width, and each row's height from its case (lowercase rows
// from the ascender line at 2 x-heights, capital rows from the capital
// height and the tallest capital in shapes.json). A page whose rows do not
// fit fails rather than clipping, and the printed PDF must have exactly the
// spec's page count. Labels use system fonts only.
//
// HAND-RUN, HARNESS OUTPUT ONLY. Never part of the Netlify build. Writes only
// inside ~/.cyrilica/harness/cursive/ (worksheets/ there, or --out) unless
// given --allow-output-outside-harness, and never overwrites. Its output goes
// live only by being copied into the site in a reviewed batch.
//
// Usage, from any directory:
//   node scripts/cursive/build-worksheets.js --spec FILE [--out DIR] [--paper letter,a4] [--html-only]
//   --plans FILE reads another stroke-plans file (for tests); the default is scripts/cursive/stroke-plans.json.
//
// Dependencies: node and Google Chrome. No packages.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { CHROME, sleep, withChrome } = require('./chrome.js');
const { HARNESS, OVERRIDE, checkDestination } = require('./output.js');
const strokes = require('./build-strokes.js');

const DEFAULT_OUT = path.join(HARNESS, 'worksheets');
const PAPER = {
    letter: { name: 'US Letter', wMm: 215.9, hMm: 279.4 },
    a4: { name: 'A4', wMm: 210, hMm: 297 },
};
const MARGIN_MM = 15;
const HEADER_MM = 18;       // the page title and instruction line
const FOOTER_MM = 8;        // the footer band
const ROW_GAP_MM = 6;       // space between rows
const LETTERS = /^[А-ЯЁа-яё]+(?:[ -][А-ЯЁа-яё]+)*$/;
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FONT = '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';

function refuse(msg) {
    console.error('BUILD-WORKSHEETS REFUSED: ' + msg);
    process.exit(2);
}
function fmt(v) {
    let s = (Math.round(v * 1e3) / 1e3).toFixed(3);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ---------- the spec ----------

function checkSpec(spec, inputs) {
    const w = 'spec: ';
    const allowed = function (o, keys, where) {
        Object.keys(o).forEach(function (k) { if (keys.indexOf(k) === -1) refuse(where + 'unknown field "' + k + '" (allowed: ' + keys.join(', ') + ')'); });
    };
    allowed(spec, ['about', 'version', 'xHeightMm', 'footer', 'instructions', 'sets'], w);
    if (!Number.isInteger(spec.version) || spec.version < 1) refuse(w + 'version must be a positive integer');
    if (spec.xHeightMm !== undefined && !(typeof spec.xHeightMm === 'number' && spec.xHeightMm >= 4 && spec.xHeightMm <= 20)) refuse(w + 'xHeightMm must be a number from 4 to 20');
    if (typeof spec.footer !== 'string' || !spec.footer.trim()) refuse(w + 'footer is required');
    if (!spec.instructions || typeof spec.instructions !== 'object') refuse(w + 'instructions { "trace", "word" } is required');
    allowed(spec.instructions, ['trace', 'word'], w + 'instructions: ');
    ['trace', 'word'].forEach(function (k) { if (typeof spec.instructions[k] !== 'string' || !spec.instructions[k].trim()) refuse(w + 'instructions.' + k + ' is required'); });
    if (!Array.isArray(spec.sets) || !spec.sets.length) refuse(w + 'sets must be a non-empty list');
    const names = new Set();
    spec.sets.forEach(function (set, si) {
        const sw = w + 'set ' + (si + 1) + ': ';
        allowed(set, ['name', 'title', 'pages'], sw);
        if (!NAME.test(set.name || '')) refuse(sw + 'name must be lowercase words joined by hyphens');
        if (names.has(set.name)) refuse(sw + 'two sets are named ' + set.name);
        names.add(set.name);
        if (typeof set.title !== 'string' || !set.title.trim()) refuse(sw + 'title is required');
        if (!Array.isArray(set.pages) || !set.pages.length) refuse(sw + 'pages must be a non-empty list');
        checkPages(set, sw, inputs, allowed);
    });
}

function pageType(p, where) {
    const types = new Set(p.rows.map(function (r) { return r.type; }));
    if (types.size !== 1) refuse(where + 'every row of a page must be of one type (trace or word), because the page has one instruction line');
    return p.rows[0].type;
}

function checkPages(set, w, inputs, allowed) {
    set.pages.forEach(function (p, pi) {
        const pw = w + 'page ' + (pi + 1) + ': ';
        allowed(p, ['title', 'rows'], pw);
        if (typeof p.title !== 'string' || !p.title.trim()) refuse(pw + 'title is required');
        if (!Array.isArray(p.rows) || !p.rows.length) refuse(pw + 'rows must be a non-empty list');
        p.rows.forEach(function (r, ri) {
            const rw = pw + 'row ' + (ri + 1) + ': ';
            if (r.type === 'word') {
                // A word is printed type only. shapes.json holds isolated letterforms,
                // not verified joined writing, so a cursive word model is refused.
                if ('model' in r || 'cursive' in r || 'style' in r || 'joined' in r) {
                    refuse(rw + 'a word row is always printed Cyrillic. shapes.json holds isolated letterforms, not verified joined writing, so no cursive word model can be generated');
                }
                allowed(r, ['type', 'text'], rw);
                if (typeof r.text !== 'string' || !LETTERS.test(r.text)) refuse(rw + 'text must be Cyrillic letters (words separated by single spaces or hyphens)');
            } else if (r.type === 'trace') {
                allowed(r, ['type', 'letter', 'traces', 'dotsOnly'], rw);
                if (typeof r.letter !== 'string' || [...r.letter].length !== 1) refuse(rw + 'letter must be one letter; a trace row never strings letters into a word');
                if (!inputs.shapes.forms.some(function (f) { return f.char === r.letter; })) refuse(rw + 'shapes.json has no form ' + JSON.stringify(r.letter) + ' (it holds the 63 forms of the reference)');
                ['traces', 'dotsOnly'].forEach(function (k) { if (r[k] !== undefined && !(Number.isInteger(r[k]) && r[k] >= 0 && r[k] <= 8)) refuse(rw + k + ' must be a whole number from 0 to 8'); });
                if (hasPlan(inputs, r.letter)) {
                    // an entry exists: it must pass build-strokes.js's checks, or the run stops
                    try { strokes.planLetter(r.letter, inputs); } catch (e) {
                        if (e instanceof strokes.PlanError) refuse(rw + r.letter + ' has a stroke plan that fails validation, so the run stops (no static fallback): ' + e.message);
                        throw e;
                    }
                } else if (r.dotsOnly !== undefined && r.dotsOnly > 0) {
                    refuse(rw + r.letter + ' has no stroke plan, so a start-dots row would imply an unverified stroke order; drop dotsOnly or set it to 0');
                }
            } else {
                refuse(rw + 'type must be "trace" or "word" (got ' + JSON.stringify(r.type) + '); there is no cursive word row');
            }
        });
        pageType(p, pw);
    });
}

// ---------- geometry ----------

function formOf(inputs, ch) { return inputs.shapes.forms.find(function (f) { return f.char === ch; }); }
// "No plan" is no entry at all; an entry, valid or not, counts as a plan.
function hasPlan(inputs, ch) { return Object.prototype.hasOwnProperty.call(inputs.plans.letters || {}, ch); }
// Heights in x-heights, measured from shapes.json: the capital height is the
// median capital's top, and capital rows also make room for the tallest one.
function caseMetrics(inputs) {
    const asc = function (f) { return (f.baseline - f.bbox[1]) / f.xHeight; };
    const desc = function (f) { return (f.bbox[3] - f.baseline) / f.xHeight; };
    const caps = inputs.shapes.forms.filter(function (f) { return f.case === 'capital'; }).map(asc).sort(function (a, b) { return a - b; });
    const lower = inputs.shapes.forms.filter(function (f) { return f.case === 'lowercase'; });
    return {
        capHeight: caps[Math.floor(caps.length / 2)],
        capTop: caps[caps.length - 1],
        lowerTop: Math.max.apply(null, lower.map(asc)),
        bottom: Math.max.apply(null, inputs.shapes.forms.map(desc)),
    };
}
// Stroke starts in S1 units, from the validated plan.
function startsOf(inputs, ch) {
    return strokes.planLetter(ch, inputs).strokes.map(function (st) { return st.segs[0].p[0]; });
}
// One copy of a form: its path moved so its box's left edge sits at x and its
// baseline at y, scaled k millimetres per S1 unit (S1's own slant kept).
function placedPath(form, k, x, y) {
    const t = form.d.split(' ');
    const out = [];
    for (let i = 0; i < t.length;) {
        const c = t[i];
        const n = c === 'C' ? 3 : (c === 'M' || c === 'L') ? 1 : 0;
        out.push(c);
        for (let j = 0; j < n; j++) {
            out.push(fmt(x + (Number(t[i + 1 + 2 * j]) - form.bbox[0]) * k), fmt(y + (Number(t[i + 2 + 2 * j]) - form.baseline) * k));
        }
        i += 1 + 2 * n;
    }
    return out.join(' ');
}

// ---------- one page of one paper size ----------

function layout(spec, paperKey) {
    const paper = PAPER[paperKey];
    const xh = spec.xHeightMm || 10;
    const contentW = paper.wMm - 2 * MARGIN_MM;
    const rowsH = paper.hMm - 2 * MARGIN_MM - HEADER_MM - FOOTER_MM;
    return { paper: paper, xh: xh, contentW: contentW, rowsH: rowsH };
}
// A row's band, in mm: where its top guide sits above the baseline, how much
// room it keeps above and below, and its height. Lowercase and word rows: the
// ascender line at 2 x-heights; capital rows: the capital height, with room
// for the tallest capital. Every row keeps 1 x-height below the baseline.
function bandFor(row, L, inputs) {
    const m = caseMetrics(inputs);
    const form = row.type === 'trace' ? formOf(inputs, row.letter) : null;
    const capital = !!form && form.case === 'capital';
    const guide = capital ? m.capHeight : 2;
    const top = Math.max(guide, capital ? m.capTop : m.lowerTop);
    const bottom = Math.max(1, m.bottom);
    return { guide: guide * L.xh, top: top * L.xh, bottom: bottom * L.xh, h: (top + bottom) * L.xh + 2, capital: capital };
}

function guideLines(L, band, y) {
    const w = fmt(L.contentW);
    const line = function (yy, stroke, dash, width) {
        return '<line x1="0" y1="' + fmt(yy) + '" x2="' + w + '" y2="' + fmt(yy) + '" stroke="' + stroke + '" stroke-width="' + width + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
    };
    return line(y - band.guide, '#c9ccd6', null, 0.2) + line(y - L.xh, '#9aa0b4', '1.2 1', 0.25) +
        line(y, '#5a5f73', null, 0.35) + line(y + L.xh, '#c9ccd6', null, 0.2);
}

function traceRow(row, L, band, inputs) {
    const form = formOf(inputs, row.letter);
    const k = L.xh / form.xHeight;
    const planned = hasPlan(inputs, row.letter);
    const starts = planned ? startsOf(inputs, row.letter) : [];
    const y = band.top + 1;
    const wMm = (form.bbox[2] - form.bbox[0]) * k;
    const gap = Math.max(0.8 * L.xh, 6);
    const labelW = 8;
    const sw = fmt(1.0 * k * 0.9);
    const copies = [{ kind: 'model' }];
    for (let i = 0; i < (row.traces === undefined ? 3 : row.traces); i++) copies.push({ kind: 'trace' });
    const dots = planned ? (row.dotsOnly === undefined ? 2 : row.dotsOnly) : 0;
    for (let i = 0; i < dots; i++) copies.push({ kind: 'dots' });
    let x = labelW;
    let svg = guideLines(L, band, y);
    svg += '<text x="0" y="' + fmt(y - band.guide + L.xh * 0.55) + '" font-family=\'' + FONT + '\' font-size="' + fmt(L.xh * 0.55) + '" fill="#5a5f73" lang="ru">' + esc(row.letter) + '</text>';
    let last = -Infinity;
    copies.forEach(function (c) {
        if (x < last) throw new Error(row.letter + ': copies overlap');
        if (x + wMm > L.contentW) throw new Error('trace row ' + row.letter + ' needs ' + fmt(x + wMm) + ' mm but the row is ' + fmt(L.contentW) + ' mm wide');
        if (c.kind !== 'dots') {
            svg += '<path d="' + placedPath(form, k, x, y) + '" fill="none" stroke="' + (c.kind === 'model' ? '#1a1a2e' : '#c4c7d1') + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/>';
        }
        starts.forEach(function (p, si) {
            const cx = x + (p[0] - form.bbox[0]) * k, cy = y + (p[1] - form.baseline) * k;
            svg += '<circle cx="' + fmt(cx) + '" cy="' + fmt(cy) + '" r="' + fmt(c.kind === 'model' ? 0.9 : 0.75) + '" fill="' + (c.kind === 'trace' ? '#8a8fa3' : '#1a1a2e') + '"/>';
            if (c.kind !== 'trace') svg += '<text x="' + fmt(cx - 2.6) + '" y="' + fmt(cy + 0.9) + '" font-family=\'' + FONT + '\' font-size="2.4" fill="#1a1a2e">' + (si + 1) + '</text>';
        });
        last = x + wMm;
        x = last + gap;
    });
    return { svg: svg, used: last };
}

function wordRow(row, L, band) {
    const y = band.top + 1;
    let svg = guideLines(L, band, y);
    // Printed type, sized so its lowercase sits on the x-height (system sans x-height is about 0.52 em).
    svg += '<text x="0" y="' + fmt(y) + '" font-family=\'' + FONT + '\' font-size="' + fmt(L.xh / 0.52) + '" fill="#1a1a2e" lang="ru">' + esc(row.text) + '</text>';
    return { svg: svg };
}

function buildHtml(spec, set, paperKey, inputs) {
    const L = layout(spec, paperKey);
    const pages = set.pages.map(function (p, pi) {
        const bands = p.rows.map(function (r) { return bandFor(r, L, inputs); });
        const need = bands.reduce(function (a, b) { return a + b.h; }, 0) + ROW_GAP_MM * (bands.length - 1);
        if (need > L.rowsH) {
            refuse(set.name + ' page ' + (pi + 1) + ' needs ' + fmt(need) + ' mm for its ' + p.rows.length + ' rows but ' + L.paper.name + ' has ' + fmt(L.rowsH) + ' mm at x-height ' + L.xh + ' mm; nothing is clipped, so split the page or shrink the rows');
        }
        const rows = p.rows.map(function (r, ri) {
            let out;
            const band = bands[ri];
            try { out = r.type === 'trace' ? traceRow(r, L, band, inputs) : wordRow(r, L, band); } catch (e) { refuse(e.message); }
            return '<svg class="row" width="' + fmt(L.contentW) + 'mm" height="' + fmt(band.h) + 'mm" viewBox="0 0 ' + fmt(L.contentW) + ' ' + fmt(band.h) + '" role="img" aria-label="' +
                esc(r.type === 'trace' ? 'Tracing row for the cursive ' + (band.capital ? 'capital ' : '') + 'letter ' + r.letter : 'Writing row for the word ' + r.text) + '">' + out.svg + '</svg>';
        });
        return '<section class="page">\n<header>\n<h1>' + esc(p.title) + '</h1>\n<p class="instruction">' + esc(spec.instructions[pageType(p, '')]) + '</p>\n</header>\n<div class="rows">\n' + rows.join('\n') + '\n</div>\n' +
            '<footer>' + esc(spec.footer) + '</footer>\n</section>';
    });
    const css = '@page { size: ' + L.paper.wMm + 'mm ' + L.paper.hMm + 'mm; margin: 0; }\n' +
        'html, body { margin: 0; padding: 0; background: #fff; color: #1a1a2e; font-family: ' + FONT + '; }\n' +
        '.page { box-sizing: border-box; width: ' + L.paper.wMm + 'mm; height: ' + L.paper.hMm + 'mm; padding: ' + MARGIN_MM + 'mm; overflow: hidden; break-after: page; position: relative; }\n' +
        '.page:last-child { break-after: auto; }\n' +
        'header { height: ' + HEADER_MM + 'mm; }\n' +
        'h1 { margin: 0; font-size: 6mm; line-height: 1.2; font-weight: 700; }\n' +
        '.instruction { margin: 1.5mm 0 0; font-size: 3.4mm; line-height: 1.3; color: #3a3f52; }\n' +
        '.rows { height: ' + fmt(L.rowsH) + 'mm; display: flex; flex-direction: column; gap: ' + ROW_GAP_MM + 'mm; }\n' +
        '.row { display: block; flex: none; }\n' +
        'footer { position: absolute; left: ' + MARGIN_MM + 'mm; right: ' + MARGIN_MM + 'mm; bottom: ' + MARGIN_MM + 'mm; height: ' + FOOTER_MM + 'mm; font-size: 2.6mm; color: #5a5f73; display: flex; align-items: flex-end; }\n';
    const html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>' + esc(set.title) + '</title>\n' +
        '<!-- Generated by scripts/cursive/build-worksheets.js from a worksheet spec, shapes.json and stroke-plans.json (' + L.paper.name + '). Do not edit by hand. -->\n' +
        '<style>\n' + css + '</style>\n</head>\n<body>\n' + pages.join('\n') + '\n</body>\n</html>\n';
    return { html: html, layout: L };
}

// ---------- printing ----------

async function printPdf(htmlFile, pdfFile, L, pageCount, outDir) {
    return withChrome(outDir, async function (send) {
        await send('Network.enable');
        await send('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] });
        await send('Page.enable');
        await send('Page.navigate', { url: pathToFileURL(htmlFile).href });
        let ready = false;
        for (let i = 0; i < 50 && !ready; i++) {
            await sleep(200);
            ready = (await send('Runtime.evaluate', { expression: "document.readyState === 'complete' && document.querySelectorAll('section.page').length", returnByValue: true })).result.value === pageCount;
        }
        if (!ready) throw new Error('the worksheet page did not load ' + pageCount + ' pages');
        await send('Emulation.setEmulatedMedia', { media: 'print' });
        // No clipping: every row and the footer sit inside its page's margins.
        const fit = (await send('Runtime.evaluate', { returnByValue: true, expression: '(' + function (marginMm) {
            const mm = 96 / 25.4, bad = [];
            document.querySelectorAll('section.page').forEach(function (p, i) {
                const b = p.getBoundingClientRect(), m = marginMm * mm - 0.5;
                p.querySelectorAll('header, h1, .instruction, .row, footer').forEach(function (e) {
                    const r = e.getBoundingClientRect();
                    if (r.left < b.left + m || r.right > b.right - m || r.top < b.top + m || r.bottom > b.bottom - m) bad.push('page ' + (i + 1) + ' ' + e.tagName.toLowerCase() + ' outside the margins');
                });
            });
            return bad;
        } + ')(' + MARGIN_MM + ')' })).result.value;
        if (fit.length) throw new Error('clipping: ' + fit.join('; '));
        const r = await send('Page.printToPDF', {
            paperWidth: L.paper.wMm / 25.4, paperHeight: L.paper.hMm / 25.4,
            marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
            printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false,
            generateTaggedPDF: true, generateDocumentOutline: false,
        });
        const pdf = Buffer.from(r.data, 'base64');
        // Page objects in an uncompressed PDF dictionary: "/Type /Page" not followed by "s".
        const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;
        if (pages !== pageCount) throw new Error(path.basename(pdfFile) + ' would have ' + pages + ' pages, the spec has ' + pageCount + '; nothing written');
        fs.writeFileSync(pdfFile, pdf, { flag: 'wx' });
        return { pages: pages };
    });
}

// ---------- main ----------

async function main(argv) {
    let out = DEFAULT_OUT, specFile = null, plansFile = null, papers = ['letter', 'a4'], htmlOnly = false, anywhere = false;
    for (let i = 0; i < argv.length; i++) {
        const v = argv[i + 1];
        if (argv[i] === '--out' && v && !v.startsWith('--')) out = argv[++i];
        else if (argv[i] === '--spec' && v && !v.startsWith('--')) specFile = path.resolve(argv[++i]);
        else if (argv[i] === '--paper' && v && !v.startsWith('--')) papers = argv[++i].split(',');
        else if (argv[i] === '--plans' && v && !v.startsWith('--')) plansFile = path.resolve(argv[++i]);
        else if (argv[i] === '--html-only') htmlOnly = true;
        else if (argv[i] === OVERRIDE) anywhere = true;
        else refuse('unknown or incomplete argument ' + argv[i] + ' (use --spec FILE, --out DIR, --paper letter,a4, --plans FILE, --html-only, ' + OVERRIDE + ')');
    }
    if (!specFile) refuse('--spec FILE is required');
    papers.forEach(function (p) { if (!PAPER[p]) refuse('unknown paper ' + p + ' (letter or a4)'); });
    if (new Set(papers).size !== papers.length) refuse('a paper size is listed twice');
    const dir = checkDestination(out, anywhere, 'build-worksheets.js', refuse);
    const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
    let inputs;
    try { inputs = strokes.loadInputs(plansFile ? { plans: plansFile } : {}); } catch (e) { refuse('cannot read the cursive data: ' + e.message); }
    checkSpec(spec, inputs);
    const files = [];
    spec.sets.forEach(function (set) {
        papers.forEach(function (p) {
            const base = path.join(dir, set.name + '-' + p + '-v' + spec.version);
            files.push({ set: set, paper: p, html: base + '.html', pdf: base + '.pdf' });
        });
    });
    const clash = [];
    files.forEach(function (f) { [f.html].concat(htmlOnly ? [] : [f.pdf]).forEach(function (x) { if (fs.existsSync(x)) clash.push(x); }); });
    if (clash.length) refuse('these files already exist and nothing here overwrites: ' + clash.join(', ') + '. Give a fresh folder or raise the spec version.');
    if (!htmlOnly && !fs.existsSync(CHROME)) refuse('Google Chrome not found at ' + CHROME);
    const built = files.map(function (f) {
        let b;
        try { b = buildHtml(spec, f.set, f.paper, inputs); } catch (e) { if (e instanceof strokes.PlanError) refuse(e.message); throw e; }
        return Object.assign({}, f, { text: b.html, layout: b.layout });
    });
    fs.mkdirSync(dir, { recursive: true });
    const sha = function (f) { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); };
    for (const b of built) {
        fs.writeFileSync(b.html, b.text, { flag: 'wx' });
        console.log(b.set.name + ', ' + b.layout.paper.name + ': x-height ' + b.layout.xh + ' mm, row width ' + fmt(b.layout.contentW) + ' mm, ' + fmt(b.layout.rowsH) + ' mm of rows a page');
        console.log('wrote ' + b.html + '  sha256 ' + sha(b.html));
    }
    if (htmlOnly) return;
    for (const b of built) {
        const r = await printPdf(b.html, b.pdf, b.layout, b.set.pages.length, dir);
        console.log('wrote ' + b.pdf + '  ' + r.pages + ' page(s), ' + fs.statSync(b.pdf).size + ' bytes, no clipping  sha256 ' + sha(b.pdf));
    }
}

main(process.argv.slice(2)).catch(function (e) {
    console.error('BUILD-WORKSHEETS FAILED: ' + e.message);
    process.exit(1);
});
