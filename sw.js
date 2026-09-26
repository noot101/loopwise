const CACHE_NAME = "loopwise-v2.0.0";
const PRECACHE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  // Bewust GEEN skipWaiting hier: de nieuwe versie wacht tot de gebruiker
  // op "Vernieuwen" tikt, zodat je niet ongevraagd mid-wandeling herstart.
});

self.addEventListener("message", event => {
  if(event.data === "skipWaiting"){
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  // Alleen eigen bestanden cachen; routeberekening en kaarttegels altijd live ophalen.
  if(url.origin !== self.location.origin || event.request.method !== "GET"){
    return;
  }
  // Network-first: probeer altijd de nieuwste versie, val terug op cache als offline.
  event.respondWith(
    fetch(event.request).then(resp => {
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
      return resp;
    }).catch(() => caches.match(event.request))
  );
});
