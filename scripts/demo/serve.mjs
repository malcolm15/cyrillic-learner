// Minimal static server on 127.0.0.1 for the loop test. Serving over http
// rather than file:// matters for two reasons: a file:// video taints the
// canvas so the frame signatures cannot be read, and byte-range requests are
// how a browser really fetches video.
import { createServer } from 'http';
import { stat, open } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = process.argv[2], PORT = Number(process.argv[3]);
const TYPES = { '.html':'text/html; charset=utf-8', '.mp4':'video/mp4', '.png':'image/png',
                '.webp':'image/webp', '.css':'text/css', '.js':'text/javascript' };
createServer(async (req, res) => {
  try {
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, rel === '/' ? '/loop-test.html' : rel);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const st = await stat(file);
    const type = TYPES[extname(file)] || 'application/octet-stream';
    const range = req.headers.range;
    const fh = await open(file, 'r');
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m[1] ? parseInt(m[1]) : 0;
      const end = m[2] ? parseInt(m[2]) : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      fh.createReadStream({ start, end }).pipe(res).on('close', () => fh.close());
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
      fh.createReadStream().pipe(res).on('close', () => fh.close());
    }
  } catch (e) { res.writeHead(404).end(String(e)); }
}).listen(PORT, '127.0.0.1', () => console.log('  serving ' + ROOT + ' on http://127.0.0.1:' + PORT));
