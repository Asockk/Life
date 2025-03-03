// components/UI/ToggleViewButtons.js
import React from 'react';
import { Sun, Moon } from 'lucide-react';

const ToggleViewButtons = ({ viewType, setViewType }) => {
  return (
    <div className="mb-4">
      <div className="flex w-full bg-white rounded-lg shadow-sm overflow-hidden" role="group">
        <button 
          className={`flex-1 px-3 py-3 text-sm font-medium flex items-center justify-center ${
            viewType === 'morgen' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setViewType('morgen')}
          aria-pressed={viewType === 'morgen'}
        >
          <Sun size={18} className="mr-2" />
          <span>Morgen-Werte</span>
        </button>
        <button 
          className={`flex-1 px-3 py-3 text-sm font-medium flex items-center justify-center ${
            viewType === 'abend' 
              ? 'bg-purple-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setViewType('abend')}
          aria-pressed={viewType === 'abend'}
        >
          <Moon size={18} className="mr-2" />
          <span>Abend-Werte</span>
        </button>
      </div>
    </div>
  );
};

export default ToggleViewButtons;