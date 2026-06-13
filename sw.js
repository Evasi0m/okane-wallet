const CACHE_NAME = 'okane-v0.3.5-themes-pink-pistachio-v1';
const CACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './shared/supabase-config.js',
  './shared/svg-utils.js',
  './shared/cms-core.js',
  './assets/okane-mascot.svg',
  './assets/income-wallet.svg',
  './assets/thai-chueay-thai-logo.png',
  './updates.json',
  './admin/',
  './admin/index.html',
  './admin/admin.js',
  './admin/admin.css',
  './admin/modules/icons.js',
  './admin/modules/assets.js',
  './admin/modules/strings.js',
  './admin/modules/config.js',
  './shared/icon-defaults.js',
  'https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Google+Sans+Thai:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS.filter(u => u.startsWith('./')));
    })
  );
  // Always skip waiting so new SW takes over immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  var networkFirst = url.includes('updates.json') || url.includes('app.js') || url.includes('index.html') || url.includes('sw.js') || url.includes('api.github.com') || url.includes('supabase.co/rest/v1/');
  if (!networkFirst) {
    try {
      var p = new URL(url).pathname;
      if (p.endsWith('/okane-wallet') || p.endsWith('/okane-wallet/')) networkFirst = true;
    } catch (err) {}
  }
  if (networkFirst) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(response) {
      if (response && response.status === 200 && response.type !== 'opaque') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

// Listen for SKIP_WAITING message from the app
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
