self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('mcp-manager-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/api/services',
        '/static/css/main.css',
        '/static/js/bundle.js'
      ]);
    })
  );
});