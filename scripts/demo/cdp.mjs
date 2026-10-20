export async function connect(port) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  let t = list.find(x => x.type === 'page');
  if (!t) t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const listeners = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) listeners.forEach(fn => fn(m));
  });
  await new Promise(r => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id;
    const to = setTimeout(() => { pending.delete(i); res({ timeout: true }); }, 30000);
    pending.set(i, v => { clearTimeout(to); res(v); });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async expr => (await send('Runtime.evaluate',
    { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.result?.value;
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const goto = async (url, settle = 4000) => { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, settle)); };
  const metrics = (w, h, dsf = 1, mobile = false) =>
    send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile });
  return { ws, send, ev, goto, metrics, on: fn => listeners.push(fn), close: () => ws.close() };
}
