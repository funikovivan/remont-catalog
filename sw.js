const CACHE = 'remont-v1'; // МЕНЯЙТЕ ЭТО ПРИ КАЖДОМ ОБНОВЛЕНИИ!
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './catalog.json',
  './manifest.json',
  './js/fuse.min.js'
];

// Установка и кэширование
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активация (удаление старых кэшей)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Стратегия загрузки
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Для JSON используем Stale-While-Revalidate
  if (url.pathname.endsWith('catalog.json')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const network = fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          }).catch(() => null);
          return cached || network;
        })
      )
    );
    return;
  }

  // Для остального Cache-First с фолбэком в сеть
  e.respondWith(
    caches.match(e.request).then(r => {
      return r || fetch(e.request).catch(() => {
        // Если это навигация (открытие страницы), отдаем index.html
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});