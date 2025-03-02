// components/Dashboard/AdvancedStatistics/DayNightAnalysis.js
import React, { useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine } from 'recharts';
import { useDateParser } from './hooks/useDateParser';

const DayNightAnalysis = ({ data }) => {
  const { parseDate } = useDateParser();
  
  // Berechne Standardabweichung für ein Array von Zahlen
  const calculateStandardDeviation = (values) => {
    if (!values || values.length < 2) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.round(Math.sqrt(variance) * 10) / 10;
  };
  
  // Tag/Nacht-Rhythmus Analyse
  const dayNightAnalysis = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    // Zähle, für wie viele Tage wir sowohl Morgen- als auch Abendwerte haben
    const daysWithBothValues = data.filter(
      entry => entry.morgenSys > 0 && entry.morgenDia > 0 && entry.abendSys > 0 && entry.abendDia > 0
    );
    
    // Wenn wir weniger als 3 Tage mit vollständigen Daten haben, nicht genug für eine sinnvolle Analyse
    if (daysWithBothValues.length < 3) {
      return { 
        hasEnoughData: false,
        message: "Zu wenige Tage haben sowohl Morgen- als auch Abendmessungen für eine sinnvolle Analyse."
      };
    }
    
    // Berechne Durchschnittswerte für Morgen und Abend
    const avgMorning = {
      sys: Math.round(daysWithBothValues.reduce((sum, entry) => sum + entry.morgenSys, 0) / daysWithBothValues.length),
      dia: Math.round(daysWithBothValues.reduce((sum, entry) => sum + entry.morgenDia, 0) / daysWithBothValues.length)
    };
    
    const avgEvening = {
      sys: Math.round(daysWithBothValues.reduce((sum, entry) => sum + entry.abendSys, 0) / daysWithBothValues.length),
      dia: Math.round(daysWithBothValues.reduce((sum, entry) => sum + entry.abendDia, 0) / daysWithBothValues.length)
    };
    
    // Tageszeit-Differenz
    const timeDiff = {
      sys: avgEvening.sys - avgMorning.sys,
      dia: avgEvening.dia - avgMorning.dia
    };
    
    // Variabilität (Standardabweichung) für Morgen und Abend
    const stdDevMorning = {
      sys: calculateStandardDeviation(daysWithBothValues.map(entry => entry.morgenSys)),
      dia: calculateStandardDeviation(daysWithBothValues.map(entry => entry.morgenDia))
    };
    
    const stdDevEvening = {
      sys: calculateStandardDeviation(daysWithBothValues.map(entry => entry.abendSys)),
      dia: calculateStandardDeviation(daysWithBothValues.map(entry => entry.abendDia))
    };
    
    // Daten für das Diagramm aufbereiten
    const chartData = [
      { name: 'Morgen', systolisch: avgMorning.sys, diastolisch: avgMorning.dia },
      { name: 'Abend', systolisch: avgEvening.sys, diastolisch: avgEvening.dia }
    ];
    
    // Sortiere die Tage chronologisch
    const sortedDays = [...daysWithBothValues].sort((a, b) => {
      const dateA = parseDate(a.datum);
      const dateB = parseDate(b.datum);
      
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    });
    
    // Daten für den täglichen Verlauf (für alle Tage mit beiden Werten)
    const dailyPatternData = sortedDays.map(entry => ({
      datum: entry.datum,
      morgensys: entry.morgenSys,
      morgendi: entry.morgenDia,
      abendsys: entry.abendSys,
      abenddia: entry.abendDia,
      sysdiff: entry.abendSys - entry.morgenSys,
      diadiff: entry.abendDia - entry.morgenDia
    }));
    
    // Interpretiere die Ergebnisse
    let interpretation = "";
    
    if (Math.abs(timeDiff.sys) <= 5 && Math.abs(timeDiff.dia) <= 5) {
      interpretation = "Ihr Blutdruck ist über den Tag hinweg relativ stabil.";
    } else if (timeDiff.sys > 5 || timeDiff.dia > 5) {
      interpretation = `Ihr Blutdruck ist abends durchschnittlich höher als morgens (${timeDiff.sys > 0 ? '+' : ''}${timeDiff.sys}/${timeDiff.dia > 0 ? '+' : ''}${timeDiff.dia} mmHg). Dies könnte mit Aktivität, Stress oder Mahlzeiten zusammenhängen.`;
    } else {
      interpretation = `Ihr Blutdruck ist morgens durchschnittlich höher als abends (${timeDiff.sys}/${timeDiff.dia} mmHg). Dies ist für manche Menschen normal, könnte aber wichtig für Ihre Medikamentenplanung sein.`;
    }
    
    // Auffälligkeiten prüfen
    if (Math.abs(timeDiff.sys) > 15 || Math.abs(timeDiff.dia) > 10) {
      interpretation += " Die Differenz zwischen morgens und abends ist signifikant, was für Ihren Arzt interessant sein könnte.";
    }
    
    return {
      hasEnoughData: true,
      message: null,
      avgMorning,
      avgEvening,
      timeDiff,
      stdDevMorning,
      stdDevEvening,
      chartData,
      dailyPatternData,
      interpretation
    };
  }, [data, parseDate]);
  
  // Wenn keine Analyse möglich ist
  if (!dayNightAnalysis) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
        <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">Für diese Analyse werden mehr Daten benötigt.</p>
      </div>
    );
  }
  
  // Wenn nicht genug Daten vorhanden sind
  if (!dayNightAnalysis.hasEnoughData) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
        <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">{dayNightAnalysis.message}</p>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-md font-medium mb-3 flex items-center">
        <Clock size={18} className="mr-2 text-blue-600" /> 
        Tag/Nacht-Rhythmus Ihres Blutdrucks
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Durchschnittswerte:</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayNightAnalysis.chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[60, 180]} />
                <Tooltip 
                  formatter={(value) => [`${value} mmHg`, '']}
                  labelFormatter={(label) => `${label}-Messung`}
                />
                <Bar dataKey="systolisch" name="Systolisch" fill="#ff4136" />
                <Bar dataKey="diastolisch" name="Diastolisch" fill="#0074d9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Morgen-Abend-Differenzen (Systolisch):</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dayNightAnalysis.dailyPatternData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="datum" />
                <YAxis domain={[-40, 40]} />
                <Tooltip 
                  formatter={(value) => [`${value > 0 ? '+' : ''}${value} mmHg`, '']}
                  labelFormatter={(label) => `${label}`}
                />
                <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="sysdiff" 
                  name="Abend-Morgen Differenz" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
        <div>
          <h4 className="font-medium text-sm mb-2">Morgen-Abend-Vergleich</h4>
          <p className="text-sm"><strong>Morgens:</strong> {dayNightAnalysis.avgMorning.sys}/{dayNightAnalysis.avgMorning.dia} mmHg</p>
          <p className="text-sm"><strong>Abends:</strong> {dayNightAnalysis.avgEvening.sys}/{dayNightAnalysis.avgEvening.dia} mmHg</p>
          <p className="text-sm mt-2">
            <strong>Differenz:</strong> 
            <span className={dayNightAnalysis.timeDiff.sys > 0 ? 'text-red-600' : 'text-blue-600'}>
              {' '}{dayNightAnalysis.timeDiff.sys > 0 ? '+' : ''}{dayNightAnalysis.timeDiff.sys}/
              {dayNightAnalysis.timeDiff.dia > 0 ? '+' : ''}{dayNightAnalysis.timeDiff.dia} mmHg
            </span>
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Tagesrhythmus-Analyse</h4>
          <p className="text-sm">{dayNightAnalysis.interpretation}</p>
        </div>
      </div>
    </div>
  );
};

export default DayNightAnalysis;