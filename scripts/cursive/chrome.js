// Shared by the hand-run generators in scripts/cursive/ (build-chart.js,
// build-worksheets.js): one headless Chrome, started for one job and stopped
// after it. Never part of the Netlify build.
//
// Chrome runs headless with its debugging port bound to 127.0.0.1 on a port
// the system picks (--remote-debugging-port=0); withChrome reads that port
// from the DevToolsActivePort file Chrome writes into its throwaway profile,
// so it can only ever talk to the Chrome it started. The profile is a mkdtemp
// folder inside the job's output folder and is the one thing removed
// afterwards.
//
// Chrome's own background traffic (updates, safe browsing, metrics, sync) is
// switched off, anything left is sent to a proxy on the discard port, which
// refuses it, and every host name resolves to "not found", which also stops
// Chrome's secure-DNS lookups. file:// pages and the loopback debugging socket
// are unaffected. Measured with lsof -i on Chrome's processes: no socket
// leaves 127.0.0.1.
//
// --disable-gpu makes the raster deterministic. With GPU raster the same page
// came out as one of two PNGs that differ in anti-aliasing (Batch 74: 5 of 24
// renders were the second one); with software raster 8 of 8 were identical.
//
// Dependencies: node and Google Chrome. No packages.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_FLAGS = [
    '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--disable-gpu',
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
    '--disable-domain-reliability', '--disable-client-side-phishing-detection', '--no-pings', '--disable-quic',
    '--metrics-recording-only', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=<-loopback>',
    '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1',
];

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// Starts Chrome with a throwaway profile inside workDir, connects to its one
// page, runs job(send) and always stops Chrome and removes the profile.
// send(method, params) resolves with the CDP result or rejects on an error.
async function withChrome(workDir, job) {
    const profile = fs.mkdtempSync(path.join(workDir, '.chrome-profile-'));
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
        return await job(send);
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

module.exports = { CHROME, CHROME_FLAGS, sleep, withChrome };
