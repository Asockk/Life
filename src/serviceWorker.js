// serviceWorker.js
const CACHE_NAME = 'blutdruck-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Füge alle wichtigen CSS und JS Dateien hinzu
];

// Service Worker Installation - Cache Statische Assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installiere...');
  
  // Überspringe das Warten auf vorherige Service Worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Speichere alle Dateien im Cache');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Service Worker Aktivierung - Alte Caches löschen
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktiviert');
  
  // Übernehme Kontrolle über alle Clients sofort
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Service Worker: Lösche alten Cache', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// Fetch Interception und Cache Strategy
self.addEventListener('fetch', event => {
  // Ignoriere Nicht-GET-Anfragen
  if (event.request.method !== 'GET') return;
  
  // Ignoriere Chrome-Extensions und andere externe Anfragen
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Cache-First Strategie mit Network Fallback
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Service Worker: Liefere aus Cache', event.request.url);
          return cachedResponse;
        }
        
        // Wenn nicht im Cache, dann vom Netzwerk holen
        console.log('Service Worker: Lade vom Netzwerk', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Füge erfolgreiche Anfragen zum Cache hinzu
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache die neue Ressource
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('Service Worker: Fetch fehlgeschlagen', error);
            // Optional: Zeige eine Offline-Fallback-Seite
            return caches.match('/offline.html');
          });
      })
  );
});

// Sync-Events für optimistische UI (Offline-Formulare)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-new-measurements') {
    console.log('Service Worker: Synchronisiere Offline-Messungen');
    event.waitUntil(syncMeasurements());
  }
});

// Funktion zum Synchronisieren der Offline-Messungen
async function syncMeasurements() {
  try {
    // Hier würde normalerweise Code stehen, um Offline-Daten aus IndexedDB
    // zu lesen und mit einem Server zu synchronisieren
    // Da wir aber alles lokal machen, ist dies nur ein Platzhalter
    
    // Erstelle eine Nachricht für alle offenen Tabs/Fenster
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          message: 'Daten erfolgreich synchronisiert'
        });
      });
    });
    
    return true;
  } catch (error) {
    console.error('Synchronisierung fehlgeschlagen:', error);
    return false;
  }
}

// Push-Benachrichtigungen für Erinnerungen
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Zeit für Ihre Blutdruckmessung!',
    icon: '/icons/logo-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Blutdruck-Tracker', 
      options
    )
  );
});

// Benachrichtigungs-Klick
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Wenn bereits ein Fenster offen ist, fokussiere es
        for (const client of windowClients) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Ansonsten öffne ein neues Fenster
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
  );
});

// Periodische Background-Sync (falls unterstützt)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'daily-measurement-reminder') {
      event.waitUntil(sendMeasurementReminder());
    }
  });
}

async function sendMeasurementReminder() {
  // Prüfen ob heute schon eine Messung erfolgt ist
  // Falls nicht, sende eine Erinnerung
  const options = {
    body: 'Haben Sie heute schon Ihren Blutdruck gemessen?',
    icon: '/icons/logo-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };
  
  return self.registration.showNotification(
    'Blutdruck-Tracker Erinnerung', 
    options
  );
}