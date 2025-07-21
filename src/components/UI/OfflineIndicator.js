// Offline Indicator Component
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff } from 'lucide-react';
import syncService from '../../services/syncService';

const OfflineIndicator = ({ darkMode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(syncService.getStatus());
  const [showDetails, setShowDetails] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setSyncMessage('Verbindung wiederhergestellt');
      setTimeout(() => setSyncMessage(''), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncMessage('Keine Internetverbindung');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync events
    const unsubscribe = syncService.addListener((event) => {
      setSyncStatus(syncService.getStatus());
      
      switch (event.type) {
        case 'sync-start':
          setSyncMessage('Synchronisiere...');
          break;
        case 'sync-complete':
          if (event.synced.length > 0) {
            setSyncMessage(`${event.synced.length} Einträge synchronisiert`);
            setTimeout(() => setSyncMessage(''), 3000);
          }
          break;
        case 'queued':
          setSyncMessage('Für Synchronisation vorgemerkt');
          setTimeout(() => setSyncMessage(''), 2000);
          break;
        default:
          break;
      }
    });

    // Check sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(syncService.getStatus());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncMessage('Starte Synchronisation...');
    await syncService.syncNow();
  };

  const handleRetry = async () => {
    setSyncMessage('Wiederhole fehlgeschlagene Einträge...');
    await syncService.retryFailed();
  };

  if (!isOnline || syncStatus.queueLength > 0) {
    return (
      <>
        {/* Floating indicator */}
        <div
          className={`
            fixed bottom-20 right-4 z-40
            px-4 py-2 rounded-full
            flex items-center gap-2
            transition-all duration-300
            cursor-pointer
            ${!isOnline
              ? 'bg-red-500 text-white'
              : syncStatus.syncing
              ? 'bg-blue-500 text-white'
              : syncStatus.queueLength > 0
              ? 'bg-yellow-500 text-white'
              : 'bg-green-500 text-white'
            }
          `}
          onClick={() => setShowDetails(!showDetails)}
        >
          {!isOnline ? (
            <>
              <WifiOff size={18} />
              <span className="text-sm font-medium">Offline</span>
            </>
          ) : syncStatus.syncing ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span className="text-sm font-medium">Synchronisiere...</span>
            </>
          ) : syncStatus.queueLength > 0 ? (
            <>
              <CloudOff size={18} />
              <span className="text-sm font-medium">{syncStatus.queueLength} ausstehend</span>
            </>
          ) : null}
        </div>

        {/* Status message */}
        {syncMessage && (
          <div
            className={`
              fixed top-4 left-1/2 transform -translate-x-1/2 z-50
              px-4 py-2 rounded-lg
              ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}
              shadow-lg border
              ${darkMode ? 'border-gray-700' : 'border-gray-200'}
              animate-fade-in
            `}
          >
            <p className="text-sm">{syncMessage}</p>
          </div>
        )}

        {/* Details panel */}
        {showDetails && (
          <div
            className={`
              fixed bottom-32 right-4 z-40
              w-80 rounded-xl shadow-xl
              ${darkMode ? 'bg-gray-900' : 'bg-white'}
              border ${darkMode ? 'border-gray-800' : 'border-gray-200'}
              p-4
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Synchronisationsstatus</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {/* Connection status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Verbindung:
                </span>
                <span className={`
                  text-sm font-medium flex items-center gap-1
                  ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                `}>
                  {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Queue status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ausstehende Einträge:
                </span>
                <span className="text-sm font-medium">
                  {syncStatus.queueLength}
                </span>
              </div>

              {/* Sync status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span className="text-sm font-medium">
                  {syncStatus.syncing ? 'Synchronisiere...' : 'Bereit'}
                </span>
              </div>

              {/* Actions */}
              {isOnline && syncStatus.queueLength > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSync}
                    disabled={syncStatus.syncing}
                    className={`
                      w-full py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${syncStatus.syncing
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'}
                    `}
                  >
                    {syncStatus.syncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
                  </button>
                </div>
              )}

              {/* Retry failed */}
              {syncStatus.queue.some(item => item.retries > 0) && (
                <button
                  onClick={handleRetry}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Fehlgeschlagene wiederholen
                </button>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default OfflineIndicator;