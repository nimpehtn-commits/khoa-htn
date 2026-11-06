/* Service worker của bản cài: giữ trang vỏ + biểu tượng + phông chữ trên máy để mở App khi mất mạng.
   Lời gọi máy chủ (POST tới script.google.com) không đi qua đây. */
const CACHE = 'htn-shell-v1', FONTS = 'htn-fonts';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {   // trang vỏ: dùng bản trên máy ngay, cập nhật ở nền
    e.respondWith(caches.open(CACHE).then(async c => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const hit = await c.match(key, {ignoreSearch: true});
      const net = fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return (await net) || new Response('Không có mạng', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
    }));
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; } catch (err) { return new Response('', {status: 503}); }
    }));
  }
});
