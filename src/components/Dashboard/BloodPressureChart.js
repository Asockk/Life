// components/Dashboard/BloodPressureChart.js
import React, { useCallback, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ReferenceLine } from 'recharts';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';
import { Filter, Calendar } from 'lucide-react';

const BloodPressureChart = ({ data, viewType, avgValues }) => {
  // Zeitraumfilter für das Diagramm
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'week', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Prefix für aktuelle Ansicht (morgen oder abend)
  const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
  
  // Filtere Daten basierend auf dem ausgewählten Zeitraum
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Konvertiert Datum wie "Januar 15" in ein Date-Objekt
    const parseDate = (dateStr) => {
      const months = {
        'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
        'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
        'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
      };
      
      if (dateStr && dateStr.includes(' ')) {
        const [month, day] = dateStr.split(' ');
        if (months[month] !== undefined) {
          // Verwende 2025 als Standardjahr
          return new Date(2025, months[month], parseInt(day));
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
    
    // Sortiere nach Datum
    const sortedData = [...filteredData].sort((a, b) => {
      const parseDate = (dateStr) => {
        const months = {
          'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
          'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
          'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
        };
        
        if (dateStr && dateStr.includes(' ')) {
          const [month, day] = dateStr.split(' ');
          if (months[month] !== undefined) {
            return new Date(2025, months[month], parseInt(day));
          }
        }
        return new Date(0);
      };
      
      return parseDate(a.datum) - parseDate(b.datum);
    });
    
    // Formatiere für Anzeige
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      if (dateStr.includes(' ')) {
        const [month, day] = dateStr.split(' ');
        return `${day.padStart(2, '0')}.${months[month]}.2025`;
      }
      
      return dateStr;
    };
    
    const firstDate = formatDate(sortedData[0].datum);
    const lastDate = formatDate(sortedData[sortedData.length - 1].datum);
    
    return `${firstDate} - ${lastDate}`;
  };
  
  // Custom Dot für die Linien, um 0-Werte nicht anzuzeigen
  const CustomizedDot = (props) => {
    const { cx, cy, value } = props;
    
    // Wenn der Wert 0 ist oder nicht existiert, keinen Punkt zeichnen
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Sonst den Standardpunkt zurückgeben
    return (
      <circle cx={cx} cy={cy} r={5} fill={props.stroke} stroke={props.stroke} strokeWidth={2} />
    );
  };
  
  // Custom Dot für aktivierte Datenpunkte
  const CustomizedActiveDot = (props) => {
    const { cx, cy, value } = props;
    
    // Wenn der Wert 0 ist, keinen Punkt zeichnen
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Sonst den aktiven Punkt zurückgeben
    return (
      <circle cx={cx} cy={cy} r={7} fill={props.stroke} stroke={props.stroke} strokeWidth={2} />
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
        <div className="custom-tooltip bg-white p-3 border border-gray-200 shadow-lg rounded-md">
          <p className="font-medium">{label}, {data.datum}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
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
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          {viewType === 'morgen' ? 'Morgen-Blutdruckwerte' : 'Abend-Blutdruckwerte'}
        </h2>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {filteredData.length} Messungen
          </div>
          
          {/* Zeitraum-Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md"
            >
              <Filter size={16} className="mr-1.5" />
              {filterOptions.find(option => option.id === dateFilter)?.label || 'Zeitraum'}
            </button>
            
            {showFilterOptions && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-2">
                  {filterOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setDateFilter(option.id);
                        setShowFilterOptions(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        dateFilter === option.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
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
                      dateFilter === 'custom' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    Benutzerdefinierter Zeitraum
                  </button>
                  
                  {/* Benutzerdefinierte Datumsfelder */}
                  {dateFilter === 'custom' && (
                    <div className="p-2 border-t mt-2">
                      <div className="flex flex-col space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Von:</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Bis:</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <button
                          onClick={() => setShowFilterOptions(false)}
                          className="w-full bg-blue-500 text-white py-1.5 rounded-md text-sm"
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
      <div className="text-sm text-gray-600 mb-3 flex items-center border-b pb-2">
        <Calendar size={16} className="mr-2" />
        Zeitraum: {getDateRange()}
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={filteredData} 
            margin={{ top: 20, right: 120, left: 10, bottom: 10 }}
            connectNulls={false} // Wichtig: 0-Werte nicht verbinden
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
            <XAxis 
              dataKey="tag" 
              tick={{ fill: '#333', fontSize: 12 }}
              tickLine={{ stroke: '#555' }}
            />
            <YAxis 
              domain={[40, 180]} 
              tick={{ fill: '#333', fontSize: 12 }}
              tickLine={{ stroke: '#555' }}
              tickCount={7}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              layout="horizontal"
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingBottom: '10px' }}
            />
                
            {/* Referenzlinien für Blutdruckbereiche */}
            <ReferenceLine 
              y={120} 
              stroke="#2ECC40" 
              strokeDasharray="3 3" 
              label={{
                value: "Normal", 
                position: "right", 
                fill: "#2ECC40",
                offset: 5
              }} 
            />
            <ReferenceLine 
              y={140} 
              stroke="#FF851B" 
              strokeDasharray="3 3" 
              label={{
                value: "Hyp. Grad 1", 
                position: "right", 
                fill: "#FF851B",
                offset: 5
              }} 
            />
            <ReferenceLine 
              y={160} 
              stroke="#FF4136" 
              strokeDasharray="3 3" 
              label={{
                value: "Hyp. Grad 2", 
                position: "right", 
                fill: "#FF4136",
                offset: 5
              }} 
            />
                
            {/* Hauptlinien mit angepassten Dots, um 0-Werte zu ignorieren */}
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
                
            {/* Durchschnittslinien */}
            <ReferenceLine 
              y={avgValues.sys} 
              stroke="#B10DC9" 
              strokeWidth={1.5}
              label={{
                value: "Ø Sys", 
                position: "left", 
                fill: "#B10DC9",
                offset: 5
              }} 
            />
            <ReferenceLine 
              y={avgValues.dia} 
              stroke="#7FDBFF" 
              strokeWidth={1.5}
              label={{
                value: "Ø Dia", 
                position: "left", 
                fill: "#7FDBFF",
                offset: 5
              }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BloodPressureChart;