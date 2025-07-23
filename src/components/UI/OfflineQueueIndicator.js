// components/UI/OfflineQueueIndicator.js
import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import offlineQueueService from '../../services/offlineQueueService';
import HapticFeedback from '../../utils/hapticFeedback';

const OfflineQueueIndicator = ({ darkMode }) => {
  const [queueStatus, setQueueStatus] = useState({
    count: 0,
    syncing: false,
    lastSync: null,
    error: null
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStatus = async (event) => {
      const count = await offlineQueueService.getPendingCount();
      
      setQueueStatus(prev => ({
        ...prev,
        count,
        syncing: event?.event === 'sync-start',
        error: event?.event === 'error' ? event.data?.lastError : null,
        lastSync: event?.event === 'sync-complete' ? new Date() : prev.lastSync
      }));

      // Haptic feedback bei wichtigen Events
      if (event?.event === 'sync-complete' && count === 0) {
        HapticFeedback.notification('success');
      } else if (event?.event === 'error') {
        HapticFeedback.notification('error');
      }
    };

    // Initial status
    updateStatus();
    
    // Subscribe to updates
    offlineQueueService.addListener(updateStatus);

    return () => {
      offlineQueueService.removeListener(updateStatus);
    };
  }, []);

  // Nicht anzeigen wenn keine ausstehenden Operationen
  if (queueStatus.count === 0 && !queueStatus.syncing) {
    return null;
  }

  const syncNow = () => {
    HapticFeedback.impact('medium');
    offlineQueueService.processPendingOperations();
  };

  return (
    <div className={`
      fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-30
      ${darkMode ? 'bg-gray-800' : 'bg-white'}
      rounded-lg shadow-lg border
      ${darkMode ? 'border-gray-700' : 'border-gray-200'}
      transition-all duration-300 transform
      ${isExpanded ? 'scale-100' : 'scale-95'}
    `}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => {
          HapticFeedback.selection();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-2">
          {queueStatus.syncing ? (
            <Loader size={18} className="text-blue-500 animate-spin" />
          ) : navigator.onLine ? (
            <Cloud size={18} className="text-green-500" />
          ) : (
            <CloudOff size={18} className="text-gray-400" />
          )}
          
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {queueStatus.syncing 
              ? 'Synchronisiere...' 
              : `${queueStatus.count} ausstehende Änderungen`
            }
          </span>
        </div>
        
        {!queueStatus.syncing && navigator.onLine && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              syncNow();
            }}
            className={`
              px-3 py-1 text-xs rounded-full font-medium
              ${darkMode 
                ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }
              transition-colors
            `}
          >
            Jetzt sync
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={`
          px-3 pb-3 border-t
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {/* Status Info */}
          <div className="mt-2 space-y-2">
            {queueStatus.error && (
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5" />
                <div>
                  <p className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    Fehler bei Synchronisation
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {queueStatus.error}
                  </p>
                </div>
              </div>
            )}
            
            {queueStatus.lastSync && (
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Letzte Sync: {queueStatus.lastSync.toLocaleTimeString()}
                </p>
              </div>
            )}
            
            {!navigator.onLine && (
              <p className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Die Änderungen werden automatisch synchronisiert, sobald Sie wieder online sind.
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {queueStatus.syncing && (
            <div className="mt-3">
              <div className={`
                h-1 rounded-full overflow-hidden
                ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}
              `}>
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineQueueIndicator;