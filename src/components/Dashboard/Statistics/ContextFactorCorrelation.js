// components/Dashboard/Statistics/ContextFactorCorrelation.js
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const ContextFactorCorrelation = ({ data, contextFactors, extractYearFromDate, convertDisplayDateToISO }) => {
  // ================================================================
  // Kontextfaktor-Korrelation
  // ================================================================
  const contextCorrelationAnalysis = useMemo(() => {
    if (!data || !contextFactors || Object.keys(contextFactors).length === 0) {
      return { 
        hasEnoughData: false,
        message: "Es liegen keine Kontextfaktoren vor oder sie sind nicht mit den Blutdruckdaten verknüpft."
      };
    }
    
    // Ordne Kontextfaktoren den Blutdruckdaten zu
    const enrichedData = [];
    
    data.forEach(entry => {
      // Konvertiere Datum für Lookup in contextFactors
      const isoDate = convertDisplayDateToISO(entry.datum);
      
      if (!isoDate || !contextFactors[isoDate]) return;
      
      // Füge die Messung mit Kontextfaktoren hinzu
      const context = contextFactors[isoDate];
      
      enrichedData.push({
        ...entry,
        context
      });
    });
    
    if (enrichedData.length < 5) {
      return { 
        hasEnoughData: false,
        message: "Es werden mindestens 5 Messungen mit Kontextfaktoren benötigt, um Korrelationen zu erkennen."
      };
    }
    
    // Jetzt analysieren wir die Korrelationen zwischen Kontextfaktoren und Blutdruck
    const factors = ['stress', 'sleep', 'activity', 'salt', 'caffeine', 'alcohol'];
    const factorNames = {
      'stress': 'Stress', 
      'sleep': 'Schlafqualität', 
      'activity': 'Aktivität',
      'salt': 'Salzkonsum', 
      'caffeine': 'Koffein', 
      'alcohol': 'Alkohol'
    };
    
    // Gruppiere Messungen nach Faktorwerten (0, 1, 2)
    const factorAnalysis = {};
    
    factors.forEach(factor => {
      const factorData = { 0: [], 1: [], 2: [] };
      
      enrichedData.forEach(entry => {
        const value = entry.context[factor];
        if (value === undefined || value === null) return;
        
        // Sammle systolische Werte (Morgen und/oder Abend)
        if (entry.morgenSys > 0) factorData[value].push(entry.morgenSys);
        if (entry.abendSys > 0) factorData[value].push(entry.abendSys);
      });
      
      // Berechne Durchschnitt für jeden Wert
      const valueAverages = {};
      let hasEnoughDataPoints = true;
      
      for (let i = 0; i <= 2; i++) {
        if (factorData[i].length < 3) {
          hasEnoughDataPoints = false;
          valueAverages[i] = factorData[i].length > 0 
            ? Math.round(factorData[i].reduce((sum, val) => sum + val, 0) / factorData[i].length)
            : null;
        } else {
          valueAverages[i] = Math.round(factorData[i].reduce((sum, val) => sum + val, 0) / factorData[i].length);
        }
      }
      
      // Berechne Korrelationsrichtung (wenn genügend Daten vorhanden sind)
      let correlation = null;
      let impact = 'unbekannt';
      
      if (hasEnoughDataPoints && valueAverages[0] !== null && valueAverages[2] !== null) {
        const diff = valueAverages[2] - valueAverages[0];
        
        if (Math.abs(diff) <= 3) {
          correlation = 'neutral';
          impact = 'gering';
        } else if (diff > 0) {
          correlation = 'positiv';
          impact = Math.abs(diff) > 8 ? 'stark' : 'mittel';
        } else {
          correlation = 'negativ';
          impact = Math.abs(diff) > 8 ? 'stark' : 'mittel';
        }
      }
      
      // Chart-Daten für diesen Faktor
      const chartData = [];
      const factorLabels = {
        'stress': ['Niedrig', 'Mittel', 'Hoch'],
        'sleep': ['Schlecht', 'Mittel', 'Gut'],
        'activity': ['Niedrig', 'Mittel', 'Hoch'],
        'salt': ['Niedrig', 'Mittel', 'Hoch'],
        'caffeine': ['Niedrig', 'Mittel', 'Hoch'],
        'alcohol': ['Keiner', 'Wenig', 'Viel']
      };
      
      for (let i = 0; i <= 2; i++) {
        if (valueAverages[i] !== null) {
          chartData.push({
            name: factorLabels[factor][i],
            value: i,
            systolisch: valueAverages[i],
            anzahl: factorData[i].length
          });
        }
      }
      
      factorAnalysis[factor] = {
        name: factorNames[factor],
        hasEnoughDataPoints,
        valueAverages,
        correlation,
        impact,
        chartData
      };
    });
    
    // Gesamtinterpretation
    let interpretation = "Basierend auf Ihren Daten wurden folgende Einflüsse auf Ihren Blutdruck erkannt:\n";
    
    const significantFactors = Object.entries(factorAnalysis)
      .filter(([_, info]) => info.correlation && info.impact !== 'gering')
      .map(([factor, info]) => {
        const directionText = info.correlation === 'positiv' ? 'erhöht' : 'senkt';
        const intensityText = info.impact === 'stark' ? 'deutlich' : 'moderat';
        
        if (factor === 'sleep' && info.correlation === 'negativ') {
          return `Bessere ${info.name} ${directionText} Ihren Blutdruck ${intensityText}`;
        } else if (factor === 'sleep' && info.correlation === 'positiv') {
          return `Schlechtere ${info.name} ${directionText} Ihren Blutdruck ${intensityText}`;
        } else if (info.correlation === 'positiv') {
          return `Höherer ${info.name} ${directionText} Ihren Blutdruck ${intensityText}`;
        } else {
          return `Niedrigerer ${info.name} ${directionText} Ihren Blutdruck ${intensityText}`;
        }
      });
    
    if (significantFactors.length === 0) {
      interpretation = "Es wurden keine eindeutigen Zusammenhänge zwischen Kontextfaktoren und Ihrem Blutdruck gefunden. Dies kann sich ändern, wenn Sie mehr Daten erfassen.";
    } else {
      interpretation += significantFactors.join('. ') + '.';
    }
    
    return {
      hasEnoughData: true,
      enrichedData,
      factorAnalysis,
      interpretation
    };
  }, [data, contextFactors, convertDisplayDateToISO]);

  return (
    <div>
      <h3 className="text-md font-medium mb-3">
        Zusammenhang zwischen Kontextfaktoren und Blutdruck
      </h3>
      
      {!contextCorrelationAnalysis?.hasEnoughData ? (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
          <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{contextCorrelationAnalysis?.message || "Für diese Analyse werden mehr Daten benötigt."}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {Object.entries(contextCorrelationAnalysis.factorAnalysis).map(([factor, info]) => (
              <div key={factor} className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-sm mb-2">{info.name}</h4>
                
                {!info.hasEnoughDataPoints ? (
                  <p className="text-xs text-gray-600">
                    Nicht genügend Daten für eine zuverlässige Analyse.
                  </p>
                ) : (
                  <>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={info.chartData}
                          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'systolisch' ? `${value} mmHg` : value,
                              name === 'systolisch' ? 'Systolischer Blutdruck' : name
                            ]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="systolisch" 
                            name="Systolisch" 
                            stroke="#ff4136" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {info.correlation && (
                      <div className="mt-2 text-xs">
                        <span className="font-medium">Einfluss: </span>
                        <span className={`${
                          info.impact === 'stark' ? 'font-bold' : ''
                        } ${
                          info.correlation === 'positiv' ? 'text-red-600' : 
                          info.correlation === 'negativ' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {info.impact === 'stark' ? 'Starker' : 
                           info.impact === 'mittel' ? 'Mittlerer' : 'Geringer'} 
                          {info.correlation === 'positiv' ? ' erhöhender' : 
                           info.correlation === 'negativ' ? ' senkender' : ''} Effekt
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-sm mb-2">Zusammenfassung der Faktoren</h4>
            <p className="text-sm">{contextCorrelationAnalysis.interpretation}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default ContextFactorCorrelation;