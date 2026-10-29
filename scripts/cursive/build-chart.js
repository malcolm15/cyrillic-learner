#!/usr/bin/env node
//
// Builds the Russian cursive alphabet chart from scripts/cursive/shapes.json
// (layer 1, S1's shapes) and scripts/cursive/layout.json:
//   a. the chart's HTML block: 63 cells in alphabet order, each letter's
//      capital and lowercase paired, each cell holding the printed letter as
//      real text in a guarded element (translate="no", class notranslate,
//      lang="ru") and the cursive form as an inline SVG path, aria-hidden;
//   b. a standalone page holding that same block, and the full-chart PNG
//      rendered from that page by headless Chrome;
//   c. when layout.json has a "narrow" entry, a second page and PNG of the
//      same block at that entry's narrower page width (the variant for small
//      screens; the block wraps into more rows).
// All names carry the layout's version (…-v1.png and so on).
//
// HAND-RUN, HARNESS OUTPUT ONLY. Never part of the Netlify build. By default
// it writes only inside ~/.cyrilica/harness/cursive/ (into chart/ there, or
// the folder given with --out), and it refuses any other destination, the
// repository included (images/, js/, downloads/, the root), unless given
// --allow-output-outside-harness (output.js). Its output goes live only by
// being copied into the site in a reviewed batch.
//
// It never deletes or overwrites: if any file it would write already exists
// it refuses before writing anything. The one deletion is its own throwaway
// Chrome profile, a mkdtemp folder it creates inside the output folder.
// Chrome is started and stopped by chrome.js (127.0.0.1 only, no network).
// The page is local and its own http and https requests are blocked.
//
// Usage, from any directory:
//   node scripts/cursive/build-chart.js [--out DIR] [--layout FILE] [--html-only]
// --layout reads another layout file instead of scripts/cursive/layout.json.
//
// Dependencies: node and Google Chrome. No packages.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { CHROME, sleep, withChrome } = require('./chrome.js');
const { HARNESS, OVERRIDE, checkDestination } = require('./output.js');

const HERE = __dirname;
const DEFAULT_OUT = path.join(HARNESS, 'chart');
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-v\{version\}\.(?:png|html)$/;
const ORDER = [
    'Аа', 'Бб', 'Вв', 'Гг', 'Дд', 'Ее', 'Ёё', 'Жж', 'Зз', 'Ии', 'Йй', 'Кк', 'Лл', 'Мм', 'Нн', 'Оо', 'Пп',
    'Рр', 'Сс', 'Тт', 'Уу', 'Фф', 'Хх', 'Цц', 'Чч', 'Шш', 'Щщ', 'ъ', 'ы', 'ь', 'Ээ', 'Юю', 'Яя',
];

function refuse(msg) {
    console.error('BUILD-CHART REFUSED: ' + msg);
    process.exit(2);
}

// ---------- the chart ----------

function fmt(v) {
    let s = (Math.round(v * 1e4) / 1e4).toFixed(4);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
}

// Changes S1's slant to the layout's: x moves by k per unit of height above
// the baseline. With slantDeg equal to S1's own, k is 0 and the path is S1's.
function shearPath(d, k, baseline) {
    if (k === 0) return d;
    const t = d.split(' ');
    const out = [];
    for (let i = 0; i < t.length;) {
        const c = t[i];
        if (c === 'Z') { out.push(c); i += 1; continue; }
        const n = c === 'C' ? 3 : 1;
        out.push(c);
        for (let j = 0; j < n; j++) {
            const x = Number(t[i + 1 + 2 * j]), y = Number(t[i + 2 + 2 * j]);
            out.push(fmt(x + k * (baseline - y)), fmt(y));
        }
        i += 1 + 2 * n;
    }
    return out.join(' ');
}
function pathBox(d) {
    const t = d.split(' ');
    let cur = null;
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    const add = function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); };
    for (let i = 0; i < t.length;) {
        const c = t[i];
        if (c === 'M' || c === 'L') { cur = [Number(t[i + 1]), Number(t[i + 2])]; add(cur); i += 3; }
        else if (c === 'C') {
            const p = [cur, [Number(t[i + 1]), Number(t[i + 2])], [Number(t[i + 3]), Number(t[i + 4])], [Number(t[i + 5]), Number(t[i + 6])]];
            for (let s = 1; s <= 64; s++) {
                const u = s / 64, v = 1 - u;
                add([v * v * v * p[0][0] + 3 * v * v * u * p[1][0] + 3 * v * u * u * p[2][0] + u * u * u * p[3][0],
                     v * v * v * p[0][1] + 3 * v * v * u * p[1][1] + 3 * v * u * u * p[2][1] + u * u * u * p[3][1]]);
            }
            cur = p[3]; i += 7;
        } else i += 1;
    }
    return b;
}

function buildBlock(shapes, layout) {
    const byChar = {};
    shapes.forms.forEach(function (f) { byChar[f.char] = f; });
    const want = ORDER.join('').split('');
    if (shapes.forms.length !== 63 || want.some(function (c) { return !byChar[c]; })) refuse('shapes.json must hold exactly the 63 forms ' + want.join(''));
    const k = Math.tan(layout.slantDeg * Math.PI / 180) - Math.tan(layout.s1SlantDeg * Math.PI / 180);
    const forms = want.map(function (c) {
        const f = byChar[c];
        const d = shearPath(f.d, k, f.baseline);
        return { f: f, d: d, box: k === 0 ? f.bbox : pathBox(d) };
    });
    // one frame for every cell, so all baselines and x-heights line up
    const pad = layout.cellPadding;
    let asc = 0, desc = 0, wide = 0;
    forms.forEach(function (x) {
        asc = Math.max(asc, x.f.baseline - x.box[1]);
        desc = Math.max(desc, x.box[3] - x.f.baseline);
        wide = Math.max(wide, x.box[2] - x.box[0]);
    });
    const W = wide + 2 * pad, H = asc + desc + 2 * pad;
    const px = layout.xHeightPx / forms[0].f.xHeight;
    const cell = function (x) {
        const f = x.f;
        const vx = (x.box[0] + x.box[2]) / 2 - W / 2, vy = f.baseline - asc - pad;
        const guides = layout.guides ? [f.baseline, f.baseline - f.xHeight].map(function (y) {
            return '<line class="cursive-chart-guide" x1="' + fmt(vx) + '" y1="' + fmt(y) + '" x2="' + fmt(vx + W) + '" y2="' + fmt(y) +
                   '" stroke="currentColor" stroke-opacity="0.25" stroke-width="0.3"/>';
        }).join('') : '';
        return '      <div class="cursive-chart-cell">' +
            '<span class="cursive-chart-letter notranslate" translate="no" lang="ru">' + f.char + '</span>' +
            '<svg class="cursive-chart-form" viewBox="' + [vx, vy, W, H].map(fmt).join(' ') + '" width="' + fmt(W * px) + '" height="' + fmt(H * px) +
            '" aria-hidden="true" focusable="false">' + guides +
            '<path d="' + x.d + '" fill="none" stroke="currentColor" stroke-width="' + fmt(layout.strokeWidth) +
            '" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    };
    const lines = ['<!-- Generated by scripts/cursive/build-chart.js from scripts/cursive/shapes.json (layout v' + layout.version + '). Do not edit by hand. -->',
                   '<div class="cursive-chart">'];
    let i = 0;
    ORDER.forEach(function (pair) {
        lines.push('  <div class="cursive-chart-pair">');
        pair.split('').forEach(function () { lines.push(cell(forms[i++])); });
        lines.push('  </div>');
    });
    lines.push('</div>');
    return { html: lines.join('\n') + '\n', cells: i };
}

function buildPage(block, pageWidthPx) {
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Russian cursive alphabet chart</title>\n<style>\n' +
        'html, body { margin: 0; background: #ffffff; color: #1a1a2e; }\n' +
        '#chart { width: ' + pageWidthPx + 'px; box-sizing: border-box; padding: 28px 32px 24px; font-family: Arial, Helvetica, sans-serif; }\n' +
        '#chart h1 { margin: 0 0 18px; font-size: 30px; font-weight: 700; letter-spacing: 0.02em; }\n' +
        '.cursive-chart { display: flex; flex-wrap: wrap; gap: 10px; }\n' +
        '.cursive-chart-pair { display: flex; gap: 2px; border: 1px solid #d9dce6; border-radius: 8px; padding: 6px 6px 2px; }\n' +
        '.cursive-chart-cell { display: flex; flex-direction: column; align-items: center; }\n' +
        '.cursive-chart-letter { font-size: 20px; line-height: 1; color: #5a5f73; }\n' +
        '.cursive-chart-form { display: block; }\n' +
        '#chart p { margin: 16px 0 0; font-size: 14px; color: #5a5f73; }\n' +
        '</style>\n</head>\n<body>\n<div id="chart">\n<h1>Russian cursive alphabet</h1>\n' + block +
        '<p>Letterforms: Wikimedia Commons, Russian_Cursive_Cyrillic.svg (public domain). cyrilica.com</p>\n</div>\n</body>\n</html>\n';
}

// ---------- Chrome ----------

async function renderPng(pageFile, pngFile, outDir, pageWidthPx, deviceScaleFactor) {
    return withChrome(outDir, async function (send) {
        await send('Network.enable');
        await send('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] });
        await send('Emulation.setDeviceMetricsOverride', { width: pageWidthPx, height: 900, deviceScaleFactor: deviceScaleFactor, mobile: false });
        await send('Page.enable');
        await send('Page.navigate', { url: pathToFileURL(pageFile).href });
        let ready = false;
        for (let i = 0; i < 50 && !ready; i++) {
            await sleep(200);
            const r = await send('Runtime.evaluate', { expression: "document.readyState === 'complete' && document.querySelectorAll('.cursive-chart-cell').length", returnByValue: true });
            ready = r.result.value === 63;
        }
        if (!ready) throw new Error('the chart page did not load 63 cells');
        await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(function () { return true; })', awaitPromise: true });
        const box = (await send('Runtime.evaluate', { expression: "JSON.stringify(document.getElementById('chart').getBoundingClientRect())", returnByValue: true })).result.value;
        const r = JSON.parse(box);
        const h = Math.ceil(r.bottom);
        await send('Emulation.setDeviceMetricsOverride', { width: pageWidthPx, height: h, deviceScaleFactor: deviceScaleFactor, mobile: false });
        const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: pageWidthPx, height: h, scale: 1 }, captureBeyondViewport: true });
        fs.writeFileSync(pngFile, Buffer.from(shot.data, 'base64'), { flag: 'wx' });
        return { width: pageWidthPx * deviceScaleFactor, height: h * deviceScaleFactor };
    });
}

// ---------- main ----------

async function main(argv) {
    let out = DEFAULT_OUT, layoutFile = path.join(HERE, 'layout.json'), htmlOnly = false, anywhere = false;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--out' && argv[i + 1] && !argv[i + 1].startsWith('--')) out = argv[++i];
        else if (argv[i] === '--layout' && argv[i + 1] && !argv[i + 1].startsWith('--')) layoutFile = path.resolve(argv[++i]);
        else if (argv[i] === '--html-only') htmlOnly = true;
        else if (argv[i] === OVERRIDE) anywhere = true;
        else refuse('unknown or incomplete argument ' + argv[i] + ' (use --out DIR, --layout FILE, --html-only, ' + OVERRIDE + ')');
    }
    const dir = checkDestination(out, anywhere, 'build-chart.js', refuse);
    const layout = JSON.parse(fs.readFileSync(layoutFile, 'utf8'));
    if (!Number.isInteger(layout.version) || layout.version < 1) refuse('layout.json version must be a positive integer');
    const name = function (n, from) {
        const v = (from || layout)[n];
        if (typeof v !== 'string' || !NAME.test(v)) refuse('layout.json ' + (from ? 'narrow.' : '') + n + ' must look like "some-name-v{version}.png" or ".html", with no folder');
        const f = path.join(dir, v.replace('{version}', String(layout.version)));
        if (path.dirname(f) !== dir) refuse('layout.json ' + n + ' would leave the output folder');
        return f;
    };
    const files = { block: name('blockName'), page: name('pageName'), png: name('pngName') };
    const narrow = layout.narrow || null;
    if (narrow) {
        if (!Number.isInteger(narrow.pageWidthPx) || narrow.pageWidthPx < 200 || narrow.pageWidthPx >= layout.pageWidthPx) refuse('layout.json narrow.pageWidthPx must be a whole number from 200 up to less than pageWidthPx');
        files.narrowPage = name('pageName', narrow);
        files.narrowPng = name('pngName', narrow);
        const all = Object.keys(files).map(function (k) { return files[k]; });
        if (new Set(all).size !== all.length) refuse('layout.json gives two outputs the same name');
    }
    const isPng = function (k) { return k === 'png' || k === 'narrowPng'; };
    const clash = Object.keys(files).filter(function (k) { return (!isPng(k) || !htmlOnly) && fs.existsSync(files[k]); }).map(function (k) { return files[k]; });
    if (clash.length) refuse('these files already exist and nothing here overwrites: ' + clash.join(', ') + '. Give a fresh folder or raise the layout version.');
    if (!htmlOnly && !fs.existsSync(CHROME)) refuse('Google Chrome not found at ' + CHROME);
    const shapes = JSON.parse(fs.readFileSync(path.join(HERE, 'shapes.json'), 'utf8'));
    const block = buildBlock(shapes, layout);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(files.block, block.html, { flag: 'wx' });
    fs.writeFileSync(files.page, buildPage(block.html, layout.pageWidthPx), { flag: 'wx' });
    if (narrow) fs.writeFileSync(files.narrowPage, buildPage(block.html, narrow.pageWidthPx), { flag: 'wx' });
    const sha = function (f) { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); };
    console.log('cells: ' + block.cells);
    console.log('wrote ' + files.block + '  sha256 ' + sha(files.block));
    console.log('wrote ' + files.page + '  sha256 ' + sha(files.page));
    if (narrow) console.log('wrote ' + files.narrowPage + '  sha256 ' + sha(files.narrowPage));
    if (htmlOnly) return;
    const size = await renderPng(files.page, files.png, dir, layout.pageWidthPx, layout.deviceScaleFactor);
    console.log('wrote ' + files.png + '  ' + size.width + 'x' + size.height + '  sha256 ' + sha(files.png));
    if (!narrow) return;
    const small = await renderPng(files.narrowPage, files.narrowPng, dir, narrow.pageWidthPx, layout.deviceScaleFactor);
    console.log('wrote ' + files.narrowPng + '  ' + small.width + 'x' + small.height + '  sha256 ' + sha(files.narrowPng));
}

main(process.argv.slice(2)).catch(function (e) {
    console.error('BUILD-CHART FAILED: ' + e.message);
    process.exit(1);
});
