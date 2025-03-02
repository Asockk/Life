// components/Dashboard/BloodPressureChart.js
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ReferenceLine } from 'recharts';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';
import { Filter, Calendar, Eye, EyeOff, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from 'lucide-react';

// Diagramm-Header Komponente
const ChartHeader = ({ title, dataCount, sortDirection, toggleSortDirection }) => (
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

// Date Range Selector Komponente
const DateRangeSelector = ({ dateFilter, setDateFilter, dateRange, onCustomDateChange, showCustomDateInputs, setShowCustomDateInputs, customStartDate, customEndDate, setCustomStartDate, setCustomEndDate }) => {
  const filterOptions = [
    { id: 'all', label: 'Alle Daten' },
    { id: 'month', label: 'Letzter Monat' },
    { id: 'week', label: 'Letzte Woche' },
    { id: 'custom', label: 'Benutzerdefiniert' }
  ];

  return (
    <div className="flex items-center mb-4 flex-wrap gap-2">
      <div className="flex items-center text-sm text-gray-700 mr-2">
        <Calendar size={16} className="mr-1 text-blue-600" />
        <span className="font-medium">Zeitraum:</span>
      </div>
      
      <div className="flex flex-1 flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              setDateFilter(option.id);
              if (option.id === 'custom') {
                setShowCustomDateInputs(true);
              } else {
                setShowCustomDateInputs(false);
              }
            }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              dateFilter === option.id 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {showCustomDateInputs && (
        <div className="w-full mt-2 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[120px]">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              placeholder="Von"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
              placeholder="Bis"
            />
          </div>
          <button
            onClick={onCustomDateChange}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
          >
            Anwenden
          </button>
        </div>
      )}
      
      <div className="flex-1 basis-full sm:basis-auto text-sm mt-1 sm:mt-0">
        <span className="text-gray-600">{dateRange || 'Alle Daten'}</span>
      </div>
    </div>
  );
};

// Visualization Controls Komponente
const VisualizationControls = ({ visibleLines, toggleLine, isMobile }) => {
  const [expandLegend, setExpandLegend] = useState(false);
  
  const controls = [
    { id: 'systolic', label: 'Systolisch', color: '#FF4136' },
    { id: 'diastolic', label: 'Diastolisch', color: '#0074D9' },
    { id: 'pulse', label: 'Puls', color: '#2ECC40' },
    { id: 'references', label: 'Referenzlinien', color: '#B10DC9', isLine: true }
  ];
  
  if (isMobile) {
    return (
      <div className="mb-3">
        <button
          onClick={() => setExpandLegend(!expandLegend)}
          className="w-full flex items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors mb-2"
        >
          <span className="font-medium">Linien anzeigen/ausblenden</span>
          {expandLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {expandLegend && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {controls.map((control) => (
              <button
                key={control.id}
                onClick={() => toggleLine(control.id)}
                className={`flex items-center p-2 rounded-md text-sm ${
                  visibleLines[control.id] 
                    ? control.isLine 
                      ? 'bg-purple-50 text-purple-700'
                      : `bg-${control.color.replace('#', '')}-50`
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {control.isLine ? (
                  <div className="w-4 h-0.5 mr-2 bg-purple-500 border-t border-dashed"></div>
                ) : (
                  <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: control.color }}></div>
                )}
                <span>{control.label}</span>
                {visibleLines[control.id] ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {controls.map((control) => (
        <button
          key={control.id}
          onClick={() => toggleLine(control.id)}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
            visibleLines[control.id] 
              ? control.isLine 
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 font-medium'
              : 'bg-gray-50 text-gray-400'
          }`}
        >
          {control.isLine ? (
            <div className="w-4 h-0.5 mr-2 bg-purple-500 border-t border-dashed"></div>
          ) : (
            <div className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: control.color }}></div>
          )}
          <span>{control.label}</span>
          {!visibleLines[control.id] && <EyeOff size={14} className="ml-1 text-gray-400" />}
        </button>
      ))}
    </div>
  );
};

// Pagination Komponente
const Pagination = ({ currentPage, totalPages, handlePreviousPage, handleNextPage }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-between items-center mt-3 px-2">
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

// Mobile-Optimierungswarnung
const MobileOptimizationWarning = ({ filteredLength, optimizedLength }) => {
  if (filteredLength <= optimizedLength) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-xs text-yellow-800 mb-3">
      <strong>Hinweis:</strong> Es werden {optimizedLength} von {filteredLength} Datenpunkten angezeigt. Verwende die Filter für eine detailliertere Ansicht.
    </div>
  );
};

// Haupt-Chart Komponente
const BloodPressureChart = ({ data, viewType, avgValues }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleLines, setVisibleLines] = useState({
    systolic: true,
    diastolic: true,
    pulse: true,
    references: true
  });
  
  // Paginierung (für bessere Performance bei vielen Daten)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  
  // Zeitraumfilter
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);
  
  // Sortierrichtung 
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' = neueste zuerst
  
  // Präfix für aktuelle Ansicht
  const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
  
  // Mobile Breakpoint erkennen
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Bei mobilen Geräten weniger Einträge pro Seite anzeigen
      setItemsPerPage(window.innerWidth < 768 ? 20 : 30);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Hilfsfunktion zum Extrahieren des Datums
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    let day, month, year = new Date().getFullYear();
    
    // Format: "Januar 15" oder "Januar 15 2024"
    if (dateStr.includes(' ') && !dateStr.includes('.')) {
      const parts = dateStr.split(' ');
      month = parts[0];
      day = parseInt(parts[1]);
      if (parts.length > 2) {
        year = parseInt(parts[2]);
      }
    }
    // Format: "15. Januar" oder "15. Januar 2024"
    else if (dateStr.includes('.') && dateStr.includes(' ')) {
      const parts = dateStr.split('. ');
      day = parseInt(parts[0]);
      const monthPart = parts[1].split(' ')[0];
      month = monthPart;
      if (parts[1].split(' ').length > 1) {
        year = parseInt(parts[1].split(' ')[1]);
      }
    }
    
    if (day && month && months[month] !== undefined) {
      return new Date(year, months[month], day);
    }
    
    return null;
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
      case 'custom': {
        // Benutzerdefinierter Zeitraum
        if (!customStartDate || !customEndDate) return sortedData;
        
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59); // Ende des Tages
        
        return sortedData.filter(item => {
          const itemDate = parseDate(item.datum);
          return itemDate && itemDate >= startDate && itemDate <= endDate;
        });
      }
      default:
        // Alle Daten anzeigen
        return sortedData;
    }
  }, [sortedData, dateFilter, customStartDate, customEndDate]);
  
  // Berechne Gesamtseitenzahl
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  
  // Achte darauf, dass die aktuelle Seite niemals größer als die Gesamtseitenzahl ist
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);
  
  // Erstelle paginierte und für Mobile optimierte Daten
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    
    // Mobile Optimierung: Bei vielen Datenpunkten auf Mobilgeräten reduzieren
    if (isMobile && filteredData.length > 20) {
      // Bei mehr als 20 Punkten auf Mobilgeräten nur jeden n-ten Punkt anzeigen
      const stride = Math.ceil(filteredData.length / 15);
      return filteredData.filter((_, index) => index % stride === 0 || index === filteredData.length - 1);
    }
    
    // Normaler Fall: Paginierung
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage, isMobile]);
  
  // Berechne Datumsbereich für die Anzeige
  const getDateRange = () => {
    if (filteredData.length === 0) return "Keine Daten";
    
    const firstDate = filteredData[0].datum;
    const lastDate = filteredData[filteredData.length - 1].datum;
    
    return `${firstDate} - ${lastDate}`;
  };
  
  // Toggle für Sichtbarkeit der Linien
  const toggleLine = (line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };
  
  // Toggle für Sortierrichtung
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  // Paginierung-Handler
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  
  // Handler für benutzerdefinierte Datumsänderungen
  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      // Setze die erste Seite, wenn sich der Zeitraum ändert
      setCurrentPage(1);
    }
  };
  
  // Benutzerdefinierter Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sys = data[`${prefix}Sys`];
      const dia = data[`${prefix}Dia`];
      const puls = data[`${prefix}Puls`];
      
      if ((sys === 0 && dia === 0) || (sys === 0 || dia === 0)) {
        return null;
      }
      
      const category = getBloodPressureCategory(sys, dia);
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg max-w-[200px]">
          <p className="font-medium text-sm mb-1">{label}, {data.datum}</p>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {sys > 0 && (
              <>
                <span className="text-gray-600">Systolisch:</span>
                <span className="font-medium">{sys} mmHg</span>
              </>
            )}
            
            {dia > 0 && (
              <>
                <span className="text-gray-600">Diastolisch:</span>
                <span className="font-medium">{dia} mmHg</span>
              </>
            )}
            
            {puls > 0 && (
              <>
                <span className="text-gray-600">Puls:</span>
                <span className="font-medium">{puls} bpm</span>
              </>
            )}
            
            {sys > 0 && dia > 0 && (
              <>
                <span className="text-gray-600">Kategorie:</span>
                <span className="font-medium" style={{ color: category.color }}>{category.category}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Custom Dot für Werte > 0
  const CustomizedDot = (props) => {
    const { cx, cy, value } = props;
    
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    const dotSize = isMobile ? 4 : 5;
    return (
      <circle cx={cx} cy={cy} r={dotSize} fill={props.stroke} stroke={props.stroke} strokeWidth={1.5} />
    );
  };
  
  // Erstelle den Titel basierend auf dem Typ
  const chartTitle = viewType === 'morgen' ? 'Morgen-Blutdruckwerte' : 'Abend-Blutdruckwerte';
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
      <ChartHeader 
        title={chartTitle} 
        dataCount={filteredData.length} 
        sortDirection={sortDirection} 
        toggleSortDirection={toggleSortDirection} 
      />
      
      <DateRangeSelector 
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        dateRange={getDateRange()} 
        onCustomDateChange={handleCustomDateChange}
        showCustomDateInputs={showCustomDateInputs}
        setShowCustomDateInputs={setShowCustomDateInputs}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        setCustomStartDate={setCustomStartDate}
        setCustomEndDate={setCustomEndDate}
      />
      
      <VisualizationControls 
        visibleLines={visibleLines} 
        toggleLine={toggleLine} 
        isMobile={isMobile} 
      />
      
      {isMobile && (
        <MobileOptimizationWarning 
          filteredLength={filteredData.length}
          optimizedLength={paginatedData.length}
        />
      )}
      
      <div className="h-64 sm:h-80 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={paginatedData}
            margin={{ top: 10, right: isMobile ? 10 : 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
            <XAxis 
              dataKey="tag" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 'preserveEnd' : 0}
            />
            <YAxis 
              domain={[40, 180]}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={25}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Referenzlinien für Blutdruckbereiche */}
            {visibleLines.references && (
              <>
                <ReferenceLine 
                  y={120} 
                  stroke="#2ECC40" 
                  strokeDasharray="3 3" 
                  label={isMobile ? null : {
                    value: "Normal", 
                    position: "right", 
                    fill: "#2ECC40",
                    fontSize: 12
                  }} 
                />
                <ReferenceLine 
                  y={140} 
                  stroke="#FF851B" 
                  strokeDasharray="3 3" 
                  label={isMobile ? null : {
                    value: "Hyp. Grad 1", 
                    position: "right", 
                    fill: "#FF851B",
                    fontSize: 12
                  }} 
                />
                <ReferenceLine 
                  y={160} 
                  stroke="#FF4136" 
                  strokeDasharray="3 3" 
                  label={isMobile ? null : {
                    value: "Hyp. Grad 2", 
                    position: "right", 
                    fill: "#FF4136",
                    fontSize: 12
                  }} 
                />
                
                {/* Durchschnittslinien */}
                <ReferenceLine 
                  y={avgValues.sys} 
                  stroke="#B10DC9" 
                  strokeWidth={1.5}
                  label={isMobile ? null : {
                    value: "Ø Sys", 
                    position: "left", 
                    fill: "#B10DC9",
                    fontSize: 11
                  }} 
                />
                <ReferenceLine 
                  y={avgValues.dia} 
                  stroke="#7FDBFF" 
                  strokeWidth={1.5}
                  label={isMobile ? null : {
                    value: "Ø Dia", 
                    position: "left", 
                    fill: "#7FDBFF",
                    fontSize: 11
                  }} 
                />
              </>
            )}
            
            {/* Systolisch */}
            {visibleLines.systolic && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Sys`} 
                stroke="#FF4136" 
                strokeWidth={2.5}
                dot={<CustomizedDot />}
                activeDot={{ r: isMobile ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Diastolisch */}
            {visibleLines.diastolic && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Dia`} 
                stroke="#0074D9" 
                strokeWidth={2.5}
                dot={<CustomizedDot />}
                activeDot={{ r: isMobile ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Puls */}
            {visibleLines.pulse && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Puls`} 
                stroke="#2ECC40" 
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: isMobile ? 6 : 7 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
      />
    </div>
  );
};

export default BloodPressureChart;