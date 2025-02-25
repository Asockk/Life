// components/Table/BloodPressureTable.js
import React, { useState, useEffect } from 'react';
import { Edit, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBloodPressureCategory, formatTableValue } from '../../utils/bloodPressureUtils';

const BloodPressureTable = ({ data, onEdit, onDelete }) => {
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  // Flag für Sortierungsrichtung (absteigend = true)
  const [sortDescending, setSortDescending] = useState(true);
  
  // Funktion zum Sortieren der Daten
  const getSortedData = (dataArray, isDescending) => {
    return [...dataArray].sort((a, b) => {
      // Versuche, Datum in Date-Objekte zu konvertieren
      // Format "Monat Tag" wie "Januar 1"
      const getDateValue = (dateStr) => {
        const months = {
          'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
          'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
          'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
        };
        
        if (dateStr && dateStr.includes(' ')) {
          const [month, day] = dateStr.split(' ');
          if (months[month] !== undefined) {
            // Verwende 2025 als Standardjahr (könnte ein beliebiges Jahr sein)
            return new Date(2025, months[month], parseInt(day));
          }
        }
        return new Date(0); // Fallback-Datum
      };
      
      // Sortierungsrichtung basierend auf Flag
      if (isDescending) {
        // Absteigend (neuere Daten zuerst)
        return getDateValue(b.datum) - getDateValue(a.datum);
      } else {
        // Aufsteigend (ältere Daten zuerst)
        return getDateValue(a.datum) - getDateValue(b.datum);
      }
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
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Ihre Blutdruck-Einträge</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleSortDirection}
            className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition duration-200 flex items-center"
          >
            Sortierung: {sortDescending ? "Neueste zuerst" : "Älteste zuerst"}
          </button>
          <div className="text-sm text-gray-500">
            {data.length} Einträge insgesamt
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                        style={{ backgroundColor: morgenBP.color + '20', color: morgenBP.color }}
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
                        style={{ backgroundColor: abendBP.color + '20', color: abendBP.color }}
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
      
      {/* Paginierung */}
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