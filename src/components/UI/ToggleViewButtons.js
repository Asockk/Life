// components/UI/ToggleViewButtons.js
import React from 'react';

const ToggleViewButtons = ({ viewType, setViewType }) => {
  return (
    <div className="mb-4">
      <div className="bg-white inline-flex rounded-md shadow-sm" role="group">
        <button 
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            viewType === 'morgen' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setViewType('morgen')}
        >
          Morgen-Werte
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
            viewType === 'abend' 
              ? 'bg-purple-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setViewType('abend')}
        >
          Abend-Werte
        </button>
      </div>
    </div>
  );
};

export default ToggleViewButtons;