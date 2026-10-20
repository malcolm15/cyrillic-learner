// Plays both clips in a real browser and reads back every presented frame via
// requestVideoFrameCallback, to answer two questions the file itself cannot:
// how long the final frame is actually on screen before the clip restarts, and
// whether anything blank or out of order appears at the seam.
import { connect } from './cdp.mjs';
import { installBlocker, report } from './block.mjs';
const PORT = Number(process.argv[2]), HTTP = Number(process.argv[3]), SECONDS = Number(process.argv[4] || 52);
const c = await connect(PORT);
const stats = await installBlocker(c);
const wait = ms => new Promise(r => setTimeout(r, ms));
await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'http://127.0.0.1:' + HTTP + '/loop-test.html' });
await wait(2500);
console.log('  readyState: ' + await c.ev(`JSON.stringify(['wide','phone'].map(function(i){var v=document.getElementById(i);
  return {id:i, paused:v.paused, rvfc:typeof v.requestVideoFrameCallback==='function', dur:+v.duration.toFixed(3),
          w:v.videoWidth, h:v.videoHeight, displayW:Math.round(v.getBoundingClientRect().width)};}))`));
console.log('  playing for ' + SECONDS + 's ...');
await wait(SECONDS * 1000);

for (const id of ['wide', 'phone']) {
  const raw = await c.ev(`JSON.stringify(window.__log['${id}'])`);
  const rows = JSON.parse(raw || '[]');
  console.log('');
  console.log('  ===== ' + id + ': ' + rows.length + ' presented frames logged =====');
  if (rows.length < 10) { console.log('    too few frames, playback did not run'); continue; }
  // loop boundaries: media time jumps backwards by a lot
  const bounds = [];
  for (let i = 1; i < rows.length; i++) if (rows[i].m < rows[i-1].m - 1) bounds.push(i);
  // out-of-order inside a loop
  let ooo = 0, oooDetail = [];
  for (let i = 1; i < rows.length; i++) {
    if (bounds.includes(i)) continue;
    if (rows[i].m < rows[i-1].m) { ooo++; if (oooDetail.length < 5) oooDetail.push(rows[i-1].m + ' -> ' + rows[i].m); }
  }
  const ref = rows.find(r => r.m === 0 && r.s) || rows[bounds[0]] || rows[0];
  const sigDist = (a, b) => (!a || !b) ? -1 : Math.max(...a.map((v, k) => Math.abs(v - b[k])));
  console.log('    complete loops observed: ' + bounds.length);
  console.log('    loop | rest begins | last pts   | next loop | rest length | identical-picture run');
  bounds.forEach((i, n) => {
    const finalM = rows[i-1].m;
    // The rest is a run of repeats of the final frame, so it is many samples,
    // not one. Walk back while the picture still matches the opening frame:
    // that finds where the rest actually begins, and proves it is the same
    // picture the next loop starts on.
    let j = i - 1;
    while (j > 0 && sigDist(rows[j-1].s, ref.s) <= 2) j--;
    const onScreen = rows[i].d - rows[j].d;
    // every frame from the final image through the start of the next loop is
    // the same picture, so they must all match the reference signature
    let worst = 0, worstAt = null, checked = 0;
    for (let k = j; k <= Math.min(rows.length - 1, i + 4); k++) {
      if (!(rows[k].m >= rows[j].m - 0.001 || rows[k].m <= 0.3)) continue;
      const d = sigDist(rows[k].s, ref.s);
      checked++;
      if (d > worst) { worst = d; worstAt = rows[k].m; }
    }
    console.log('    ' + String(n+1).padEnd(5) + '| ' + String(rows[j].m.toFixed(4)).padEnd(12) + '| ' +
                String(finalM.toFixed(4)).padEnd(11) + '| ' + String(rows[i].m.toFixed(4)).padEnd(10) + '| ' +
                String(onScreen.toFixed(1) + ' ms').padEnd(12) + '| ' + (i - j) +
                ' frames, worst block delta ' + worst + ' (checked ' + checked + ')');
  });
  console.log('    frames out of order inside a loop: ' + ooo + (oooDetail.length ? ('  e.g. ' + oooDetail.join(', ')) : ''));
  const allSigs = rows.filter(r => r.s).map(r => Math.round(r.s.reduce((a,b)=>a+b,0)/r.s.length));
  console.log('    frame brightness over the whole run: min ' + Math.min(...allSigs) + '  max ' + Math.max(...allSigs) +
              '  (reference frame ' + Math.round(ref.s.reduce((a,b)=>a+b,0)/ref.s.length) + ')');
}
report('b64 loop test session', stats);
c.close(); process.exit(0);
