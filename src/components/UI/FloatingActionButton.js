// components/UI/FloatingActionButton.js
import React from 'react';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transform transition-transform hover:scale-110 active:scale-95 focus:outline-none"
      aria-label="Neuer Eintrag"
    >
      <Plus size={24} />
    </button>
  );
};

export default FloatingActionButton;