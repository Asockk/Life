// components/UI/ConfirmationDialog.js
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 animate-fadeIn" 
        style={{animation: 'fadeIn 0.2s ease-out'}}
      >
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>

          <button 
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-500"
            onClick={onCancel}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onCancel}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={onConfirm}
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;