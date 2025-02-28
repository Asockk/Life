// components/Table/BloodPressureTable.js
import React, { useState, useEffect } from 'react';
import { Edit, Trash, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { getBloodPressureCategory, formatTableValue } from '../../utils/bloodPressureUtils';

const BloodPressureTable = ({ data, onEdit, onDelete }) => {
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  // Flag für Sortierungsrichtung (absteigend = true)
  const [sortDescending, setSortDescending] = useState(true);
  
  // Extrahiert das Jahr aus einem Datumsstring
  const extractYearFromDate = (dateStr) => {
    if (!dateStr) return new Date().getFullYear(); // Aktuelles Jahr als Fallback
    
    // Suche nach einer vierstelligen Zahl, die das Jahr sein könnte
    const yearMatch = dateStr.match(/\b(20\d{2})\b/); // 2000-2099
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    // Kein Jahr gefunden, verwende aktuelles Jahr
    return new Date().getFullYear();
  };
  
  // Verbesserte Funktion zum Sortieren der Daten
  const getSortedData = (dataArray, isDescending) => {
    return [...dataArray].sort((a, b) => {
      // Vergleiche Jahre zuerst
      const yearA = extractYearFromDate(a.datum);
      const yearB = extractYearFromDate(b.datum);
      
      if (yearA !== yearB) {
        return isDescending ? yearB - yearA : yearA - yearB;
      }
      
      // Wenn die Jahre gleich sind, vergleiche Monat und Tag
      const getDateValue = (dateStr) => {
        if (!dateStr) return new Date(0);
        
        const months = {
          'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
          'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
          'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
        };
        
        let day, month, year = yearA; // Verwende das bereits extrahierte Jahr
        
        // Format "1. Januar 2024" oder "1. Januar"
        if (dateStr.includes('.')) {
          const parts = dateStr.split('. ');
          day = parseInt(parts[0]);
          
          if (parts.length > 1) {
            const monthParts = parts[1].split(' ');
            month = monthParts[0].trim();
          }
        }
        // Format "Januar 1 2024" oder "Januar 1"
        else if (dateStr.includes(' ')) {
          const parts = dateStr.split(' ');
          month = parts[0];
          day = parseInt(parts[1]);
        } else {
          return new Date(0); // Ungültiges Format
        }
        
        // Überprüfen, ob Monat in der Liste vorhanden ist
        if (months[month] === undefined) {
          return new Date(0);
        }
        
        // Gültiges Datum erstellen
        return new Date(year, months[month], day);
      };
      
      const dateA = getDateValue(a.datum);
      const dateB = getDateValue(b.datum);
      
      // Sortierungsrichtung basierend auf Flag
      return isDescending ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Sortierte Daten
  const sortedData = getSortedData(data, sortDescending);

  useEffect(() => {
    // Berechne die Gesamtzahl der Seiten basierend auf den sortierten Daten
    setTotalPages(Math.ceil(sortedData.length / ITEMS_PER_PAGE));
    
    // Aktuelle Seite nicht größer als Gesamtseitenzahl
    if (currentPage > Math.ceil(sortedData.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1);
    }
    
    // Daten für die aktuelle Seite filtern
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, sortedData.length);
    setCurrentData(sortedData.slice(start, end));
  }, [data, currentPage, sortDescending]);
  
  // Funktion zum Umschalten der Sortierungsrichtung
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
  
  // Style-Funktion für bessere Farbkontraste, aber im minimalistischen Stil
  const getReadableStyle = (category) => {
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
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold mb-2 sm:mb-0">Ihre Blutdruck-Einträge</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleSortDirection}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition duration-200 flex items-center"
          >
            Sortierung: {sortDescending ? "Neueste zuerst" : "Älteste zuerst"}
          </button>
          <div className="text-sm text-gray-500">
            {data.length} Einträge insgesamt
          </div>
        </div>
      </div>
      
      {/* Desktop Tabelle - Nur auf größeren Bildschirmen anzeigen */}
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
                        onClick={() => onDelete(entry.id)}
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

      {/* Mobile Kartenansicht - Nur auf kleinen Bildschirmen anzeigen */}
      <div className="md:hidden">
        <div className="space-y-3">
          {currentData.map((entry) => {
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
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => onEdit(entry)}
                      className="text-blue-600 p-1 hover:bg-blue-50 rounded"
                      title="Bearbeiten"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(entry.id)}
                      className="text-red-600 p-1 hover:bg-red-50 rounded"
                      title="Löschen"
                    >
                      <Trash size={16} />
                    </button>
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
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Paginierung - Für Desktop und Mobile */}
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
              <ChevronLeft size={20} />
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
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodPressureTable;