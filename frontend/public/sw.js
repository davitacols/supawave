const CACHE_NAME = 'supawave-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Check if request is for API endpoints
  if (event.request.url.includes('/api/')) {
    // Verify authorization for API requests
    const authHeader = event.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      event.respondWith(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      return;
    }
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
  if (syncQueue.length === 0) return;

  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('No access token available for sync');
    return;
  }

  try {
    const response = await fetch('/api/sync/upload/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ queue: syncQueue })
    });

    if (response.ok) {
      localStorage.setItem('syncQueue', '[]');
    } else if (response.status === 401) {
      console.error('Unauthorized sync request');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}