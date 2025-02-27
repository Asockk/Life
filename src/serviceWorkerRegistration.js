// serviceWorkerRegistration.js

// Diese Service Worker-Registrierungsdatei macht deine App offline-fähig
// und lädt sie schneller (durch Vorabladen von Ressourcen).

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    // Der Service Worker-URLs sind relativ zum Ursprung der Webseite
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Unsere Service Worker funktioniert nicht, wenn PUBLIC_URL auf
      // einer anderen Ursprungs-Domain ist als unsere Seite.
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/serviceWorker.js`;

      if (isLocalhost) {
        // Dies wird auf dem Localhost ausgeführt. Prüfen wir, ob ein Service Worker noch existiert oder nicht.
        checkValidServiceWorker(swUrl, config);

        // Füge zusätzliche Logging für den Localhost hinzu, um Entwicklern zu zeigen,
        // dass Service Worker läuft/nicht läuft.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Diese Web-App wird vom Service Worker bedient. ' +
              'Weitere Informationen unter https://cra.link/PWA'
          );
        });
      } else {
        // Kein Localhost. Service Worker einfach registrieren
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Auslöser für Aktualisierung, wenn ein neuer Service Worker gefunden wird
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Bei diesem Punkt wurde ein neuer Service Worker aktiviert, und der alte
              // Service Worker wird bald inaktiv.
              
              // Einen Hinweis anzeigen, um den Benutzer über die neue Version zu informieren
              console.log(
                'Neue Inhalte sind verfügbar und werden verwendet, ' +
                  'wenn alle Tabs für diese Seite geschlossen werden.'
              );

              // Benachrichtigungsfunktion ausführen, wenn in der Konfiguration vorhanden
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Das ist eine erste Installation.
              console.log('Inhalte werden für die Offline-Nutzung zwischengespeichert.');

              // Benachrichtigungsfunktion ausführen, wenn in der Konfiguration vorhanden
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
              
              // Offline-Funktionalität im UI aktivieren
              window.dispatchEvent(new CustomEvent('swOfflineReady'));
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Fehler während der Service Worker-Registrierung:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Prüfen, ob der Service Worker gefunden werden kann. Wenn nicht, laden wir die Seite neu.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Stellen Sie sicher, dass der Service Worker existiert und dass wir wirklich eine JS-Datei erhalten.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Kein Service Worker gefunden. Wahrscheinlich eine andere App. Seite neu laden.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service Worker gefunden. Fahre wie gewohnt fort.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Keine Internetverbindung gefunden. App läuft im Offline-Modus.');
      
      // Offline-Status im UI anzeigen
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