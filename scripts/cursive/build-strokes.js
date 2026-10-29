#!/usr/bin/env node
//
// Derives a cursive widget's stroke table from three files in this folder:
//   shapes.json        S1's letterforms (layer 1), shape only;
//   stroke-plans.json  for each letter, its strokes as S1 pieces in drawing
//                      order with a reverse flag, each step citing the
//                      evidence.json record it follows (layer 2 to layer 3);
//   stroke-frame.json  the widget's frame: viewBox, baseline, x-height, slant
//                      and the table's name and letter order.
// The output is the table's text, ready to sit in js/article-scripts.js in
// the grammar scripts/pre-render.js reads: integer, non-negative coordinates,
// one path per stroke, nothing hand-edited.
//
// Fails closed (exit 2, nothing written) unless, for every letter:
//   - every step's citation is real: its "evidence" text equals the cited
//     evidence.json field word for word, and a segment step's direction is
//     the one evidence.json records for that segment;
//   - the cited segments run in evidence order, and every segment is cited
//     (a step may cite several consecutive segments when one S1 piece draws
//     them all; each one's text and direction is still checked);
//   - a plan's "splits" cut an S1 piece only where another piece of the form
//     starts or ends on it (within 0.01 S1 units), each with a reason; the cut
//     is exact (de Casteljau) and shapes.json is not changed;
//   - the number of strokes is evidence.json's stroke count;
//   - every S1 piece of the form is drawn, and a piece drawn a second time
//     sits in a step marked "retrace": true (and a retrace step redraws only
//     pieces already drawn);
//   - consecutive pieces in a stroke meet within 0.01 S1 units;
//   - every coordinate is a non-negative integer and every stroke stays
//     inside the viewBox once drawn (the stroke width and slant included).
// Deterministic: the same inputs give the same bytes.
//
// HAND-RUN. Never part of the Netlify build, which may use checkTable() to
// require that the table in js/article-scripts.js is this script's output.
//
// Usage, from any directory:
//   node scripts/cursive/build-strokes.js                print the table
//   node scripts/cursive/build-strokes.js --report       print the clearance and stroke report
//   node scripts/cursive/build-strokes.js --check FILE   exit 0 if FILE holds the table byte for byte
//   node scripts/cursive/build-strokes.js --out FILE     write the table to a new file inside the harness
//                                                        (output.js rules; never overwrites)
//   --plans FILE / --frame FILE read other plan or frame files; --letters и,й limits the letters
//   (both are for drafting; the table is always derived from the files in this folder).
//
// Dependencies: node. No packages.

const fs = require('fs');
const path = require('path');
const { OVERRIDE, checkDestination } = require('./output.js');

const HERE = __dirname;
const GAP_MAX = 0.01;
const DIRECTIONS = ['ARROWED', 'FORCED', 'JOIN', 'INFERRED'];
const FIELDS = ['joiningMarks.entry', 'joiningMarks.exit', 'openPoints', 'penLifts', 'structure.difference', 'structure.consequence'];

class PlanError extends Error {}
function fail(msg) { throw new PlanError(msg); }

// ---------- geometry ----------

// A shapes.json path as drawn segments: { cmd, p: [start, (c1, c2,) end] }.
function segments(d) {
    const t = d.split(' ');
    const out = [];
    let cur = null;
    for (let i = 0; i < t.length;) {
        const c = t[i];
        if (c === 'M') { cur = [Number(t[i + 1]), Number(t[i + 2])]; i += 3; }
        else if (c === 'L') { const q = [Number(t[i + 1]), Number(t[i + 2])]; out.push({ cmd: 'L', p: [cur, q] }); cur = q; i += 3; }
        else if (c === 'C') {
            const p = [cur, [Number(t[i + 1]), Number(t[i + 2])], [Number(t[i + 3]), Number(t[i + 4])], [Number(t[i + 5]), Number(t[i + 6])]];
            out.push({ cmd: 'C', p: p }); cur = p[3]; i += 7;
        } else fail('shapes.json path command ' + JSON.stringify(c) + ' is not M, L or C');
    }
    return out;
}
function reversed(s) { return { cmd: s.cmd, p: s.p.slice().reverse() }; }
function at(s, u) {
    const p = s.p;
    if (s.cmd === 'L') return [p[0][0] + (p[1][0] - p[0][0]) * u, p[0][1] + (p[1][1] - p[0][1]) * u];
    const v = 1 - u;
    return [0, 1].map(function (k) { return v * v * v * p[0][k] + 3 * v * v * u * p[1][k] + 3 * v * u * u * p[2][k] + u * u * u * p[3][k]; });
}

