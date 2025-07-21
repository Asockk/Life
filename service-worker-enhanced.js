/* eslint-disable no-restricted-globals */
// Enhanced Service Worker for Offline-First PWA

const CACHE_NAME = 'blutdruck-tracker-v2';
const SYNC_TAG = 'blood-pressure-sync';
const DB_NAME = 'BlutdruckTrackerDB';
const SYNC_QUEUE_NAME = 'sync-queue';

// Files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return 404 for other requests
            return new Response('Not found', { status: 404 });
          });
      })
  );
});

// Background Sync for offline changes
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncOfflineData());
  }
});

// Sync Queue for offline data
class SyncQueue {
  constructor() {
    this.dbPromise = this.openDB();
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = event => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(SYNC_QUEUE_NAME)) {
          const store = db.createObjectStore(SYNC_QUEUE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async add(data) {
    const db = await this.dbPromise;
    const tx = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_NAME);
    
    return store.add({
      ...data,
      timestamp: Date.now(),
      synced: false
    });
  }

  async getAll() {
    const db = await this.dbPromise;
    const tx = db.transaction(SYNC_QUEUE_NAME, 'readonly');
    const store = tx.objectStore(SYNC_QUEUE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(id) {
    const db = await this.dbPromise;
    const tx = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_NAME);
    
    return store.delete(id);
  }

  async markSynced(id) {
    const db = await this.dbPromise;
    const tx = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_NAME);
    
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          data.syncedAt = Date.now();
          store.put(data).onsuccess = () => resolve(true);
        } else {
          resolve(false);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

const syncQueue = new SyncQueue();

// Handle messages from the app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'QUEUE_SYNC') {
    // Add to sync queue
    syncQueue.add(event.data.payload)
      .then(() => {
        // Try to sync immediately if online
        if (self.registration.sync) {
          return self.registration.sync.register(SYNC_TAG);
        }
      })
      .catch(error => {
        console.error('[SW] Failed to queue sync:', error);
      });
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    const items = await syncQueue.getAll();
    const unsynced = items.filter(item => !item.synced);
    
    console.log(`[SW] Syncing ${unsynced.length} items`);
    
    for (const item of unsynced) {
      try {
        // Handle different sync types
        switch (item.type) {
          case 'measurement':
            await syncMeasurement(item);
            break;
          case 'context':
            await syncContext(item);
            break;
          default:
            console.warn('[SW] Unknown sync type:', item.type);
        }
        
        // Mark as synced
        await syncQueue.markSynced(item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
        // Keep in queue for retry
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: unsynced.length
      });
    });
    
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry later
  }
}

// Sync measurement data
async function syncMeasurement(item) {
  // In a real app, this would sync to a server
  // For now, we'll just update IndexedDB
  return updateIndexedDB('messungen', item.data);
}

// Sync context data
async function syncContext(item) {
  return updateIndexedDB('kontextfaktoren', item.data);
}

// Update IndexedDB with conflict resolution
async function updateIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onsuccess = event => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Check for existing data
      const getRequest = store.get(data.id);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        
        if (existing) {
          // Conflict resolution: use latest timestamp
          const existingTime = existing.lastModified || 0;
          const newTime = data.lastModified || Date.now();
          
          if (newTime > existingTime) {
            store.put(data).onsuccess = () => resolve(data);
          } else {
            // Keep existing data
            resolve(existing);
          }
        } else {
          // No conflict, just add
          store.add(data).onsuccess = () => resolve(data);
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Push notification support
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Zeit für Ihre Blutdruckmessung!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'measure',
        title: 'Jetzt messen',
        icon: '/icon-measure.png'
      },
      {
        action: 'later',
        title: 'Später',
        icon: '/icon-later.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Blutdruck Tracker', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'measure') {
    // Open app with measurement form
    event.waitUntil(
      clients.openWindow('/?action=measure')
    );
  } else if (event.action === 'later') {
    // Schedule reminder for later
    // This would integrate with the notification scheduling system
  } else {
    // Just open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Enhanced Service Worker loaded');