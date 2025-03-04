// components/Table/BloodPressureTable.js
import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash, ChevronLeft, ChevronRight, Clock, Calendar, ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getBloodPressureCategory, formatTableValue } from '../../utils/bloodPressureUtils';

const BloodPressureTable = ({ data, onEdit, onDelete, darkMode = true }) => {
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  const [sortDescending, setSortDescending] = useState(true);
  
  // Verbesserte Swipe-States für Feedback
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [swipeState, setSwipeState] = useState({
    id: null,
    startX: 0,
    currentX: 0,
    direction: null,
    percentage: 0,
    status: 'idle' // 'idle', 'swiping', 'triggered'
  });
  
  // Timing-Referenz für lange Presses
  const longPressTimer = useRef(null);
  const [showSwipeHelper, setShowSwipeHelper] = useState(true);
  
  // Erkennt das Gerät und dessen Fähigkeiten
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTouch: false,
  });
  
  // Initialisiert Device-Info
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.innerWidth < 768;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setDeviceInfo({ isMobile, isTouch });
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  // Versteckt Swipe-Hilfe nach 6 Sekunden
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHelper(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);
  
  // Sortierte Daten erhalten
  const getSortedData = (dataArray, isDescending) => {
    // Extrahiert das Jahr aus einem Datumsstring
    const extractYear = (dateStr) => {
      if (!dateStr) return new Date().getFullYear();
      const yearMatch = dateStr.match(/\b(20\d{2})\b/);
      return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    };
    
    return [...dataArray].sort((a, b) => {
      // Vergleiche Jahre zuerst
      const yearA = extractYear(a.datum);
      const yearB = extractYear(b.datum);
      
      if (yearA !== yearB) {
        return isDescending ? yearB - yearA : yearA - yearB;
      }
      
      // Deutsche Monatsnamen in numerische Werte
      const months = {
        'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
        'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
        'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
      };
      
      // Datumsstring in Date-Objekt
      const parseDate = (str) => {
        if (!str) return new Date(0);
        
        let day, month, year = yearA;
        
        // Format: "1. Januar 2023"
        if (str.includes('.')) {
          const parts = str.split('. ');
          day = parseInt(parts[0]);
          
          if (parts.length > 1) {
            const monthParts = parts[1].split(' ');
            month = monthParts[0].trim();
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
        
        if (months[month] === undefined) return new Date(0);
        return new Date(year, months[month], day);
      };
      
      const dateA = parseDate(a.datum);
      const dateB = parseDate(b.datum);
      
      return isDescending ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Sortierte Daten
  const sortedData = getSortedData(data, sortDescending);
  
  // Daten und Paginierung aktualisieren
  useEffect(() => {
    const pages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    setTotalPages(pages || 1);
    
    if (currentPage > pages) {
      setCurrentPage(1);
    }
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, sortedData.length);
    setCurrentData(sortedData.slice(start, end));
  }, [data, currentPage, sortDescending]);
  
  // Sortierreihenfolge umschalten
  const toggleSortDirection = () => {
    setSortDescending(!sortDescending);
  };
  
  // Seitenwechsel
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  // ===== VERBESSERTE SWIPE-FUNKTIONEN =====
  
  // Touch-Start initialisieren mit Verzögerungseffekten
  const handleTouchStart = (e, entryId) => {
    // Alle aktiven Swipes zurücksetzen
    if (swipedItemId && swipedItemId !== entryId) {
      setSwipedItemId(null);
    }
    
    const touch = e.touches[0];
    
    // Swipe-Status initialisieren
    setSwipeState({
      id: entryId,
      startX: touch.clientX,
      currentX: touch.clientX,
      direction: null,
      percentage: 0,
      status: 'idle'
    });
    
    // Verzögerten Long-Press für Editieren starten
    longPressTimer.current = setTimeout(() => {
      // Wenn der Benutzer immer noch drückt, editieren öffnen
      if (swipeState.id === entryId && swipeState.status === 'idle') {
        const entry = currentData.find(e => e.id === entryId);
        if (entry) {
          onEdit(entry);
        }
      }
    }, 800); // 800ms für Long-Press
  };
  
  // Touch-Bewegung verfolgen
  const handleTouchMove = (e, entryId) => {
    if (swipeState.id !== entryId) return;
    
    // Long-Press abbrechen, da Bewegung erkannt wurde
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const absDeltaX = Math.abs(deltaX);
    
    // Horizontale Distanz als Prozentsatz (max 100%)
    const swipeThreshold = 100; // Pixel bis 100%
    const percentage = Math.min(100, (absDeltaX / swipeThreshold) * 100);
    
    // Richtung bestimmen
    const direction = deltaX > 0 ? 'right' : 'left';
    
    // Swipe-Status aktualisieren
    setSwipeState({
      ...swipeState,
      currentX: touch.clientX,
      direction,
      percentage,
      status: absDeltaX > 10 ? 'swiping' : 'idle'
    });
    
    // Bei starkem horizontalen Swipe vertikales Scrollen verhindern
    if (absDeltaX > 30) {
      e.preventDefault();
    }
  };
  
  // Touch-Ende auswerten
  const handleTouchEnd = (entryId) => {
    // Long-Press Timer aufräumen
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (swipeState.id !== entryId) return;
    
    // Threshold zum Auslösen (30%)
    const actionThreshold = 30;
    
    // Aktion basierend auf Richtung und Stärke
    if (swipeState.percentage >= actionThreshold) {
      if (swipeState.direction === 'left') {
        // Nach links = Löschen (aber erst Confirm zeigen)
        setSwipedItemId(entryId);
      } else if (swipeState.direction === 'right') {
        // Nach rechts = Editieren
        const entry = currentData.find(e => e.id === entryId);
        if (entry) {
          onEdit(entry);
        }
      }
    }
    
    // Swipe-Status zurücksetzen, aber ID behalten für visuelles Feedback
    setSwipeState({
      ...swipeState,
      status: 'idle',
      percentage: 0
    });
  };
  
  // Eintrag Löschen mit Bestätigung
  const handleDelete = (id) => {
    setShowConfirmDelete(id);
  };
  
  const confirmDelete = (id) => {
    onDelete(id);
    setShowConfirmDelete(null);
    setSwipedItemId(null);
  };
  
  const cancelDelete = () => {
    setShowConfirmDelete(null);
    setSwipedItemId(null);
  };
  
  // Bearbeiten über Button
  const handleEdit = (entry) => {
    onEdit(entry);
  };
  
  // ===== STYLING UND RENDERING =====
  
  // Farben für Blutdruckkategorien (dunkel und hell)
  const getReadableStyle = (category) => {
    // Verbesserte dunkle Farben mit besserem Kontrast
    const darkModeColors = {
      "Optimal": { bg: "#0a3317", color: "#4ade80" },
      "Normal": { bg: "#1a3305", color: "#a3e635" },
      "Hoch normal": { bg: "#422006", color: "#fbbf24" },
      "Hypertonie Grad 1": { bg: "#451a03", color: "#fb923c" },
      "Hypertonie Grad 2": { bg: "#450a0a", color: "#f87171" },
      "Hypertonie Grad 3": { bg: "#3b0764", color: "#d8b4fe" },
      "Unbekannt": { bg: "#1f2937", color: "#9ca3af" }
    };
    
    // Helle Farben (unverändert)
    const lightModeColors = {
      "Optimal": { bg: "#DBF9DB", color: "#1A7A1A" },
      "Normal": { bg: "#E5FFDD", color: "#2D6A00" },
      "Hoch normal": { bg: "#FFF4D1", color: "#8C6900" },
      "Hypertonie Grad 1": { bg: "#FFEBD4", color: "#B25000" },
      "Hypertonie Grad 2": { bg: "#FFDBDB", color: "#D42E2E" },
      "Hypertonie Grad 3": { bg: "#F8D7E8", color: "#A0105C" },
      "Unbekannt": { bg: "#E5E5E5", color: "#707070" }
    };
    
    const colorSet = darkMode ? darkModeColors[category.category] || darkModeColors["Unbekannt"] 
                             : lightModeColors[category.category] || lightModeColors["Unbekannt"];
    
    return { backgroundColor: colorSet.bg, color: colorSet.color };
  };
  
  // Mobile Karte mit verbessertem Swipe-Verhalten rendern
  const renderMobileCard = (entry) => {
    const morgenBP = entry.morgenSys > 0 && entry.morgenDia > 0 
      ? getBloodPressureCategory(entry.morgenSys, entry.morgenDia) 
      : { category: "Unbekannt", color: "#AAAAAA" };
    
    const abendBP = entry.abendSys > 0 && entry.abendDia > 0 
      ? getBloodPressureCategory(entry.abendSys, entry.abendDia)
      : { category: "Unbekannt", color: "#AAAAAA" };
    
    // Löschdialog anzeigen
    if (showConfirmDelete === entry.id) {
      return (
        <div key={entry.id} className={`${darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} p-4 rounded-lg border shadow-sm relative mb-3`}>
          <p className={`${darkMode ? 'text-red-300 font-bold' : 'text-red-800 font-medium'} mb-3`}>Eintrag wirklich löschen?</p>
          <div className="flex justify-between">
            <button 
              onClick={cancelDelete}
              className={`${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} py-2 px-4 rounded-md flex-1 mr-2`}
            >
              Abbrechen
            </button>
            <button 
              onClick={() => confirmDelete(entry.id)}
              className={`${darkMode ? 'bg-red-700' : 'bg-red-600'} text-white py-2 px-4 rounded-md flex-1`}
            >
              Löschen
            </button>
          </div>
        </div>
      );
    }
    
    // Swipe-Status dieses Eintrags
    const isActive = swipeState.id === entry.id && swipeState.status === 'swiping';
    const isLeftSwiped = swipedItemId === entry.id;
    const swipeDirection = isActive ? swipeState.direction : null;
    const swipePercentage = isActive ? swipeState.percentage : 0;
    
    // Transformationen für den Swipe-Effekt
    let swipeTransform = 'translateX(0)';
    if (isActive) {
      // Während des Swipens - limitierte Bewegung mit Widerstand
      const maxDistance = 70; // maximale Pixel-Bewegung
      const distance = (swipePercentage / 100) * maxDistance;
      swipeTransform = swipeDirection === 'left' 
        ? `translateX(-${distance}px)` 
        : `translateX(${distance}px)`;
    } else if (isLeftSwiped) {
      // Nach erfolgreichem Links-Swipe - fixierte Position
      swipeTransform = 'translateX(-70px)';
    }
    
    // Dynamische Stile für Swipe-Feedback
    const cardStyle = {
      transform: swipeTransform,
      transition: isActive ? 'none' : 'transform 0.3s ease-out',
      borderLeftColor: swipeDirection === 'right' ? '#3b82f6' : undefined,
      borderLeftWidth: swipeDirection === 'right' ? '4px' : '1px',
      borderRightColor: swipeDirection === 'left' ? '#ef4444' : undefined,
      borderRightWidth: swipeDirection === 'left' ? '4px' : '1px',
    };
    
    return (
      <div key={entry.id} className="mb-3 relative touch-manipulation">
        {/* Swipe-Aktions-Indikatoren */}
        <div className={`absolute inset-0 flex pointer-events-none rounded-lg overflow-hidden opacity-${isActive ? '100' : '70'}`}>
          <div className={`w-1/2 ${darkMode ? 'bg-blue-900/40' : 'bg-blue-50'} rounded-l-lg flex items-center justify-start pl-4`}>
            <ArrowLeft size={20} className={darkMode ? "text-blue-400" : "text-blue-500"} />
            <span className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'} ml-1`}>Bearbeiten</span>
          </div>
          <div className={`w-1/2 ${darkMode ? 'bg-red-900/40' : 'bg-red-50'} rounded-r-lg flex items-center justify-end pr-4`}>
            <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} mr-1`}>Löschen</span>
            <ArrowRight size={20} className={darkMode ? "text-red-400" : "text-red-500"} />
          </div>
        </div>

        {/* Löschen-Button (erscheint bei Links-Swipe) */}
        {isLeftSwiped && (
          <button
            onClick={() => handleDelete(entry.id)}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${darkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-500'} text-white p-2 rounded-md z-10`}
            aria-label="Löschen"
          >
            <Trash size={20} />
          </button>
        )}
        
        {/* Karte mit Touch-Handlern */}
        <div 
          onTouchStart={(e) => handleTouchStart(e, entry.id)}
          onTouchMove={(e) => handleTouchMove(e, entry.id)}
          onTouchEnd={() => handleTouchEnd(entry.id)}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-3 rounded-lg border shadow-sm relative z-0`}
          style={cardStyle}
        >
          {/* Datumszeile */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{entry.tag}, {entry.datum}</span>
            </div>
          </div>
          
          {/* Werte Karten */}
          <div className="grid grid-cols-2 gap-2">
            {/* Morgen-Werte */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-2 rounded`}>
              <div className="flex items-center mb-1">
                <Clock size={14} className="text-indigo-500 mr-1" />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Morgen</span>
              </div>
              
              {entry.morgenSys > 0 && entry.morgenDia > 0 ? (
                <div 
                  className="px-2 py-1 text-center rounded text-xs font-medium w-full"
                  style={getReadableStyle(morgenBP)}
                >
                  {formatTableValue(entry.morgenSys, entry.morgenDia, entry.morgenPuls || '-')}
                </div>
              ) : (
                <div className={`text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-xs`}>-</div>
              )}
            </div>
            
            {/* Abend-Werte */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-2 rounded`}>
              <div className="flex items-center mb-1">
                <Clock size={14} className="text-purple-500 mr-1" />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Abend</span>
              </div>
              
              {entry.abendSys > 0 && entry.abendDia > 0 ? (
                <div 
                  className="px-2 py-1 text-center rounded text-xs font-medium w-full"
                  style={getReadableStyle(abendBP)}
                >
                  {formatTableValue(entry.abendSys, entry.abendDia, entry.abendPuls || '-')}
                </div>
              ) : (
                <div className={`text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-xs`}>-</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`p-3 sm:p-4 rounded-lg shadow-sm mb-6 transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-800 text-gray-100 border border-gray-700' 
        : 'bg-white text-gray-800 border border-gray-300'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className={`text-lg font-semibold mb-2 sm:mb-0 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          Ihre Blutdruck-Einträge
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleSortDirection}
            className={`text-sm px-3 py-2 rounded-md transition duration-200 flex items-center w-full justify-center ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            {sortDescending ? <ChevronDown size={18} className="mr-1" /> : <ChevronUp size={18} className="mr-1" />}
            <span>{sortDescending ? "Neueste zuerst" : "Älteste zuerst"}</span>
          </button>
          <div className={`text-sm w-full text-center sm:text-left sm:w-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {data.length} Einträge insgesamt
          </div>
        </div>
      </div>
      
      {/* Swipe-Hilfe anzeigen */}
      {showSwipeHelper && deviceInfo.isTouch && (
        <div className={`mb-4 p-3 rounded-lg text-center text-sm ${
          darkMode 
            ? 'bg-blue-900/20 border border-blue-800 text-blue-300' 
            : 'bg-blue-50 border border-blue-100 text-blue-700'
        }`}>
          <p className="font-medium mb-1">So bearbeiten oder löschen Sie Einträge:</p>
          <p>• Wischen Sie nach <span className="font-bold">rechts</span> zum Bearbeiten</p>
          <p>• Wischen Sie nach <span className="font-bold">links</span> zum Löschen</p>
          <p className="text-xs mt-1 opacity-80">Sie können auch einen Eintrag länger drücken, um ihn zu bearbeiten</p>
        </div>
      )}
      
      {/* Desktop-Tabelle (nur auf größeren Bildschirmen) */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`min-w-full divide-y ${
          darkMode ? 'divide-gray-700' : 'divide-gray-200'
        }`}>
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Datum</th>
              <th scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Morgen (Sys/Dia/Puls)</th>
              <th scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Abend (Sys/Dia/Puls)</th>
              <th scope="col" className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Aktionen</th>
            </tr>
          </thead>
          <tbody className={`${
            darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'
          }`}>
            {currentData.map((entry) => {
              const morgenBP = entry.morgenSys > 0 && entry.morgenDia > 0 
                ? getBloodPressureCategory(entry.morgenSys, entry.morgenDia) 
                : { category: "Unbekannt", color: "#AAAAAA" };
              
              const abendBP = entry.abendSys > 0 && entry.abendDia > 0 
                ? getBloodPressureCategory(entry.abendSys, entry.abendDia)
                : { category: "Unbekannt", color: "#AAAAAA" };
              
              return (
                <tr key={entry.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      darkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>{entry.tag}, {entry.datum}</div>
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
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
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
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleEdit(entry)}
                        className={`${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white py-1 px-3 rounded-md text-xs flex items-center`}
                      >
                        <Edit size={14} className="mr-1" /> Bearbeiten
                      </button>
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        className={`${darkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'} text-white py-1 px-3 rounded-md text-xs flex items-center`}
                      >
                        <Trash size={14} className="mr-1" /> Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile-Kartenansicht (nur auf kleinen Bildschirmen) */}
      <div className="md:hidden">
        <div className="space-y-1">
          {currentData.length === 0 ? (
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-6`}>Keine Einträge gefunden</p>
          ) : (
            currentData.map(entry => renderMobileCard(entry))
          )}
        </div>
      </div>
      
      {/* Paginierung */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-2">
          <div className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Seite {currentPage} von {totalPages}
          </div>
          <div className="flex">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded ${
                currentPage === 1 
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50')
              }`}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded ${
                currentPage === totalPages 
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50')
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