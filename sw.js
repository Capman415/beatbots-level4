// v13.2 service worker: images, fonts, voice lines and scripts come from cache after the first visit (slow school Wi-Fi /
// smartboards). index.html and version.json always try the network first so a new build is picked up.
const C='bb-1794000201';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin)return;
  const fresh=/\/(index\.html)?$|version\.json/.test(u.pathname);
  if(fresh){e.respondWith(fetch(r).then(x=>{const y=x.clone();caches.open(C).then(c=>c.put(r,y));return x}).catch(()=>caches.match(r)));return}
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r,y))}return x})))});
