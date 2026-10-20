// Abort every request to Google analytics and advertising hosts, so headless
// runs contribute no traffic. Matching is on the request URL's hostname, never
// a substring of the full URL.
const SUFFIXES = [
  'google-analytics.com',
  'analytics.google.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'doubleclick.net',
  'googleadservices.com',
  'fundingchoicesmessages.google.com',
];
const ADSERVICE = /^adservice\.google\.[a-z0-9.-]+$/;

export function isBlockedHost(host) {
  const h = String(host || '').toLowerCase();
  if (!h) return false;
  if (SUFFIXES.some(s => h === s || h.endsWith('.' + s))) return true;
  return ADSERVICE.test(h);
}

export async function installBlocker(c) {
  const stats = { blocked: 0, hosts: Object.create(null), allowedHosts: Object.create(null) };
  c.on(async m => {
    if (m.method !== 'Fetch.requestPaused') return;
    const id = m.params.requestId;
    let host = '';
    try { host = new URL(m.params.request.url).hostname; } catch (e) { host = ''; }
    if (isBlockedHost(host)) {
      stats.blocked += 1;
      stats.hosts[host] = (stats.hosts[host] || 0) + 1;
      await c.send('Fetch.failRequest', { requestId: id, errorReason: 'BlockedByClient' });
      return;
    }
    if (host) stats.allowedHosts[host] = (stats.allowedHosts[host] || 0) + 1;
    await c.send('Fetch.continueRequest', { requestId: id });
  });
  await c.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  return stats;
}

export function report(label, stats) {
  const hosts = Object.keys(stats.hosts).sort();
  console.log('  [' + label + '] blocked requests: ' + stats.blocked);
  console.log('  [' + label + '] distinct blocked hostnames (' + hosts.length + '): ' + (hosts.join(' ') || 'none'));
  const leaked = Object.keys(stats.allowedHosts).filter(isBlockedHost);
  console.log('  [' + label + '] blocked-list hosts that were allowed through: ' + (leaked.length ? leaked.join(' ') : 'none'));
}
