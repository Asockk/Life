// components/UI/ResetButton.js
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ResetButton = ({ onReset }) => {
  const handleReset = () => {
    if (window.confirm('WARNUNG: Dies löscht alle Daten und setzt die App zurück. Fortfahren?')) {
      // Clear IndexedDB
      if (window.indexedDB) {
        window.indexedDB.deleteDatabase('BlutdruckTrackerDB');
      }
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('blutdruck')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Call reset callback if provided
      if (onReset) {
        onReset();
      }
      
      // Reload the page
      window.location.reload();
    }
  };
  
  return (
    <button
      onClick={handleReset}
      className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
    >
      <AlertTriangle size={18} className="mr-2" />
      App zurücksetzen (Debug)
    </button>
  );
};

export default ResetButton;