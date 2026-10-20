// Makes the WebP poster with Chrome's own encoder (canvas.toBlob), so the
// pipeline still needs nothing beyond Chrome and swift.
//
// The PNG goes in as a data: URL rather than a file:// image: a file:// image
// taints the canvas in headless Chrome and toBlob then throws SecurityError.
//
// usage: node towebp.mjs <port> <in.png> <out.webp> [quality]
import { connect } from './cdp.mjs';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { basename } from 'path';
const [port, inPng, outWebp, q = '0.82'] = process.argv.slice(2);
if (!outWebp || existsSync(outWebp)) {
    // Never overwrite: an existing output means a previous run, and silently
    // replacing it would destroy the only copy of that clip's poster.
    console.error(outWebp
        ? 'refusing to write ' + outWebp + ': it already exists.'
        : 'usage: node towebp.mjs <port> <in.png> <out.webp> [quality]');
    process.exit(2);
}
const png = readFileSync(inPng);
const c = await connect(Number(port));
await c.send('Page.navigate', { url: 'about:blank' });
await new Promise(r => setTimeout(r, 400));
const src = 'data:image/png;base64,' + png.toString('base64');
const out = await c.ev(`new Promise(function(res,rej){
  var i = new Image();
  i.onerror = function(){ res(JSON.stringify({error:'image failed to decode'})); };
  i.onload = function(){
    try {
      var cv = document.createElement('canvas');
      cv.width = i.naturalWidth; cv.height = i.naturalHeight;
      cv.getContext('2d').drawImage(i, 0, 0);
      cv.toBlob(function(b){
        if (!b) { res(JSON.stringify({error:'toBlob returned null'})); return; }
        var r = new FileReader();
        r.onload = function(){ res(JSON.stringify({w:cv.width, h:cv.height, type:b.type, d:r.result})); };
        r.readAsDataURL(b);
      }, 'image/webp', ${q});
    } catch (e) { res(JSON.stringify({error:String(e)})); }
  };
  i.src = ${JSON.stringify(src)};
})`);
if (typeof out !== 'string') { console.log('  FAILED: evaluate returned ' + JSON.stringify(out)); process.exit(1); }
const o = JSON.parse(out);
if (o.error) { console.log('  FAILED: ' + o.error); process.exit(1); }
if (o.type !== 'image/webp') { console.log('  FAILED: Chrome produced ' + o.type + ', not image/webp'); process.exit(1); }
const buf = Buffer.from(o.d.split(',')[1], 'base64');
writeFileSync(outWebp, buf);
const magic = buf.slice(0, 4).toString('ascii') + ' ' + buf.slice(8, 12).toString('ascii');
console.log('  ' + basename(inPng).padEnd(30) + o.w + 'x' + o.h + '  ' + Math.round(png.length/1024) + ' KB');
console.log('  ' + basename(outWebp).padEnd(30) + o.w + 'x' + o.h + '  ' + Math.round(buf.length/1024) + ' KB' +
            '   quality ' + q + ', ' + (png.length/buf.length).toFixed(1) + 'x smaller, container magic "' + magic + '"');
c.close(); process.exit(0);
