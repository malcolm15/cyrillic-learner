#!/usr/bin/env node
//
// Regenerates scripts/cursive/shapes.json: the canonical shape of every written
// Russian letter form (30 capitals, 33 lowercase), taken from the S1 source
// file (source/Russian_Cursive_Cyrillic.svg, Wikimedia Commons, public domain)
// and assembled by the per-letter table in rules.json.
//
// LAYER 1 OF THREE (see CLAUDE.md, "scripts/cursive/"). Shape only: no stroke
// order and no pen direction. A form is a set of chains, each a continuous run
// of S1 pieces; the order and direction of a chain mean nothing. Stroke
// evidence is evidence.json (layer 2) and animation data lives with each
// widget (layer 3).
//
// Coordinates are S1's own: no scaling, no slant change. Every coordinate this
// script does not move is written exactly as S1 has it (S1 uses at most seven
// decimals, and output is rounded to seven).
//
// What is decided by hand, in rules.json: which S1 subpaths make up each form,
// how their segments chain, each piece's role, which segments are dropped and
// why, and the ambiguities. What this script does with fixed thresholds, the
// same ones the Phase 1 prototype used:
//   - merges chain neighbours whose endpoints miss by less than MERGE;
//   - snaps a free chain end onto another piece of the same form when it
//     misses a T-junction by up to SNAP, or another piece's endpoint by less
//     than MERGE;
//   - smooths a node only if its angle is between ANG_MIN and ANG_MAX degrees
//     and it involves an S1 straight piece or is a split or closure point
//     between subpaths (a corner drawn inside one S1 curve is kept);
//   - smooths a node by turning both handles to one common tangent, the turn
//     split by arc length: piece a turns lb / (la + lb) of the angle and piece
//     b turns la / (la + lb), so the shorter piece turns more. A straight
//     piece at least LONG_L long never moves; its neighbour takes the whole
//     turn. A straight piece shorter than LONG_L becomes a cubic when one of
//     its handles turns; its other end keeps its own direction;
//   - caps the total effect of smoothing on every piece: each piece's
//     reference is its geometry after merges and snaps. Nodes are processed in
//     a fixed order (chain by chain, node by node along the chain, a closed
//     chain's closing node last), and a node is smoothed only if every piece it
//     moves would stay within CAP of its reference, measured on the piece as
//     already smoothed by earlier nodes. Otherwise the node keeps its corner.
//     After smoothing every piece is measured again and the run fails if any
//     is more than CAP from its reference.
// For every turned handle the angle at the same piece's other end is logged
// before and after smoothing, so a kink moved along the line would show.
//
// A free chain end listed in a form's keepFree (per letter, in rules.json) is
// never snapped, so S1's own gap there is kept exactly; it is logged as a rule
// applied. Smoothing never moves an end point, so it cannot move one either.
// Every action is logged per form in shapes.json, so nothing changes silently.
//
// It fails closed: the source must have the recorded sha256 and exactly 306
// subpaths in S1's grammar; every subpath must belong to exactly one form;
// within a form every segment must be used exactly once or dropped with a
// checked reason: a dropped duplicate must lie within DUP_TOL of the piece it
// repeats, a dropped sliver must be shorter than SLIVER_MAX, and any other drop
// must lie, along its whole length, within DUP_TOL of the kept piece it names
// (ink S1 draws on top of other ink, such as a retraced spike).
//
// Deterministic: no clock, no randomness, fixed iteration order. Two runs give
// byte-identical output.
//
// Usage, from any directory:
//   node scripts/cursive/extract.js               write scripts/cursive/shapes.json
//   node scripts/cursive/extract.js --out FILE    write FILE instead
//   node scripts/cursive/extract.js --check       exit 1 unless shapes.json is current
//   node scripts/cursive/extract.js --rules FILE  read FILE instead of rules.json
//
// No dependencies. Hand-run; never part of the Netlify build.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HERE = __dirname;
const SOURCE = path.join(HERE, 'source', 'Russian_Cursive_Cyrillic.svg');
const SOURCE_SHA256 = '3f924d64d0352730a0efd608852d9f8f6e34d1c58b06675aa4ff4ed660960045';
const SOURCE_SUBPATHS = 306;
const RULES = path.join(HERE, 'rules.json');
const OUT = path.join(HERE, 'shapes.json');

const MERGE = 0.1;        // endpoints closer than this are one point (S1 rounding)
const SNAP = 0.75;        // a free end this close to the inside of another piece is a T-junction near-miss
const ANG_MIN = 1.0;      // degrees: below this a node is already continuous
const ANG_MAX = 30.0;     // degrees: above this a node is a real corner
const LONG_L = 5.0;       // an S1 straight piece at least this long is a real straight stroke
const DUP_TOL = 0.3;      // a dropped duplicate lies within this of the piece it repeats
const SLIVER_MAX = 0.4;   // a dropped sliver is shorter than this
const CAP = 0.25;         // smoothing may move no piece further than this from its geometry after snaps
const ROLES = ['body', 'entry', 'exit', 'dot', 'breve', 'bar', 'tail'];
const CAPITALS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ';
const LOWERCASE = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

function die(msg) {
    const e = new Error(msg);
    e.extract = true;
    throw e;
}

// ---------- the source ----------

// Returns the S1 subpaths in document order, numbered from 0 the way every
// Phase 1 record numbers them: each <path> element in turn, split at each M.
function readSource(buf) {
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    if (sha !== SOURCE_SHA256) die('source sha256 is ' + sha + ', expected ' + SOURCE_SHA256 + ' (the file as downloaded)');
    const svg = buf.toString('utf8');
    const transforms = svg.match(/\btransform="[^"]*"/g) || [];
    transforms.forEach(function (t) {
        if (t !== 'transform="matrix(1.0 0.0 0.0 1.0 0.0 0.0)"') die('unexpected ' + t + ' in the source');
    });
    const subs = [];
    const re = /<path\b([\s\S]*?)\/>/g;
    let m;
    while ((m = re.exec(svg)) !== null) {
        const id = /\bid="([^"]*)"/.exec(m[1]);
        const d = /\bd="([^"]*)"/.exec(m[1]);
        if (!id || !d) die('a <path> without id or d');
        d[1].trim().split(/(?=M )/).forEach(function (part, k) {
            subs.push({ id: subs.length, element: id[1], k: k, d: part.trim(), segs: parseSubpath(part.trim(), subs.length) });
        });
    }
    if (subs.length !== SOURCE_SUBPATHS) die('source has ' + subs.length + ' subpaths, expected ' + SOURCE_SUBPATHS);
    return subs;
}

const NUM = /^-?\d+(?:\.\d+)?$/;

// One subpath, S1's grammar only: M x y, then L x y or C x1 y1 x2 y2 x y, then
// an optional Z. Segment k is the k-th drawn piece; a straight piece is held as
// a cubic with handles at its thirds. Z adds a closing piece only when the pen
// is not already back at the start.
function parseSubpath(d, sid) {
    const t = d.split(' ');
    const num = function (i) {
        if (!NUM.test(t[i] || '')) die('#' + sid + ': expected a number at token ' + i + ' of "' + d + '"');
        return Number(t[i]);
    };
    if (t[0] !== 'M') die('#' + sid + ': does not start with M');
    let cur = [num(1), num(2)];
    const start = cur;
    const segs = [];
    let i = 3;
    let closed = false;
    while (i < t.length) {
        if (t[i] === 'L') {
            const p = [num(i + 1), num(i + 2)];
            segs.push({ cmd: 'L', p: line(cur, p) });
            cur = p; i += 3;
        } else if (t[i] === 'C') {
            const a = [num(i + 1), num(i + 2)], b = [num(i + 3), num(i + 4)], c = [num(i + 5), num(i + 6)];
            segs.push({ cmd: 'C', p: [cur, a, b, c] });
            cur = c; i += 7;
        } else if (t[i] === 'Z' && i === t.length - 1) {
            if (Math.abs(cur[0] - start[0]) > 1e-6 || Math.abs(cur[1] - start[1]) > 1e-6) segs.push({ cmd: 'Z', p: line(cur, start) });
            closed = true; i += 1;
        } else {
            die('#' + sid + ': unexpected token "' + t[i] + '"');
        }
    }
    if (!segs.length) die('#' + sid + ': no segments');
    segs.closed = closed;
    return segs;
}

// ---------- geometry ----------

function line(a, b) {
    return [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + 2 * (b[0] - a[0]) / 3, a[1] + 2 * (b[1] - a[1]) / 3], b];
}
function bez(p, t) {
    const u = 1 - t;
    return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
            u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]];
}
function rev(p) { return [p[3], p[2], p[1], p[0]]; }
function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
function unit(v) { const n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n]; }
function tanStart(p) {
    for (let i = 1; i <= 3; i++) {
        const v = [p[i][0] - p[0][0], p[i][1] - p[0][1]];
        if (Math.hypot(v[0], v[1]) > 1e-6) return unit(v);
    }
    return [1, 0];
}
function tanEnd(p) {
    for (let i = 2; i >= 0; i--) {
        const v = [p[3][0] - p[i][0], p[3][1] - p[i][1]];
        if (Math.hypot(v[0], v[1]) > 1e-6) return unit(v);
    }
    return [1, 0];
}
function angle(u, v) { return Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) * 180 / Math.PI; }
function chord(p) { return dist(p[0], p[3]); }
function arcLength(p) {
    let s = 0, prev = p[0];
    for (let i = 1; i <= 200; i++) { const q = bez(p, i / 200); s += dist(prev, q); prev = q; }
    return s;
}
function closestT(p, q, n) {
    let best = null;
    for (let i = 0; i <= n; i++) {
        const dd = dist(bez(p, i / n), q);
        if (best === null || dd < best[0]) best = [dd, i / n];
    }
    return best;
}
// Largest distance from any sample of a to the nearest sample of b.
function oneWay(a, b) {
    const sb = [];
    for (let i = 0; i <= 200; i++) sb.push(bez(b, i / 200));
    let worst = 0;
    for (let i = 0; i <= 200; i++) {
        const x = bez(a, i / 200);
        let near = Infinity;
        sb.forEach(function (y) { near = Math.min(near, dist(x, y)); });
        worst = Math.max(worst, near);
    }
    return worst;
}
// Largest distance from any sample of a to the nearest sample of b, both ways.
function deviation(a, b) {
    const sa = [], sb = [];
    for (let i = 0; i <= 200; i++) { sa.push(bez(a, i / 200)); sb.push(bez(b, i / 200)); }
    const one = function (xs, ys) {
        let worst = 0;
        xs.forEach(function (x) {
            let near = Infinity;
            ys.forEach(function (y) { near = Math.min(near, dist(x, y)); });
            worst = Math.max(worst, near);
        });
        return worst;
    };
    return Math.max(one(sa, sb), one(sb, sa));
}
// Distance from point q to curve p: the nearest of 400 samples, refined by
// golden-section search on the parameter around it.
function pointToCurve(q, p) {
    let bi = 0, bd = Infinity;
    for (let i = 0; i <= 400; i++) { const d = dist(q, bez(p, i / 400)); if (d < bd) { bd = d; bi = i; } }
    let lo = Math.max(0, (bi - 1) / 400), hi = Math.min(1, (bi + 1) / 400);
    const G = (Math.sqrt(5) - 1) / 2;
    for (let k = 0; k < 40; k++) {
        const m1 = hi - G * (hi - lo), m2 = lo + G * (hi - lo);
        if (dist(q, bez(p, m1)) < dist(q, bez(p, m2))) hi = m2; else lo = m1;
    }
    return Math.min(bd, dist(q, bez(p, (lo + hi) / 2)));
}
// How far curve a lies from curve b, both ways: the largest distance from a
// point of either to the other curve (201 points each side).
function curveGap(a, b) {
    let w = 0;
    for (let i = 0; i <= 200; i++) {
        w = Math.max(w, pointToCurve(bez(a, i / 200), b), pointToCurve(bez(b, i / 200), a));
    }
    return w;
}
// The unit vector a fraction f of the way from unit vector u to unit vector v.
function slerp(u, v, f) {
    const g = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1])));
    if (g < 1e-9) return u;
    const s = Math.sin(g), wa = Math.sin((1 - f) * g) / s, wb = Math.sin(f * g) / s;
    return unit([wa * u[0] + wb * v[0], wa * u[1] + wb * v[1]]);
}
// Exact extent of a cubic on one axis: its endpoints and the roots of its
// derivative inside (0, 1).
function extent(p, ax) {
    const a = p[0][ax], b = p[1][ax], c = p[2][ax], d = p[3][ax];
    const ts = [0, 1];
    const A = -a + 3 * b - 3 * c + d, B = 2 * (a - 2 * b + c), C = b - a;
    if (Math.abs(A) < 1e-12) {
        if (Math.abs(B) > 1e-12) ts.push(-C / B);
    } else {
        const disc = B * B - 4 * A * C;
        if (disc >= 0) { const r = Math.sqrt(disc); ts.push((-B + r) / (2 * A), (-B - r) / (2 * A)); }
    }
    const vs = ts.filter(function (t) { return t >= 0 && t <= 1; }).map(function (t) { return bez(p, t)[ax]; });
    return [Math.min.apply(null, vs), Math.max.apply(null, vs)];
}

// ---------- number and path formatting ----------

function fmt(v) {
    let s = v.toFixed(7);
    if (s.indexOf('.') !== -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
}
function r4(v) { return Number(fmt(Math.round(v * 1e4) / 1e4)); }
function pt(q) { return [r4(q[0]), r4(q[1])]; }
function chainD(chain) {
    const it = chain.items;
    let s = 'M ' + fmt(it[0].p[0][0]) + ' ' + fmt(it[0].p[0][1]);
    it.forEach(function (x) {
        const q = x.p;
        if (x.cmd !== 'C' && !x.rebuilt) s += ' L ' + fmt(q[3][0]) + ' ' + fmt(q[3][1]);
        else s += ' C ' + [q[1], q[2], q[3]].map(function (v) { return fmt(v[0]) + ' ' + fmt(v[1]); }).join(' ');
    });
    if (chain.closed) s += ' Z';
    return s;
}
function pieceName(x) { return x.sid + '.' + x.k + (x.rev ? 'r' : ''); }

// ---------- rules ----------

const PIECE = /^(\d+)\.(\d+)(r?) ([a-z]+)$/;
const DROP = /^(\d+)(?:\.(\d+))?$/;

function readRules(src) {
    let rules;
    try { rules = JSON.parse(src); } catch (e) { die('rules.json does not parse: ' + e.message); }
    if (!rules || !Array.isArray(rules.forms) || !rules.rows) die('rules.json needs "rows" and "forms"');
    Object.keys(rules.rows).forEach(function (k) {
        const r = rules.rows[k];
        if (!r || typeof r.baseline !== 'number' || typeof r.xHeight !== 'number' || typeof r.note !== 'string') die('rules.json row ' + k + ' needs a numeric baseline and xHeight and a note');
    });
    const want = CAPITALS + LOWERCASE;
    const got = rules.forms.map(function (f) { return f.char; }).join('');
    if (got !== want) die('rules.json forms must be exactly ' + want + ' in that order; got ' + got);
    return rules;
}

// ---------- per form ----------

function buildForm(form, subs, rows) {
    const where = form.char + ': ';
    const row = rows[String(form.row)];
    if (!row) die(where + 'unknown row ' + form.row);
    if (typeof form.name !== 'string' || !form.name) die(where + 'needs a name');
    if (!Array.isArray(form.subpaths) || !form.subpaths.length) die(where + 'no subpaths');
    const own = {};
    form.subpaths.forEach(function (sid) {
        if (!Number.isInteger(sid) || !subs[sid]) die(where + 'unknown subpath ' + sid);
        if (own[sid]) die(where + 'subpath ' + sid + ' listed twice');
        own[sid] = true;
    });
    // Every segment of every own subpath: used exactly once, or dropped.
    const seen = {};
    const mark = function (sid, k, how) {
        const key = sid + '.' + k;
        if (seen[key]) die(where + 'segment ' + key + ' is ' + how + ' and also ' + seen[key]);
        seen[key] = how;
    };
    const chains = (form.chains || []).map(function (ch, ci) {
        if (!Array.isArray(ch.pieces) || !ch.pieces.length) die(where + 'chain ' + ci + ' has no pieces');
        const items = ch.pieces.map(function (s) {
            const m = PIECE.exec(s);
            if (!m) die(where + 'bad piece "' + s + '" (want "<subpath>.<segment>[r] <role>")');
            const sid = Number(m[1]), k = Number(m[2]);
            if (!own[sid]) die(where + 'piece ' + s + ' uses subpath ' + sid + ', which is not in this form');
            const seg = subs[sid].segs[k];
            if (!seg) die(where + 'piece ' + s + ': subpath ' + sid + ' has no segment ' + k);
            if (ROLES.indexOf(m[4]) === -1) die(where + 'piece ' + s + ': unknown role ' + m[4]);
            mark(sid, k, 'used in chain ' + ci);
            const p = seg.p.map(function (q) { return [q[0], q[1]]; });
            return { sid: sid, k: k, rev: m[3] === 'r', role: m[4], cmd: seg.cmd, p: m[3] === 'r' ? rev(p) : p };
        });
        return { items: items, closed: !!ch.closed, nosmooth: !!ch.nosmooth, note: ch.note || null };
    });
    if (!chains.length) die(where + 'no chains');
    const dropped = (form.dropped || []).map(function (dr) {
        const m = DROP.exec(String(dr.piece));
        if (!m) die(where + 'bad dropped piece "' + dr.piece + '"');
        const sid = Number(m[1]);
        if (!own[sid]) die(where + 'dropped ' + dr.piece + ' is not in this form');
        const ks = m[2] === undefined ? subs[sid].segs.map(function (_, k) { return k; }) : [Number(m[2])];
        ks.forEach(function (k) {
            if (!subs[sid].segs[k]) die(where + 'dropped ' + dr.piece + ': no segment ' + k);
            mark(sid, k, 'dropped');
        });
        if (['duplicate', 'sliver', 'other'].indexOf(dr.kind) === -1) die(where + 'dropped ' + dr.piece + ': kind must be duplicate, sliver or other');
        if (!dr.reason) die(where + 'dropped ' + dr.piece + ' needs a reason');
        const segs = ks.map(function (k) { return subs[sid].segs[k].p; });
        const len = segs.reduce(function (s, p) { return s + arcLength(p); }, 0);
        const out = { piece: String(dr.piece), kind: dr.kind, length: r4(len) };
        if (dr.kind === 'sliver' && !(len < SLIVER_MAX)) die(where + 'dropped sliver ' + dr.piece + ' is ' + r4(len) + ' long, not under ' + SLIVER_MAX);
        if (dr.kind === 'duplicate') {
            const o = PIECE.exec(String(dr.of) + ' body');
            if (!o || ks.length !== 1) die(where + 'dropped duplicate ' + dr.piece + ' must name one segment and the piece it repeats ("of")');
            const other = subs[Number(o[1])] && subs[Number(o[1])].segs[Number(o[2])];
            if (!other) die(where + 'dropped duplicate ' + dr.piece + ': unknown "of" ' + dr.of);
            const dev = deviation(segs[0], other.p);
            if (!(dev <= DUP_TOL)) die(where + 'dropped duplicate ' + dr.piece + ' deviates ' + r4(dev) + ' from ' + dr.of + ', more than ' + DUP_TOL);
            out.of = String(dr.of);
            out.deviation = r4(dev);
        }
        if (dr.kind === 'other') {
            const o = PIECE.exec(String(dr.along) + ' body');
            const other = o && subs[Number(o[1])] && subs[Number(o[1])].segs[Number(o[2])];
            if (!other) die(where + 'dropped ' + dr.piece + ' (kind other) must name, in "along", the kept segment it lies on');
            const far = Math.max.apply(null, segs.map(function (p) { return oneWay(p, other.p); }));
            if (!(far <= DUP_TOL)) die(where + 'dropped ' + dr.piece + ' (kind other) lies up to ' + r4(far) + ' from ' + dr.along + ', more than ' + DUP_TOL);
            out.along = String(dr.along);
            out.distance = r4(far);
        }
        out.reason = dr.reason;
        return out;
    });
    form.subpaths.forEach(function (sid) {
        subs[sid].segs.forEach(function (_, k) {
            if (!seen[sid + '.' + k]) die(where + 'segment ' + sid + '.' + k + ' is neither used nor dropped');
        });
    });
    (form.dropped || []).forEach(function (dr) {
        if (dr.kind === 'duplicate' && !/^used/.test(seen[String(dr.of).replace(/r$/, '')] || '')) die(where + 'dropped duplicate ' + dr.piece + ' repeats ' + dr.of + ', which is not used');
        if (dr.kind === 'other' && !/^used/.test(seen[String(dr.along).replace(/r$/, '')] || '')) die(where + 'dropped ' + dr.piece + ' lies along ' + dr.along + ', which is not used');
    });
    // free chain ends that keep S1's own gap (never snapped)
    const keepFree = {};
    (form.keepFree || []).forEach(function (k) {
        const m = /^(\d+)\.(\d+) (start|end)$/.exec(String(k));
        if (!m) die(where + 'bad keepFree "' + k + '" (want "<subpath>.<segment> start|end", the end as S1 draws the segment)');
        let hit = null;
        chains.forEach(function (c, ci) {
            c.items.forEach(function (x, i) {
                if (x.sid !== Number(m[1]) || x.k !== Number(m[2])) return;
                const chainEnd = (m[3] === 'end') !== x.rev ? 'end' : 'start';
                const free = chainEnd === 'start' ? i === 0 : i === c.items.length - 1;
                if (!free || c.closed) die(where + 'keepFree ' + k + ' is not a free chain end');
                hit = ci + ':' + chainEnd;
            });
        });
        if (!hit) die(where + 'keepFree ' + k + ' names a piece that is not in a chain');
        keepFree[hit] = String(k);
    });
    return { chains: chains, dropped: dropped, row: row, keepFree: keepFree };
}

function isInternal(a, b) {
    if (a.sid !== b.sid || a.rev !== b.rev) return false;
    return b.k === a.k + (a.rev ? -1 : 1);
}

function processForm(form, subs, rows) {
    const where = form.char + ': ';
    const built = buildForm(form, subs, rows);
    const chains = built.chains;
    const log = { merges: [], snaps: [], keptFree: [], nodes: [], continuous: 0, rebuilt: [] };

    // 1. continuity inside each chain: exact, or merged under MERGE
    chains.forEach(function (c, ci) {
        const it = c.items;
        const pairs = [];
        for (let i = 0; i + 1 < it.length; i++) pairs.push([i, i + 1]);
        if (c.closed) pairs.push([it.length - 1, 0]);
        pairs.forEach(function (ab) {
            const a = it[ab[0]], b = it[ab[1]];
            const gap = dist(a.p[3], b.p[0]);
            if (gap < 1e-6) return;
            if (gap >= MERGE) die(where + 'chain ' + ci + ': ' + pieceName(a) + ' ends ' + r4(gap) + ' from the start of ' + pieceName(b));
            const dx = a.p[3][0] - b.p[0][0], dy = a.p[3][1] - b.p[0][1];
            b.p = b.cmd === 'C' ? [a.p[3], [b.p[1][0] + dx, b.p[1][1] + dy], b.p[2], b.p[3]] : line(a.p[3], b.p[3]);
            log.merges.push({ at: pt(a.p[3]), moved: pieceName(b) + ' start', by: r4(gap) });
        });
    });

    // 2. a free chain end that nearly meets another piece of the form
    chains.forEach(function (c, ci) {
        if (c.closed || c.nosmooth) return;
        const it = c.items;
        ['start', 'end'].forEach(function (end) {
            const piece = end === 'start' ? it[0] : it[it.length - 1];
            const q = end === 'start' ? piece.p[0] : piece.p[3];
            let best = null;
            chains.forEach(function (c2, cj) {
                if (cj === ci || c2.nosmooth) return;
                c2.items.forEach(function (other, jj) {
                    const r = closestT(other.p, q, 1000);
                    if (best === null || r[0] < best[0]) best = [r[0], r[1], cj, jj];
                });
            });
            if (!best) return;
            if (built.keepFree[ci + ':' + end]) {
                const o = chains[best[2]].items[best[3]];
                log.keptFree.push({ end: built.keepFree[ci + ':' + end], at: pt(q), nearest: pieceName(o), distance: r4(best[0]) });
                return;
            }
            // a T-junction near-miss (closest point inside the other piece) up
            // to SNAP, or a near-coincident endpoint under MERGE; a spur tip
            // next to an endpoint is neither and stays where S1 put it
            const interior = best[1] > 0.01 && best[1] < 0.99;
            if (!(best[0] > 1e-3 && ((interior && best[0] <= SNAP) || best[0] < MERGE))) return;
            const o = chains[best[2]].items[best[3]];
            const tgt = bez(o.p, best[1]);
            const dx = tgt[0] - q[0], dy = tgt[1] - q[1];
            const p = piece.p;
            // a straight piece stays straight: its handles go back to the thirds of
            // the line it is now drawn on, so later angles read the drawn direction
            if (piece.cmd !== 'C') piece.p = end === 'start' ? line(tgt, p[3]) : line(p[0], tgt);
            else if (end === 'start') piece.p = [tgt, [p[1][0] + dx, p[1][1] + dy], p[2], p[3]];
            else piece.p = [p[0], p[1], [p[2][0] + dx, p[2][1] + dy], tgt];
            log.snaps.push({ piece: pieceName(piece), end: end, onto: pieceName(o), by: r4(best[0]), from: pt(q), to: pt(tgt) });
        });
    });

    // 3. nodes: classify, then smooth the artefacts, splitting each turn by arc
    // length and capping the total move of every piece from its reference
    let order = 0;
    const handleLen = function (x, which) {
        const p = x.p;
        if (x.cmd !== 'C') return chord(p) / 3;
        return (which === 'start' ? dist(p[1], p[0]) : dist(p[3], p[2])) || chord(p) / 3;
    };
    const turnedTo = function (x, which, t) {
        const p = x.p, l = handleLen(x, which);
        return which === 'start' ? [p[0], [p[0][0] + t[0] * l, p[0][1] + t[1] * l], p[2], p[3]]
                                 : [p[0], p[1], [p[3][0] - t[0] * l, p[3][1] - t[1] * l], p[3]];
    };
    chains.forEach(function (c) {
        const it = c.items;
        it.forEach(function (x) { x.ref = x.p.map(function (q) { return [q[0], q[1]]; }); x.refLen = arcLength(x.p); });
        if (c.nosmooth) return;
        const pairs = [];
        for (let i = 0; i + 1 < it.length; i++) pairs.push([i, i + 1]);
        if (c.closed) pairs.push([it.length - 1, 0]);
        const nodeAngle = function (ab) { return angle(tanEnd(it[ab[0]].p), tanStart(it[ab[1]].p)); };
        const before = pairs.map(nodeAngle);
        const turned = [];
        pairs.forEach(function (ab) {
            const a = it[ab[0]], b = it[ab[1]];
            const ta = tanEnd(a.p), tb = tanStart(b.p);
            const g = angle(ta, tb);
            const internal = isInternal(a, b);
            const straight = a.cmd !== 'C' || b.cmd !== 'C';
            order += 1;
            if (g < ANG_MIN) { log.continuous += 1; return; }
            let kind, action;
            if (g > ANG_MAX) { kind = 'corner'; action = 'kept'; }
            else if (straight) { kind = 'straight-piece kink'; action = 'smoothed'; }
            else if (!internal) { kind = 'split or closure point'; action = 'smoothed'; }
            else { kind = 'corner inside one S1 curve'; action = 'kept'; }
            const node = { order: order, at: pt(a.p[3]), between: [pieceName(a), pieceName(b)], angle: Number(g.toFixed(1)), kind: kind, action: action };
            log.nodes.push(node);
            if (action !== 'smoothed') return;
            const longA = a.cmd !== 'C' && chord(a.p) >= LONG_L;
            const longB = b.cmd !== 'C' && chord(b.p) >= LONG_L;
            if (longA && longB) { node.action = 'kept (two long straight pieces)'; return; }
            // fa: the share of the turn piece a takes; b takes the rest
            const fa = longA ? 0 : longB ? 1 : b.refLen / (a.refLen + b.refLen);
            node.arcLengths = [r4(a.refLen), r4(b.refLen)];
            node.split = [r4(fa), r4(1 - fa)];
            const t = slerp(ta, tb, fa);
            const moves = [];
            if (fa > 0) moves.push({ x: a, i: ab[0], end: 'end', p: turnedTo(a, 'end', t) });
            if (fa < 1) moves.push({ x: b, i: ab[1], end: 'start', p: turnedTo(b, 'start', t) });
            moves.forEach(function (m) { m.d = curveGap(m.p, m.x.ref); });
            const over = moves.filter(function (m) { return m.d > CAP; });
            if (over.length) {
                node.action = 'kept: smoothing would move ' + over.map(function (m) { return pieceName(m.x) + ' ' + r4(m.d); }).join(' and ') +
                              ' from reference, over the ' + CAP + ' cap';
                node.capped = over.map(function (m) { return { piece: pieceName(m.x), distance: r4(m.d) }; });
                return;
            }
            moves.forEach(function (m) {
                m.x.p = m.p;
                if (m.x.cmd !== 'C' && !m.x.rebuilt) { m.x.rebuilt = true; log.rebuilt.push(pieceName(m.x)); }
                turned.push({ node: node, i: m.i, end: m.end });
            });
            node.action = longA || longB ? 'smoothed: ' + pieceName(longA ? b : a) + ' turned to the long straight ' + pieceName(longA ? a : b)
                                         : 'smoothed: turn split by arc length';
            node.moved = moves.map(function (m) { return { piece: pieceName(m.x), fromReference: r4(m.d) }; });
        });
        // the other end of every turned piece: the angle there before and after
        turned.forEach(function (tr) {
            const x = it[tr.i];
            const k = pairs.findIndex(function (ab) { return tr.end === 'end' ? ab[1] === tr.i : ab[0] === tr.i; });
            const rec = { piece: pieceName(x) };
            if (k === -1) rec.farEnd = 'free end';
            else {
                const after = nodeAngle(pairs[k]);
                rec.farEnd = [pieceName(it[pairs[k][0]]), pieceName(it[pairs[k][1]])];
                rec.before = Number(before[k].toFixed(2));
                rec.after = Number(after.toFixed(2));
                if (after > ANG_MIN && after > before[k] + 0.05) rec.flag = 'rose above ' + ANG_MIN + ' degrees';
            }
            (tr.node.farEnds = tr.node.farEnds || []).push(rec);
        });
    });
    // every piece against its reference, after all smoothing: the cap must hold
    let maxMove = { piece: null, distance: 0 };
    chains.forEach(function (c) {
        c.items.forEach(function (x) {
            const d = curveGap(x.p, x.ref);
            if (d > CAP) die(where + 'piece ' + pieceName(x) + ' ends ' + r4(d) + ' from its reference geometry, over the ' + CAP + ' cap');
            if (d > maxMove.distance) maxMove = { piece: pieceName(x), distance: r4(d) };
        });
    });

    // 4. output
    let bb = [Infinity, Infinity, -Infinity, -Infinity];
    chains.forEach(function (c) {
        c.items.forEach(function (x) {
            const ex = extent(x.p, 0), ey = extent(x.p, 1);
            bb = [Math.min(bb[0], ex[0]), Math.min(bb[1], ey[0]), Math.max(bb[2], ex[1]), Math.max(bb[3], ey[1])];
        });
    });
    const paths = chains.map(function (c) {
        const roles = [];
        c.items.forEach(function (x) { if (roles.indexOf(x.role) === -1) roles.push(x.role); });
        const o = {
            d: chainD(c),
            closed: c.closed,
            roles: roles,
            pieces: c.items.map(function (x) {
                return { s1: pieceName(x), role: x.role, cmd: x.cmd, rebuilt: !!x.rebuilt };
            }),
        };
        if (c.note) o.note = c.note;
        return o;
    });
    return {
        char: form.char,
        name: form.name,
        case: CAPITALS.indexOf(form.char) !== -1 ? 'capital' : 'lowercase',
        row: form.row,
        baseline: built.row.baseline,
        xHeight: built.row.xHeight,
        subpaths: form.subpaths.slice().sort(function (a, b) { return a - b; }),
        d: paths.map(function (p) { return p.d; }).join(' '),
        bbox: bb.map(r4),
        paths: paths,
        rules: {
            chaining: chains.map(function (c) { return c.items.map(function (x) { return pieceName(x) + ' ' + x.role; }).join(', ') + (c.closed ? ' (closed)' : ''); }),
            dropped: built.dropped,
            merges: log.merges,
            snaps: log.snaps,
            keptFree: log.keptFree,
            smoothing: { continuousNodes: log.continuous, nodes: log.nodes, rebuiltAsCubic: log.rebuilt, maxMoveFromReference: maxMove },
        },
        ambiguities: (form.ambiguities || []).map(function (a) {
            if (!a.issue || !a.choice || !a.why) die(where + 'each ambiguity needs issue, choice and why');
            return { issue: a.issue, choice: a.choice, why: a.why };
        }),
    };
}

// ---------- whole file ----------

function extract(sourceBuf, rulesSrc) {
    const subs = readSource(sourceBuf);
    const rules = readRules(rulesSrc);
    const owner = {};
    rules.forms.forEach(function (f) {
        (f.subpaths || []).forEach(function (sid) {
            if (owner[sid] !== undefined) die('subpath ' + sid + ' is in both ' + owner[sid] + ' and ' + f.char);
            owner[sid] = f.char;
        });
    });
    const missing = subs.filter(function (s) { return owner[s.id] === undefined; }).map(function (s) { return s.id; });
    if (missing.length) die(missing.length + ' subpath(s) in no form: ' + missing.join(' '));
    // S1 subpaths that continue across two forms, split where S1 splits them
    const splits = (rules.splits || []).map(function (s) {
        const a = subs[s.ends], b = subs[s.starts];
        if (!a || !b) die('split: unknown subpath');
        const end = a.segs[a.segs.length - 1].p[3], start = b.segs[0].p[0];
        if (dist(end, start) > 1e-6 || dist(end, s.at) > 1e-6) die('split at ' + s.at + ': #' + s.ends + ' does not end, and #' + s.starts + ' start, exactly there');
        if (typeof s.note !== 'string' || !s.note) die('split at ' + s.at + ' needs a note');
        if (owner[s.ends] !== s.forms[0] || owner[s.starts] !== s.forms[1]) die('split at ' + s.at + ': owners do not match ' + s.forms.join(' and '));
        return { forms: s.forms, ends: s.ends, starts: s.starts, at: s.at, note: s.note };
    });
    const forms = rules.forms.map(function (f) { return processForm(f, subs, rules.rows); });
    return {
        meta: {
            source: 'source/Russian_Cursive_Cyrillic.svg (S1), sha256 ' + SOURCE_SHA256 + '; see source/source.txt',
            generator: 'scripts/cursive/extract.js from rules.json',
            coordinates: 'S1 units, y grows downward; no scaling, no slant change (S1 slants about 22.5 degrees); S1 draws every stroke 1.0 wide',
            shapeOnly: 'chains are continuous runs of S1 pieces; their order and direction carry no stroke order or pen direction',
            subpathNumbering: 'each <path> element of the source in document order, split at each M, counted from 0; segment k is the k-th drawn piece of its subpath, a closing Z counting only when it draws',
            thresholds: { merge: MERGE, snap: SNAP, smoothAngleMin: ANG_MIN, smoothAngleMax: ANG_MAX, longStraight: LONG_L, duplicateTolerance: DUP_TOL, sliverMax: SLIVER_MAX, smoothingCap: CAP },
            smoothing: 'both handles turned to one common tangent, the turn split by arc length (piece a turns lb / (la + lb) of the angle, piece b la / (la + lb)); a long straight piece never moves and its neighbour takes the whole turn; nodes in a fixed order (chain by chain, along each chain, a closed chain\'s closing node last), and a node keeps its corner if smoothing it would move any piece more than the cap from its geometry after snaps, measured cumulatively; the run fails if any piece ends over the cap',
            rows: rules.rows,
            splits: splits,
            counts: { forms: forms.length, capitals: CAPITALS.length, lowercase: LOWERCASE.length, subpaths: subs.length },
        },
        forms: forms,
    };
}

// JSON with short arrays on one line, so the file stays readable.
function serialise(v, ind) {
    ind = ind || '';
    if (v === undefined || (typeof v === 'number' && !isFinite(v))) die('internal: a value to write is ' + v);
    if (Array.isArray(v)) {
        if (v.every(function (x) { return x === null || typeof x !== 'object'; })) return '[' + v.map(function (x) { return JSON.stringify(x); }).join(', ') + ']';
        return '[\n' + v.map(function (x) { return ind + '  ' + serialise(x, ind + '  '); }).join(',\n') + '\n' + ind + ']';
    }
    if (v && typeof v === 'object') {
        const keys = Object.keys(v);
        if (!keys.length) return '{}';
        return '{\n' + keys.map(function (k) { return ind + '  ' + JSON.stringify(k) + ': ' + serialise(v[k], ind + '  '); }).join(',\n') + '\n' + ind + '}';
    }
    return JSON.stringify(v);
}

function main(argv) {
    let out = OUT, rulesFile = RULES, check = false;
    for (let i = 0; i < argv.length; i++) {
        const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
        if (argv[i] === '--out' && value) { out = path.resolve(value); i++; }
        else if (argv[i] === '--rules' && value) { rulesFile = path.resolve(value); i++; }
        else if (argv[i] === '--check') check = true;
        else die('unknown or incomplete argument ' + argv[i] + ' (use --out FILE, --rules FILE or --check)');
    }
    if (check && out !== OUT) die('--check compares with scripts/cursive/shapes.json; it does not take --out');
    const text = serialise(extract(fs.readFileSync(SOURCE), fs.readFileSync(rulesFile, 'utf8'))) + '\n';
    if (check) {
        const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
        if (cur !== text) die('shapes.json is not what extract.js produces from rules.json; regenerate it');
        console.log('shapes.json is current');
        return;
    }
    fs.writeFileSync(out, text);
    console.log('wrote ' + out + ' (' + Buffer.byteLength(text) + ' bytes, sha256 ' + crypto.createHash('sha256').update(text).digest('hex') + ')');
}

if (require.main === module) {
    try {
        main(process.argv.slice(2));
    } catch (e) {
        if (!e.extract) throw e;
        console.error('EXTRACT FAILED: ' + e.message);
        process.exit(1);
    }
}

module.exports = { readSource: readSource, processForm: processForm, extract: extract, serialise: serialise, CAPITALS: CAPITALS, LOWERCASE: LOWERCASE };
