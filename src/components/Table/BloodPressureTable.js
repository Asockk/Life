// components/Table/BloodPressureTable.js
import React, { useState, useEffect } from 'react';
import { Edit, Trash, ChevronLeft, ChevronRight, Clock, Calendar, ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getBloodPressureCategory, formatTableValue } from '../../utils/bloodPressureUtils';

const BloodPressureTable = ({ data, onEdit, onDelete }) => {
  const ITEMS_PER_PAGE = 10; // Reduced number for mobile
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  // Flag for sort direction (descending = true)
  const [sortDescending, setSortDescending] = useState(true);
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Extracts the year from a date string
  const extractYearFromDate = (dateStr) => {
    if (!dateStr) return new Date().getFullYear(); // Current year as fallback
    
    // Look for a four-digit number that could be the year
    const yearMatch = dateStr.match(/\b(20\d{2})\b/); // 2000-2099
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    // No year found, use current year
    return new Date().getFullYear();
  };
  
  // Improved function to sort the data
  const getSortedData = (dataArray, isDescending) => {
    return [...dataArray].sort((a, b) => {
      // Compare years first
      const yearA = extractYearFromDate(a.datum);
      const yearB = extractYearFromDate(b.datum);
      
      if (yearA !== yearB) {
        return isDescending ? yearB - yearA : yearA - yearB;
      }
      
      // If years are equal, compare month and day
      const getDateValue = (dateStr) => {
        if (!dateStr) return new Date(0);
        
        const months = {
          'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
          'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
          'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
        };
        
        let day, month, year = yearA; // Use already extracted year
        
        // Format "1. Januar 2024" or "1. Januar"
        if (dateStr.includes('.')) {
          const parts = dateStr.split('. ');
          day = parseInt(parts[0]);
          
          if (parts.length > 1) {
            const monthParts = parts[1].split(' ');
            month = monthParts[0].trim();
          }
        }
        // Format "Januar 1 2024" or "Januar 1"
        else if (dateStr.includes(' ')) {
          const parts = dateStr.split(' ');
          month = parts[0];
          day = parseInt(parts[1]);
        } else {
          return new Date(0); // Invalid format
        }
        
        // Check if month is in the list
        if (months[month] === undefined) {
          return new Date(0);
        }
        
        // Create valid date
        return new Date(year, months[month], day);
      };
      
      const dateA = getDateValue(a.datum);
      const dateB = getDateValue(b.datum);
      
      // Sort direction based on flag
      return isDescending ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Sorted data
  const sortedData = getSortedData(data, sortDescending);

  useEffect(() => {
    // Calculate total number of pages based on sorted data
    setTotalPages(Math.ceil(sortedData.length / ITEMS_PER_PAGE));
    
    // Current page not greater than total pages
    if (currentPage > Math.ceil(sortedData.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1);
    }
    
    // Filter data for current page
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, sortedData.length);
    setCurrentData(sortedData.slice(start, end));
  }, [data, currentPage, sortDescending]);
  
  // Function to toggle sort direction
  const toggleSortDirection = () => {
    setSortDescending(!sortDescending);
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  // Handle delete with confirmation
  const handleDelete = (id) => {
    setShowConfirmDelete(id);
  };

  const confirmDelete = (id) => {
    onDelete(id);
    setShowConfirmDelete(null);
    // Reset any swiped states
    setSwipedItemId(null);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(null);
    // Reset any swiped states
    setSwipedItemId(null);
  };
  
  // Style function for better color contrast, but in minimalist style
  const getReadableStyle = (category) => {
    // Improved colors with modern look
    const betterColors = {
      "Optimal": { bg: "#DBF9DB", color: "#1A7A1A" },           // Dark green on light background
      "Normal": { bg: "#E5FFDD", color: "#2D6A00" },           // Medium green on light background
      "Hoch normal": { bg: "#FFF4D1", color: "#8C6900" },      // Dark yellow on light background
      "Hypertonie Grad 1": { bg: "#FFEBD4", color: "#B25000" }, // Orange on light background
      "Hypertonie Grad 2": { bg: "#FFDBDB", color: "#D42E2E" }, // Red on light background
      "Hypertonie Grad 3": { bg: "#F8D7E8", color: "#A0105C" }, // Dark magenta on light background
      "Unbekannt": { bg: "#E5E5E5", color: "#707070" }         // Dark gray on light gray background
    };
    
    const colorSet = betterColors[category.category] || betterColors["Unbekannt"];
    
    return {
      backgroundColor: colorSet.bg,
      color: colorSet.color
    };
  };

  // Manual touch handling instead of using a Hook
  const handleTouchStart = (e, entryId) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      entryId
    });
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchEnd.x - touchStart.x;
    const distanceY = Math.abs(touchEnd.y - touchStart.y);
    const isHorizontalSwipe = distanceY < 50;
    
    // Horizontal swipe detection
    if (isHorizontalSwipe) {
      if (distanceX < -50) { // Left swipe
        setSwipedItemId(touchStart.entryId);
      } else if (distanceX > 50) { // Right swipe
        // Find the entry and edit it
        const entry = currentData.find(e => e.id === touchStart.entryId);
        if (entry) {
          onEdit(entry);
        }
      } else {
        // Small swipe, reset state
        if (swipedItemId === touchStart.entryId) {
          setSwipedItemId(null);
        }
      }
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Render a mobile card with touch controls
  const renderMobileCard = (entry) => {
    const morgenBP = entry.morgenSys > 0 && entry.morgenDia > 0 
      ? getBloodPressureCategory(entry.morgenSys, entry.morgenDia) 
      : { category: "Unbekannt", color: "#AAAAAA" };
    
    const abendBP = entry.abendSys > 0 && entry.abendDia > 0 
      ? getBloodPressureCategory(entry.abendSys, entry.abendDia)
      : { category: "Unbekannt", color: "#AAAAAA" };

    // Deletion confirmation dialog
    if (showConfirmDelete === entry.id) {
      return (
        <div key={entry.id} className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm relative mb-3">
          <p className="text-red-800 font-medium mb-3">Eintrag wirklich löschen?</p>
          <div className="flex justify-between">
            <button 
              onClick={cancelDelete}
              className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md flex-1 mr-2"
            >
              Abbrechen
            </button>
            <button 
              onClick={() => confirmDelete(entry.id)}
              className="bg-red-600 text-white py-2 px-4 rounded-md flex-1"
            >
              Löschen
            </button>
          </div>
        </div>
      );
    }
    
    // Design for swiped card with delete action
    const isSwipedLeft = swipedItemId === entry.id;
    
    return (
      <div key={entry.id} className="mb-3 relative touch-manipulation">
        {/* Swipe action indicators */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-1/2 bg-blue-50 rounded-l-lg flex items-center justify-start pl-4">
            <ArrowLeft size={20} className="text-blue-500" />
            <span className="text-xs text-blue-600 ml-1">Bearbeiten</span>
          </div>
          <div className="w-1/2 bg-red-50 rounded-r-lg flex items-center justify-end pr-4">
            <span className="text-xs text-red-600 mr-1">Löschen</span>
            <ArrowRight size={20} className="text-red-500" />
          </div>
        </div>
        
        {/* Card content with touch handlers */}
        <div 
          onTouchStart={(e) => handleTouchStart(e, entry.id)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative transition-transform duration-200 z-10 ${
            isSwipedLeft ? 'transform translate-x-20' : ''
          }`}
        >
          {/* Delete button shown after swipe */}
          {isSwipedLeft && (
            <button
              onClick={() => handleDelete(entry.id)}
              className="absolute -right-16 top-1/2 transform -translate-y-1/2 bg-red-600 text-white p-2 rounded-md"
              aria-label="Löschen"
            >
              <Trash size={20} />
            </button>
          )}
          
          {/* Datumszeile */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-sm font-medium">{entry.tag}, {entry.datum}</span>
            </div>
          </div>
          
          {/* Werte Karten */}
          <div className="grid grid-cols-2 gap-2 mb-1">
            {/* Morgen-Werte */}
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center mb-1">
                <Clock size={14} className="text-indigo-500 mr-1" />
                <span className="text-xs font-medium text-gray-700">Morgen</span>
              </div>
              
              {entry.morgenSys > 0 && entry.morgenDia > 0 ? (
                <div 
                  className="px-2 py-1 text-center rounded text-xs font-medium w-full"
                  style={getReadableStyle(morgenBP)}
                >
                  {formatTableValue(entry.morgenSys, entry.morgenDia, entry.morgenPuls || '-')}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-xs">-</div>
              )}
            </div>
            
            {/* Abend-Werte */}
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center mb-1">
                <Clock size={14} className="text-purple-500 mr-1" />
                <span className="text-xs font-medium text-gray-700">Abend</span>
              </div>
              
              {entry.abendSys > 0 && entry.abendDia > 0 ? (
                <div 
                  className="px-2 py-1 text-center rounded text-xs font-medium w-full"
                  style={getReadableStyle(abendBP)}
                >
                  {formatTableValue(entry.abendSys, entry.abendDia, entry.abendPuls || '-')}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-xs">-</div>
              )}
            </div>
          </div>
          
          {/* Swipe hint text */}
          <div className="mt-2 text-xs text-center text-gray-400">
            ← Nach links/rechts swipen für Aktionen →
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold mb-2 sm:mb-0">Ihre Blutdruck-Einträge</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleSortDirection}
            className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition duration-200 flex items-center w-full justify-center"
          >
            {sortDescending ? <ChevronDown size={18} className="mr-1" /> : <ChevronUp size={18} className="mr-1" />}
            <span>{sortDescending ? "Neueste zuerst" : "Älteste zuerst"}</span>
          </button>
          <div className="text-sm text-gray-500 w-full text-center sm:text-left sm:w-auto">
            {data.length} Einträge insgesamt
          </div>
        </div>
      </div>
      
      {/* Desktop Table - Only show on larger screens */}
      <div className="hidden md:block overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Morgen (Sys/Dia/Puls)</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Abend (Sys/Dia/Puls)</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((entry) => {
              const morgenBP = entry.morgenSys > 0 && entry.morgenDia > 0 
                ? getBloodPressureCategory(entry.morgenSys, entry.morgenDia) 
                : { category: "Unbekannt", color: "#AAAAAA" };
              
              const abendBP = entry.abendSys > 0 && entry.abendDia > 0 
                ? getBloodPressureCategory(entry.abendSys, entry.abendDia)
                : { category: "Unbekannt", color: "#AAAAAA" };
              
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.tag}, {entry.datum}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {entry.morgenSys > 0 && entry.morgenDia > 0 ? (
                      <span 
                        className="px-2 py-1 inline-flex items-center justify-center rounded-full text-xs font-medium"
                        style={getReadableStyle(morgenBP)}
                      >
                        {formatTableValue(entry.morgenSys, entry.morgenDia, entry.morgenPuls || '-')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {entry.abendSys > 0 && entry.abendDia > 0 ? (
                      <span 
                        className="px-2 py-1 inline-flex items-center justify-center rounded-full text-xs font-medium"
                        style={getReadableStyle(abendBP)}
                      >
                        {formatTableValue(entry.abendSys, entry.abendDia, entry.abendPuls || '-')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => onEdit(entry)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Bearbeiten"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Löschen"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Only show on small screens */}
      <div className="md:hidden">
        <div className="space-y-1">
          {currentData.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Keine Einträge gefunden</p>
          ) : (
            currentData.map(entry => renderMobileCard(entry))
          )}
        </div>
      </div>
      
      {/* Pagination - For Desktop and Mobile */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-2">
          <div className="text-sm text-gray-600">
            Seite {currentPage} von {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded ${
                currentPage === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded ${
                currentPage === totalPages 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodPressureTable;