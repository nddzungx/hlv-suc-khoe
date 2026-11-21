/* HLV Sức Khỏe – service worker (tạo bởi make_pwa.py): lưu app vào máy để chạy offline */
const CACHE = 'hlv-suc-khoe-v1.1.1-c10e2444';
const FILES = ["./", "./icons/apple-touch-icon.png", "./icons/favicon-32.png", "./icons/icon-192.png", "./icons/icon-512-maskable.png", "./icons/icon-512.png", "./img/qr_ung_ho.png", "./index.html", "./js/app.js", "./js/data.js", "./js/engine.js", "./js/lib/three.module.min.js", "./js/lunar.js", "./js/photos.js", "./js/viewer3d.js", "./manifest.webmanifest"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || !/^https?:/.test(req.url)) return;
  e.respondWith(caches.match(req, { ignoreSearch: new URL(req.url).origin === location.origin }).then(hit => hit || fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res;
  }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
