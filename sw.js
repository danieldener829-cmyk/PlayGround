const C = "psp-clone-v1";
const A = ["./","./index.html","./styles.css","./app.js","./games.json","./manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(A)).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(r => {
    const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)).catch(()=>{});
    return r;
  }).catch(()=>caches.match("./index.html"))));
});
