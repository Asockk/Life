// components/Dashboard/ContextFactorsTrend.js
import React, { useState, useMemo } from 'react';
import { Heart, Moon, Activity, Utensils, Coffee, Wine, ArrowUp, ArrowDown, Minus, 
         Filter, Calendar, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
         BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, LineChart } from 'recharts';

// Komponente für die Datumsauswahl
const DateFilter = ({ dateFilter, setDateFilter, showFilterOptions, setShowFilterOptions, 
                    onApplyCustomDates, customStartDate, setCustomStartDate,
                    customEndDate, setCustomEndDate }) => {
  const filterOptions = [
    { id: 'all', label: 'Alle Daten' },
    { id: 'month', label: 'Letzter Monat' },
    { id: 'week', label: 'Letzte Woche' },
    { id: 'custom', label: 'Benutzerdefiniert' }
  ];
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowFilterOptions(!showFilterOptions)}
        className="flex items-center text-sm bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md w-full sm:w-auto justify-between sm:justify-start transition-colors"
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
                  if (option.id !== 'custom') {
                    setShowFilterOptions(false);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  dateFilter === option.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
            
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
                    onClick={() => {
                      onApplyCustomDates();
                      setShowFilterOptions(false);
                    }}
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
  );
};

// Radar-Chart Komponente für Kontextfaktoren
const FactorsRadarChart = ({ latestContextData }) => {
  // Sicherstellen, dass latestContextData existiert
  if (!latestContextData) return null;
  
  // Daten für das Radar-Chart aufbereiten
  const radarData = [
    { 
      subject: 'Stress', 
      value: latestContextData.stress !== undefined ? latestContextData.stress : 0,
      fullMark: 2 
    },
    { 
      subject: 'Schlaf', 
      value: latestContextData.sleep !== undefined ? latestContextData.sleep : 0,
      fullMark: 2 
    },
    { 
      subject: 'Aktivität', 
      value: latestContextData.activity !== undefined ? latestContextData.activity : 0,
      fullMark: 2 
    },
    { 
      subject: 'Salz', 
      value: latestContextData.salt !== undefined ? latestContextData.salt : 0,
      fullMark: 2 
    },
    { 
      subject: 'Koffein', 
      value: latestContextData.caffeine !== undefined ? latestContextData.caffeine : 0,
      fullMark: 2 
    },
    { 
      subject: 'Alkohol', 
      value: latestContextData.alcohol !== undefined ? latestContextData.alcohol : 0,
      fullMark: 2 
    }
  ];
  
  // Nur Faktoren mit Werten einbeziehen
  const filteredData = radarData.filter(item => item.value !== undefined);
  
  if (filteredData.length === 0) return null;
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={filteredData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 2]} tick={{ fill: '#666', fontSize: 10 }} />
          <Radar
            name="Aktuelle Faktoren"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip 
            formatter={(value, name, props) => {
              const valueLabels = {
                'Stress': ['Niedrig', 'Mittel', 'Hoch'],
                'Schlaf': ['Schlecht', 'Mittel', 'Gut'],
                'Aktivität': ['Niedrig', 'Mittel', 'Hoch'],
                'Salz': ['Niedrig', 'Mittel', 'Hoch'],
                'Koffein': ['Niedrig', 'Mittel', 'Hoch'],
                'Alkohol': ['Keiner', 'Wenig', 'Viel']
              };
              
              const subject = props.payload.subject;
              const labels = valueLabels[subject] || [];
              const label = labels[value] || value;
              
              return [label, subject];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Komponente für Trend-Historien
const FactorHistoryChart = ({ factorData, factorName, color }) => {
  // Sortierte Daten für das Diagramm 
  const chartData = useMemo(() => {
    if (!factorData || Object.keys(factorData).length === 0) return [];
    
    return Object.entries(factorData)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10); // Zeige nur die letzten 10 Einträge an
  }, [factorData]);
  
  if (chartData.length < 2) return null;
  
  // Werte-Labels für den Tooltip
  const valueLabels = {
    'Stress': ['Niedrig', 'Mittel', 'Hoch'],
    'Schlaf': ['Schlecht', 'Mittel', 'Gut'],
    'Aktivität': ['Niedrig', 'Mittel', 'Hoch'], 
    'Salzkonsum': ['Niedrig', 'Mittel', 'Hoch'],
    'Koffein': ['Niedrig', 'Mittel', 'Hoch'],
    'Alkohol': ['Keiner', 'Wenig', 'Viel']
  };
  
  // Formatierungsfunktion für das Datum im Tooltip
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };
  
  // Custom Tooltip für das Diagramm
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const labels = valueLabels[factorName] || [];
      const valueLabel = labels[value] || value;
      
      return (
        <div className="bg-white p-2 border border-gray-200 shadow rounded-md">
          <p className="text-xs font-medium">{formatDate(label)}</p>
          <p className="text-xs">
            {factorName}: <span className="font-medium">{valueLabel}</span>
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }} 
            tickFormatter={formatDate}
            interval="preserveEnd"
          />
          <YAxis 
            domain={[0, 2]} 
            ticks={[0, 1, 2]} 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => valueLabels[factorName]?.[value] || value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Bar-Chart für Faktoren-Verteilung
const FactorsDistributionChart = ({ contextData, selectedFactor }) => {
  // Zähle, wie oft jeder Wert (0, 1, 2) für den ausgewählten Faktor vorkommt
  const distributionData = useMemo(() => {
    if (!contextData || Object.keys(contextData).length === 0 || !selectedFactor) {
      return [];
    }
    
    const counts = [0, 0, 0]; // Für Werte 0, 1, 2
    
    Object.values(contextData).forEach(factors => {
      if (factors[selectedFactor] !== undefined) {
        counts[factors[selectedFactor]]++;
      }
    });
    
    // Werte-Labels für den ausgewählten Faktor
    const valueLabels = {
      'stress': ['Niedrig', 'Mittel', 'Hoch'],
      'sleep': ['Schlecht', 'Mittel', 'Gut'],
      'activity': ['Niedrig', 'Mittel', 'Hoch'],
      'salt': ['Niedrig', 'Mittel', 'Hoch'],
      'caffeine': ['Niedrig', 'Mittel', 'Hoch'],
      'alcohol': ['Keiner', 'Wenig', 'Viel']
    };
    
    return counts.map((count, index) => ({
      value: index,
      label: valueLabels[selectedFactor]?.[index] || `Wert ${index}`,
      count
    }));
  }, [contextData, selectedFactor]);
  
  if (distributionData.every(item => item.count === 0)) return null;
  
  // Farben für die verschiedenen Faktoren
  const factorColors = {
    'stress': '#FF4136',
    'sleep': '#0074D9',
    'activity': '#2ECC40',
    'salt': '#FF851B',
    'caffeine': '#B10DC9',
    'alcohol': '#FFDC00'
  };
  
  const barColor = factorColors[selectedFactor] || '#AAAAAA';
  
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={distributionData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip 
            formatter={(value) => [`${value} Messungen`, 'Anzahl']} 
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Einzelne Faktorkarte mit Wert und Trend
const FactorCard = ({ factor, icon, label, value, trend, options, onClick, isSelected }) => {
  // Anzeige für den Trend
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={16} className="text-red-600" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-blue-600" />;
    return null;
  };
  
  return (
    <div 
      className={`bg-white p-3 rounded-lg shadow-sm border cursor-pointer transition-all
                 ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-indigo-600 mr-2 flex-shrink-0">{icon}</span>
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        {getTrendIcon()}
      </div>
      
      {value !== undefined && options && (
        <div className="flex justify-between space-x-1 mt-2">
          {options.map((option, i) => (
            <div
              key={i}
              className={`flex-1 py-1 px-0.5 text-center rounded-md text-xs truncate 
                ${value === i ? 'bg-indigo-500 text-white font-medium' : 'bg-gray-100 text-gray-600'}`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Haupt-Komponente für Kontextfaktoren-Trend
const ContextFactorsTrend = ({ contextData }) => {
  // State für Zeitraumfilter
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // State für den ausgewählten Faktor
  const [selectedFactor, setSelectedFactor] = useState(null);
  
  // Gefilterte Kontextdaten
  const filteredContextData = useMemo(() => {
    if (!contextData || Object.keys(contextData).length === 0) return {};
    
    const now = new Date();
    
    switch (dateFilter) {
      case 'month': {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        return Object.fromEntries(
          Object.entries(contextData).filter(([date]) => {
            const dateObj = new Date(date);
            return dateObj >= oneMonthAgo && dateObj <= now;
          })
        );
      }
      case 'week': {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return Object.fromEntries(
          Object.entries(contextData).filter(([date]) => {
            const dateObj = new Date(date);
            return dateObj >= oneWeekAgo && dateObj <= now;
          })
        );
      }
      case 'custom': {
        if (!customStartDate || !customEndDate) return contextData;
        
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        
        return Object.fromEntries(
          Object.entries(contextData).filter(([date]) => {
            const dateObj = new Date(date);
            return dateObj >= startDate && dateObj <= endDate;
          })
        );
      }
      default:
        return contextData;
    }
  }, [contextData, dateFilter, customStartDate, customEndDate]);
  
  // Neueste Tage, sortiert nach Datum
  const latestDays = useMemo(() => {
    if (!filteredContextData) return [];
    
    return Object.keys(filteredContextData)
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 5);
  }, [filteredContextData]);
  
  // Trends für jeden Faktor berechnen
  const trends = useMemo(() => {
    if (latestDays.length < 2) return {};
    
    const factors = ['stress', 'sleep', 'activity', 'salt', 'caffeine', 'alcohol'];
    const result = {};
    
    factors.forEach(factor => {
      const lastDay = latestDays[0];
      const previousDay = latestDays[1];
      
      const currentValue = filteredContextData[lastDay]?.[factor];
      const previousValue = filteredContextData[previousDay]?.[factor];
      
      if (currentValue !== undefined && previousValue !== undefined) {
        if (currentValue > previousValue) {
          result[factor] = 'up';
        } else if (currentValue < previousValue) {
          result[factor] = 'down';
        } else {
          result[factor] = 'stable';
        }
      } else {
        result[factor] = null;
      }
    });
    
    return result;
  }, [filteredContextData, latestDays]);
  
  // Aktuellsten Kontextdaten
  const latestContextData = latestDays[0] ? filteredContextData[latestDays[0]] : null;
  
  // Faktoren-Definitionen
  const factorDefinitions = [
    { name: 'stress', icon: <Heart size={22} />, label: 'Stress', options: ["Niedrig", "Mittel", "Hoch"], color: '#FF4136' },
    { name: 'sleep', icon: <Moon size={22} />, label: 'Schlafqualität', options: ["Schlecht", "Mittel", "Gut"], color: '#0074D9' },
    { name: 'activity', icon: <Activity size={22} />, label: 'Körperliche Aktivität', options: ["Niedrig", "Mittel", "Hoch"], color: '#2ECC40' },
    { name: 'salt', icon: <Utensils size={22} />, label: 'Salzkonsum', options: ["Niedrig", "Mittel", "Hoch"], color: '#FF851B' },
    { name: 'caffeine', icon: <Coffee size={22} />, label: 'Koffein', options: ["Niedrig", "Mittel", "Hoch"], color: '#B10DC9' },
    { name: 'alcohol', icon: <Wine size={22} />, label: 'Alkohol', options: ["Keiner", "Wenig", "Viel"], color: '#FFDC00' }
  ];
  
  // Zeitraumangaben
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const dateRange = useMemo(() => {
    if (latestDays.length === 0) return "Keine Daten";
    
    const firstDay = latestDays[latestDays.length - 1];
    const lastDay = latestDays[0];
    
    return `${formatDateForDisplay(firstDay)} - ${formatDateForDisplay(lastDay)}`;
  }, [latestDays]);
  
  // Für Visualisierung verfügbare Faktoren ermitteln
  const availableFactors = useMemo(() => {
    if (!latestContextData) return [];
    
    return Object.keys(latestContextData).filter(
      factor => latestContextData[factor] !== undefined
    );
  }, [latestContextData]);
  
  // Wenn keine Daten verfügbar sind
  if (!latestContextData || availableFactors.length === 0) {
    return null;
  }
  
  // Beim ersten Rendern den ersten verfügbaren Faktor auswählen
  if (availableFactors.length > 0 && !selectedFactor) {
    setSelectedFactor(availableFactors[0]);
  }
  
  // Funktion zum Sammeln aller Faktordaten für einen bestimmten Faktor
  const getFactorData = (factorName) => {
    const result = {};
    
    Object.entries(filteredContextData).forEach(([date, factors]) => {
      if (factors[factorName] !== undefined) {
        result[date] = factors[factorName];
      }
    });
    
    return result;
  };
  
  // Ausgewählter Faktor-Definition
  const selectedFactorDef = factorDefinitions.find(f => f.name === selectedFactor);
  
  // Einfache Statistik für den ausgewählten Faktor
  const getFactorStats = (factorName) => {
    if (!factorName) return null;
    
    const values = Object.values(filteredContextData)
      .map(factors => factors[factorName])
      .filter(value => value !== undefined);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    
    // Häufigste Wert ermitteln
    const counts = [0, 0, 0]; // Für Werte 0, 1, 2
    values.forEach(val => counts[val]++);
    const mostCommonIndex = counts.indexOf(Math.max(...counts));
    
    return {
      average: avg,
      mostCommon: mostCommonIndex,
      count: values.length
    };
  };
  
  const selectedFactorStats = getFactorStats(selectedFactor);
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6 border border-gray-300">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Kontextfaktoren-Analyse</h2>
        
        <DateFilter 
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showFilterOptions={showFilterOptions}
          setShowFilterOptions={setShowFilterOptions}
          onApplyCustomDates={() => {}}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
        />
      </div>
      
      {/* Zeitraumanzeige */}
      <div className="text-sm text-gray-700 mb-4 flex items-center border-b border-gray-300 pb-2">
        <Calendar size={16} className="mr-2 text-blue-600" />
        <span className="font-medium">Zeitraum: {dateRange}</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Faktoren-Karten (1. Spalte auf kleinen, 2 Spalten auf großen Bildschirmen) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 h-fit">
          {factorDefinitions.map((factor) => {
            // Nur Faktoren anzeigen, für die Daten verfügbar sind
            if (!availableFactors.includes(factor.name)) return null;
            
            return (
              <FactorCard 
                key={factor.name}
                factor={factor.name}
                icon={factor.icon}
                label={factor.label}
                value={latestContextData[factor.name]}
                trend={trends[factor.name]}
                options={factor.options}
                onClick={() => setSelectedFactor(factor.name)}
                isSelected={selectedFactor === factor.name}
              />
            );
          })}
        </div>
        
        {/* Visualisierungsbereich */}
        <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">
              {selectedFactorDef ? selectedFactorDef.label : 'Faktor'} Analyse
            </h3>
            {selectedFactorStats && (
              <div className="text-sm">
                <span className="text-gray-600">Durchschnitt:</span> 
                <span className="ml-1 font-medium">
                  {selectedFactorDef.options[Math.round(selectedFactorStats.average)]}
                </span>
              </div>
            )}
          </div>
          
          {/* Tab-ähnliche Ansicht für verschiedene Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radar-Chart */}
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Aktuelle Faktoren</h4>
              <FactorsRadarChart latestContextData={latestContextData} />
            </div>
            
            {/* Historien-Chart */}
            {selectedFactor && (
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Faktor-Verlauf</h4>
                <FactorHistoryChart 
                  factorData={getFactorData(selectedFactor)} 
                  factorName={selectedFactorDef?.label || selectedFactor}
                  color={selectedFactorDef?.color || '#0074D9'}
                />
              </div>
            )}
            
            {/* Verteilungs-Chart */}
            {selectedFactor && (
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Verteilung</h4>
                <FactorsDistributionChart 
                  contextData={filteredContextData}
                  selectedFactor={selectedFactor}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextFactorsTrend;