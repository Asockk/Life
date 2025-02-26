// components/Dashboard/ContextFactorsTrend.js
import React, { useMemo, useState } from 'react';
import { Heart, Moon, Activity, Utensils, Coffee, Wine, ArrowUp, ArrowDown, Minus, Filter, Calendar } from 'lucide-react';

const ContextFactorsTrend = ({ contextData }) => {
  // Zeitraumfilter-State
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'month', 'week', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Verfügbare Zeiträume
  const filterOptions = [
    { id: 'all', label: 'Alle Daten' },
    { id: 'month', label: 'Letzter Monat' },
    { id: 'week', label: 'Letzte Woche' }
  ];
  
  // Gefilterte Kontextdaten basierend auf dem ausgewählten Zeitraum
  const filteredContextData = useMemo(() => {
    if (!contextData || Object.keys(contextData).length === 0) return {};
    
    const now = new Date();
    
    // Filterdaten basierend auf dem gewählten Zeitraum
    switch (dateFilter) {
      case 'month': {
        // Letzter Monat
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
        // Letzte Woche
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
        // Benutzerdefinierter Zeitraum
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
        // Alle Daten
        return contextData;
    }
  }, [contextData, dateFilter, customStartDate, customEndDate]);
  
  // Überprüfen, ob genügend Daten für Trends verfügbar sind
  const hasSufficientData = useMemo(() => {
    return filteredContextData && Object.keys(filteredContextData).length >= 2;
  }, [filteredContextData]);
  
  // Berechne die aktuellsten 5 Tage aus den gefilterten Daten
  const latestDays = useMemo(() => {
    if (!filteredContextData) return [];
    
    return Object.keys(filteredContextData)
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 5); // Nur die letzten 5 Tage betrachten
  }, [filteredContextData]);
  
  // Berechnung der Trends für jeden Faktor
  const trends = useMemo(() => {
    if (!hasSufficientData || latestDays.length < 2) return {};
    
    const factors = ['stress', 'sleep', 'activity', 'salt', 'caffeine', 'alcohol'];
    const result = {};
    
    factors.forEach(factor => {
      // Hole die letzten beiden Tageswerte für den Faktor
      const lastDay = latestDays[0];
      const previousDay = latestDays[1];
      
      const currentValue = filteredContextData[lastDay]?.[factor];
      const previousValue = filteredContextData[previousDay]?.[factor];
      
      // Wenn für beide Tage Werte vorhanden sind, berechne den Trend
      if (currentValue !== undefined && previousValue !== undefined) {
        if (currentValue > previousValue) {
          result[factor] = 'up';
        } else if (currentValue < previousValue) {
          result[factor] = 'down';
        } else {
          result[factor] = 'stable';
        }
      } else {
        result[factor] = null; // Kein Trend berechenbar
      }
    });
    
    return result;
  }, [filteredContextData, hasSufficientData, latestDays]);
  
  // Bestimme den aktuellsten Tag mit Daten
  const latestDay = latestDays[0];
  const latestContextData = latestDay ? filteredContextData[latestDay] : null;
  
  // Icon-Map für die Faktoren
  const factorIcons = {
    'stress': <Heart size={22} />,
    'sleep': <Moon size={22} />,
    'activity': <Activity size={22} />,
    'salt': <Utensils size={22} />,
    'caffeine': <Coffee size={22} />,
    'alcohol': <Wine size={22} />
  };
  
  // Label-Map für die Faktoren
  const factorLabels = {
    'stress': 'Stress',
    'sleep': 'Schlaf',
    'activity': 'Aktivität',
    'salt': 'Salzkonsum',
    'caffeine': 'Koffein',
    'alcohol': 'Alkohol'
  };
  
  // Werte-Labels für jede Stufe (jetzt nur 0, 1, 2)
  const valueLabels = {
    'stress': ['Niedrig', 'Mittel', 'Hoch'],
    'sleep': ['Schlecht', 'Mittel', 'Gut'],
    'activity': ['Niedrig', 'Mittel', 'Hoch'],
    'salt': ['Niedrig', 'Mittel', 'Hoch'],
    'caffeine': ['Niedrig', 'Mittel', 'Hoch'],
    'alcohol': ['Keiner', 'Wenig', 'Viel']
  };
  
  // Bewertung für Trends (nicht für alle Faktoren ist "runter" positiv)
  const getValueClass = (factor, trend) => {
    // Für diese Faktoren ist "runter" besser
    const lowerIsBetter = ['stress', 'salt', 'caffeine', 'alcohol'];
    
    if (trend === 'up') {
      return lowerIsBetter.includes(factor) ? 'text-red-500' : 'text-green-500';
    } else if (trend === 'down') {
      return lowerIsBetter.includes(factor) ? 'text-green-500' : 'text-red-500';
    }
    return 'text-gray-500';
  };
  
  // Wenn überhaupt keine Daten vorhanden sind
  if (!latestContextData) {
    return null;
  }
  
  // Faktoren filtern, für die Daten vorhanden sind
  const availableFactors = Object.keys(latestContextData).filter(
    factor => latestContextData[factor] !== undefined
  );
  
  if (availableFactors.length === 0) {
    return null;
  }
  
  // Formatiere Datum für Anzeige
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  // Berechne ersten und letzten Tag des angezeigten Zeitraums
  const firstDay = latestDays.length > 0 ? latestDays[latestDays.length - 1] : null;
  const lastDay = latestDays.length > 0 ? latestDays[0] : null;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Kontextfaktoren-Trend</h2>
        
        <div className="relative">
          <button 
            onClick={() => setShowFilterOptions(!showFilterOptions)}
            className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md"
          >
            <Filter size={16} className="mr-1.5" />
            {filterOptions.find(option => option.id === dateFilter)?.label || 'Zeitraum'}
          </button>
          
          {/* Dropdown für Zeitraumfilter */}
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
      
      {/* Zeitraumanzeige - immer sichtbar */}
      <div className="text-sm text-gray-600 mb-3 flex items-center border-b pb-2">
        <Calendar size={16} className="mr-2" />
        {firstDay && lastDay ? (
          <>Zeitraum: {formatDateForDisplay(firstDay)} - {formatDateForDisplay(lastDay)}</>
        ) : (
          <>Kein Zeitraum verfügbar</>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {availableFactors.map(factor => (
          <div key={factor} className="bg-gray-50 p-3 rounded-lg flex flex-col items-center">
            <div className="text-indigo-500 mb-1">
              {factorIcons[factor]}
            </div>
            
            <div className="text-sm font-medium">{factorLabels[factor]}</div>
            
            {/* Wert als Text anzeigen (z.B. "Niedrig" statt "0") */}
            <div className="text-base font-bold">
              {valueLabels[factor]?.[latestContextData[factor]] || latestContextData[factor]}
            </div>
            
            {/* Nur Trend-Pfeil anzeigen ohne Text */}
            {trends[factor] ? (
              <div className={`flex items-center mt-1 ${getValueClass(factor, trends[factor])}`}>
                {trends[factor] === 'up' && <ArrowUp size={16} />}
                {trends[factor] === 'down' && <ArrowDown size={16} />}
                {trends[factor] === 'stable' && <Minus size={16} />}
              </div>
            ) : (
              <div className="h-4 mt-1"></div> // Platzhalter für Konsistenz
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextFactorsTrend;