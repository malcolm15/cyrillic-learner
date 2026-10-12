#!/usr/bin/env node
//
// IndexNow notifier for cyrilica.com (Bing, Yandex, Naver, Seznam, Yep; not Google).
//
// Cyrilica only changes through merged batches, so there is no deploy automation
// here. A batch captures a production baseline BEFORE merging, and after the
// production checks pass it diffs production against that baseline and submits
// only the URLs that actually changed. Every run prints the full list first and
// sends nothing without an explicit --send.
//
// A 200 from IndexNow means the list was received, not that anything was indexed.
//
// The key is public by design: it is served at a public URL. It lives in exactly
// one place, the name of the <key>.txt file at the repo root, so the served file
// and the submitted key cannot drift apart.
//
// Node built-ins only. No package.json, no dependencies.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execFileSync } = require('child_process');

const SCRIPT_VERSION = '1.0.0';
const HOST = 'cyrilica.com';
const ORIGIN = 'https://' + HOST;
const SITEMAP = ORIGIN + '/sitemap.xml';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(os.homedir(), '.cyrilica', 'indexnow');
const KEY_FILE_RE = /^[0-9a-f]{32}\.txt$/;

// ---------------------------------------------------------------- pure helpers

function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

// Byte for byte, with no trimming. The key file must contain the key and
// nothing else: a trailing newline, a trailing space or a BOM all make it a
// different file, and Bing fetches the bytes we serve, not a tidied version.
// This check is deliberately stricter than Bing may be. It fails safe: it
// refuses to send on a doubtful key file rather than sending and guessing.
function keyBodyMatches(body, key) {
    const b = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
    const k = Buffer.from(String(key), 'utf8');
    return b.length === k.length && b.equals(k);
}

function headerValue(headers, name) {
    const want = String(name).toLowerCase();
    const keys = Object.keys(headers || {});
    for (let i = 0; i < keys.length; i += 1) {
        if (keys[i].toLowerCase() === want) {
            const v = headers[keys[i]];
            return Array.isArray(v) ? v.join(', ') : String(v);
        }
    }
    return null;
}

// One attribute out of a <meta> tag, in any quoting style. The (^|\s) prefix
// matters: a bare \bname would also match data-name= and similar.
function attrFrom(attrs, name) {
    const re = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s"\'=<>`]+))', 'i');
    const m = re.exec(attrs);
    if (!m) return null;
    return m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
}

// Meta names that de-index a page for the engines IndexNow actually feeds.
// robots is the sitewide directive; bingbot and msnbot are Bing's own crawler
// names and a noindex aimed at either one still removes the page from Bing.
// googlebot and every other crawler name are deliberately excluded: Google does
// not consume IndexNow, so a Google-only directive says nothing about what we
// should tell Bing.
const NOINDEX_META_NAMES = ['robots', 'bingbot', 'msnbot'];

// Two independent sources, because either one is enough to de-index a URL.
// Today the site emits no X-Robots-Tag and uses a meta tag everywhere, but a
// future _headers file could change that, and checking only one would be wrong.
//
// The header check is deliberately broad: ANY noindex anywhere in
// X-Robots-Tag counts, whatever crawler it names. That is the fail-safe
// direction, it costs nothing while the site emits no such header at all, and a
// precise per-crawler header parser would be more complexity than the risk
// justifies. The meta check below is the precise one.
//
// Every <meta> tag is scanned rather than matched by one fixed attribute order.
// name and content may appear in either order, in any quoting style, in any
// case, with other attributes between them.
function isNoindex(headers, body) {
    const xr = headerValue(headers, 'x-robots-tag');
    if (xr && /noindex/i.test(xr)) return true;
    const text = body == null ? '' : String(body);
    const re = /<meta\b([^>]*)>/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
        const name = attrFrom(m[1], 'name');
        if (!name || NOINDEX_META_NAMES.indexOf(name.trim().toLowerCase()) === -1) continue;
        const content = attrFrom(m[1], 'content');
        if (content && /noindex/i.test(content)) return true;
    }
    return false;
}

const REDIRECT_CODES = [301, 302, 307, 308];

// Pure. Given what production says about one URL and whether the sitemap listed
// it before and lists it now, decide what to tell IndexNow.
//
// hashBefore is the baseline hash for a URL present in both sitemaps; it is what
// CHANGED is measured against and is unused for the other classes. url is the
// URL that was requested, needed only to resolve a relative Location header.
function classify(o) {
    const status = o.status;
    const headers = o.headers || {};
    const body = o.body;
    const before = !!o.inSitemapBefore;
    const now = !!o.inSitemapNow;

    if (before && !now) {
        if (status === 404 || status === 410) {
            return { cls: 'REMOVED', submit: true, note: 'gone from the sitemap and ' + status + ' on production' };
        }
        if (REDIRECT_CODES.indexOf(status) !== -1) {
            // A redirect we cannot resolve is not a redirect we can act on.
            // Submitting the old URL while guessing at the destination would be
            // worse than stopping and letting a human look.
            const raw = headerValue(headers, 'location');
            if (!raw || !String(raw).trim()) {
                return { cls: 'UNEXPECTED', submit: false, note: status + ' but the Location header is missing or empty, so the destination is unknown' };
            }
            let target = null;
            try {
                target = new URL(String(raw).trim(), o.url).toString();
            } catch (e) {
                return { cls: 'UNEXPECTED', submit: false, note: status + ' but Location ' + JSON.stringify(String(raw)) + ' could not be resolved: ' + e.message };
            }
            if (!/^https?:$/i.test(new URL(target).protocol)) {
                return { cls: 'UNEXPECTED', submit: false, note: status + ' to a non-http(s) destination ' + JSON.stringify(target) };
            }
            return { cls: 'REDIRECTED', submit: true, target: target, note: status + ' to ' + target };
        }
        if (status === 200 && isNoindex(headers, body)) {
            return { cls: 'DEINDEXED', submit: true, note: 'still 200 but carries noindex' };
        }
        if (status === 200) {
            return { cls: 'UNEXPECTED', submit: false, note: 'gone from the sitemap but still live and indexable; the sitemap edit was probably a mistake' };
        }
        return { cls: 'UNEXPECTED', submit: false, note: 'gone from the sitemap and returned an unhandled status ' + status };
    }

    if (!before && now) {
        if (status === 200 && !isNoindex(headers, body)) {
            return { cls: 'ADDED', submit: true, note: 'new in the sitemap, live and indexable' };
        }
        if (status === 200) {
            return { cls: 'UNEXPECTED', submit: false, note: 'new in the sitemap but carries noindex' };
        }
        return { cls: 'UNEXPECTED', submit: false, note: 'new in the sitemap but returned ' + status };
    }

    if (before && now) {
        if (status !== 200) {
            return { cls: 'UNEXPECTED', submit: false, note: 'in the sitemap but returned ' + status };
        }
        // Still listed as indexable, but the page itself says do not index. The
        // sitemap and the directive disagree, and guessing which one is right is
        // not the script's job: one of them is a mistake and a human has to say
        // which before anything is sent.
        if (isNoindex(headers, body)) {
            return { cls: 'UNEXPECTED', submit: false, note: 'still in the sitemap but the page carries noindex; reconcile the sitemap and the robots directive before submitting' };
        }
        const after = sha256(Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8'));
        if (after !== o.hashBefore) {
            return { cls: 'CHANGED', submit: true, note: 'body hash differs from the baseline', hashAfter: after };
        }
        return { cls: 'UNCHANGED', submit: false, note: 'identical to the baseline', hashAfter: after };
    }

    return { cls: 'UNEXPECTED', submit: false, note: 'in neither the old nor the new sitemap' };
}

function parseSitemap(xml) {
    const out = [];
    const re = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = re.exec(String(xml))) !== null) out.push(m[1].trim());
    return out;
}

function baselineFileName(commitRef) {
    return 'baseline-' + commitRef + '.json';
}

// Pure. The URLs to submit: every row marked submit, plus the resolved target of
// any REDIRECTED row, but only when that target is in the new sitemap and is not
// already queued. A target outside the sitemap is deliberately skipped: IndexNow
// answers 422 for URLs that are not ours to submit, and a redirect can point
// anywhere, including off site.
function buildSubmitList(rows, nowUrls) {
    const out = [];
    const seen = Object.create(null);
    rows.forEach(function (r) {
        if (!r.submit) return;
        if (seen[r.url]) return;
        seen[r.url] = true;
        out.push(r.url);
    });
    rows.forEach(function (r) {
        if (r.cls !== 'REDIRECTED' || !r.target) return;
        if ((nowUrls || []).indexOf(r.target) === -1) return;
        if (seen[r.target]) return;
        seen[r.target] = true;
        out.push(r.target);
    });
    return out;
}

// Pure. Everything the Netlify API answer has to satisfy before we trust it to
// tell us which commit production serves. Throws a descriptive Error rather
// than exiting, so it can be tested without a process boundary.
function validateDeployResponse(status, text) {
    const excerpt = '\n  body excerpt: ' + JSON.stringify(String(text == null ? '' : text).slice(0, 200));
    if (status !== 200) {
        throw new Error('the Netlify API returned ' + status +
                        '. Without it we cannot tell which commit production serves.' + excerpt);
    }
    let d;
    try {
        d = JSON.parse(text);
    } catch (e) {
        throw new Error('the Netlify API response is not JSON: ' + e.message + excerpt);
    }
    if (!d || !d.published_deploy) {
        throw new Error('the Netlify API response has no published_deploy, so there is no production deploy to describe.' + excerpt);
    }
    return d.published_deploy;
}

// Every command depends on the sitemap being the list of indexable URLs. A
// non-200, or a 200 that parses to nothing, must stop the run rather than be
// read as "the site has no pages": that would write an empty baseline, or make
// every URL look removed on the next diff.
async function fetchSitemap(url) {
    const target = url || SITEMAP;
    const res = await get(target);
    if (res.status !== 200) {
        fail('the sitemap at ' + target + ' returned ' + res.status + ', not 200. Refusing to continue');
    }
    const urls = parseSitemap(res.body.toString('utf8'));
    if (urls.length === 0) {
        fail('the sitemap at ' + target + ' returned 200 but parsed to 0 URLs. Refusing to continue');
    }
    return { res: res, urls: urls };
}

// ------------------------------------------------------------------ impure I/O

function fail(msg) {
    console.error('INDEXNOW REFUSED: ' + msg);
    process.exit(1);
}

function get(url, opts) {
    const options = opts || {};
    return new Promise(function (resolve, reject) {
        const req = https.get(url, { headers: { 'User-Agent': 'cyrilica-indexnow/' + SCRIPT_VERSION, 'Cache-Control': 'no-cache' } }, function (res) {
            const chunks = [];
            res.on('data', function (c) { chunks.push(c); });
            res.on('end', function () {
                resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) });
            });
        });
        req.setTimeout(options.timeout || 20000, function () { req.destroy(new Error('timeout after ' + (options.timeout || 20000) + 'ms')); });
        req.on('error', reject);
    });
}

function postJson(url, payload) {
    const data = Buffer.from(JSON.stringify(payload), 'utf8');
    const u = new URL(url);
    return new Promise(function (resolve, reject) {
        const req = https.request({
            method: 'POST', hostname: u.hostname, path: u.pathname + u.search,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': data.length,
                       'User-Agent': 'cyrilica-indexnow/' + SCRIPT_VERSION },
        }, function (res) {
            const chunks = [];
            res.on('data', function (c) { chunks.push(c); });
            res.on('end', function () { resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }); });
        });
        req.setTimeout(30000, function () { req.destroy(new Error('timeout after 30000ms')); });
        req.on('error', reject);
        req.end(data);
    });
}

// Pure. One label per run, so a batch report can record the outcome in a single
// token rather than a paraphrase of the HTTP code.
function resultLabel(code, err, count) {
    if (!err && (count === 0 || count === undefined) && code === undefined) return 'NOTHING_TO_SUBMIT';
    if (err) return 'FAILED_RETRY_REQUIRED';
    if (typeof code !== 'number' || code < 200 || code > 299) return 'FAILED_RETRY_REQUIRED';
    if (code === 202) return 'ACCEPTED_PENDING_VALIDATION';
    return 'SUBMITTED';
}

const RESPONSE_MEANING = {
    200: 'received',
    202: 'received, key validation pending',
    400: 'bad request format',
    403: 'key not found or not matching',
    422: 'URLs do not belong to the host, or the key does not match the schema',
    429: 'too many requests',
};

function discoverKey() {
    const matches = fs.readdirSync(REPO_ROOT).filter(function (f) { return KEY_FILE_RE.test(f); });
    if (matches.length === 0) {
        fail('no IndexNow key file at the repo root. Expected exactly one file matching ^[0-9a-f]{32}\\.txt$');
    }
    if (matches.length > 1) {
        fail('found ' + matches.length + ' files matching ^[0-9a-f]{32}\\.txt$ at the repo root: ' +
             matches.join(', ') + '. The key must exist in exactly one place');
    }
    const key = matches[0].replace(/\.txt$/, '');
    return { key: key, fileName: matches[0], keyLocation: ORIGIN + '/' + matches[0] };
}

async function productionDeploy() {
    const url = 'https://api.netlify.com/api/v1/sites/dapper-axolotl-1f65df.netlify.app';
    const res = await get(url);
    try {
        return validateDeployResponse(res.status, res.body.toString('utf8'));
    } catch (e) {
        fail(e.message + '\n  requested: ' + url);
        return null;
    }
}

function parentOne(sha) {
    try {
        return execFileSync('git', ['rev-parse', sha + '^1'], { cwd: REPO_ROOT }).toString().trim();
    } catch (e) {
        fail('could not resolve parent 1 of ' + sha + '. Is it a merge commit in this repo?');
        return null;
    }
}

async function fetchAll(urls) {
    const out = {};
    for (let i = 0; i < urls.length; i += 1) {
        const r = await get(urls[i]);
        out[urls[i]] = r;
    }
    return out;
}

// ------------------------------------------------------------------- commands

async function cmdBaseline(sitemapUrl) {
    const startedAt = new Date().toISOString();
    const dep = await productionDeploy();
    if (dep.state !== 'ready' || dep.context !== 'production') {
        fail('the published deploy is state=' + dep.state + ' context=' + dep.context +
             '. A baseline must describe a ready production deploy');
    }
    // The sitemap is fetched and validated BEFORE the state directory is
    // created or anything is written, so a bad sitemap leaves no file behind.
    const sm = await fetchSitemap(sitemapUrl);
    const smRes = sm.res;
    const urls = sm.urls;
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const sitemapMd5 = crypto.createHash('md5').update(smRes.body).digest('hex');
    const fetched = await fetchAll(urls);
    const hashes = {};
    urls.forEach(function (u) {
        const r = fetched[u];
        if (r.status !== 200) fail('baseline: ' + u + ' returned ' + r.status + '; refusing to record a baseline with a non-200 sitemap URL');
        hashes[u] = sha256(r.body);
    });
    // Production must not have moved under us while we were fetching 29 pages.
    // If it did, the hashes describe a mixture of two deploys and the baseline
    // would silently misattribute the difference to the next merge.
    const depAfter = await productionDeploy();
    if (depAfter.id !== dep.id || depAfter.commit_ref !== dep.commit_ref) {
        fail('production changed during the capture, so this baseline would mix two deploys.\n' +
             '  at the start: deploy ' + dep.id + ' commit ' + dep.commit_ref + '\n' +
             '  at the end  : deploy ' + depAfter.id + ' commit ' + depAfter.commit_ref + '\n' +
             '  No file was written. Re-run baseline once the deploy has settled');
    }
    const finishedAt = new Date().toISOString();
    const record = {
        scriptVersion: SCRIPT_VERSION,
        deployId: dep.id, commitRef: dep.commit_ref, state: dep.state,
        context: dep.context, branch: dep.branch, publishedAt: dep.published_at,
        captureStartedAt: startedAt, captureFinishedAt: finishedAt,
        sitemapMd5: sitemapMd5, urlCount: urls.length, hashes: hashes,
    };
    const file = path.join(STATE_DIR, baselineFileName(dep.commit_ref));
    const existed = fs.existsSync(file);
    fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n', 'utf8');
    console.log('Baseline written: ' + file);
    if (existed) console.log('  NOTE: a baseline for this commit already existed and was overwritten.');
    console.log('  deployId     : ' + record.deployId);
    console.log('  commitRef    : ' + record.commitRef);
    console.log('  state        : ' + record.state + '   context: ' + record.context + '   branch: ' + record.branch);
    console.log('  publishedAt  : ' + record.publishedAt);
    console.log('  captured     : ' + startedAt + ' to ' + finishedAt);
    console.log('  sitemapMd5   : ' + record.sitemapMd5);
    console.log('  urlCount     : ' + record.urlCount);
}

function selectBaseline(mergeSha, override) {
    const p1 = parentOne(mergeSha);
    let file;
    if (override) {
        file = path.resolve(override);
        if (!fs.existsSync(file)) fail('--baseline file does not exist: ' + file);
    } else {
        if (!fs.existsSync(STATE_DIR)) fail('no baseline directory at ' + STATE_DIR + '. Run "baseline" before merging');
        const want = baselineFileName(p1);
        const all = fs.readdirSync(STATE_DIR).filter(function (f) { return /^baseline-.*\.json$/.test(f); });
        if (all.indexOf(want) === -1) {
            fail('no baseline matches parent 1 of ' + mergeSha + '.\n' +
                 '  parent 1 is ' + p1 + ', so the baseline must be ' + want + '\n' +
                 '  baselines present: ' + (all.length ? all.join(', ') : '(none)'));
        }
        file = path.join(STATE_DIR, want);
    }
    const b = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log('Baseline selected: ' + file);
    console.log('  baseline commitRef: ' + b.commitRef);
    console.log('  parent 1 of ' + mergeSha + ': ' + p1);
    if (b.commitRef !== p1) {
        fail('the baseline describes ' + b.commitRef + ' but parent 1 of ' + mergeSha + ' is ' + p1 +
             '. The baseline must have been captured from the commit production served before the merge');
    }
    if (b.state !== 'ready' || b.context !== 'production') {
        fail('the baseline records state=' + b.state + ' context=' + b.context + '; it must be a ready production deploy');
    }
    return b;
}

async function computeDiff(mergeSha, override) {
    const baseline = selectBaseline(mergeSha, override);
    const dep = await productionDeploy();
    if (dep.commit_ref !== mergeSha) {
        fail('production currently serves ' + dep.commit_ref + ', not ' + mergeSha +
             '. Run the diff only after production has published the merge');
    }
    const sm = await fetchSitemap();
    const nowUrls = sm.urls;
    const beforeUrls = Object.keys(baseline.hashes);
    const all = Array.from(new Set(beforeUrls.concat(nowUrls)));
    all.sort();
    const rows = [];
    for (let i = 0; i < all.length; i += 1) {
        const u = all[i];
        const r = await get(u);
        const res = classify({
            url: u,
            status: r.status, headers: r.headers, body: r.body,
            inSitemapBefore: beforeUrls.indexOf(u) !== -1,
            inSitemapNow: nowUrls.indexOf(u) !== -1,
            hashBefore: baseline.hashes[u],
        });
        rows.push({ url: u, status: r.status, cls: res.cls, submit: res.submit, note: res.note, target: res.target });
    }
    return { baseline: baseline, rows: rows, nowUrls: nowUrls };
}

function printRows(rows, nowUrls) {
    const counts = {};
    rows.forEach(function (r) { counts[r.cls] = (counts[r.cls] || 0) + 1; });
    console.log('');
    rows.forEach(function (r) {
        if (r.cls === 'UNCHANGED') return;
        console.log('  ' + r.cls.padEnd(11) + ' ' + String(r.status).padEnd(4) + ' ' + r.url + (r.target ? '  -> ' + r.target : ''));
        console.log('              ' + r.note);
        if (r.cls === 'REDIRECTED' && r.target) {
            const inNow = (nowUrls || []).indexOf(r.target) !== -1;
            console.log('              target ' + (inNow ? 'is in the new sitemap and will also be submitted'
                                                         : 'is NOT in the new sitemap, so it will not be submitted'));
        }
    });
    console.log('');
    console.log('  counts: ' + Object.keys(counts).sort().map(function (k) { return k + '=' + counts[k]; }).join('  '));
    const urls = buildSubmitList(rows, nowUrls);
    const unexpected = rows.filter(function (r) { return r.cls === 'UNEXPECTED'; });
    console.log('  would submit: ' + urls.length + ' URL(s)');
    return { urls: urls, unexpected: unexpected };
}

