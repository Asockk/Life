import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import App from './App';
// import App from './AppModern'; // Verwende die moderne Version
import App from './AppUltraModern'; // Ultra moderne Version mit iOS-inspiriertem Design
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistrationEnhanced';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Enhanced Service Worker für Offline-First PWA registrieren
serviceWorkerRegistration.register({
  onUpdate: registration => {
    console.log('Neue Version verfügbar!');
    // Optional: Show update notification to user
  },
  onSuccess: registration => {
    console.log('App ist offline-fähig!');
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();