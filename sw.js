// Unregister this service worker and clear every cache so classroom devices
// stop serving the old Beat Bots / Steady Bots Level 4 copy from this URL.
self.addEventListener('install',function(e){e.waitUntil(self.skipWaiting())});
self.addEventListener('activate',function(e){
  e.waitUntil((async function(){
    try{
      var keys=await caches.keys();
      await Promise.all(keys.map(function(k){return caches.delete(k)}));
    }catch(err){}
    try{await self.registration.unregister()}catch(err){}
    try{await self.clients.claim()}catch(err){}
    try{
      var clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
      await Promise.all(clients.map(function(c){try{return c.navigate(c.url)}catch(err){}}));
    }catch(err){}
  })());
});
// Do not intercept fetches; let the redirect pages hit the network.
