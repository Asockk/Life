// components/Dashboard/BloodPressureChart.js
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ReferenceLine } from 'recharts';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';
import { Filter, Calendar, Eye, EyeOff, ChevronDown, ChevronUp, Share2 } from 'lucide-react';

const BloodPressureChart = ({ data, viewType, avgValues }) => {
  // State for mobile optimizations
  const [isMobile, setIsMobile] = useState(false);
  const [expandLegend, setExpandLegend] = useState(false);
  const [chartHeight, setChartHeight] = useState(300);
  
  // Which lines should be shown
  const [visibleLines, setVisibleLines] = useState({
    systolic: true,
    diastolic: true,
    pulse: true,
    references: true
  });
  
  // Time filter for the chart
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'week', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Check if we're on a mobile device (on mount and on resize)
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // Adjust chart height based on screen size
      setChartHeight(isMobileView ? 220 : 300);
    };
    
    // Initial Check
    checkIfMobile();
    
    // Event Listener for resizes
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Prefix for current view (morning or evening)
  const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
  
  // Extract year from date string
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
  
  // Parse a German date into a JavaScript Date object
  const parseGermanDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Extract year (if present)
    const explicitYear = extractYearFromDate(dateStr);
    
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    let day, month, year;
    
    // Format "Januar 15" or "Januar 15 2024"
    if (dateStr.includes(' ') && !dateStr.includes('.')) {
      const parts = dateStr.split(' ');
      if (parts.length >= 2 && months[parts[0]] !== undefined) {
        month = parts[0];
        day = parseInt(parts[1]);
        year = explicitYear || new Date().getFullYear(); // Current year as fallback
      }
    }
    // Format "15. Januar" or "15. Januar 2024"
    else if (dateStr.includes('.') && dateStr.includes(' ')) {
      const parts = dateStr.split('. ');
      if (parts.length >= 2) {
        day = parseInt(parts[0]);
        const monthPart = parts[1].split(' ')[0]; // If year is included
        month = monthPart;
        year = explicitYear || new Date().getFullYear(); // Current year as fallback
      }
    }
    
    if (day && month && months[month] !== undefined) {
      return new Date(year, months[month], day);
    }
    
    return null;
  };
  
  // Sort all data chronologically by date
  const sortDataByDate = (dataArray) => {
    return [...dataArray].sort((a, b) => {
      const dateA = parseGermanDate(a.datum);
      const dateB = parseGermanDate(b.datum);
      
      if (dateA && dateB) {
        return dateA - dateB;
      }
      
      // Fallback if date objects cannot be created
      return 0;
    });
  };

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // First sort data chronologically
    const sortedData = sortDataByDate(data);
    
    const now = new Date();
    
    // Filter based on selected time range
    switch (dateFilter) {
      case 'month': {
        // Last month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        return sortedData.filter(item => {
          const itemDate = parseGermanDate(item.datum);
          return itemDate && itemDate >= oneMonthAgo && itemDate <= now;
        });
      }
      case 'week': {
        // Last week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return sortedData.filter(item => {
          const itemDate = parseGermanDate(item.datum);
          return itemDate && itemDate >= oneWeekAgo && itemDate <= now;
        });
      }
      case 'custom': {
        // Custom time range
        if (!customStartDate || !customEndDate) return sortedData;
        
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        
        return sortedData.filter(item => {
          const itemDate = parseGermanDate(item.datum);
          return itemDate && itemDate >= startDate && itemDate <= endDate;
        });
      }
      default:
        // All data (already sorted)
        return sortedData;
    }
  }, [data, dateFilter, customStartDate, customEndDate]);

  // Optimized data for mobile view (reducing data points)
  const mobileOptimizedData = useMemo(() => {
    if (!isMobile || filteredData.length <= 5) return filteredData;
    
    // For mobile devices with many data points: Intelligent reduction
    // Strategy: With more than 5 data points, we show a selection of important points
    
    // First and last points plus evenly distributed intermediate points
    const maxPoints = Math.min(7, Math.max(5, Math.floor(window.innerWidth / 60)));
    const step = Math.max(1, Math.floor(filteredData.length / maxPoints));
    
    return filteredData.filter((_, index) => index % step === 0 || index === filteredData.length - 1);
  }, [filteredData, isMobile]);
  
  // The actual data to display (normal or optimized)
  const displayData = isMobile ? mobileOptimizedData : filteredData;
  
  // Available time ranges for the dropdown
  const filterOptions = [
    { id: 'all', label: 'Alle Daten' },
    { id: 'month', label: 'Letzter Monat' },
    { id: 'week', label: 'Letzte Woche' }
  ];
  
  // Calculate first and last day of the displayed time range for display
  const getDateRange = () => {
    if (filteredData.length === 0) {
      return "Keine Daten";
    }
    
    // Format for display
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      
      // Return the date directly without further processing
      return dateStr;
    };
    
    const firstDate = formatDate(filteredData[0].datum);
    const lastDate = formatDate(filteredData[filteredData.length - 1].datum);
    
    return `${firstDate} - ${lastDate}`;
  };
  
  // Toggle for line visibility
  const toggleLine = (line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };
  
  // Custom Dot for the lines to hide 0 values
  const CustomizedDot = (props) => {
    const { cx, cy, value } = props;
    
    // If value is 0 or doesn't exist, don't draw a point
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Adjust dot size based on mobile device
    const dotSize = isMobile ? 3 : 4;
    
    // Otherwise return the standard dot
    return (
      <circle cx={cx} cy={cy} r={dotSize} fill={props.stroke} stroke={props.stroke} strokeWidth={1.5} />
    );
  };
  
  // Custom Dot for active data points
  const CustomizedActiveDot = (props) => {
    const { cx, cy, value } = props;
    
    // If value is 0, don't draw a dot
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Adjust active dot size based on mobile device
    const dotSize = isMobile ? 5 : 6;
    
    // Otherwise return the active dot
    return (
      <circle cx={cx} cy={cy} r={dotSize} fill={props.stroke} stroke="white" strokeWidth={2} />
    );
  };
  
  // Custom Tooltip for the chart
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sys = data[`${prefix}Sys`];
      const dia = data[`${prefix}Dia`];
      const puls = data[`${prefix}Puls`];
      
      // If a value is 0, don't show the tooltip
      if ((sys === 0 && dia === 0) || (sys === 0 || dia === 0)) {
        return null; // Don't show the tooltip
      }
      
      const category = getBloodPressureCategory(sys, dia);
      
      return (
        <div className="custom-tooltip bg-white p-2 sm:p-3 border border-gray-200 shadow-lg rounded-md max-w-[180px] sm:max-w-none">
          <p className="font-medium text-xs sm:text-sm">{label}, {data.datum}</p>
          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 mt-1 text-xs">
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
  
  // Adjusted mobile legend
  const renderMobileLegend = () => {
    return (
      <div className="mb-2 mt-1">
        <div 
          className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
          onClick={() => setExpandLegend(!expandLegend)}
        >
          <span className="font-medium text-sm">Linien anzeigen/ausblenden</span>
          {expandLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        
        {expandLegend && (
          <div className="mt-2 grid grid-cols-2 gap-2 px-1">
            <div 
              className={`flex items-center p-2 rounded-md ${visibleLines.systolic ? 'bg-red-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('systolic')}
            >
              <div className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: '#FF4136' }}></div>
              <span className="text-xs">Systolisch</span>
              {visibleLines.systolic ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
            
            <div 
              className={`flex items-center p-2 rounded-md ${visibleLines.diastolic ? 'bg-blue-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('diastolic')}
            >
              <div className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: '#0074D9' }}></div>
              <span className="text-xs">Diastolisch</span>
              {visibleLines.diastolic ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
            
            <div 
              className={`flex items-center p-2 rounded-md ${visibleLines.pulse ? 'bg-green-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('pulse')}
            >
              <div className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: '#2ECC40' }}></div>
              <span className="text-xs">Puls</span>
              {visibleLines.pulse ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
            
            <div 
              className={`flex items-center p-2 rounded-md ${visibleLines.references ? 'bg-purple-50' : 'bg-gray-100'}`}
              onClick={() => toggleLine('references')}
            >
              <div className="flex-1 h-1 mr-2 bg-purple-300" style={{ backgroundImage: 'linear-gradient(to right, transparent 50%, white 50%)', backgroundSize: '6px 100%' }}></div>
              <span className="text-xs">Referenz</span>
              {visibleLines.references ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render warning for many data points on mobile
  const renderMobileDataWarning = () => {
    if (!isMobile || filteredData.length <= mobileOptimizedData.length) return null;
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-xs text-yellow-800 mb-2">
        <strong>Hinweis:</strong> Es werden {mobileOptimizedData.length} von {filteredData.length} Datenpunkten angezeigt. Verwende die Filter für eine detailliertere Ansicht.
      </div>
    );
  };
  
  // Function to share the chart as an image
  const handleShareChart = () => {
    // This is a placeholder - implementing chart sharing would involve canvas rendering
    alert('Diese Funktion wird in einer zukünftigen Version verfügbar sein.');
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
          
          {/* Time range filter dropdown */}
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
                  
                  {/* Option for custom time range */}
                  <button
                    onClick={() => {
                      setDateFilter('custom');
                      // Don't close - let user see the date fields
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      dateFilter === 'custom' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Benutzerdefinierter Zeitraum
                  </button>
                  
                  {/* Custom date fields */}
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
          
          {/* Share button - Mobile only */}
          {isMobile && (
            <button
              onClick={handleShareChart}
              className="p-1.5 bg-gray-100 rounded-md"
              aria-label="Diagramm teilen"
            >
              <Share2 size={16} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>
      
      {/* Time range display - always visible */}
      <div className="text-sm text-gray-700 mb-3 flex items-center border-b border-gray-300 pb-2">
        <Calendar size={16} className="mr-2 text-blue-600" />
        <span className="font-medium truncate">Zeitraum: {getDateRange()}</span>
      </div>
      
      {/* Mobile optimizations */}
      {isMobile && (
        <>
          {renderMobileLegend()}
          {renderMobileDataWarning()}
        </>
      )}
      
      <div className="h-60 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={displayData} 
            margin={{ 
              top: 10, 
              right: isMobile ? 5 : 30, 
              left: isMobile ? 0 : 10, 
              bottom: 5 
            }}
            connectNulls={false} // Important: don't connect 0 values
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
              tickCount={isMobile ? 5 : 7}
              width={isMobile ? 22 : 30}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Legend only on desktop, replaced by custom component on mobile */}
            {!isMobile && (
              <Legend
                iconType="circle"
                layout="horizontal"
                verticalAlign="top"
                align="center"
                wrapperStyle={{ paddingBottom: '10px' }}
              />
            )}
                
            {/* Reference lines for blood pressure ranges */}
            {visibleLines.references && (
              <>
                <ReferenceLine 
                  y={120} 
                  stroke="#2ECC40" 
                  strokeDasharray="3 3" 
                  strokeWidth={isMobile ? 0.5 : 1}
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
                  strokeWidth={isMobile ? 0.5 : 1} 
                  label={isMobile ? null : {
                    value: "Hyp. Grad 1", 
                    position: "right", 
                    fill: "#FF851B",
                    fontSize: 12,
                    offset: 5
                  }} 
                />
                {!isMobile && (
                  <ReferenceLine 
                    y={160} 
                    stroke="#FF4136" 
                    strokeDasharray="3 3" 
                    label={{
                      value: "Hyp. Grad 2", 
                      position: "right", 
                      fill: "#FF4136",
                      fontSize: 12,
                      offset: 5
                    }} 
                  />
                )}
              </>
            )}
                
            {/* Main lines with custom dots to ignore 0 values */}
            {visibleLines.systolic && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Sys`} 
                stroke="#FF4136" 
                name="Systolisch" 
                strokeWidth={isMobile ? 2 : 2.5}
                dot={<CustomizedDot />}
                activeDot={<CustomizedActiveDot />}
                connectNulls={false} // Don't connect 0 values
              />
            )}
            
            {visibleLines.diastolic && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Dia`} 
                stroke="#0074D9" 
                name="Diastolisch" 
                strokeWidth={isMobile ? 2 : 2.5}
                dot={<CustomizedDot />}
                activeDot={<CustomizedActiveDot />}
                connectNulls={false} // Don't connect 0 values
              />
            )}
            
            {visibleLines.pulse && (
              <Line 
                type="monotone" 
                dataKey={`${prefix}Puls`} 
                stroke="#2ECC40" 
                name="Puls" 
                strokeWidth={isMobile ? 1.5 : 2}
                dot={<CustomizedDot />}
                activeDot={<CustomizedActiveDot />}
                connectNulls={false} // Don't connect 0 values
              />
            )}
                
            {/* Average lines */}
            {visibleLines.references && (
              <>
                <ReferenceLine 
                  y={avgValues.sys} 
                  stroke="#B10DC9" 
                  strokeWidth={1}
                  strokeDasharray={isMobile ? "2 2" : "3 3"}
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
                  strokeWidth={1}
                  strokeDasharray={isMobile ? "2 2" : "3 3"}
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