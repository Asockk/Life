// components/Table/BloodPressureTable.js
import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash, ArrowLeft, ArrowRight, Calendar, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { getBloodPressureCategory, formatTableValue } from '../../utils/bloodPressureUtils';

// Style-Funktionen für bessere Lesbarkeit extrahieren
const getCategoryStyle = (category) => {
  // Verbesserte Farben mit modernem Look
  const betterColors = {
    "Optimal": { bg: "#DBF9DB", color: "#1A7A1A" },           // Dunkles Grün auf hellem Hintergrund
    "Normal": { bg: "#E5FFDD", color: "#2D6A00" },           // Mittelgrün auf hellem Hintergrund
    "Hoch normal": { bg: "#FFF4D1", color: "#8C6900" },      // Dunkelgelb auf hellem Hintergrund
    "Hypertonie Grad 1": { bg: "#FFEBD4", color: "#B25000" }, // Orange auf hellem Hintergrund
    "Hypertonie Grad 2": { bg: "#FFDBDB", color: "#D42E2E" }, // Rot auf hellem Hintergrund
    "Hypertonie Grad 3": { bg: "#F8D7E8", color: "#A0105C" }, // Dunkelmagenta auf hellem Hintergrund
    "Unbekannt": { bg: "#E5E5E5", color: "#707070" }         // Dunkelgrau auf hellgrauem Hintergrund
  };
  
  const colorSet = betterColors[category.category] || betterColors["Unbekannt"];
  
  return {
    backgroundColor: colorSet.bg,
    color: colorSet.color
  };
};

