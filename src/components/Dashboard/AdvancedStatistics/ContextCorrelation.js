// components/Dashboard/AdvancedStatistics/ContextCorrelation.js
import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useDateParser } from './hooks/useDateParser';

const ContextCorrelation = ({ data, contextFactors }) => {
  const { convertDisplayDateToISO } = useDateParser();
  
  // Kontextfaktor-Korrelationen
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
      
      // Scatter-Plot Daten für einzelne Messungen
      const scatterData = [];
      
      enrichedData.forEach(entry => {
        const factorValue = entry.context[factor];
        if (factorValue === undefined || factorValue === null) return;
        
        // Sammle Messungen für Scatter-Plot
        if (entry.morgenSys > 0) {
          scatterData.push({
            x: factorValue,
            y: entry.morgenSys,
            z: 3 // Größe des Punkts
          });
        }
        
        if (entry.abendSys > 0) {
          scatterData.push({
            x: factorValue,
            y: entry.abendSys,
            z: 3 // Größe des Punkts
          });
        }
      });
      
      factorAnalysis[factor] = {
        name: factorNames[factor],
        hasEnoughDataPoints,
        valueAverages,
        correlation,
        impact,
        chartData,
        scatterData
      };
    });
    
    // Gesamtinterpretation
    let interpretation = "Basierend auf Ihren Daten wurden folgende Einflüsse auf Ihren Blutdruck erkannt:";
    
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
      interpretation += " " + significantFactors.join('. ') + '.';
    }
    
    return {
      hasEnoughData: true,
      enrichedData,
      factorAnalysis,
      interpretation
    };
  }, [data, contextFactors, convertDisplayDateToISO]);
  
  // Wenn keine Analyse möglich ist
  if (!contextCorrelationAnalysis || !contextCorrelationAnalysis.hasEnoughData) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
        <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          {contextCorrelationAnalysis?.message || "Für diese Analyse werden mehr Daten benötigt."}
        </p>
      </div>
    );
  }
  
  // Farben für die verschiedenen Faktoren
  const factorColors = {
    'stress': '#FF4136',
    'sleep': '#0074D9',
    'activity': '#2ECC40',
    'salt': '#FF851B',
    'caffeine': '#B10DC9',
    'alcohol': '#FFDC00'
  };
  
  // Helfer-Komponente für die Faktor-Karte
  const FactorCard = ({ factorKey, analysis }) => {
    const { name, correlation, impact, hasEnoughDataPoints, chartData } = analysis;
    
    if (!hasEnoughDataPoints) {
      return (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: factorColors[factorKey] }}></span>
            {name}
          </h4>
          <p className="text-xs text-gray-600">
            Nicht genügend Daten für eine zuverlässige Analyse.
          </p>
        </div>
      );
    }
    
    // Korrelationsindikator
    const CorrelationIndicator = () => {
      if (correlation === 'positiv') {
        return <TrendingUp size={16} className="text-red-600 ml-1" />;
      } else if (correlation === 'negativ') {
        return <TrendingDown size={16} className="text-blue-600 ml-1" />;
      }
      return <Minus size={16} className="text-gray-600 ml-1" />;
    };
    
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
        <h4 className="font-medium text-sm mb-2 flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: factorColors[factorKey] }}></span>
          {name}
          <CorrelationIndicator />
        </h4>
        
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10 }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                stroke={factorColors[factorKey]} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {correlation && (
          <div className="mt-2 text-xs">
            <span className="font-medium">Einfluss: </span>
            <span className={`${
              impact === 'stark' ? 'font-bold' : ''
            } ${
              correlation === 'positiv' ? 'text-red-600' : 
              correlation === 'negativ' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {impact === 'stark' ? 'Starker' : 
               impact === 'mittel' ? 'Mittlerer' : 'Geringer'} 
              {correlation === 'positiv' ? ' erhöhender' : 
               correlation === 'negativ' ? ' senkender' : ''} Effekt
            </span>
          </div>
        )}
      </div>
    );
  };
  
  // Einzel-Faktor-Analyse-Komponente
  const FactorDetailView = ({ factorKey, analysis }) => {
    if (!analysis.hasEnoughDataPoints) return null;
    
    const { name, chartData, scatterData } = analysis;
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg col-span-2">
        <h4 className="font-medium mb-2">{name}: Detailansicht</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-2 rounded-lg border border-blue-100">
            <h5 className="text-xs font-medium mb-1">Durchschnittswerte</h5>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`${value} mmHg`, 'Systolisch']} />
                  <Bar 
                    dataKey="systolisch" 
                    fill={factorColors[factorKey]} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg border border-blue-100">
            <h5 className="text-xs font-medium mb-1">Einzelmessungen</h5>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Wert" 
                    domain={[0, 2]} 
                    tickCount={3} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => chartData.find(item => item.value === value)?.name || value}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Blutdruck" 
                    tick={{ fontSize: 10 }}
                  />
                  <ZAxis type="number" dataKey="z" range={[20, 60]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => {
                      if (name === 'x') {
                        const factor = chartData.find(item => item.value === value);
                        return [factor ? factor.name : value, name === 'x' ? 'Faktor' : name];
                      }
                      return [value + (name === 'y' ? ' mmHg' : ''), name === 'y' ? 'Blutdruck' : name];
                    }}
                  />
                  <Scatter 
                    name="Messungen" 
                    data={scatterData} 
                    fill={factorColors[factorKey]} 
                    opacity={0.7}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <h3 className="text-md font-medium mb-3">
        Zusammenhang zwischen Kontextfaktoren und Blutdruck
      </h3>
      
      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <h4 className="font-medium text-sm mb-2">Zusammenfassung der Faktoren</h4>
        <p className="text-sm">{contextCorrelationAnalysis.interpretation}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
        {Object.entries(contextCorrelationAnalysis.factorAnalysis).map(([factor, analysis]) => (
          <FactorCard key={factor} factorKey={factor} analysis={analysis} />
        ))}
      </div>
      
      {/* Ausführliche Ansicht für die wichtigsten Faktoren */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Object.entries(contextCorrelationAnalysis.factorAnalysis)
          .filter(([_, info]) => info.hasEnoughDataPoints && info.impact === 'stark')
          .map(([factor, analysis]) => (
            <FactorDetailView key={factor} factorKey={factor} analysis={analysis} />
          ))}
      </div>
    </div>
  );
};

export default ContextCorrelation;