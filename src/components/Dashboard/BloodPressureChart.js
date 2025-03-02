// components/Dashboard/BloodPressureChart.js
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ReferenceLine } from 'recharts';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';
import { Filter, Calendar, Eye, EyeOff, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BloodPressureChart = ({ data, viewType, avgValues }) => {
  const { theme } = useTheme();
  
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
    if (!dateStr) return null; // Kein Default-Jahr zurückgeben
    
    // Suche nach einer vierstelligen Zahl, die das Jahr sein könnte
    const yearMatch = dateStr.match(/\b(20\d{2})\b/); // 2000-2099
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    return null; // Kein Jahr gefunden
  };
  
  // Parst ein deutsches Datum in ein JavaScript Date-Objekt
  const parseGermanDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Jahr extrahieren, falls vorhanden
    const explicitYear = extractYearFromDate(dateStr);
    
    // Deutsche Monatsnamen in Zahlen (0-11) für JS Date
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    let day, month, year;
    
    // Format "Januar 15" oder "Januar 15 2024"
    if (dateStr.includes(' ') && !dateStr.includes('.')) {
      const parts = dateStr.split(' ');
      if (parts.length >= 2 && months[parts[0]] !== undefined) {
        month = parts[0];
        day = parseInt(parts[1]);
        year = explicitYear || new Date().getFullYear(); // Aktuelles Jahr als Fallback
      }
    }
    // Format "15. Januar" oder "15. Januar 2024"
    else if (dateStr.includes('.') && dateStr.includes(' ')) {
      const parts = dateStr.split('. ');
      if (parts.length >= 2) {
        day = parseInt(parts[0]);
        const monthPart = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
        month = monthPart;
        year = explicitYear || new Date().getFullYear(); // Aktuelles Jahr als Fallback
      }
    }
    
    if (day && month && months[month] !== undefined) {
      return new Date(year, months[month], day);
    }
    
    return null;
  };
  
  // Sortiert alle Daten chronologisch nach Datum
  const sortDataByDate = (dataArray) => {
    return [...dataArray].sort((a, b) => {
      const dateA = parseGermanDate(a.datum);
      const dateB = parseGermanDate(b.datum);
      
      if (dateA && dateB) {
        return dateA - dateB;
      }
      
      // Fallback, wenn Datumobjekte nicht erstellt werden können
      return 0;
    });
  };
  
  // Filtere Daten basierend auf dem ausgewählten Zeitraum
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sortiere Daten zuerst chronologisch
    const sortedData = sortDataByDate(data);
    
    const now = new Date();
    
    // Filtere basierend auf dem ausgewählten Zeitraum
    switch (dateFilter) {
      case 'month': {
        // Letzter Monat
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        return sortedData.filter(item => {
          const itemDate = parseGermanDate(item.datum);
          return itemDate && itemDate >= oneMonthAgo && itemDate <= now;
        });
      }
      case 'week': {
        // Letzte Woche
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return sortedData.filter(item => {
          const itemDate = parseGermanDate(item.datum);
          return itemDate && itemDate >= oneWeekAgo && itemDate <= now;
        });
      }
      case 'custom': {
        // Benutzerdefinierter Zeitraum
        if (!customStartDate || !customEndDate) return sortedData;
        
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        
        return sortedData.filter(item => {
          const itemDate = parseGermanDate(item.datum);
          return itemDate && itemDate >= startDate && itemDate <= endDate;
        });
      }
      default:
        // Alle Daten (bereits sortiert)
        return sortedData;
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
    
    // Formatiere für Anzeige
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      
      // Direktes Zurückgeben des Datums ohne weitere Verarbeitung
      return dateStr;
    };
    
    const firstDate = formatDate(filteredData[0].datum);
    const lastDate = formatDate(filteredData[filteredData.length - 1].datum);
    
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
        <div 
          className="custom-tooltip p-3 border rounded-md shadow-lg max-w-[180px] sm:max-w-none"
          style={{ 
            backgroundColor: theme.card, 
            borderColor: theme.border,
            color: theme.text.primary
          }}
        >
          <p className="font-medium text-sm">{label}, {data.datum}</p>
          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm">
            {sys > 0 && (
              <>
                <span style={{ color: theme.text.secondary }}>Systolisch:</span>
                <span className="font-medium">{sys} mmHg</span>
              </>
            )}
            
            {dia > 0 && (
              <>
                <span style={{ color: theme.text.secondary }}>Diastolisch:</span>
                <span className="font-medium">{dia} mmHg</span>
              </>
            )}
            
            {puls > 0 && (
              <>
                <span style={{ color: theme.text.secondary }}>Puls:</span>
                <span className="font-medium">{puls} bpm</span>
              </>
            )}
            
            {sys > 0 && dia > 0 && (
              <>
                <span style={{ color: theme.text.secondary }}>Kategorie:</span>
                <span className="font-medium" style={{ color: category.color }}>{category.category}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  }, [prefix, theme]);
  
  // Angepasste mobile Legende
  const renderMobileLegend = () => {
    return (
      <div className="mb-2 mt-1">
        <div 
          className="flex items-center justify-between p-2 rounded-md cursor-pointer interactive"
          style={{ backgroundColor: `${theme.primary}10` }}
          onClick={() => setExpandLegend(!expandLegend)}
        >
          <span className="font-medium text-sm">Linien anzeigen/ausblenden</span>
          {expandLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        
        {expandLegend && (
          <div className="mt-2 grid grid-cols-2 gap-2 px-2">
            <div 
              className="flex items-center p-2 rounded-md cursor-pointer interactive transition-all duration-200"
              style={{ 
                backgroundColor: visibleLines.systolic 
                  ? `${theme.chart.systolic}15` 
                  : theme.card,
                borderColor: theme.border,
                borderWidth: '1px'
              }}
              onClick={() => toggleLine('systolic')}
            >
              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: theme.chart.systolic }}></div>
              <span className="text-xs">Systolisch</span>
              {visibleLines.systolic ? 
                <Eye size={14} className="ml-auto" style={{ color: theme.chart.systolic }} /> : 
                <EyeOff size={14} className="ml-auto" style={{ color: theme.text.muted }} />
              }
            </div>
            
            <div 
              className="flex items-center p-2 rounded-md cursor-pointer interactive transition-all duration-200"
              style={{ 
                backgroundColor: visibleLines.diastolic 
                  ? `${theme.chart.diastolic}15` 
                  : theme.card,
                borderColor: theme.border,
                borderWidth: '1px'
              }}
              onClick={() => toggleLine('diastolic')}
            >
              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: theme.chart.diastolic }}></div>
              <span className="text-xs">Diastolisch</span>
              {visibleLines.diastolic ? 
                <Eye size={14} className="ml-auto" style={{ color: theme.chart.diastolic }} /> : 
                <EyeOff size={14} className="ml-auto" style={{ color: theme.text.muted }} />
              }
            </div>
            
            <div 
              className="flex items-center p-2 rounded-md cursor-pointer interactive transition-all duration-200"
              style={{ 
                backgroundColor: visibleLines.pulse 
                  ? `${theme.chart.pulse}15` 
                  : theme.card,
                borderColor: theme.border,
                borderWidth: '1px'
              }}
              onClick={() => toggleLine('pulse')}
            >
              <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: theme.chart.pulse }}></div>
              <span className="text-xs">Puls</span>
              {visibleLines.pulse ? 
                <Eye size={14} className="ml-auto" style={{ color: theme.chart.pulse }} /> : 
                <EyeOff size={14} className="ml-auto" style={{ color: theme.text.muted }} />
              }
            </div>
            
            <div 
              className="flex items-center p-2 rounded-md cursor-pointer interactive transition-all duration-200"
              style={{ 
                backgroundColor: visibleLines.references 
                  ? `${theme.chart.reference}15` 
                  : theme.card,
                borderColor: theme.border,
                borderWidth: '1px'
              }}
              onClick={() => toggleLine('references')}
            >
              <div className="flex-1 h-1 mr-2" style={{ 
                backgroundImage: `linear-gradient(to right, transparent 50%, ${theme.card} 50%)`, 
                backgroundSize: '10px 100%',
                backgroundColor: theme.chart.reference
              }}></div>
              <span className="text-xs">Referenzlinien</span>
              {visibleLines.references ? 
                <Eye size={14} className="ml-auto" style={{ color: theme.chart.reference }} /> : 
                <EyeOff size={14} className="ml-auto" style={{ color: theme.text.muted }} />
              }
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
      <div className="mb-2 p-2 rounded-md flex items-start text-xs" style={{ 
        backgroundColor: `${theme.warning}15`,
        color: theme.warning,
        borderColor: theme.warning,
        borderWidth: '1px'
      }}>
        <Info size={14} className="mr-2 flex-shrink-0 mt-0.5" />
        <span>Es werden {mobileOptimizedData.length} von {filteredData.length} Datenpunkten angezeigt. Verwende die Filter für eine detailliertere Ansicht.</span>
      </div>
    );
  };

  return (
    <div className="mb-6 card" style={{ 
      backgroundColor: theme.card, 
      borderColor: theme.border
    }}>
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
          <h2 className="text-lg font-semibold mb-2 sm:mb-0" style={{ color: theme.text.primary }}>
            {viewType === 'morgen' ? 'Morgen-Blutdruckwerte' : 'Abend-Blutdruckwerte'}
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium" style={{ color: theme.text.secondary }}>
              {filteredData.length} Messungen
            </div>
            
            {/* Zeitraum-Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <button 
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="flex w-full sm:w-auto items-center justify-between text-sm px-3 py-1.5 rounded-md interactive"
                style={{ 
                  backgroundColor: `${theme.primary}15`,
                  color: theme.primary
                }}
              >
                <Filter size={16} className="mr-1.5" />
                <span className="font-medium">
                  {filterOptions.find(option => option.id === dateFilter)?.label || 'Zeitraum'}
                </span>
              </button>
              
              {showFilterOptions && (
                <div className="absolute right-0 mt-1 w-full sm:w-64 rounded-md shadow-lg z-10 card" style={{ 
                  backgroundColor: theme.card,
                  borderColor: theme.border
                }}>
                  <div className="p-2">
                    {filterOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setDateFilter(option.id);
                          setShowFilterOptions(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-md text-sm interactive transition-all duration-200"
                        style={{ 
                          backgroundColor: dateFilter === option.id 
                            ? `${theme.primary}15` 
                            : 'transparent',
                          color: dateFilter === option.id 
                            ? theme.primary 
                            : theme.text.primary
                        }}
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
                      className="w-full text-left px-3 py-2 rounded-md text-sm interactive transition-all duration-200"
                      style={{ 
                        backgroundColor: dateFilter === 'custom' 
                          ? `${theme.primary}15` 
                          : 'transparent',
                        color: dateFilter === 'custom' 
                          ? theme.primary 
                          : theme.text.primary
                      }}
                    >
                      Benutzerdefinierter Zeitraum
                    </button>
                    
                    {/* Benutzerdefinierte Datumsfelder */}
                    {dateFilter === 'custom' && (
                      <div className="p-2 mt-2" style={{ borderTopColor: theme.border, borderTopWidth: '1px' }}>
                        <div className="flex flex-col space-y-2">
                          <div>
                            <label className="block text-xs mb-1 font-medium" style={{ color: theme.text.secondary }}>Von:</label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full p-1.5 text-sm rounded-md border"
                              style={{ 
                                backgroundColor: theme.card,
                                color: theme.text.primary,
                                borderColor: theme.border
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1 font-medium" style={{ color: theme.text.secondary }}>Bis:</label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full p-1.5 text-sm rounded-md border"
                              style={{ 
                                backgroundColor: theme.card,
                                color: theme.text.primary,
                                borderColor: theme.border
                              }}
                            />
                          </div>
                          <button
                            onClick={() => setShowFilterOptions(false)}
                            className="w-full py-1.5 rounded-md text-sm font-medium interactive"
                            style={{ 
                              backgroundColor: theme.primary,
                              color: '#ffffff'
                            }}
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
        <div className="text-sm mb-3 flex items-center pb-2" style={{ 
          borderBottomColor: theme.border,
          borderBottomWidth: '1px',
          color: theme.text.secondary
        }}>
          <Calendar size={16} className="mr-2" style={{ color: theme.primary }} />
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
              <CartesianGrid 
                strokeDasharray="3 3" 
                opacity={0.7} 
                stroke={theme.chart.grid}
              />
              <XAxis 
                dataKey="tag" 
                tick={{ fill: theme.text.primary, fontSize: isMobile ? 10 : 12 }}
                tickLine={{ stroke: theme.text.secondary }}
                axisLine={{ stroke: theme.border }}
                interval={isMobile ? 'preserveEnd' : 0}
              />
              <YAxis 
                domain={[40, 180]} 
                tick={{ fill: theme.text.primary, fontSize: isMobile ? 10 : 12 }}
                tickLine={{ stroke: theme.text.secondary }}
                axisLine={{ stroke: theme.border }}
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
                    stroke={theme.categories.normal}
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={isMobile ? null : {
                      value: "Normal", 
                      position: "right", 
                      fill: theme.categories.normal,
                      fontSize: 12,
                      offset: 5
                    }} 
                  />
                  <ReferenceLine 
                    y={140} 
                    stroke={theme.categories.highNormal}
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={isMobile ? null : {
                      value: "Hyp. Grad 1", 
                      position: "right", 
                      fill: theme.categories.highNormal,
                      fontSize: 12,
                      offset: 5
                    }} 
                  />
                  <ReferenceLine 
                    y={160} 
                    stroke={theme.categories.hypertension2}
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={isMobile ? null : {
                      value: "Hyp. Grad 2", 
                      position: "right", 
                      fill: theme.categories.hypertension2,
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
                  stroke={theme.chart.systolic}
                  name="Systolisch" 
                  strokeWidth={2.5}
                  dot={<CustomizedDot />}
                  activeDot={<CustomizedActiveDot />}
                  connectNulls={false} // 0-Werte nicht verbinden
                  animationDuration={500}
                />
              )}
              
              {visibleLines.diastolic && (
                <Line 
                  type="monotone" 
                  dataKey={`${prefix}Dia`} 
                  stroke={theme.chart.diastolic}
                  name="Diastolisch" 
                  strokeWidth={2.5}
                  dot={<CustomizedDot />}
                  activeDot={<CustomizedActiveDot />}
                  connectNulls={false} // 0-Werte nicht verbinden
                  animationDuration={500}
                  animationBegin={200}
                />
              )}
              
              {visibleLines.pulse && (
                <Line 
                  type="monotone" 
                  dataKey={`${prefix}Puls`} 
                  stroke={theme.chart.pulse}
                  name="Puls" 
                  strokeWidth={2}
                  dot={<CustomizedDot />}
                  activeDot={<CustomizedActiveDot />}
                  connectNulls={false} // 0-Werte nicht verbinden
                  animationDuration={500}
                  animationBegin={400}
                />
              )}
                  
              {/* Durchschnittslinien */}
              {visibleLines.references && (
                <>
                  <ReferenceLine 
                    y={avgValues.sys} 
                    stroke={theme.chart.reference}
                    strokeWidth={1.5}
                    label={isMobile ? null : {
                      value: "Ø Sys", 
                      position: "left", 
                      fill: theme.chart.reference,
                      fontSize: 11,
                      offset: 5
                    }} 
                  />
                  <ReferenceLine 
                    y={avgValues.dia} 
                    stroke={theme.chart.reference}
                    strokeWidth={1.5}
                    strokeDasharray="3 1"
                    label={isMobile ? null : {
                      value: "Ø Dia", 
                      position: "left", 
                      fill: theme.chart.reference,
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
    </div>
  );
};

export default BloodPressureChart;