// Komponente für die Datumsfilterung
const DateFilter = ({ dateFilter, setDateFilter, showFilterOptions, setShowFilterOptions }) => {
  const filterOptions = [
    { id: 'all', label: 'Alle Daten' },
    { id: 'month', label: 'Letzter Monat' },
    { id: 'week', label: 'Letzte Woche' }
  ];
  
  return (
    <div className="relative flex-1 sm:flex-none">
      <button 
        onClick={() => setShowFilterOptions(!showFilterOptions)}
        className="flex w-full sm:w-auto items-center justify-between text-sm bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors"
      >
        <Filter size={16} className="mr-1.5 text-blue-700" />
        <span className="text-blue-700 font-medium">
          {filterOptions.find(option => option.id === dateFilter)?.label || 'Zeitraum'}
        </span>
      </button>
      
      {showFilterOptions && (
        <div className="absolute right-0 mt-1 w-full sm:w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="p-2">
            {filterOptions.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  setDateFilter(option.id);
                  setShowFilterOptions(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  dateFilter === option.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Table Header Komponente
const TableHeader = ({ title, dataCount, sortDirection, toggleSortDirection }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
    <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">{title}</h2>
    <div className="flex flex-wrap items-center gap-2">
      <button 
        onClick={toggleSortDirection}
        className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors flex items-center gap-1"
      >
        <span>{sortDirection === 'desc' ? 'Neueste' : 'Älteste'} zuerst</span>
        {sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      <div className="text-sm text-gray-500">
        {dataCount} Einträge
      </div>
    </div>
  </div>
);

// Pagination Komponente
const Pagination = ({ currentPage, totalPages, handlePreviousPage, handleNextPage }) => {
  if (totalPages <= 1) return null;
  
  return (
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
          aria-label="Vorherige Seite"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`p-2 rounded ${
            currentPage === totalPages 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:bg-blue-50'
          }`}
          aria-label="Nächste Seite"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

// Haupt-Tabellen-Komponente
const BloodPressureTable = ({ data, onEdit, onDelete }) => {
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' = neueste zuerst
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Prüfe, ob wir auf einem mobilen Gerät sind
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Extrahiere das Jahr aus einem Datumsstring
  const extractYearFromDate = (dateStr) => {
    if (!dateStr) return new Date().getFullYear();
    
    // Suche nach einer vierstelligen Zahl, die das Jahr sein könnte
    const yearMatch = dateStr.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    return new Date().getFullYear();
  };
  
  // Parse Datum für Sortierung
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    let day, month, year = extractYearFromDate(dateStr);
    
    // Format: "1. Januar 2024" oder "1. Januar"
    if (dateStr.includes('.')) {
      const parts = dateStr.split('. ');
      day = parseInt(parts[0]);
      
      if (parts.length > 1) {
        const monthParts = parts[1].split(' ');
        month = monthParts[0];
      }
    }
    // Format: "Januar 1 2024" oder "Januar 1"
    else if (dateStr.includes(' ')) {
      const parts = dateStr.split(' ');
      month = parts[0];
      day = parseInt(parts[1]);
    } else {
      return new Date(0);
    }
    
    // Überprüfen, ob Monat in der Liste vorhanden ist
    if (months[month] === undefined) {
      return new Date(0);
    }
    
    // Gültiges Datum erstellen
    return new Date(year, months[month], day);
  };
  
  // Sortiere Daten nach Datum
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return [...data].sort((a, b) => {
      const dateA = parseDate(a.datum);
      const dateB = parseDate(b.datum);
      
      if (dateA && dateB) {
        // Sortierrichtung berücksichtigen
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      }
      
      return 0;
    });
  }, [data, sortDirection]);
  
  // Filtere Daten nach Datum
  const filteredData = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return [];
    
    const now = new Date();
    
    // Filtere nach ausgewähltem Zeitraum
    switch (dateFilter) {
      case 'month': {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        return sortedData.filter(item => {
          const itemDate = parseDate(item.datum);
          return itemDate && itemDate >= oneMonthAgo && itemDate <= now;
        });
      }
      case 'week': {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return sortedData.filter(item => {
          const itemDate = parseDate(item.datum);
          return itemDate && itemDate >= oneWeekAgo && itemDate <= now;
        });
      }
      default:
        // Alle Daten anzeigen
        return sortedData;
    }
  }, [sortedData, dateFilter]);

  // Paginierte Daten berechnen
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);
  
  // Berechne Gesamtseitenzahl
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE)));
    
    // Setze die aktuelle Seite zurück, wenn die Gesamtseitenzahl kleiner als die aktuelle Seite ist
    if (currentPage > Math.ceil(filteredData.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1);
    }
  }, [filteredData, currentPage]);
  
  // Handlers für Paginierung
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
  
  // Sortierrichtung umschalten
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  // Wenn keine Daten verfügbar sind
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Ihre Blutdruck-Einträge</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Keine Einträge vorhanden.</p>
          <p className="text-sm mt-2">Fügen Sie neue Messungen hinzu, um Ihre Daten zu verfolgen.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
      <TableHeader 
        title="Ihre Blutdruck-Einträge" 
        dataCount={filteredData.length} 
        sortDirection={sortDirection}
        toggleSortDirection={toggleSortDirection}
      />
      
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <DateFilter 
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showFilterOptions={showFilterOptions}
          setShowFilterOptions={setShowFilterOptions}
        />
      </div>
      
      {/* Desktop Tabelle - Nur auf größeren Bildschirmen anzeigen */}
      <div className="hidden md:block overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Morgen (Sys/Dia/Puls)</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Abend (Sys/Dia/Puls)</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((entry) => {
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
                        style={getCategoryStyle(morgenBP)}
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
                        style={getCategoryStyle(abendBP)}
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
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded-full transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(entry.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-colors"
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

      {/* Mobile Kartenansicht - Nur auf kleinen Bildschirmen anzeigen */}
      <div className="md:hidden">
        <div className="space-y-3">
          {paginatedData.map((entry) => {
            const morgenBP = entry.morgenSys > 0 && entry.morgenDia > 0 
              ? getBloodPressureCategory(entry.morgenSys, entry.morgenDia) 
              : { category: "Unbekannt", color: "#AAAAAA" };
            
            const abendBP = entry.abendSys > 0 && entry.abendDia > 0 
              ? getBloodPressureCategory(entry.abendSys, entry.abendDia)
              : { category: "Unbekannt", color: "#AAAAAA" };
            
            return (
              <div key={entry.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative">
                {/* Datumszeile */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">{entry.tag}, {entry.datum}</span>
                  </div>
                  
                  {/* Aktionsbuttons */}
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onEdit(entry)}
                      className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-full transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(entry.id)}
                      className="text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                      title="Löschen"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Werte Karten */}
                <div className="grid grid-cols-2 gap-2 mb-1">
                  {/* Morgen-Werte */}
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Clock size={14} className="text-indigo-500 mr-1" />
                      <span className="text-xs font-medium text-gray-700">Morgen</span>
                    </div>
                    
                    {entry.morgenSys > 0 && entry.morgenDia > 0 ? (
                      <div 
                        className="px-2 py-1.5 text-center rounded text-xs font-medium w-full"
                        style={getCategoryStyle(morgenBP)}
                      >
                        {formatTableValue(entry.morgenSys, entry.morgenDia, entry.morgenPuls || '-')}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-xs py-1.5">-</div>
                    )}
                  </div>
                  
                  {/* Abend-Werte */}
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Clock size={14} className="text-purple-500 mr-1" />
                      <span className="text-xs font-medium text-gray-700">Abend</span>
                    </div>
                    
                    {entry.abendSys > 0 && entry.abendDia > 0 ? (
                      <div 
                        className="px-2 py-1.5 text-center rounded text-xs font-medium w-full"
                        style={getCategoryStyle(abendBP)}
                      >
                        {formatTableValue(entry.abendSys, entry.abendDia, entry.abendPuls || '-')}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-xs py-1.5">-</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Paginierung - Für Desktop und Mobile */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
      />
    </div>
  );
};

export default BloodPressureTable;