// The cubic (or line) from parameter a to b of s, exactly.
function subSegment(s, a, b) {
    if (s.cmd === 'L') return { cmd: 'L', p: [at(s, a), at(s, b)] };
    const lerp = function (p, q, u) { return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]; };
    const splitAt = function (p, u) {
        const ab = lerp(p[0], p[1], u), bc = lerp(p[1], p[2], u), cd = lerp(p[2], p[3], u);
        const abc = lerp(ab, bc, u), bcd = lerp(bc, cd, u), m = lerp(abc, bcd, u);
        return [[p[0], ab, abc, m], [m, bcd, cd, p[3]]];
    };
    let p = s.p;
    if (b < 1) p = splitAt(p, b)[0];
    if (a > 0) p = splitAt(p, a / b)[1];
    return { cmd: 'C', p: p };
}
// The parameter where s passes closest to point q, and that distance.
function closestT(s, q) {
    let best = 0, bd = Infinity;
    for (let i = 0; i <= 2000; i++) { const u = i / 2000, r = at(s, u), d = Math.hypot(r[0] - q[0], r[1] - q[1]); if (d < bd) { bd = d; best = u; } }
    let lo = Math.max(0, best - 1 / 2000), hi = Math.min(1, best + 1 / 2000);
    const g = (Math.sqrt(5) - 1) / 2;
    const f = function (u) { const r = at(s, u); return Math.hypot(r[0] - q[0], r[1] - q[1]); };
    for (let i = 0; i < 80; i++) { const c = hi - g * (hi - lo), d = lo + g * (hi - lo); if (f(c) < f(d)) hi = d; else lo = c; }
    const t = (lo + hi) / 2;
    return { t: t, dist: f(t) };
}

// ---------- inputs ----------

function readJson(f) { return JSON.parse(fs.readFileSync(f, 'utf8')); }
function loadInputs(opts) {
    opts = opts || {};
    return {
        shapes: readJson(path.join(HERE, 'shapes.json')),
        evidence: readJson(path.join(HERE, 'evidence.json')),
        plans: readJson(opts.plans || path.join(HERE, 'stroke-plans.json')),
        frame: readJson(opts.frame || path.join(HERE, 'stroke-frame.json')),
    };
}
function fieldOf(ev, name) {
    return name.split('.').reduce(function (o, k) { return o === undefined || o === null ? undefined : o[k]; }, ev);
}

// ---------- plans: validate one letter, return its strokes as S1 segments ----------

function planLetter(ch, inputs) {
    const where = 'stroke-plans.json ' + ch + ': ';
    const forms = inputs.shapes.forms.filter(function (f) { return f.char === ch; });
    if (forms.length !== 1) fail(where + 'shapes.json has ' + forms.length + ' forms for ' + ch);
    const form = forms[0];
    const evs = inputs.evidence.forms.filter(function (f) { return f.char === ch && f.case === form.case; });
    if (evs.length !== 1) fail(where + 'evidence.json has ' + evs.length + ' records for ' + ch);
    const ev = evs[0];
    const plan = inputs.plans.letters && inputs.plans.letters[ch];
    if (!plan) fail(where + 'no plan');
    // every S1 piece of the form, by name
    const pieces = {};
    form.paths.forEach(function (p, ci) {
        const segs = segments(p.d);
        if (segs.length !== p.pieces.length) fail(where + 'shapes.json chain ' + ci + ' has ' + segs.length + ' segments but ' + p.pieces.length + ' pieces');
        segs.forEach(function (s, k) {
            const n = p.pieces[k].s1;
            if (pieces[n]) fail(where + 'shapes.json names two pieces ' + n);
            pieces[n] = { seg: s, role: p.pieces[k].role, used: 0 };
        });
    });
    // Splits: an S1 piece cut where another piece starts or ends on it.
    if (plan.splits !== undefined && !Array.isArray(plan.splits)) fail(where + '"splits" must be a list');
    (plan.splits || []).forEach(function (sp, k) {
        const sw = where + 'split ' + (k + 1) + ': ';
        if (!sp || typeof sp.piece !== 'string' || !sp.at || typeof sp.why !== 'string' || !sp.why.trim()) fail(sw + 'must be { "piece", "at": { "startOf" | "endOf": piece }, "why" }');
        const pc = pieces[sp.piece];
        if (!pc) fail(sw + 'no piece ' + sp.piece + ' (or it was already split)');
        const keys = Object.keys(sp.at);
        if (keys.length !== 1 || (keys[0] !== 'startOf' && keys[0] !== 'endOf')) fail(sw + '"at" must name exactly one of startOf, endOf');
        const other = pieces[sp.at[keys[0]]];
        if (!other || sp.at[keys[0]] === sp.piece) fail(sw + 'no other piece ' + sp.at[keys[0]]);
        const q = keys[0] === 'startOf' ? other.seg.p[0] : other.seg.p[other.seg.p.length - 1];
        const c = closestT(pc.seg, q);
        if (c.dist > GAP_MAX) fail(sw + sp.at[keys[0]] + ' does not ' + (keys[0] === 'startOf' ? 'start' : 'end') + ' on ' + sp.piece + ' (closest ' + c.dist.toFixed(4) + ' S1 units, at most ' + GAP_MAX + ')');
        if (c.t < 0.02 || c.t > 0.98) fail(sw + 'the cut would fall at the end of ' + sp.piece + ' (t=' + c.t.toFixed(4) + '); no split is needed');
        const a = subSegment(pc.seg, 0, c.t), b = subSegment(pc.seg, c.t, 1);
        a.p[a.p.length - 1] = q.slice(); b.p[0] = q.slice();    // both halves meet exactly at the junction
        delete pieces[sp.piece];
        pieces[sp.piece + '/1'] = { seg: a, role: pc.role, used: 0 };
        pieces[sp.piece + '/2'] = { seg: b, role: pc.role, used: 0 };
    });
    if (!Array.isArray(plan.strokes) || plan.strokes.length !== ev.strokeNumbers.count) {
        fail(where + (Array.isArray(plan.strokes) ? plan.strokes.length : 'no') + ' strokes, but evidence.json records ' + ev.strokeNumbers.count);
    }
    let lastSeg = -1;
    const cited = new Set();
    const strokes = plan.strokes.map(function (st, si) {
        const sw = where + 'stroke ' + (si + 1) + ': ';
        if (st.stroke !== si + 1) fail(sw + '"stroke" must be ' + (si + 1));
        if (!Array.isArray(st.steps) || !st.steps.length) fail(sw + 'no steps');
        const segs = [];
        const names = [];
        st.steps.forEach(function (step, ti) {
            const tw = sw + 'step ' + (ti + 1) + ': ';
            if (!Array.isArray(step.direction) && DIRECTIONS.indexOf(step.direction) === -1) fail(tw + 'direction must be one of ' + DIRECTIONS.join(', '));
            const multi = Array.isArray(step.follows);
            const m = multi ? null : /^segments\[(\d+)\]$/.exec(step.follows || '');
            if (multi) {
                // one S1 piece drawing several consecutive segments: every one cited, in order
                if (step.follows.length < 2 || !Array.isArray(step.evidence) || !Array.isArray(step.direction) ||
                    step.evidence.length !== step.follows.length || step.direction.length !== step.follows.length) {
                    fail(tw + 'a step citing several segments lists them in "follows" with matching "evidence" and "direction" lists');
                }
                if (step.pieces && step.pieces.length !== 1) fail(tw + 'a step may cite several segments only when one piece draws them all');
                step.follows.forEach(function (f, j) {
                    const mm = /^segments\[(\d+)\]$/.exec(f);
                    if (!mm) fail(tw + 'a list in "follows" may hold only segments[N]');
                    const k = Number(mm[1]), seg = ev.segments[k];
                    if (!seg) fail(tw + 'evidence.json has no segments[' + k + ']');
                    if (step.evidence[j] !== seg.segment) fail(tw + 'evidence text does not match segments[' + k + ']: ' + JSON.stringify(seg.segment));
                    if (step.direction[j] !== seg.direction) fail(tw + 'segments[' + k + '] is ' + seg.direction + ' in evidence.json, the plan says ' + step.direction[j]);
                    if (j > 0 && k !== lastSeg + 1) fail(tw + 'the segments in one step must be consecutive');
                    if (j === 0 && k < lastSeg) fail(tw + 'cites segments[' + k + '] after segments[' + lastSeg + ']; segments must be followed in evidence order');
                    lastSeg = k;
                    cited.add(k);
                });
            } else if (m) {
                const k = Number(m[1]);
                const seg = ev.segments[k];
                if (!seg) fail(tw + 'evidence.json has no segments[' + k + ']');
                if (step.evidence !== seg.segment) fail(tw + 'evidence text does not match segments[' + k + ']: ' + JSON.stringify(seg.segment));
                if (step.direction !== seg.direction) fail(tw + 'segments[' + k + '] is ' + seg.direction + ' in evidence.json, the plan says ' + step.direction);
                if (k < lastSeg) fail(tw + 'cites segments[' + k + '] after segments[' + lastSeg + ']; segments must be followed in evidence order');
                lastSeg = k;
                cited.add(k);
            } else {
                if (FIELDS.indexOf(step.follows) === -1) fail(tw + 'follows must be segments[N] or one of ' + FIELDS.join(', '));
                if (step.evidence !== fieldOf(ev, step.follows)) fail(tw + 'evidence text does not match ' + step.follows + ': ' + JSON.stringify(fieldOf(ev, step.follows)));
                if (step.direction === 'ARROWED' || step.direction === 'FORCED') fail(tw + step.direction + ' must cite a segment; use JOIN or INFERRED');
                if (step.direction === 'JOIN' && step.follows.indexOf('joiningMarks.') !== 0) fail(tw + 'a JOIN step must cite joiningMarks.entry or joiningMarks.exit');
                if (step.direction === 'INFERRED' && (typeof step.why !== 'string' || !step.why.trim())) fail(tw + 'an INFERRED step needs a "why"');
            }
            if (step.retrace !== undefined && typeof step.retrace !== 'boolean') fail(tw + '"retrace" must be true or false');
            if (!Array.isArray(step.pieces) || !step.pieces.length) fail(tw + 'no pieces');
            step.pieces.forEach(function (ref) {
                const pw = tw + 'piece ' + JSON.stringify(ref && ref.piece) + ': ';
                if (!ref || typeof ref.piece !== 'string' || typeof ref.reverse !== 'boolean' || Object.keys(ref).length !== 2) fail(pw + 'must be { "piece": name, "reverse": true|false }');
                const pc = pieces[ref.piece];
                if (!pc) fail(pw + 'no such piece in shapes.json');
                if (step.retrace === true && pc.used === 0) fail(pw + 'a retrace step redraws only pieces already drawn');
                if (step.retrace !== true && pc.used > 0) fail(pw + 'already drawn; a second drawing must sit in a step marked "retrace": true');
                pc.used++;
                const s = ref.reverse ? reversed(pc.seg) : pc.seg;
                if (segs.length) {
                    const a = segs[segs.length - 1].p[segs[segs.length - 1].p.length - 1], b = s.p[0];
                    const gap = Math.hypot(a[0] - b[0], a[1] - b[1]);
                    if (gap > GAP_MAX) fail(pw + 'starts ' + gap.toFixed(4) + ' S1 units from the end of ' + names[names.length - 1] + ' (at most ' + GAP_MAX + ')');
                }
                segs.push(s);
                names.push(ref.piece + (ref.reverse ? ' reversed' : ''));
            });
        });
        return { segs: segs, names: names };
    });
    ev.segments.forEach(function (s, k) { if (!cited.has(k)) fail(where + 'evidence.json segments[' + k + '] (' + s.segment + ') is not cited by any step'); });
    const unused = Object.keys(pieces).filter(function (n) { return pieces[n].used === 0; });
    if (unused.length) fail(where + 'S1 pieces never drawn: ' + unused.join(', '));
    return { form: form, evidence: ev, strokes: strokes, pieces: pieces };
}

// ---------- frame: S1 units to widget units ----------

function checkFrame(fr) {
    const w = 'stroke-frame.json: ';
    if (!/^CURSIVE_STROKES_[A-Z0-9_]+$/.test(fr.table || '')) fail(w + 'table must be named CURSIVE_STROKES_<NAME>');
    if (!Array.isArray(fr.letters) || !fr.letters.length || new Set(fr.letters).size !== fr.letters.length) fail(w + 'letters must be a list of distinct letters');
    ['s1SlantDeg', 'xHeightUnits', 'baselineY', 'strokeWidth', 'centerX', 'translateX', 'skewXDeg'].forEach(function (k) {
        if (typeof fr[k] !== 'number' || !isFinite(fr[k])) fail(w + k + ' must be a number');
    });
    if (!Array.isArray(fr.viewBox) || fr.viewBox.length !== 4 || !fr.viewBox.every(function (v) { return Number.isInteger(v); })) fail(w + 'viewBox must be four integers');
}
function groupMarkup(fr) {
    return { viewBox: fr.viewBox.join(' '), transform: 'translate(' + fr.translateX + ', 0) skewX(' + fr.skewXDeg + ')' };
}
// The letter group's transform as a matrix [a, b, c, d, e, f], as the browser applies it.
function groupMatrix(fr) {
    return [1, 0, Math.tan(fr.skewXDeg * Math.PI / 180), 1, fr.translateX, 0];
}
function apply(m, q) { return [m[0] * q[0] + m[2] * q[1] + m[4], m[1] * q[0] + m[3] * q[1] + m[5]]; }

// Unslant S1 about the form's baseline, scale to the widget's x-height, put the
// baseline at baselineY, then shift the letter so its drawn (slanted) extent is
// centred on centerX.
function placeLetter(planned, fr) {
    const form = planned.form;
    const k = fr.xHeightUnits / form.xHeight;
    const t = Math.tan(fr.s1SlantDeg * Math.PI / 180);
    const upright = function (q) { return [(q[0] + (q[1] - form.baseline) * t) * k, fr.baselineY + (q[1] - form.baseline) * k]; };
    const m = groupMatrix(fr);
    let lo = Infinity, hi = -Infinity;
    planned.strokes.forEach(function (st) {
        st.segs.forEach(function (s) {
            const u = { cmd: s.cmd, p: s.p.map(upright) };
            for (let i = 0; i <= 64; i++) { const x = apply(m, at(u, i / 64))[0]; lo = Math.min(lo, x); hi = Math.max(hi, x); }
        });
    });
    const shift = fr.centerX - (lo + hi) / 2;
    const toWidget = function (q) { const u = upright(q); return [u[0] + shift, u[1]]; };
    const placed = planned.strokes.map(function (st) {
        return st.segs.map(function (s) { return { cmd: s.cmd, p: s.p.map(toWidget) }; });
    });
    placed.toWidget = toWidget;
    return placed;
}
function int(v) { const r = Math.round(v); return r === 0 ? 0 : r; }
function strokePath(segs, ch, si) {
    const pts = [];
    const parts = [];
    const first = segs[0].p[0].map(int);
    pts.push(first);
    parts.push('M ' + first[0] + ',' + first[1]);
    segs.forEach(function (s) {
        const q = s.p.slice(1).map(function (p) { return p.map(int); });
        q.forEach(function (p) { pts.push(p); });
        parts.push((s.cmd === 'L' ? 'L ' : 'C ') + q.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
    });
    pts.forEach(function (p) { if (p[0] < 0 || p[1] < 0) fail('stroke-frame.json: ' + ch + ' stroke ' + (si + 1) + ' has a negative coordinate (' + p.join(',') + '); move the frame'); });
    return parts.join(' ');
}
// The integer path as segments again, for the clearance measure.
function parsePath(d) {
    const t = d.replace(/,/g, ' ').split(' ').filter(Boolean);
    const out = [];
    let cur = null;
    for (let i = 0; i < t.length;) {
        if (t[i] === 'M') { cur = [Number(t[i + 1]), Number(t[i + 2])]; i += 3; }
        else if (t[i] === 'L') { const q = [Number(t[i + 1]), Number(t[i + 2])]; out.push({ cmd: 'L', p: [cur, q] }); cur = q; i += 3; }
        else { const p = [cur, [Number(t[i + 1]), Number(t[i + 2])], [Number(t[i + 3]), Number(t[i + 4])], [Number(t[i + 5]), Number(t[i + 6])]]; out.push({ cmd: 'C', p: p }); cur = p[3]; i += 7; }
    }
    return out;
}
// Clearance of the drawn letter to each edge of the viewBox, the stroke's half
// width widened by the transform's largest stretch (round caps and joins add
// nothing beyond that). Sampled at 400 points per segment.
function clearance(paths, fr) {
    const m = groupMatrix(fr);
    const stretch = Math.max(Math.hypot(m[0], m[2]), Math.hypot(m[1], m[3]));
    const r = fr.strokeWidth / 2 * stretch;
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    paths.forEach(function (d) {
        parsePath(d).forEach(function (s) {
            for (let i = 0; i <= 400; i++) {
                const q = apply(m, at(s, i / 400));
                b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]);
            }
        });
    });
    const vb = fr.viewBox;
    return { left: b[0] - r - vb[0], top: b[1] - r - vb[1], right: vb[0] + vb[2] - (b[2] + r), bottom: vb[1] + vb[3] - (b[3] + r), stretch: stretch };
}

// ---------- the table ----------

function derive(inputs, onlyLetters) {
    checkFrame(inputs.frame);
    const fr = inputs.frame;
    const letters = onlyLetters || fr.letters;
    const lines = ['var ' + fr.table + ' = {',
        '    // Generated by scripts/cursive/build-strokes.js from shapes.json, stroke-plans.json',
        '    // and stroke-frame.json. Do not edit by hand: change those files and regenerate.'];
    const report = [];
    letters.forEach(function (ch, li) {
        if (fr.letters.indexOf(ch) === -1) fail('stroke-frame.json does not list ' + ch);
        const planned = planLetter(ch, inputs);
        const placed = placeLetter(planned, fr);
        const paths = placed.map(function (segs, si) { return strokePath(segs, ch, si); });
        const c = clearance(paths, fr);
        ['left', 'top', 'right', 'bottom'].forEach(function (e) { if (c[e] < 0) fail(ch + ' leaves the viewBox at the ' + e + ' by ' + (-c[e]).toFixed(2)); });
        lines.push("    '" + ch + "': [");
        paths.forEach(function (d, si) { lines.push("        { d: '" + d + "', optional: false, label: null }" + (si < paths.length - 1 ? ',' : '')); });
        lines.push('    ]' + (li < letters.length - 1 ? ',' : ''));
        report.push({ letter: ch, strokes: planned.strokes.map(function (st, si) {
            return { stroke: si + 1, pieces: st.names, start: placed[si][0].p[0].map(int), startS1: st.segs[0].p[0] };
        }), clearance: c, paths: paths, toWidget: placed.toWidget, form: planned.form });
    });
    lines.push('};');
    return { text: lines.join('\n') + '\n', report: report, markup: groupMarkup(fr) };
}

// The table as it sits in a source file: from "var NAME = {" on its own line to
// the first "};" line after it, both included.
function tableIn(src, name) {
    const opener = '\nvar ' + name + ' = {\n';
    const a = src.indexOf(opener);
    if (a === -1 || src.indexOf(opener, a + 1) !== -1) return null;
    const b = src.indexOf('\n};\n', a + 1);
    if (b === -1) return null;
    return src.slice(a + 1, b + 4);
}
// For the build: { ok, expected, found }. ok only if the file holds the derived table byte for byte.
function checkTable(src, inputs) {
    const expected = derive(inputs || loadInputs()).text;
    const found = tableIn(src, (inputs || loadInputs()).frame.table);
    return { ok: found === expected, expected: expected, found: found };
}

module.exports = { loadInputs, planLetter, derive, checkTable, tableIn, groupMarkup, PlanError };

// ---------- command line ----------

if (require.main === module) {
    const argv = process.argv.slice(2);
    const opts = {};
    let mode = 'print', file = null, letters = null, anywhere = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i], v = argv[i + 1];
        const need = function () { if (!v || v.startsWith('--')) { console.error('BUILD-STROKES REFUSED: ' + a + ' needs a value'); process.exit(2); } i++; return v; };
        if (a === '--report') mode = 'report';
        else if (a === '--check') { mode = 'check'; file = need(); }
        else if (a === '--out') { mode = 'out'; file = need(); }
        else if (a === '--plans') opts.plans = path.resolve(need());
        else if (a === '--frame') opts.frame = path.resolve(need());
        else if (a === '--letters') letters = need().split(',');
        else if (a === OVERRIDE) anywhere = true;
        else { console.error('BUILD-STROKES REFUSED: unknown argument ' + a); process.exit(2); }
    }
    try {
        const inputs = loadInputs(opts);
        const r = derive(inputs, letters);
        if (mode === 'print') process.stdout.write(r.text);
        else if (mode === 'out') {
            checkDestination(path.dirname(path.resolve(file)), anywhere, 'build-strokes.js', function (m) { console.error('BUILD-STROKES REFUSED: ' + m); process.exit(2); });
            fs.writeFileSync(file, r.text, { flag: 'wx' });
            console.log('wrote ' + file);
        }
        else if (mode === 'check') {
            const c = checkTable(fs.readFileSync(file, 'utf8'), inputs);
            console.log(c.ok ? 'TABLE CURRENT: ' + file + ' holds ' + inputs.frame.table + ' exactly as derived' : 'TABLE NOT CURRENT: ' + (c.found === null ? 'no single ' + inputs.frame.table + ' block in ' + file : 'the table in ' + file + ' differs from the derived one'));
            process.exit(c.ok ? 0 : 1);
        } else {
            console.log('markup: viewBox="' + r.markup.viewBox + '" letter-group transform="' + r.markup.transform + '"');
            r.report.forEach(function (x) {
                const c = x.clearance;
                console.log(x.letter + ': clearance left ' + c.left.toFixed(2) + ', top ' + c.top.toFixed(2) + ', right ' + c.right.toFixed(2) + ', bottom ' + c.bottom.toFixed(2) + ' (stretch ' + c.stretch.toFixed(4) + ')');
                x.strokes.forEach(function (s) { console.log('   stroke ' + s.stroke + ' starts at ' + s.start.join(',') + ': ' + s.pieces.join(', ')); });
            });
        }
    } catch (e) {
        if (e instanceof PlanError) { console.error('BUILD-STROKES FAILED: ' + e.message); process.exit(2); }
        throw e;
    }
}
