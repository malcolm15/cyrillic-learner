// Phone-width companion to record-wide.mjs: same production site, same
// determinism, same cut and loop-seam handling, but the crop is sized to the
// QUIZ card rather than to both states.
//
// At 480 CSS px the selection card is 1122px tall, so no crop can hold it and
// the quiz card at once. The frame is therefore the quiz card plus a margin,
// and during the selection beat it shows the top of the selection pane; the
// page is scrolled on camera to reach Begin Learning, which at this width sits
// below three rows of groups.
//
// The margin is 8px, not the 14px of the wide take, because at mobile widths
// the page itself only leaves an 8px gutter beside the card: the card is 464px
// wide in a 480px viewport.
import { connect } from './cdp.mjs';
import { installBlocker, report } from './block.mjs';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

const PORT = Number(process.argv[2]);
const OUT = process.argv[3];
const SITE = 'https://cyrilica.com/';
const VW = 480, VH = 1000, DSF = 1;
const MARGIN = 8;
const CUR_HOME = [300, 880];       // resting on the groups, inside the opening frame
const QUIZ_PARK = [400, 680];      // the clear band between the controls and the stats

// This script only ever ADDS files. It never deletes and never overwrites: if
// the frames directory already exists with anything in it, it refuses rather
// than clearing it, so pointing it at the wrong path costs nothing. An empty
// directory, or no directory at all, is fine.
if (typeof OUT !== 'string' || OUT.trim() === '') {
    console.error('usage: node record-phone.mjs <chrome-port> <frames-dir>');
    process.exit(2);
}
if (!Number.isFinite(PORT) || PORT <= 0) {
    console.error('usage: node record-phone.mjs <chrome-port> <frames-dir>   (chrome-port must be a number)');
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
  { width: VW, height: VH, deviceScaleFactor: DSF, mobile: true });
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
const pageBox = async (sel) => JSON.parse(await c.ev(`(function(){
  var e=document.querySelector(${JSON.stringify(sel)}); var r=e.getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x),right:Math.round(r.right),
    top:Math.round(r.top+window.scrollY), bottom:Math.round(r.bottom+window.scrollY),
    w:Math.round(r.width), h:Math.round(r.height)});})()`));
const deselectAll = () => c.ev(`(function(){var n=0;
  document.querySelectorAll('.reference-section.selected').forEach(function(e){e.click();n++;});return n;})()`);

// ---------- calibration ----------
await load();
await deselectAll();
await wait(300);
const calSel = await pageBox('.card.char-reference');
const calBtn = await pageBox('#start-btn');
await c.ev(`document.querySelector('.reference-section[data-group="vowels_1"]').click()`);
await c.ev(`document.getElementById('start-btn').click()`);
await wait(1500);
const calQuiz = await pageBox('#quiz-container .card');
const navH = Math.round(await c.ev(`document.querySelector('nav').getBoundingClientRect().height`));
const even = n => n - (n % 2);
// The quiz card sits at page y calQuiz.top with the page unscrolled, so the
// crop is simply its box plus the margin, in viewport coordinates at scroll 0.
const CROP = { x: Math.max(0, calSel.x - MARGIN), y: calQuiz.top - MARGIN,
               w: even(Math.min(VW, calSel.right + MARGIN) - Math.max(0, calSel.x - MARGIN)),
               h: even(calQuiz.h + 2 * MARGIN) };
// scroll that brings Begin Learning and the selection card's bottom border into
// the same fixed frame
const BTN_SCROLL = Math.max(0, calSel.bottom + MARGIN - (CROP.y + CROP.h));
console.log('=== calibration (viewport ' + VW + 'x' + VH + ', dsf ' + DSF + ', mobile) ===');
console.log('  nav is position:fixed, height ' + navH + 'px, so the crop must start below it: crop top ' + CROP.y);
console.log('  selection card (page coords): ' + JSON.stringify(calSel));
console.log('  quiz card (page coords):      ' + JSON.stringify(calQuiz));
console.log('  Begin Learning (page coords): ' + JSON.stringify(calBtn));
console.log('  crop (CSS px, viewport relative, scroll 0): x=' + CROP.x + ' y=' + CROP.y +
            ' w=' + CROP.w + ' h=' + CROP.h + '   aspect ' + (CROP.w / CROP.h).toFixed(3) + ':1');
console.log('  crop top vs nav bottom: ' + CROP.y + ' > ' + navH + '  -> nav never enters the frame: ' + (CROP.y > navH));
console.log('  scroll used to reach Begin Learning: ' + BTN_SCROLL +
            'px  (button then at viewport y ' + (calBtn.top - BTN_SCROLL) + '..' + (calBtn.bottom - BTN_SCROLL) +
            ', card bottom border at ' + (calSel.bottom - BTN_SCROLL) + ')');
console.log('  opening frame shows page y ' + (CROP.y) + '..' + (CROP.y + CROP.h) + ' of the selection pane');
if (CROP.y + CROP.h > VH) { console.log('  ABORT: crop taller than the viewport'); process.exit(2); }

// ---------- record ----------
await load();
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
await c.ev(`window.scrollTo(0,0)`);
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
async function smoothScroll(toY, ms) {
  const from = await c.ev(`Math.round(window.scrollY)`);
  const tA = Date.now();
  for (;;) {
    const e = Math.min(1, (Date.now() - tA) / ms), k = easeInOut(e);
    await c.ev(`window.scrollTo(0, ${Math.round(from + (toY - from) * k)})`);
    if (e >= 1) break;
  }
}
async function centre(sel) {
  return JSON.parse(await c.ev(`(function(){var r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
    return JSON.stringify([Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)]);})()`));
}
async function pressRipple(sel) { const [x, y] = await centre(sel); await c.ev(`window.__ripple(${x}, ${y})`); }
async function clickAt(sel) {
  await pressRipple(sel); await wait(90);
  await c.ev(`document.querySelector(${JSON.stringify(sel)}).click()`); await wait(360);
}
async function cutAcross(fn, settleMs) {
  await c.send('Page.stopScreencast');
  await wait(120);
  await fn();
  await wait(settleMs);
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

let p = await centre('.reference-section[data-group="vowels_1"]');
await moveCursor(p[0], p[1], 740);
await clickAt('.reference-section[data-group="vowels_1"]');
mark('selected');
await wait(520);

await smoothScroll(BTN_SCROLL, 700);
mark('scrolled');
await wait(260);
p = await centre('#start-btn');
await moveCursor(p[0], p[1], 460);
await pressRipple('#start-btn');
await wait(380);
await cutAcross(async () => {
  await c.ev(`document.getElementById('start-btn').click()`);
  await wait(150);
  await c.ev(`window.scrollTo(0,0)`);
}, 1200);
mark('quizShown');
await wait(260);
await moveCursor(QUIZ_PARK[0], QUIZ_PARK[1], 420);
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

p = await centre('#home-btn');
await moveCursor(p[0], p[1], 460);
await pressRipple('#home-btn');
await wait(380);
await cutAcross(async () => {
  await c.ev(`document.getElementById('home-btn').click()`);
  await wait(150);
  await c.ev(`(function(){document.querySelectorAll('.reference-section.selected').forEach(function(e){e.click();});})()`);
  await c.ev(`window.scrollTo(0,0)`);
  await c.ev(`window.__cursorTo(${CUR_HOME[0]}, ${CUR_HOME[1]})`);
}, 1300);
mark('end');
await wait(260);
await c.send('Page.stopScreencast');
await wait(300);
console.log('  final state (must match the opening): ' + await c.ev(`JSON.stringify({
  selected:document.querySelectorAll('.reference-section.selected').length,
  startDisabled:document.getElementById('start-btn').disabled, scrollY:Math.round(window.scrollY),
  cur:[document.getElementById('__cur').style.left,document.getElementById('__cur').style.top]})`));

const firstPng = readFileSync(OUT + '/' + frames[0].file);
const fw = firstPng.readUInt32BE(16), fh = firstPng.readUInt32BE(20);
console.log('  screencast frame size received: ' + fw + 'x' + fh + '   measured scale vs CSS: ' + (fw / VW) + 'x');
writeFileSync(OUT + '/manifest.json', JSON.stringify({ frames, marks, cropCss: CROP, dsf: DSF,
  viewport: { w: VW, h: VH }, frameSize: { w: fw, h: fh }, scale: fw / VW,
  calibration: { selection: calSel, quiz: calQuiz, button: calBtn, margin: MARGIN, btnScroll: BTN_SCROLL } }, null, 1));
const gaps = frames.slice(1).map((f, i) => f.t - frames[i].t);
const total = frames[frames.length - 1].t;
console.log('  frames captured: ' + frames.length + '   span: ' + total.toFixed(2) + 's');
console.log('  mean interval: ' + (gaps.reduce((a,b)=>a+b,0)/gaps.length*1000).toFixed(1) + 'ms  (' +
            (gaps.length/total).toFixed(1) + ' fps)   max gap: ' + (Math.max(...gaps)*1000).toFixed(0) + 'ms');
console.log('  marks: ' + JSON.stringify(marks));
report('b64 phone recording session', stats);
c.close(); process.exit(0);
