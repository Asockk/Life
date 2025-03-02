// components/Dashboard/ViewToggleButtons.js
import React from 'react';
import { Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ViewToggleButtons = ({ viewType, setViewType }) => {
  const { theme } = useTheme();

  return (
    <div className="w-full flex justify-between items-center mb-1 mt-1">
      {/* Linker Button: Zur Morgenansicht wechseln (nur anzeigen, wenn aktuell Abendansicht) */}
      <button
        onClick={() => setViewType('morgen')}
        className={`flex items-center p-2 rounded-lg transition-all duration-300 ${
          viewType === 'abend' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: `${theme.primary}15`,
          color: theme.primary,
        }}
        aria-label="Zu Morgenansicht wechseln"
      >
        <ChevronLeft size={16} />
        <Sun size={16} className="ml-1" />
        <span className="text-xs ml-1 font-medium">Morgen</span>
      </button>

      {/* Mittlerer Text: Aktuelle Ansicht */}
      <div className="text-xs font-medium" style={{ color: theme.text.secondary }}>
        {viewType === 'morgen' ? 'Morgen-Werte' : 'Abend-Werte'}
      </div>

      {/* Rechter Button: Zur Abendansicht wechseln (nur anzeigen, wenn aktuell Morgenansicht) */}
      <button
        onClick={() => setViewType('abend')}
        className={`flex items-center p-2 rounded-lg transition-all duration-300 ${
          viewType === 'morgen' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: `${theme.secondary}15`,
          color: theme.secondary,
        }}
        aria-label="Zu Abendansicht wechseln"
      >
        <span className="text-xs mr-1 font-medium">Abend</span>
        <Moon size={16} className="mr-1" />
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default ViewToggleButtons;