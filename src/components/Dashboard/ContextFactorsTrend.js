// components/Dashboard/ContextFactorsTrend.js
import React, { useState } from 'react';
import { Heart, Coffee, Utensils, Moon, Activity, Wine, ArrowUp, ArrowDown, Minus, Calendar, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const ContextFactorsTrend = ({ contextData, darkMode = false }) => {
  // State für Details anzeigen/ausblenden
  const [showDetails, setShowDetails] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // Bestimme den aktuellsten Tag mit Daten
  const latestDay = Object.keys(contextData).sort().reverse()[0];
  const latestContextData = latestDay ? contextData[latestDay] : null;
  
  if (!latestContextData) return null;

  // Daten für den Zeitraum-Filter
  const dates = Object.keys(contextData).sort();
  const firstDay = dates.length > 0 ? dates[0] : null;
  const lastDay = dates.length > 0 ? dates[dates.length - 1] : null;
  
  // Formatiere Datum für Anzeige
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  // Icon-Map für die Faktoren
  const factorIcons = {
    'stress': <Heart size={20} />,
    'sleep': <Moon size={20} />,
    'activity': <Activity size={20} />,
    'salt': <Utensils size={20} />,
    'caffeine': <Coffee size={20} />,
    'alcohol': <Wine size={20} />
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

  // Werte-Labels für jede Stufe
  const valueLabels = {
    'stress': ['Niedrig', 'Mittel', 'Hoch'],
    'sleep': ['Schlecht', 'Mittel', 'Gut'],
    'activity': ['Niedrig', 'Mittel', 'Hoch'],
    'salt': ['Niedrig', 'Mittel', 'Hoch'],
    'caffeine': ['Niedrig', 'Mittel', 'Hoch'],
    'alcohol': ['Keiner', 'Wenig', 'Viel']
  };

  // Werte und Trends für die Faktoren
  const factorValues = {};
  const factorTrends = {};

  // Trends berechnen
  for (const factor of Object.keys(factorLabels)) {
    if (latestContextData[factor] !== undefined) {
      // Wert des aktuellsten Tages
      factorValues[factor] = latestContextData[factor];
      
      // Trend berechnen (vereinfacht - nur letzter Tag vs. vorletzter Tag)
      const sortedDates = Object.keys(contextData).sort();
      if (sortedDates.length >= 2) {
        const previousDay = sortedDates[sortedDates.length - 2];
        const previousValue = contextData[previousDay][factor];
        
        if (previousValue !== undefined) {
          if (factorValues[factor] > previousValue) {
            factorTrends[factor] = 'up';
          } else if (factorValues[factor] < previousValue) {
            factorTrends[factor] = 'down';
          } else {
            factorTrends[factor] = 'stable';
          }
        } else {
          factorTrends[factor] = null;
        }
      } else {
        factorTrends[factor] = null;
      }
    }
  }

  // Trendsymbole rendern
  const renderTrendIcon = (factor, value, trend) => {
    if (trend === null) return <Minus size={16} className="text-gray-400 dark:text-gray-500" />;
    
    // Für diese Faktoren ist "runter" besser
    const lowerIsBetter = ['stress', 'salt', 'caffeine', 'alcohol'];
    
    // Besondere Behandlung für Schlaf: "höher" ist besser, aber Wert "schlecht" ist 0
    if (factor === 'sleep') {
      if (trend === 'up') {
        return <ArrowUp size={16} className="text-green-500" />;
      } else if (trend === 'down') {
        return <ArrowDown size={16} className="text-red-500" />;
      }
      return <Minus size={16} className="text-gray-500" />;
    }
    
    // Für die anderen Faktoren
    if (lowerIsBetter.includes(factor)) {
      if (trend === 'up') {
        return <ArrowUp size={16} className="text-red-500" />;
      } else if (trend === 'down') {
        return <ArrowDown size={16} className="text-green-500" />;
      }
    } else { // Für Aktivität ist "höher" besser
      if (trend === 'up') {
        return <ArrowUp size={16} className="text-green-500" />;
      } else if (trend === 'down') {
        return <ArrowDown size={16} className="text-red-500" />;
      }
    }
    
    return <Minus size={16} className="text-gray-500" />;
  };

  // Faktoren filtern, für die Daten vorhanden sind
  const availableFactors = Object.keys(factorValues);
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-4 transition-colors duration-200">
      {/* Header mit Toggle für Details */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h2 className="text-base font-semibold mr-2 dark:text-gray-200">Kontextfaktoren-Trend</h2>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded-full"
          >
            {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
        
        {/* Filter-Button */}
        <button className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
          <Filter size={14} className="mr-1" />
          <span className="text-xs mr-1">Zeitraum:</span>
          <span className="font-medium text-xs">
            {formatDateForDisplay(firstDay)} - {formatDateForDisplay(lastDay)}
          </span>
        </button>
      </div>
      
      {/* Kompakte Version (standardmäßig angezeigt) */}
      <div className="flex flex-wrap gap-2">
        {availableFactors.map(factor => (
          <div 
            key={factor} 
            className="flex-1 min-w-[100px] bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg p-2 flex items-center transition-colors duration-200"
          >
            <div className="text-indigo-500 mr-2">
              {factorIcons[factor]}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">{factorLabels[factor]}</div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm dark:text-gray-200">
                  {valueLabels[factor] ? valueLabels[factor][factorValues[factor]] : ''}
                </span>
                {renderTrendIcon(factor, factorValues[factor], factorTrends[factor])}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Erweiterte Details (ausklappbar) */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableFactors.map(factor => (
              <div key={factor} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors duration-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-2">{factorIcons[factor]}</span>
                    <span className="font-medium text-sm dark:text-gray-200">{factorLabels[factor]}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  {/* Wert Verlauf als Mini-Balken */}
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mr-2 relative">
                    <div 
                      className="absolute top-0 left-0 h-2 rounded-full" 
                      style={{ 
                        width: `${(factorValues[factor] / 2) * 100}%`,
                        backgroundColor: factor === 'sleep' 
                          ? (factorValues[factor] === 2 ? '#10B981' : factorValues[factor] === 1 ? '#FBBF24' : '#EF4444')
                          : (factorValues[factor] === 0 ? '#10B981' : factorValues[factor] === 1 ? '#FBBF24' : '#EF4444')
                      }}
                    />
                  </div>
                  
                  <div>
                    <span className="font-medium dark:text-gray-200">
                      {valueLabels[factor] ? valueLabels[factor][factorValues[factor]] : ''}
                    </span>
                  </div>
                </div>
                
                {/* Verlauf über Zeit hier anzeigen könnte */}
                <div className="text-xs mt-1 text-gray-500 dark:text-gray-400 flex items-center">
                  <span>Trend: </span>
                  <span className="ml-1 flex items-center">
                    {renderTrendIcon(factor, factorValues[factor], factorTrends[factor])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextFactorsTrend;