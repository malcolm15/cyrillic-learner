#!/usr/bin/env node
//
// Builds the Russian cursive alphabet chart from scripts/cursive/shapes.json
// (layer 1, S1's shapes) and scripts/cursive/layout.json:
//   a. the chart's HTML block: 63 cells in alphabet order, each letter's
//      capital and lowercase paired, each cell holding the printed letter as
//      real text in a guarded element (translate="no", class notranslate,
//      lang="ru") and the cursive form as an inline SVG path, aria-hidden;
//   b. a standalone page holding that same block, and the full-chart PNG
//      rendered from that page by headless Chrome.
// All three names carry the layout's version (…-v1.png and so on).
//
// HAND-RUN, HARNESS OUTPUT ONLY. Never part of the Netlify build. By default
// it writes only inside ~/.cyrilica/harness/cursive/b73/ (into chart/ there),
// and it refuses any other destination, the repository included (images/,
// js/, downloads/, the root), unless given --allow-output-outside-harness.
// Its output goes live only by being copied into the site in a reviewed batch.
//
// It never deletes or overwrites: if any file it would write already exists
// it refuses before writing anything. The one deletion is its own throwaway
// Chrome profile, a mkdtemp folder it creates inside the output folder.
// Chrome runs headless with its debugging port bound to 127.0.0.1 on a port
// the system picks (--remote-debugging-port=0); the script reads that port
// from the DevToolsActivePort file Chrome writes into the throwaway profile,
// so it can only ever talk to the Chrome it started. No network: the page is
// local, the page's own http and https requests are blocked, and Chrome's
// background services are switched off and pointed at a dead proxy.
//
// Usage, from any directory:
//   node scripts/cursive/build-chart.js [--out DIR] [--html-only]
//
// Dependencies: node and Google Chrome. No packages.

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..');
const HARNESS = path.join(os.homedir(), '.cyrilica', 'harness', 'cursive', 'b73');
const DEFAULT_OUT = path.join(HARNESS, 'chart');
const OVERRIDE = '--allow-output-outside-harness';
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-v\{version\}\.(?:png|html)$/;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ORDER = [
    'Аа', 'Бб', 'Вв', 'Гг', 'Дд', 'Ее', 'Ёё', 'Жж', 'Зз', 'Ии', 'Йй', 'Кк', 'Лл', 'Мм', 'Нн', 'Оо', 'Пп',
    'Рр', 'Сс', 'Тт', 'Уу', 'Фф', 'Хх', 'Цц', 'Чч', 'Шш', 'Щщ', 'ъ', 'ы', 'ь', 'Ээ', 'Юю', 'Яя',
];

function refuse(msg) {
    console.error('BUILD-CHART REFUSED: ' + msg);
    process.exit(2);
}

// ---------- where output may go ----------

// The real path of p, resolving symlinks in the part that already exists.
function realOf(p) {
    let head = path.resolve(p);
    const rest = [];
    while (!fs.existsSync(head)) {
        rest.unshift(path.basename(head));
        const up = path.dirname(head);
        if (up === head) break;
        head = up;
    }
    return path.join(fs.realpathSync(head), ...rest);
}
function inside(child, parent) {
    const rel = path.relative(parent, child);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
function checkDestination(dir, allowAnywhere) {
    const abs = path.resolve(dir);
    if (allowAnywhere) return abs;
    if (!fs.existsSync(HARNESS)) refuse('the harness folder ' + HARNESS + ' does not exist; create it, or pass ' + OVERRIDE);
    const real = realOf(abs);
    if (inside(real, fs.realpathSync(HARNESS))) return abs;
    const where = inside(real, fs.realpathSync(REPO)) ? ' It is inside the repository (' + REPO + ').' : '';
    refuse('will not write to ' + abs + '.' + where + ' build-chart.js writes only inside ' + HARNESS +
           ', because its output goes live only through a reviewed batch. To write elsewhere anyway, pass ' + OVERRIDE + '.');
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

function buildPage(block, layout) {
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Russian cursive alphabet chart</title>\n<style>\n' +
        'html, body { margin: 0; background: #ffffff; color: #1a1a2e; }\n' +
        '#chart { width: ' + layout.pageWidthPx + 'px; box-sizing: border-box; padding: 28px 32px 24px; font-family: Arial, Helvetica, sans-serif; }\n' +
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

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// Chrome's own background traffic (updates, safe browsing, metrics, sync) is
// switched off, anything left is sent to a proxy on the discard port, which
// refuses it, and every host name resolves to "not found", which also stops
// Chrome's secure-DNS lookups. file:// pages and the loopback debugging socket
// are unaffected. Measured with lsof -i on Chrome's processes: no socket
// leaves 127.0.0.1.
const CHROME_FLAGS = [
    '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
    '--disable-domain-reliability', '--disable-client-side-phishing-detection', '--no-pings', '--disable-quic',
    '--metrics-recording-only', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=<-loopback>',
    '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1',
];

async function renderPng(pageFile, pngFile, outDir, layout) {
    const profile = fs.mkdtempSync(path.join(outDir, '.chrome-profile-'));
    const chrome = spawn(CHROME, CHROME_FLAGS.concat(['--user-data-dir=' + profile, 'about:blank']), { stdio: 'ignore' });
    let ws = null;
    try {
        // the port Chrome bound, from the file it writes into our own profile
        let port = null;
        for (let i = 0; i < 100 && !port; i++) {
            await sleep(100);
            try { port = Number(fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch (e) { port = null; }
        }
        if (!port) throw new Error('Chrome did not report its debugging port');
        let target = null;
        for (let i = 0; i < 50 && !target; i++) {
            await sleep(100);
            try {
                const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
                target = list.find(function (t) { return t.type === 'page'; }) || null;
            } catch (e) { target = null; }
        }
        if (!target) target = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' })).json();
        ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise(function (r, j) { ws.addEventListener('open', r); ws.addEventListener('error', j); });
        let id = 0;
        const pending = new Map();
        ws.addEventListener('message', function (e) {
            const m = JSON.parse(e.data);
            if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        });
        const send = function (method, params) {
            return new Promise(function (resolve, reject) {
                const n = ++id;
                const to = setTimeout(function () { pending.delete(n); reject(new Error(method + ' timed out')); }, 30000);
                pending.set(n, function (m) { clearTimeout(to); if (m.error) reject(new Error(method + ': ' + m.error.message)); else resolve(m.result); });
                ws.send(JSON.stringify({ id: n, method: method, params: params || {} }));
            });
        };
        await send('Network.enable');
        await send('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] });
        await send('Emulation.setDeviceMetricsOverride', { width: layout.pageWidthPx, height: 900, deviceScaleFactor: layout.deviceScaleFactor, mobile: false });
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
        await send('Emulation.setDeviceMetricsOverride', { width: layout.pageWidthPx, height: h, deviceScaleFactor: layout.deviceScaleFactor, mobile: false });
        const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: layout.pageWidthPx, height: h, scale: 1 }, captureBeyondViewport: true });
        fs.writeFileSync(pngFile, Buffer.from(shot.data, 'base64'), { flag: 'wx' });
        return { width: layout.pageWidthPx * layout.deviceScaleFactor, height: h * layout.deviceScaleFactor };
    } finally {
        if (ws) try { ws.close(); } catch (e) { /* closing anyway */ }
        await new Promise(function (r) {
            if (chrome.exitCode !== null) return r();
            chrome.once('exit', r);
            chrome.kill('SIGTERM');
            setTimeout(function () { try { chrome.kill('SIGKILL'); } catch (e) { /* gone */ } r(); }, 5000);
        });
        // only the folder this run created, named by mkdtemp
        fs.rmSync(profile, { recursive: true, force: true });
    }
}

// ---------- main ----------

async function main(argv) {
    let out = DEFAULT_OUT, htmlOnly = false, anywhere = false;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--out' && argv[i + 1] && !argv[i + 1].startsWith('--')) out = argv[++i];
        else if (argv[i] === '--html-only') htmlOnly = true;
        else if (argv[i] === OVERRIDE) anywhere = true;
        else refuse('unknown or incomplete argument ' + argv[i] + ' (use --out DIR, --html-only, ' + OVERRIDE + ')');
    }
    const dir = checkDestination(out, anywhere);
    const layout = JSON.parse(fs.readFileSync(path.join(HERE, 'layout.json'), 'utf8'));
    if (!Number.isInteger(layout.version) || layout.version < 1) refuse('layout.json version must be a positive integer');
    const name = function (n) {
        if (typeof layout[n] !== 'string' || !NAME.test(layout[n])) refuse('layout.json ' + n + ' must look like "some-name-v{version}.png" or ".html", with no folder');
        const f = path.join(dir, layout[n].replace('{version}', String(layout.version)));
        if (path.dirname(f) !== dir) refuse('layout.json ' + n + ' would leave the output folder');
        return f;
    };
    const files = { block: name('blockName'), page: name('pageName'), png: name('pngName') };
    const clash = Object.keys(files).filter(function (k) { return (k !== 'png' || !htmlOnly) && fs.existsSync(files[k]); }).map(function (k) { return files[k]; });
    if (clash.length) refuse('these files already exist and nothing here overwrites: ' + clash.join(', ') + '. Give a fresh folder or raise the layout version.');
    if (!htmlOnly && !fs.existsSync(CHROME)) refuse('Google Chrome not found at ' + CHROME);
    const shapes = JSON.parse(fs.readFileSync(path.join(HERE, 'shapes.json'), 'utf8'));
    const block = buildBlock(shapes, layout);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(files.block, block.html, { flag: 'wx' });
    fs.writeFileSync(files.page, buildPage(block.html, layout), { flag: 'wx' });
    const sha = function (f) { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); };
    console.log('cells: ' + block.cells);
    console.log('wrote ' + files.block + '  sha256 ' + sha(files.block));
    console.log('wrote ' + files.page + '  sha256 ' + sha(files.page));
    if (htmlOnly) return;
    const size = await renderPng(files.page, files.png, dir, layout);
    console.log('wrote ' + files.png + '  ' + size.width + 'x' + size.height + '  sha256 ' + sha(files.png));
}

main(process.argv.slice(2)).catch(function (e) {
    console.error('BUILD-CHART FAILED: ' + e.message);
    process.exit(1);
});
