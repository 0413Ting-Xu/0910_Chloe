// Offline shell for the app. The list itself lives in localStorage / Supabase; this only keeps the page, images and font
// available without a network. The page is fetched network-first so a new version shows up the next time it's opened.
const CACHE = 'chloe-shell-v3';
const CORE = ['./', 'index.html', 'demo.js', 'updates.js', 'manifest.webmanifest', 'images/chiikawa.webp', 'images/hachiware.webp', 'images/usagi.jpg',
  'images/chiikawa-usagi.jpg', 'images/face-chiikawa.png', 'images/face-hachiware.png', 'images/icon-180.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; };

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const same = url.origin === location.origin;
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;   // Supabase and everything else goes straight to the network
  if (req.mode === 'navigate' || (same && /\/(index\.html|demo\.js|updates\.js|sw\.js)$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html', { ignoreSearch: true }))));
    return;
  }
  // Images, fonts and the rest: show the saved copy right away, refresh it in the background.
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => put(req, r)).catch(() => hit);
    return hit || net;
  }));
});

// Reminders: the server sends a push at a routine's time; show it, and open the app when it's tapped.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (err) {}
  e.waitUntil(self.registration.showNotification(d.title || '每日小清單', {
    body: d.body || '', tag: d.tag, icon: 'images/icon-192.png', badge: 'images/icon-192.png', data: { url: d.url || './' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(self.registration.scope));
    return open && 'focus' in open ? open.focus() : self.clients.openWindow(url);
  }));
});
