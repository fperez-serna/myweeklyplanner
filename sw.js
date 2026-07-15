const CACHE_NAME = 'weekly-planner-v10';
self.addEventListener('install', e => {
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
// Network first always - never serve HTML from cache
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Always fetch from network for HTML and Firebase
  if (url.pathname.endsWith('.html') || 
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('google')) {
    return;
  }
  
  // JS/CSS: bypass HTTP cache to always get latest, fallback to SW cache
  const isScript = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  e.respondWith(
    fetch(e.request, isScript ? { cache: 'no-cache' } : {}).catch(() => caches.match(e.request))
  );
});