async function checkKeyLive(k) {
    const res = await get(k.keyLocation);
    if (res.status !== 200) {
        fail('the key file is not served: ' + k.keyLocation + ' returned ' + res.status +
             '. IndexNow would answer 403 key not found');
    }
    if (!keyBodyMatches(res.body, k.key)) {
        fail('the served key file body does not equal the key byte for byte.\n' +
             '  expected ' + Buffer.from(k.key).length + ' bytes: ' + JSON.stringify(k.key) + '\n' +
             '  served   ' + res.body.length + ' bytes: ' + JSON.stringify(res.body.toString('utf8')));
    }
    console.log('Key check passed: ' + k.keyLocation + ' is 200 and its body equals the key byte for byte (' + res.body.length + ' bytes).');
}

function writeRunFile(name, payload) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const file = path.join(STATE_DIR, name);
    fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    return file;
}

async function sendSubmission(k, urls) {
    const payload = { host: HOST, key: k.key, keyLocation: k.keyLocation, urlList: urls };
    console.log('');
    console.log('Request body:');
    console.log(JSON.stringify(payload, null, 2).split('\n').map(function (l) { return '  ' + l; }).join('\n'));
    let res = null;
    let err = null;
    try {
        res = await postJson(ENDPOINT, payload);
    } catch (e) {
        err = e;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (err || !res || res.status < 200 || res.status > 299) {
        const code = res ? res.status : null;
        console.error('');
        console.error('SUBMISSION FAILED.');
        console.error('  response code: ' + (code === null ? '(none, ' + err.message + ')' : code +
                      (RESPONSE_MEANING[code] ? ' (' + RESPONSE_MEANING[code] + ')' : '')));
        if (res) console.error('  response body: ' + JSON.stringify(res.body));
        const file = writeRunFile('failed-' + stamp + '.json', {
            scriptVersion: SCRIPT_VERSION, at: new Date().toISOString(),
            responseCode: code, responseBody: res ? res.body : null,
            error: err ? err.message : null, failedUrls: urls,
        });
        console.error('  failed URL list written to: ' + file);
        console.error('');
        console.error('  Nothing retries this automatically, and a later batch will only diff its own');
        console.error('  changes, so these URLs will not reappear on their own. Retry manually with:');
        console.error('');
        console.error('    node scripts/indexnow.js submit --urls ' + urls.join(',') + ' --send');
        console.error('');
        console.log('INDEXNOW RESULT: ' + resultLabel(code, err, urls.length));
        process.exit(0);
    }
    console.log('');
    console.log('Submitted ' + urls.length + ' URL(s).');
    console.log('  response code: ' + res.status + (RESPONSE_MEANING[res.status] ? ' (' + RESPONSE_MEANING[res.status] + ')' : ''));
    console.log('  response body: ' + JSON.stringify(res.body));
    console.log('  A 200 means the list was received, not that anything was indexed.');
    const file = writeRunFile('sent-' + stamp + '.json', {
        scriptVersion: SCRIPT_VERSION, at: new Date().toISOString(),
        responseCode: res.status, responseBody: res.body, urls: urls,
    });
    console.log('  run recorded: ' + file);
    console.log('INDEXNOW RESULT: ' + resultLabel(res.status, null, urls.length));
}

async function cmdSubmitUrls(urls, send) {
    console.log('Explicit URL list mode: ' + urls.length + ' URL(s).');
    const sm = await fetchSitemap();
    const nowUrls = sm.urls;
    const absent = urls.filter(function (u) { return nowUrls.indexOf(u) === -1; });
    if (absent.length) {
        fail('these URLs are not in the live production sitemap, so IndexNow would answer 422:\n' +
             absent.map(function (u) { return '    ' + u; }).join('\n') +
             '\n  (sitemap currently lists ' + nowUrls.length + ' URLs)');
    }
    console.log('  all ' + urls.length + ' URL(s) are in the live sitemap (' + nowUrls.length + ' entries).');
    const k = discoverKey();
    console.log('  key file: ' + k.fileName + '   keyLocation: ' + k.keyLocation);
    await checkKeyLive(k);
    if (!send) {
        const payload = { host: HOST, key: k.key, keyLocation: k.keyLocation, urlList: urls };
        console.log('');
        console.log('DRY RUN. Nothing was sent. The request body would be:');
        console.log(JSON.stringify(payload, null, 2).split('\n').map(function (l) { return '  ' + l; }).join('\n'));
        console.log('');
        console.log('Re-run with --send to submit.');
        return;
    }
    await sendSubmission(k, urls);
}

async function cmdDiff(mergeSha, override) {
    const d = await computeDiff(mergeSha, override);
    const r = printRows(d.rows, d.nowUrls);
    if (r.unexpected.length) {
        console.error('');
        console.error(r.unexpected.length + ' UNEXPECTED row(s). Nothing may be submitted until these are explained.');
        process.exit(1);
    }
}

async function cmdSubmit(mergeSha, override, send) {
    const d = await computeDiff(mergeSha, override);
    const r = printRows(d.rows, d.nowUrls);
    if (r.unexpected.length) {
        console.error('');
        console.error(r.unexpected.length + ' UNEXPECTED row(s). Refusing to submit.');
        process.exit(1);
    }
    if (!r.urls.length) {
        console.log('');
        console.log('Nothing to submit. No URL changed, was added or was removed.');
        console.log('INDEXNOW RESULT: ' + resultLabel(undefined, null, 0));
        return;
    }
    const k = discoverKey();
    console.log('  key file: ' + k.fileName + '   keyLocation: ' + k.keyLocation);
    await checkKeyLive(k);
    const urls = r.urls;
    if (!send) {
        const payload = { host: HOST, key: k.key, keyLocation: k.keyLocation, urlList: urls };
        console.log('');
        console.log('DRY RUN. Nothing was sent. The request body would be:');
        console.log(JSON.stringify(payload, null, 2).split('\n').map(function (l) { return '  ' + l; }).join('\n'));
        console.log('');
        console.log('Re-run with --send to submit.');
        return;
    }
    await sendSubmission(k, urls);
}

function usage() {
    console.log('Usage:');
    console.log('  node scripts/indexnow.js baseline');
    console.log('  node scripts/indexnow.js diff   <merge-sha> [--baseline <path>]');
    console.log('  node scripts/indexnow.js submit <merge-sha> [--baseline <path>] [--send]');
    console.log('  node scripts/indexnow.js submit --urls <url,url,...> [--send]');
}

async function main(argv) {
    const args = argv.slice(2);
    const cmd = args[0];
    const send = args.indexOf('--send') !== -1;
    const bIdx = args.indexOf('--baseline');
    const override = bIdx !== -1 ? args[bIdx + 1] : null;

    if (cmd === 'baseline') return cmdBaseline();
    if (cmd === 'diff') {
        if (!args[1] || args[1].charAt(0) === '-') fail('diff needs a merge sha');
        return cmdDiff(args[1], override);
    }
    if (cmd === 'submit') {
        const uIdx = args.indexOf('--urls');
        if (uIdx !== -1) {
            const list = String(args[uIdx + 1] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            if (!list.length) fail('--urls needs a comma separated list of absolute URLs');
            return cmdSubmitUrls(list, send);
        }
        if (!args[1] || args[1].charAt(0) === '-') fail('submit needs a merge sha, or --urls');
        return cmdSubmit(args[1], override, send);
    }
    usage();
    process.exit(1);
}

module.exports = {
    classify, keyBodyMatches, isNoindex, attrFrom, headerValue, sha256,
    parseSitemap, baselineFileName, buildSubmitList, fetchSitemap,
    validateDeployResponse, resultLabel,
    cmdBaseline, productionDeploy,
    REDIRECT_CODES, RESPONSE_MEANING, NOINDEX_META_NAMES,
    KEY_FILE_RE, SCRIPT_VERSION, HOST, ORIGIN, SITEMAP, ENDPOINT, STATE_DIR,
};

if (require.main === module) {
    main(process.argv).catch(function (e) {
        console.error('INDEXNOW ERROR: ' + (e && e.stack ? e.stack : e));
        process.exit(1);
    });
}
