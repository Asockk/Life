// components/Dashboard/ContextFactorsTrend.js
import React, { useMemo } from 'react';
import { Heart, Moon, Activity, Utensils, Coffee, PieChart, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const ContextFactorsTrend = ({ contextData }) => {
  // Wenn keine Kontextdaten vorhanden sind oder weniger als 2 Tage mit Daten
  const hasSufficientData = useMemo(() => {
    return contextData && Object.keys(contextData).length >= 2;
  }, [contextData]);
  
  // Berechne die aktuellsten 5 Tage
  const latestDays = useMemo(() => {
    if (!contextData) return [];
    
    return Object.keys(contextData)
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 5); // Nur die letzten 5 Tage betrachten
  }, [contextData]);
  
  // Berechnung der Trends für jeden Faktor
  const trends = useMemo(() => {
    if (!hasSufficientData || latestDays.length < 2) return {};
    
    const factors = ['stress', 'sleep', 'activity', 'salt', 'caffeine', 'alcohol'];
    const result = {};
    
    factors.forEach(factor => {
      // Hole die letzten beiden Tageswerte für den Faktor
      const lastDay = latestDays[0];
      const previousDay = latestDays[1];
      
      const currentValue = contextData[lastDay]?.[factor];
      const previousValue = contextData[previousDay]?.[factor];
      
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
  }, [contextData, hasSufficientData, latestDays]);
  
  // Bestimme den aktuellsten Tag mit Daten
  const latestDay = latestDays[0];
  const latestContextData = latestDay ? contextData[latestDay] : null;
  
  // Icon-Map für die Faktoren
  const factorIcons = {
    'stress': <Heart size={22} />,
    'sleep': <Moon size={22} />,
    'activity': <Activity size={22} />,
    'salt': <Utensils size={22} />,
    'caffeine': <Coffee size={22} />,
    'alcohol': <PieChart size={22} />
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
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-2">Kontextfaktoren-Trend</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {availableFactors.map(factor => (
          <div key={factor} className="bg-gray-50 p-3 rounded-lg flex flex-col items-center">
            <div className="text-indigo-500 mb-1">
              {factorIcons[factor]}
            </div>
            
            <div className="text-sm font-medium">{factorLabels[factor]}</div>
            
            <div className="text-xl font-bold">
              {latestContextData[factor]}
            </div>
            
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
      
      <p className="text-xs text-gray-500 mt-2">
        Die Trendpfeile zeigen die Veränderung im Vergleich zum vorherigen Tag.
      </p>
    </div>
  );
};

export default ContextFactorsTrend;