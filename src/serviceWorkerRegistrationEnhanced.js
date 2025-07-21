// Enhanced Service Worker Registration
// Erweitert die Standard-Registrierung um Background Sync und Push Notifications

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      // Use enhanced service worker
      const swUrl = `${process.env.PUBLIC_URL}/service-worker-enhanced.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);

        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Enhanced PWA mit Offline-Sync und Background Features aktiviert.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Enhanced Service Worker registriert:', registration);
      
      // Check for Background Sync support
      if ('sync' in registration) {
        console.log('Background Sync unterstützt');
      }
      
      // Check for Push support
      if ('pushManager' in registration) {
        console.log('Push Notifications unterstützt');
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('Neue Version verfügbar!');
              
              // Show update notification
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
              
              // Custom event for app to handle
              window.dispatchEvent(new CustomEvent('swUpdate', { 
                detail: { registration } 
              }));
            } else {
              // First install
              console.log('App ist jetzt offline-fähig!');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
              
              window.dispatchEvent(new CustomEvent('swInstalled', { 
                detail: { registration } 
              }));
            }
          }
        };
      };
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('SW Message:', event.data);
        
        if (event.data.type === 'SYNC_COMPLETE') {
          window.dispatchEvent(new CustomEvent('swSyncComplete', { 
            detail: event.data 
          }));
        }
      });
    })
    .catch((error) => {
      console.error('Service Worker Registrierung fehlgeschlagen:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Keine Internetverbindung. App läuft offline.');
      window.dispatchEvent(new CustomEvent('swOffline'));
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Helper to trigger background sync
export async function requestBackgroundSync(tag = 'blood-pressure-sync') {
  if ('serviceWorker' in navigator && 'sync' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync scheduled:', tag);
      return true;
    } catch (error) {
      console.error('Background sync failed:', error);
      return false;
    }
  }
  return false;
}

// Helper to send data to sync queue
export async function queueForSync(data) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'QUEUE_SYNC',
      payload: data
    });
    return true;
  }
  return false;
}

// Helper to check online status
export function isOnline() {
  return navigator.onLine;
}

// Helper to request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}