/* Service worker — funzionamento offline dopo il primo caricamento.
   Strategia: gli esercizi si cercano prima in rete (così gli aggiornamenti
   arrivano subito) con riserva in cache; il resto prima in cache. */
'use strict';

const CACHE = 'inglese-a2b1-v1';
const FILE_BASE = ['./', './index.html', './esercizi.json', './esercizi.js'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILE_BASE.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then(chiavi => Promise.all(chiavi.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.endsWith('esercizi.json')) {
    // rete prima, cache come riserva
    ev.respondWith(
      fetch(ev.request).then(risp => {
        const copia = risp.clone();
        caches.open(CACHE).then(c => c.put(ev.request, copia));
        return risp;
      }).catch(() => caches.match(ev.request))
    );
  } else {
    // cache prima, rete come riserva (aggiornando la cache)
    ev.respondWith(
      caches.match(ev.request).then(inCache => inCache || fetch(ev.request).then(risp => {
        const copia = risp.clone();
        caches.open(CACHE).then(c => c.put(ev.request, copia));
        return risp;
      }))
    );
  }
});
