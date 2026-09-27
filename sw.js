// NuvemOS SW — cacheia o shell (html/css/js). Imagens de VM ficam em rede (grandes demais).
const CACHE = 'nuvemos-shell-v3';
const SHELL = ['./index.html', './styles.css', './app.js', './manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Nunca intercepta imagens de VM / motores externos: deixa ir direto à rede.
  if (/cdn\.jsdelivr\.net|copy\.sh|bellard\.org|webvm\.io|leaningtech|disks\.webvm\.io/.test(u.host)) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r.ok && u.origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
