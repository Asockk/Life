// components/Dashboard/BloodPressureChart.js
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ReferenceLine } from 'recharts';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';
import { Filter, Calendar, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

const BloodPressureChart = ({ data, viewType, avgValues }) => {
  // State für mobile Optimierungen
  const [isMobile, setIsMobile] = useState(false);
  const [expandLegend, setExpandLegend] = useState(false);
  
  // Welche Linien sollen angezeigt werden
  const [visibleLines, setVisibleLines] = useState({
    systolic: true,
    diastolic: true,
    pulse: true,
    references: true
  });
  
  // Zeitraumfilter für das Diagramm
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'week', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Prüfen, ob wir auf einem mobilen Gerät sind (beim Mounten und bei Größenänderungen)
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial Check
    checkIfMobile();
    
    // Event Listener für Größenänderungen
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Prefix für aktuelle Ansicht (morgen oder abend)
  const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
  
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
  
  // Filtere Daten basierend auf dem ausgewählten Zeitraum
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Konvertiert Datum wie "Januar 15" oder "15. Januar 2024" in ein Date-Objekt
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      
      // Jahr extrahieren (falls vorhanden)
      const year = extractYearFromDate(dateStr);
      
      const months = {
        'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
        'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
        'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
      };
      
      // Fall 1: Format "Januar 15" oder "Januar 15 2024"
      if (dateStr.includes(' ') && !dateStr.includes('.')) {
        const parts = dateStr.split(' ');
        if (parts.length >= 2 && months[parts[0]] !== undefined) {
          const month = parts[0];
          const day = parseInt(parts[1]);
          if (!isNaN(day)) {
            return new Date(year, months[month], day);
          }
        }
      }
      
      // Fall 2: Format "15. Januar" oder "15. Januar 2024"
      if (dateStr.includes('.') && dateStr.includes(' ')) {
        const parts = dateStr.split('. ');
        if (parts.length >= 2) {
          const day = parseInt(parts[0]);
          const monthPart = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
          if (!isNaN(day) && months[monthPart] !== undefined) {
            return new Date(year, months[monthPart], day);
          }
        }
      }
      
      return null;
    };
    
    const now = new Date();
    
    // Filtere basierend auf dem ausgewählten Zeitraum
    switch (dateFilter) {
      case 'month': {
        // Letzter Monat
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        return data.filter(item => {
          const itemDate = parseDate(item.datum);
          return itemDate && itemDate >= oneMonthAgo && itemDate <= now;
        });
      }
      case 'week': {
        // Letzte Woche
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return data.filter(item => {
          const itemDate = parseDate(item.datum);
          return itemDate && itemDate >= oneWeekAgo && itemDate <= now;
        });
      }
      case 'custom': {
        // Benutzerdefinierter Zeitraum
        if (!customStartDate || !customEndDate) return data;
        
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        
        return data.filter(item => {
          const itemDate = parseDate(item.datum);
          return itemDate && itemDate >= startDate && itemDate <= endDate;
        });
      }
      default:
        // Alle Daten
        return data;
    }
  }, [data, dateFilter, customStartDate, customEndDate]);
  
  // Optimierte Daten für Mobile-Ansicht (Reduzierung der Datenpunkte)
  const mobileOptimizedData = useMemo(() => {
    if (!isMobile || filteredData.length <= 7) return filteredData;
    
    // Bei vielen Datenpunkten auf Mobilgeräten: Intelligente Reduzierung
    // Strategie: Bei mehr als 7 Datenpunkten zeigen wir eine Auswahl an wichtigen Punkten
    
    // Option 1: Erste, letzte und gleichmäßig verteilte Zwischenpunkte anzeigen
    if (filteredData.length <= 14) {
      // Bei bis zu 14 Datenpunkten: Jeden zweiten anzeigen
      return filteredData.filter((_, index) => index % 2 === 0);
    } else if (filteredData.length <= 30) {
      // Bei bis zu 30 Datenpunkten: Ungefähr 10 wichtige Punkte anzeigen
      const step = Math.floor(filteredData.length / 10);
      return filteredData.filter((_, index) => index % step === 0 || index === filteredData.length - 1);
    } else {
      // Bei sehr vielen Datenpunkten: Maximal 15 Punkte anzeigen
      const step = Math.floor(filteredData.length / 15);
      return filteredData.filter((_, index) => index % step === 0 || index === filteredData.length - 1);
    }
  }, [filteredData, isMobile]);
  
  // Die tatsächlich anzuzeigenden Daten (normal oder optimiert)
  const displayData = isMobile ? mobileOptimizedData : filteredData;
  
  // Verfügbare Zeiträume für das Dropdown
  const filterOptions = [
    { id: 'all', label: 'Alle Daten' },
    { id: 'month', label: 'Letzter Monat' },
    { id: 'week', label: 'Letzte Woche' }
  ];
  
  // Berechne den ersten und letzten Tag des angezeigten Zeitraums für Anzeige
  const getDateRange = () => {
    if (filteredData.length === 0) {
      return "Keine Daten";
    }
    
    // Daten nach Datum sortieren, mit Berücksichtigung des Jahrs
    const sortedData = [...filteredData].sort((a, b) => {
      const aDate = new Date(extractYearFromDate(a.datum), 0, 1); // Jahr wird berücksichtigt
      const bDate = new Date(extractYearFromDate(b.datum), 0, 1);
      const yearDiff = aDate - bDate;
      
      if (yearDiff !== 0) return yearDiff;
      
      // Wenn Jahre gleich sind, nach Monat und Tag sortieren      
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        
        const months = {
          'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
          'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
          'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
        };
        
        // Format: "Januar 15" oder "Januar 15 2024"
        if (dateStr.includes(' ') && !dateStr.includes('.')) {
          const parts = dateStr.split(' ');
          if (parts.length >= 2 && months[parts[0]] !== undefined) {
            return new Date(extractYearFromDate(dateStr), months[parts[0]], parseInt(parts[1]));
          }
        }
        
        // Format: "15. Januar" oder "15. Januar 2024"
        if (dateStr.includes('.') && dateStr.includes(' ')) {
          const parts = dateStr.split('. ');
          if (parts.length >= 2) {
            const month = parts[1].split(' ')[0];
            if (months[month] !== undefined) {
              return new Date(extractYearFromDate(dateStr), months[month], parseInt(parts[0]));
            }
          }
        }
        
        return new Date(0);
      };
      
      return parseDate(a.datum) - parseDate(b.datum);
    });
    
    // Formatiere für Anzeige
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      
      // Direktes Zurückgeben des Datums ohne weitere Verarbeitung
      return dateStr;
    };
    
    const firstDate = formatDate(sortedData[0].datum);
    const lastDate = formatDate(sortedData[sortedData.length - 1].datum);
    
    return `${firstDate} - ${lastDate}`;
  };
  
  // Toggle für Sichtbarkeit der Linien
  const toggleLine = (line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };
  
  // Custom Dot für die Linien, um 0-Werte nicht anzuzeigen
  const CustomizedDot = (props) => {
    const { cx, cy, value } = props;
    
    // Wenn der Wert 0 ist oder nicht existiert, keinen Punkt zeichnen
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Größe des Punktes basierend auf Mobilgerät anpassen
    const dotSize = isMobile ? 4 : 5;
    
    // Sonst den Standardpunkt zurückgeben
    return (
      <circle cx={cx} cy={cy} r={dotSize} fill={props.stroke} stroke={props.stroke} strokeWidth={2} />
    );
  };
  
  // Custom Dot für aktivierte Datenpunkte
  const CustomizedActiveDot = (props) => {
    const { cx, cy, value } = props;
    
    // Wenn der Wert 0 ist, keinen Punkt zeichnen
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Größe des aktiven Punktes basierend auf Mobilgerät anpassen
    const dotSize = isMobile ? 6 : 7;
    
    // Sonst den aktiven Punkt zurückgeben
    return (
      <circle cx={cx} cy={cy} r={dotSize} fill={props.stroke} stroke={props.stroke} strokeWidth={2} />
    );
  };
  
  // Benutzerdefinierter Tooltip für das Diagramm
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sys = data[`${prefix}Sys`];
      const dia = data[`${prefix}Dia`];
      const puls = data[`${prefix}Puls`];
      
      // Wenn ein Wert 0 ist, soll er nicht angezeigt werden
      if ((sys === 0 && dia === 0) || (sys === 0 || dia === 0)) {
        return null; // Kein Tooltip anzeigen
      }
      
      const category = getBloodPressureCategory(sys, dia);
      
      return (
        <div className="custom-tooltip bg-white p-2 sm:p-3 border border-gray-200 shadow-lg rounded-md max-w-[180px] sm:max-w-none">
          <p className="font-medium text-sm">{label}, {data.datum}</p>
          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm">
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
  }, [prefix]);
  
  // Angepasste mobile Legende
  const renderMobileLegend = () => {
    return (
      <div className="mb-2 mt-1">
        <div 
          className="flex items-center justify-between bg-gray-100 p-2 rounded-md cursor-pointer"
          onClick={() => setExpandLegend(!expandLegend)}
        >
          <span className="font-medium text-sm">Linien anzeigen/ausblenden</span>
          {expandLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        
        {expandLegend && (
          <div className="mt-2 grid grid-cols-2 gap-2 px-2">
            <div 
              className={`flex items-center p-2 rounded-md cursor-pointer ${visibleLines.systolic ? 'bg-red-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('systolic')}
            >
              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#FF4136' }}></div>
              <span className="text-xs">Systolisch</span>
              {visibleLines.systolic ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
            
            <div 
              className={`flex items-center p-2 rounded-md cursor-pointer ${visibleLines.diastolic ? 'bg-blue-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('diastolic')}
            >
              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#0074D9' }}></div>
              <span className="text-xs">Diastolisch</span>
              {visibleLines.diastolic ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
            
            <div 
              className={`flex items-center p-2 rounded-md cursor-pointer ${visibleLines.pulse ? 'bg-green-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('pulse')}
            >
              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#2ECC40' }}></div>
              <span className="text-xs">Puls</span>
              {visibleLines.pulse ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
            
            <div 
              className={`flex items-center p-2 rounded-md cursor-pointer ${visibleLines.references ? 'bg-purple-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('references')}
            >
              <div className="flex-1 h-1 mr-2 bg-purple-300" style={{ backgroundImage: 'linear-gradient(to right, transparent 50%, white 50%)', backgroundSize: '10px 100%' }}></div>
              <span className="text-xs">Referenzlinien</span>
              {visibleLines.references ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Rendere Warnhinweis bei vielen Datenpunkten auf Mobilgeräten
  const renderMobileDataWarning = () => {
    if (!isMobile || filteredData.length <= mobileOptimizedData.length) return null;
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-xs text-yellow-800 mb-2">
        <strong>Hinweis:</strong> Es werden {mobileOptimizedData.length} von {filteredData.length} Datenpunkten angezeigt. Verwende die Filter für eine detailliertere Ansicht.
      </div>
    );
  };
  
  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-300 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
          {viewType === 'morgen' ? 'Morgen-Blutdruckwerte' : 'Abend-Blutdruckwerte'}
        </h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-gray-700 font-medium">
            {filteredData.length} Messungen
          </div>
          
          {/* Zeitraum-Filter Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="flex w-full sm:w-auto items-center justify-between text-sm bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md"
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
                  
                  {/* Option für benutzerdefinierten Zeitraum */}
                  <button
                    onClick={() => {
                      setDateFilter('custom');
                      // Nicht schließen - lässt Benutzer die Datumsfelder sehen
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      dateFilter === 'custom' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Benutzerdefinierter Zeitraum
                  </button>
                  
                  {/* Benutzerdefinierte Datumsfelder */}
                  {dateFilter === 'custom' && (
                    <div className="p-2 border-t mt-2">
                      <div className="flex flex-col space-y-2">
                        <div>
                          <label className="block text-xs text-gray-700 mb-1 font-medium">Von:</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 mb-1 font-medium">Bis:</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <button
                          onClick={() => setShowFilterOptions(false)}
                          className="w-full bg-blue-600 text-white py-1.5 rounded-md text-sm font-medium"
                        >
                          Anwenden
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Zeitraumanzeige - immer sichtbar */}
      <div className="text-sm text-gray-700 mb-3 flex items-center border-b border-gray-300 pb-2">
        <Calendar size={16} className="mr-2 text-blue-600" />
        <span className="font-medium">Zeitraum: {getDateRange()}</span>
      </div>
      
      {/* Mobile-Optimierungen */}
      {isMobile && (
        <>
          {renderMobileLegend()}
          {renderMobileDataWarning()}
        </>
      )}
      
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={displayData} 
            margin={{ 
              top: 20, 
              right: isMobile ? 10 : 120, 
              left: isMobile ? 0 : 10, 
              bottom: 10 
            }}
            connectNulls={false} // Wichtig: 0-Werte nicht verbinden
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
            <XAxis 
              dataKey="tag" 
              tick={{ fill: '#333', fontSize: isMobile ? 10 : 12 }}
              tickLine={{ stroke: '#555' }}
              interval={isMobile ? 'preserveEnd' : 0}
            />
            <YAxis 
              domain={[40, 180]} 
              tick={{ fill: '#333', fontSize: isMobile ? 10 : 12 }}
              tickLine={{ stroke: '#555' }}
              tickCount={7}
              width={isMobile ? 25 : 30}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Legend nur auf Desktop anzeigen, auf Mobile durch eigene Komponente ersetzt */}
            {!isMobile && (
              <Legend
                iconType="circle"
                layout="horizontal"
                verticalAlign="top"
                align="center"
                wrapperStyle={{ paddingBottom: '10px' }}
              />
            )}
                
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
                    fontSize: 12,
                    offset: 5
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
                    fontSize: 12,
                    offset: 5
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
                    fontSize: 12,
                    offset: 5
                  }} 
                />
              </>
            )}
                
            {/* Hauptlinien mit angepassten Dots, um 0-Werte zu ignorieren */}
            {visibleLines.systolic && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Sys`} 
                stroke="#FF4136" 
                name="Systolisch" 
                strokeWidth={2.5}
                dot={<CustomizedDot />}
                activeDot={<CustomizedActiveDot />}
                connectNulls={false} // 0-Werte nicht verbinden
              />
            )}
            
            {visibleLines.diastolic && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Dia`} 
                stroke="#0074D9" 
                name="Diastolisch" 
                strokeWidth={2.5}
                dot={<CustomizedDot />}
                activeDot={<CustomizedActiveDot />}
                connectNulls={false} // 0-Werte nicht verbinden
              />
            )}
            
            {visibleLines.pulse && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Puls`} 
                stroke="#2ECC40" 
                name="Puls" 
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={<CustomizedActiveDot />}
                connectNulls={false} // 0-Werte nicht verbinden
              />
            )}
                
            {/* Durchschnittslinien */}
            {visibleLines.references && (
              <>
                <ReferenceLine 
                  y={avgValues.sys} 
                  stroke="#B10DC9" 
                  strokeWidth={1.5}
                  label={isMobile ? null : {
                    value: "Ø Sys", 
                    position: "left", 
                    fill: "#B10DC9",
                    fontSize: 11,
                    offset: 5
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
                    fontSize: 11,
                    offset: 5
                  }} 
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BloodPressureChart;