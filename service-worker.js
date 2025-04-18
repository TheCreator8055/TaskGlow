// Cache name and files to cache
const CACHE_NAME = 'task-glow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/ai-manager.js',
  '/test.js',
  '/manifest.json',
  '/icons/192 x 192.webp',
  '/icons/512 x 512.webp',
  '/icons/1024 x 1024.webp',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@400;600&family=Space+Grotesk:wght@500&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip Gemini API requests
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Background sync for offline task updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Get tasks from IndexedDB
  const tasks = await getTasksFromIndexedDB();
  
  // Sync with server when online
  if (navigator.onLine) {
    try {
      await fetch('/api/sync-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tasks)
      });
      // Clear IndexedDB after successful sync
      await clearIndexedDB();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js').then(registration => {
    registration.onupdatefound = () => {
      const newWorker = registration.installing;
      newWorker.onstatechange = () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // A new version is available
          showUpdateToast(); // Show a message to the user
        }
      };
    };
  });
}
