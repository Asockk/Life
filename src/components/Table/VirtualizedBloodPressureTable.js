// components/Table/VirtualizedBloodPressureTable.js
import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Edit, Trash, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';

const VirtualizedBloodPressureTable = ({ data, onEdit, onDelete, darkMode = true }) => {
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  // totalPages state removed - calculated inline
  const [currentData, setCurrentData] = useState([]);
  const [sortDescending, setSortDescending] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  
  // Container height for virtualization
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef(null);
  
  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const windowHeight = window.innerHeight;
        const containerTop = containerRef.current.getBoundingClientRect().top;
        const bottomPadding = 100; // For navigation
        const newHeight = windowHeight - containerTop - bottomPadding;
        setContainerHeight(Math.max(400, newHeight));
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  // Data preprocessing with memoization
  useEffect(() => {
    // Deutsche Monatsnamen in numerische Werte - mit Varianten für März
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11,
      // Alternative Schreibweisen
      'Marz': 2, 'Maerz': 2
    };
    
    // Datumsstring in Date-Objekt
    const parseDate = (str) => {
      if (!str) return new Date(0);
      
      let day, month, year;
      
      // Extrahiere Jahr aus dem String
      const yearMatch = str.match(/\b(20\d{2})\b/);
      year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Format: "21. November 2024" oder "1. Januar 2023"
      if (str.includes('.')) {
        const parts = str.split('. ');
        day = parseInt(parts[0]);
        
        if (parts.length > 1) {
          // Extrahiere Monat (kann "November 2024" oder nur "November" sein)
          const monthAndYear = parts[1].trim();
          const monthName = monthAndYear.split(' ')[0].trim();
          month = monthName;
        }
      } 
      // Format: "Januar 1 2023"
      else if (str.includes(' ')) {
        const parts = str.split(' ');
        month = parts[0];
        day = parseInt(parts[1]);
      } else {
        return new Date(0);
      }
      
      if (months[month] === undefined) {
        return new Date(0);
      }
      
      return new Date(year, months[month], day);
    };
    
    // Add derived fields with unique row identifiers
    const processedData = data.map((item, index) => ({
      ...item,
      uniqueRowId: `${item.id}_${index}_${item.morgenSys || 0}_${item.abendSys || 0}`,
      uniqueSortId: `${item._standardDate || item.datum}_${item.id}_${index}`,
      morgenCategory: item.morgenSys && item.morgenDia 
        ? getBloodPressureCategory(item.morgenSys, item.morgenDia) 
        : null,
      abendCategory: item.abendSys && item.abendDia 
        ? getBloodPressureCategory(item.abendSys, item.abendDia) 
        : null
    }));
    
    // Sort with stable sorting using parsed dates
    const sortedData = [...processedData].sort((a, b) => {
      const dateA = parseDate(a.datum);
      const dateB = parseDate(b.datum);
      
      return sortDescending ? dateB - dateA : dateA - dateB;
    });
    
    // Virtual scrolling - show all data
    setCurrentData(sortedData);
    
    // Reset to page 1 if current page is out of bounds
    if (currentPage > Math.ceil(sortedData.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1);
    }
  }, [data, sortDescending, ITEMS_PER_PAGE, currentPage]);
  
  // Confirm delete handlers
  const handleDeleteClick = (entry) => {
    setShowConfirmDelete(entry.id);
  };
  
  const confirmDelete = (id) => {
    onDelete(id);
    setShowConfirmDelete(null);
  };
  
  const cancelDelete = () => {
    setShowConfirmDelete(null);
  };
  
  // Format date for display
  const formatDatum = (datum) => {
    if (!datum) return 'Kein Datum';
    return datum;
  };
  
  // Row renderer for virtualized list
  const Row = ({ index, style }) => {
    const entry = currentData[index];
    if (!entry) return null;
    
    const morgenCategory = entry.morgenCategory;
    const abendCategory = entry.abendCategory;
    
    return (
      <div 
        style={style}
        className={`
          border-b border-gray-200 dark:border-gray-700 
          ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
        `}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {formatDatum(entry.datum)}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {entry.tag}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Morgen Werte */}
              <div>
                <div className="flex items-center mb-1">
                  <Clock size={14} className="mr-1 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Morgen</span>
                </div>
                {entry.morgenSys && entry.morgenDia ? (
                  <div>
                    <div className="font-semibold" style={{ color: morgenCategory?.color }}>
                      {entry.morgenSys}/{entry.morgenDia}
                    </div>
                    {entry.morgenPuls && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Puls: {entry.morgenPuls}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-600 text-sm">-</div>
                )}
              </div>
              
              {/* Abend Werte */}
              <div>
                <div className="flex items-center mb-1">
                  <Clock size={14} className="mr-1 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Abend</span>
                </div>
                {entry.abendSys && entry.abendDia ? (
                  <div>
                    <div className="font-semibold" style={{ color: abendCategory?.color }}>
                      {entry.abendSys}/{entry.abendDia}
                    </div>
                    {entry.abendPuls && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Puls: {entry.abendPuls}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-600 text-sm">-</div>
                )}
              </div>
            </div>
            
            {entry.notizen && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                {entry.notizen}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(entry)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
              aria-label="Bearbeiten"
            >
              <Edit size={18} />
            </button>
            
            {showConfirmDelete === entry.id ? (
              <div className="flex space-x-1">
                <button
                  onClick={() => confirmDelete(entry.id)}
                  className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  aria-label="Löschen bestätigen"
                >
                  <Trash size={18} />
                </button>
                <button
                  onClick={cancelDelete}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Abbrechen"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleDeleteClick(entry)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                aria-label="Löschen"
              >
                <Trash size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // If no data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Noch keine Einträge vorhanden.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header with sort */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Alle Einträge ({data.length})
          </h2>
          <button
            onClick={() => setSortDescending(!sortDescending)}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <span className="mr-1">Sortierung:</span>
            <span className="font-medium">
              {sortDescending ? 'Neueste zuerst' : 'Älteste zuerst'}
            </span>
            {sortDescending ? <ChevronDown size={16} className="ml-1" /> : <ChevronUp size={16} className="ml-1" />}
          </button>
        </div>
      </div>
      
      {/* Virtualized list */}
      <div ref={containerRef}>
        <List
          height={containerHeight}
          itemCount={currentData.length}
          itemSize={120} // Approximate height of each row
          width="100%"
          overscanCount={3}
        >
          {Row}
        </List>
      </div>
    </div>
  );
};

export default VirtualizedBloodPressureTable;