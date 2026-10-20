// Records a WIDE take of the Cyrilica study pane on production: the whole
// "Select Characters to Study" card in its desktop two-column layout, border
// included, then the quiz card in the same fixed frame.
//
// How this differs from a naive full-page capture:
//  1. Desktop viewport, 1x. The card caps at 960px wide from a 1000px viewport
//     upward, so 1280 renders the full desktop grid with no scrolling at all.
//  2. The crop is CALIBRATED, not hardcoded: a dry run measures the selection
//     card and the quiz card, and the crop is their union plus a fixed margin.
//     The page is then reloaded and recorded, so production layout changes
//     cannot silently push content into the frame.
//  3. A recording-only stylesheet enlarges the empty space around the card.
//     The page's own clean background is only 10px above the card and 16 to
//     20px below it, so no fixed crop can hold both states with a visible
//     margin. This changes nothing about the card itself; its only visible
//     effect is on background the crop is meant to exclude.
//  4. The screencast is stopped across both state changes. Toggling display on
//     a .card restarts its `fadeIn 0.6s` with a 0.2s delay and fill-mode
//     backwards, which is what produced the blank frame and the washed-out
//     fade-in in the first draft. Frames during the fade are never captured,
//     so the clip cuts from one settled state to the next.
//  5. The clip ends on the opening frame exactly: during the final hidden cut
//     the quiz is left, Vowels 1 is deselected and the cursor is put back where
//     it started, so the last frame is pixel-identical to the first and the
//     loop seam is invisible.
import { connect } from './cdp.mjs';
import { installBlocker, report } from './block.mjs';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

const PORT = Number(process.argv[2]);
const OUT = process.argv[3];
const SITE = 'https://cyrilica.com/';
const VW = 1280, VH = 960, DSF = 1;
const MARGIN = 14;                 // page background kept around the card, all sides
const CUR_HOME = [640, 880];       // cursor rest position: background below the card
const QUIZ_PARK = [300, 530];      // empty space left of the answer box. Parking the
                                   // cursor where Begin Learning was leaves it sitting
                                   // on top of the INCORRECT stat for the whole quiz.

// This script only ever ADDS files. It never deletes and never overwrites: if
// the frames directory already exists with anything in it, it refuses rather
// than clearing it, so pointing it at the wrong path costs nothing. An empty
// directory, or no directory at all, is fine.
if (typeof OUT !== 'string' || OUT.trim() === '') {
    console.error('usage: node record-wide.mjs <chrome-port> <frames-dir>');
    process.exit(2);
}
if (!Number.isFinite(PORT) || PORT <= 0) {
    console.error('usage: node record-wide.mjs <chrome-port> <frames-dir>   (chrome-port must be a number)');
    process.exit(2);
}
if (existsSync(OUT)) {
    const existing = readdirSync(OUT);
    if (existing.length) {
        console.error('refusing to use ' + OUT + ': it already contains ' + existing.length +
                      ' entr' + (existing.length === 1 ? 'y' : 'ies') + ' (' + existing.slice(0, 3).join(', ') +
                      (existing.length > 3 ? ', ...' : '') + '). Give an empty or new directory; ' +
                      'this script does not delete anything.');
        process.exit(2);
    }
}
mkdirSync(OUT, { recursive: true });

const c = await connect(PORT);
const stats = await installBlocker(c);
await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `(function(){try{
  localStorage.setItem('autoSubmit','false');
  localStorage.setItem('continuousPlay','false');
  localStorage.setItem('repeatProblems','false');
  localStorage.setItem('autoPlayAudio','false');
  localStorage.setItem('includeLowercase','true');
  localStorage.setItem('darkMode','false');
}catch(e){}})();` });
await c.send('Emulation.setDeviceMetricsOverride',
  { width: VW, height: VH, deviceScaleFactor: DSF, mobile: false });

const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function load() {
  await c.send('Page.navigate', { url: SITE });
  const dl = Date.now() + 40000;
  while (Date.now() < dl) {
    if (await c.ev(`document.readyState==='complete' && !!document.getElementById('reference-container')`)) break;
    await wait(200);
  }
  await wait(1400);
}
// Only the empty space around the subject is changed. See note 3 above.
const SPACER = `header{margin-bottom:56px !important}` +
               `.card.char-reference{margin-bottom:56px !important}` +
               `#quiz-container .card{margin-bottom:56px !important}`;
async function injectSpacer() {
  await c.ev(`(function(){var s=document.getElementById('__frame');
    if(!s){s=document.createElement('style');s.id='__frame';document.head.appendChild(s);}
    s.textContent=${JSON.stringify(SPACER)}; return true;})()`);
  await wait(400);
}
const subjectBox = async () => JSON.parse(await c.ev(`(function(){
  var card=document.querySelector('.card.char-reference');
  var quiz=document.querySelector('#quiz-container .card');
  var s=(card && getComputedStyle(card).display!=='none')?card:quiz;
  var r=s.getBoundingClientRect();
  var hdr=document.querySelector('header').getBoundingClientRect();
  var below=null, all=document.querySelectorAll('.main-content *');
  for(var i=0;i<all.length;i++){var e=all[i];
    if(e===s||s.contains(e)||e.contains(s)||e.id==='__cur'||e.id==='__rip')continue;
    var r2=e.getBoundingClientRect(); if(r2.width===0&&r2.height===0)continue;
    if(r2.top>=r.bottom-0.5){ if(below===null||r2.top<below) below=r2.top; }}
  return JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
    right:Math.round(r.right),bottom:Math.round(r.bottom),
    cleanAbove:Math.round(r.y-hdr.bottom), cleanBelow:Math.round(below-r.bottom),
    scrollY:Math.round(window.scrollY)});})()`));
const deselectAll = () => c.ev(`(function(){var n=0;
  document.querySelectorAll('.reference-section.selected').forEach(function(e){e.click();n++;});return n;})()`);

// ---------- phase 0: calibrate the crop from both real states ----------
await load();
await injectSpacer();
await deselectAll();
await wait(300);
const calSel = await subjectBox();
await c.ev(`document.querySelector('.reference-section[data-group="vowels_1"]').click()`);
await c.ev(`document.getElementById('start-btn').click()`);
await wait(1500);
const calQuiz = await subjectBox();
console.log('=== calibration (viewport ' + VW + 'x' + VH + ', dsf ' + DSF + ', no scrolling) ===');
console.log('  selection card: ' + JSON.stringify(calSel));
console.log('  quiz card:      ' + JSON.stringify(calQuiz));
const unionTop = Math.min(calSel.y, calQuiz.y);
const unionBottom = Math.max(calSel.bottom, calQuiz.bottom);
const unionLeft = Math.min(calSel.x, calQuiz.x);
const unionRight = Math.max(calSel.right, calQuiz.right);
const even = (n) => n - (n % 2);
const CROP = { x: unionLeft - MARGIN, y: unionTop - MARGIN,
               w: even(unionRight - unionLeft + 2 * MARGIN),
               h: even(unionBottom - unionTop + 2 * MARGIN) + 2 };
console.log('  union of both states: x ' + unionLeft + '..' + unionRight + '  y ' + unionTop + '..' + unionBottom);
console.log('  crop (CSS px, viewport relative): x=' + CROP.x + ' y=' + CROP.y + ' w=' + CROP.w + ' h=' + CROP.h +
            '   aspect ' + (CROP.w / CROP.h).toFixed(3) + ':1');
{
  const bottomRoom = Math.min(calSel.bottom + calSel.cleanBelow, calQuiz.bottom + calQuiz.cleanBelow);
  const ok = (CROP.y + CROP.h) <= bottomRoom && CROP.y >= (calSel.y - calSel.cleanAbove);
  console.log('  crop stays inside clean background in BOTH states: ' + ok +
              '  (crop bottom ' + (CROP.y + CROP.h) + ' vs nearest content ' + bottomRoom + ')');
  if (!ok) { console.log('  ABORT: the crop would contain unrelated page content'); process.exit(2); }
  if (CROP.y + CROP.h > VH || CROP.x + CROP.w > VW) { console.log('  ABORT: crop falls outside the viewport'); process.exit(2); }
}

// ---------- phase 1: fresh load, cursor, record ----------
await load();
await injectSpacer();
const cleared = await deselectAll();
await wait(400);
console.log('  selections cleared before recording: ' + cleared);
await c.ev(`(function(){
  var s = document.createElement('style');
  s.textContent = '#__cur{position:fixed;z-index:99999;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;' +
    'background:rgba(0,0,0,.72);border:2px solid #fff;border-radius:50% 50% 50% 2px;box-shadow:0 1px 4px rgba(0,0,0,.45)}' +
    '#__rip{position:fixed;z-index:99998;width:14px;height:14px;margin:-7px 0 0 -7px;pointer-events:none;border-radius:50%;' +
    'background:rgba(211,47,47,.35);border:2px solid rgba(211,47,47,.9);opacity:0;transform:scale(.4)}' +
    '#__rip.go{animation:__r .45s ease-out}' +
    '@keyframes __r{0%{opacity:1;transform:scale(.4)}100%{opacity:0;transform:scale(3.2)}}';
  document.head.appendChild(s);
  var cur=document.createElement('div'); cur.id='__cur'; document.body.appendChild(cur);
  var rip=document.createElement('div'); rip.id='__rip'; document.body.appendChild(rip);
  window.__cursorTo=function(x,y){cur.style.left=x+'px';cur.style.top=y+'px';};
  window.__ripple=function(x,y){rip.style.left=x+'px';rip.style.top=y+'px';rip.classList.remove('go');void rip.offsetWidth;rip.classList.add('go');};
  window.__cursorTo(${CUR_HOME[0]}, ${CUR_HOME[1]});
  return true;})()`);
await wait(300);

const frames = [];
let seq = 0, t0 = null;
c.on(async (m) => {
  if (m.method !== 'Page.screencastFrame') return;
  const { data, sessionId, metadata } = m.params;
  c.send('Page.screencastFrameAck', { sessionId });
  const ts = metadata && metadata.timestamp ? metadata.timestamp : Date.now() / 1000;
  if (t0 === null) t0 = ts;
  const name = String(seq).padStart(5, '0') + '.png';
  writeFileSync(OUT + '/' + name, Buffer.from(data, 'base64'));
  frames.push({ file: name, t: Math.max(0, ts - t0) });
  seq += 1;
});
const marks = {};
const mark = (k) => { marks[k] = { frame: seq, t: frames.length ? frames[frames.length-1].t : 0 }; };
const startCast = () => c.send('Page.startScreencast',
  { format: 'png', maxWidth: VW, maxHeight: VH, everyNthFrame: 1 });

const easeInOut = (e) => e < 0.5 ? 2*e*e : 1 - Math.pow(-2*e + 2, 2) / 2;
async function moveCursor(toX, toY, ms) {
  const from = JSON.parse(await c.ev(`(function(){var e=document.getElementById('__cur');
    return JSON.stringify([parseFloat(e.style.left)||0, parseFloat(e.style.top)||0]);})()`));
  const tA = Date.now();
  for (;;) {
    const e = Math.min(1, (Date.now() - tA) / ms), k = easeInOut(e);
    await c.ev(`window.__cursorTo(${Math.round(from[0] + (toX-from[0])*k)}, ${Math.round(from[1] + (toY-from[1])*k)})`);
    if (e >= 1) break;
  }
}
async function centre(sel) {
  return JSON.parse(await c.ev(`(function(){var r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
    return JSON.stringify([Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)]);})()`));
}
async function pressRipple(sel) {           // show the press, do not click yet
  const [x, y] = await centre(sel);
  await c.ev(`window.__ripple(${x}, ${y})`);
}
async function clickAt(sel) {
  await pressRipple(sel);
  await wait(90);
  await c.ev(`document.querySelector(${JSON.stringify(sel)}).click()`);
  await wait(360);
}
// A state change means a .card is toggled, which restarts its fadeIn. Stop the
// screencast first so the blank 0.2s and the 0.6s fade are never captured, then
// resume once the new state has settled. The encoder clamps the resulting gap,
// so the clip cuts straight from one settled state to the next.
async function cutAcross(fn, settleMs) {
  await c.send('Page.stopScreencast');
  await wait(120);
  await fn();
  await wait(settleMs);
  await c.ev(`window.scrollTo(0,0)`);
  await wait(80);
  await startCast();
  await wait(260);
}
async function typeText(text, perChar) {
  for (const ch of text) {
    await c.ev(`(function(){var i=document.getElementById('answer-input'); i.focus();
      i.value += ${JSON.stringify(ch)}; i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await wait(perChar);
  }
}
const pressEnter = () => c.ev(`(function(){document.getElementById('answer-input')
  .dispatchEvent(new KeyboardEvent('keypress',{key:'Enter',bubbles:true}));})()`);
const ROMAN = { 'А':'a','Е':'ye','И':'i','О':'o','У':'u' };
const WRONG = { 'А':'o','Е':'e','И':'n','О':'a','У':'y' };
const currentChar = () => c.ev(`document.getElementById('current-char').textContent.trim()`);

await startCast();
await wait(320);
mark('start');
await wait(260);

// select Vowels 1
let p = await centre('.reference-section[data-group="vowels_1"]');
await moveCursor(p[0], p[1], 760);
await clickAt('.reference-section[data-group="vowels_1"]');
mark('selected');
await wait(620);

// press Begin Learning: ripple on camera, then cut across the fade
p = await centre('#start-btn');
await moveCursor(p[0], p[1], 470);
await pressRipple('#start-btn');
await wait(380);
await cutAcross(async () => { await c.ev(`document.getElementById('start-btn').click()`); }, 1200);
mark('quizShown');
// Glide out of the way rather than teleporting during the cut, so the cursor is
// continuous across the cut and only the card changes.
await wait(260);
await moveCursor(QUIZ_PARK[0], QUIZ_PARK[1], 430);
await wait(260);

let ch = await currentChar();
await typeText(ROMAN[ch] || 'a', 250);
await wait(430);
await pressEnter();
await wait(150);
mark('correctFeedback');
await wait(760);

ch = await currentChar();
await typeText(WRONG[ch] || 'x', 250);
await wait(430);
await pressEnter();
await wait(150);
mark('incorrectFeedback');
await wait(940);

ch = await currentChar();
await typeText(ROMAN[ch] || 'a', 250);
await wait(430);
await pressEnter();
await wait(620);
mark('thirdAnswered');

// leave the quiz: ripple on Home, then cut across the fade. During the cut the
// selection is cleared and the cursor goes back to where it started, so the
// final frame is the opening frame.
p = await centre('#home-btn');
await moveCursor(p[0], p[1], 480);
await pressRipple('#home-btn');
await wait(380);
await cutAcross(async () => {
  await c.ev(`document.getElementById('home-btn').click()`);
  await wait(150);
  await c.ev(`(function(){document.querySelectorAll('.reference-section.selected').forEach(function(e){e.click();});})()`);
  await c.ev(`window.__cursorTo(${CUR_HOME[0]}, ${CUR_HOME[1]})`);
}, 1300);
mark('end');
await wait(260);

await c.send('Page.stopScreencast');
await wait(300);
const finalState = await c.ev(`JSON.stringify({selected:document.querySelectorAll('.reference-section.selected').length,
  startDisabled:document.getElementById('start-btn').disabled, scrollY:Math.round(window.scrollY),
  cur:[document.getElementById('__cur').style.left,document.getElementById('__cur').style.top]})`);
console.log('  final state (must match the opening): ' + finalState);

const firstPng = readFileSync(OUT + '/' + frames[0].file);
const fw = firstPng.readUInt32BE(16), fh = firstPng.readUInt32BE(20);
const scale = fw / VW;
console.log('  screencast frame size received: ' + fw + 'x' + fh + '   measured scale vs CSS: ' + scale + 'x');
writeFileSync(OUT + '/manifest.json', JSON.stringify({ frames, marks, cropCss: CROP, dsf: DSF,
  viewport: { w: VW, h: VH }, frameSize: { w: fw, h: fh }, scale,
  calibration: { selection: calSel, quiz: calQuiz, margin: MARGIN } }, null, 1));
const gaps = frames.slice(1).map((f, i) => f.t - frames[i].t);
const total = frames[frames.length - 1].t;
console.log('  frames captured: ' + frames.length + '   span: ' + total.toFixed(2) + 's');
console.log('  mean interval: ' + (gaps.reduce((a,b)=>a+b,0)/gaps.length*1000).toFixed(1) + 'ms  (' +
            (gaps.length/total).toFixed(1) + ' fps)   max gap: ' + (Math.max(...gaps)*1000).toFixed(0) + 'ms');
const big = gaps.map((g,i)=>[i,g]).filter(x=>x[1]>0.1).map(x=>'f'+(x[0]+1)+':'+(x[1]*1000).toFixed(0)+'ms');
console.log('  gaps over 100ms (the two cuts and the stills): ' + (big.join(' ') || 'none'));
console.log('  marks: ' + JSON.stringify(marks));
report('b64 wide recording session', stats);
c.close(); process.exit(0);
