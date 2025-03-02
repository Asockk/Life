// components/Dashboard/AdvancedStatistics/WeekdayAnalysis.js
import React, { useMemo } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDateParser } from './hooks/useDateParser';

const WeekdayAnalysis = ({ data }) => {
  const { parseDate } = useDateParser();
  
  // Wochentagsanalyse
  const weekdayAnalysis = useMemo(() => {
    if (!data || data.length < 7) return null;
    
    // Gruppiere Daten nach Wochentag
    const weekdayMapping = { 'Mo': 1, 'Di': 2, 'Mi': 3, 'Do': 4, 'Fr': 5, 'Sa': 6, 'So': 7 };
    const weekdayNames = { 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch', 4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag', 7: 'Sonntag' };
    
    const weekdayGroups = {};
    
    // Initialisiere Gruppen
    for (let i = 1; i <= 7; i++) {
      weekdayGroups[i] = { 
        morgenSys: [], morgenDia: [], 
        abendSys: [], abendDia: [],
        count: 0
      };
    }
    
    // Fülle Gruppen
    data.forEach(entry => {
      const weekdayNum = weekdayMapping[entry.tag];
      if (!weekdayNum) return;
      
      if (entry.morgenSys > 0 && entry.morgenDia > 0) {
        weekdayGroups[weekdayNum].morgenSys.push(entry.morgenSys);
        weekdayGroups[weekdayNum].morgenDia.push(entry.morgenDia);
      }
      
      if (entry.abendSys > 0 && entry.abendDia > 0) {
        weekdayGroups[weekdayNum].abendSys.push(entry.abendSys);
        weekdayGroups[weekdayNum].abendDia.push(entry.abendDia);
      }
      
      if ((entry.morgenSys > 0 && entry.morgenDia > 0) || (entry.abendSys > 0 && entry.abendDia > 0)) {
        weekdayGroups[weekdayNum].count++;
      }
    });
    
    // Berechne Durchschnitt pro Wochentag
    const weekdayData = [];
    let hasEnoughData = true;
    
    for (let i = 1; i <= 7; i++) {
      const group = weekdayGroups[i];
      
      // Prüfe, ob wir genügend Daten für diesen Wochentag haben
      if (group.count < 2) {
        hasEnoughData = false;
      }
      
      const avgMorgenSys = group.morgenSys.length > 0 
        ? Math.round(group.morgenSys.reduce((sum, val) => sum + val, 0) / group.morgenSys.length) 
        : null;
      
      const avgMorgenDia = group.morgenDia.length > 0 
        ? Math.round(group.morgenDia.reduce((sum, val) => sum + val, 0) / group.morgenDia.length) 
        : null;
      
      const avgAbendSys = group.abendSys.length > 0 
        ? Math.round(group.abendSys.reduce((sum, val) => sum + val, 0) / group.abendSys.length) 
        : null;
      
      const avgAbendDia = group.abendDia.length > 0 
        ? Math.round(group.abendDia.reduce((sum, val) => sum + val, 0) / group.abendDia.length) 
        : null;
      
      weekdayData.push({
        name: weekdayNames[i],
        shortName: Object.keys(weekdayMapping).find(key => weekdayMapping[key] === i),
        sort: i,
        morgenSys: avgMorgenSys,
        morgenDia: avgMorgenDia,
        abendSys: avgAbendSys,
        abendDia: avgAbendDia,
        count: group.count
      });
    }
    
    // Interpretiere die Wochentagsdaten
    let interpretation = "";
    
    if (!hasEnoughData) {
      interpretation = "Für einige Wochentage liegen noch nicht genügend Daten vor. Die Analyse wird genauer, wenn Sie mehr Messungen für alle Wochentage haben.";
    } else {
      // Finde den Wochentag mit dem höchsten und niedrigsten Blutdruck
      const workdayData = weekdayData.filter(d => d.sort >= 1 && d.sort <= 5);
      const weekendData = weekdayData.filter(d => d.sort >= 6 && d.sort <= 7);
      
      // Vergleiche Wochentage mit Wochenende
      const workdayAvgSys = workdayData.reduce((sum, d) => sum + (d.morgenSys || 0), 0) / workdayData.length;
      const weekendAvgSys = weekendData.reduce((sum, d) => sum + (d.morgenSys || 0), 0) / weekendData.length;
      
      if (Math.abs(workdayAvgSys - weekendAvgSys) > 5) {
        if (workdayAvgSys > weekendAvgSys) {
          interpretation = "Ihr Blutdruck ist an Wochentagen tendenziell höher als am Wochenende. Dies könnte mit Arbeits- oder Alltagsstress zusammenhängen.";
        } else {
          interpretation = "Ihr Blutdruck ist am Wochenende tendenziell höher als an Wochentagen. Dies könnte mit verändertem Ess- oder Trinkverhalten, weniger Bewegung oder verändertem Schlafrhythmus zusammenhängen.";
        }
      } else {
        interpretation = "Es gibt keine auffälligen Unterschiede zwischen Ihrem Blutdruck an Wochentagen und am Wochenende.";
      }
    }
    
    return {
      hasEnoughData,
      weekdayData,
      interpretation
    };
  }, [data]);
  
  // Wenn keine Analyse möglich ist
  if (!weekdayAnalysis) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
        <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">Diese Analyse benötigt Daten aus mindestens einer vollen Woche.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-md font-medium mb-3 flex items-center">
        <Calendar size={18} className="mr-2 text-blue-600" /> 
        Blutdruckschwankungen nach Wochentagen
      </h3>
      
      {!weekdayAnalysis.hasEnoughData ? (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start mb-4">
          <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Es liegen noch nicht genügend Messungen für alle Wochentage vor. Die Analyse wird mit den verfügbaren Daten durchgeführt.
          </p>
        </div>
      ) : null}
      
      <div className="bg-white p-3 rounded-lg border border-gray-100 mb-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekdayAnalysis.weekdayData.sort((a, b) => a.sort - b.sort)}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shortName" />
              <YAxis domain={[60, 180]} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value} mmHg`, 
                  name === 'morgenSys' ? 'Morgen Systolisch' : 
                  name === 'abendSys' ? 'Abend Systolisch' : name
                ]}
                labelFormatter={(label) => `Wochentag: ${
                  weekdayAnalysis.weekdayData.find(d => d.shortName === label)?.name || label
                }`}
              />
              <Bar dataKey="morgenSys" name="Morgen Systolisch" fill="#ff4136" />
              <Bar dataKey="abendSys" name="Abend Systolisch" fill="#ff851b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Wochentags-Muster</h4>
        <p className="text-sm">{weekdayAnalysis.interpretation}</p>
        
        <div className="mt-4 grid grid-cols-7 gap-1 text-sm">
          {weekdayAnalysis.weekdayData.sort((a, b) => a.sort - b.sort).map(day => (
            <div key={day.shortName} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                day.morgenSys > 135 ? 'bg-red-100 text-red-800' : 
                day.morgenSys < 120 ? 'bg-green-100 text-green-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                <span className="font-bold">{day.shortName}</span>
              </div>
              <div className="mt-2 font-medium text-center">
                {day.morgenSys > 0 ? day.morgenSys : '-'}
              </div>
              <div className="text-xs text-gray-500">
                {day.count} {day.count === 1 ? 'Messung' : 'Messungen'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-100">
          <h4 className="font-medium text-sm mb-2">Wochenende vs. Wochentage</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] bg-white p-3 rounded-lg border border-blue-100">
              <h5 className="text-xs font-medium text-gray-600 mb-1">Wochentage (Mo-Fr)</h5>
              <div className="text-xl font-bold">
                {Math.round(
                  weekdayAnalysis.weekdayData
                    .filter(d => d.sort <= 5)
                    .reduce((sum, d) => sum + (d.morgenSys || 0), 0) / 
                  weekdayAnalysis.weekdayData.filter(d => d.sort <= 5 && d.morgenSys).length
                )}
                <span className="text-sm text-gray-600 ml-1">mmHg</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-[200px] bg-white p-3 rounded-lg border border-blue-100">
              <h5 className="text-xs font-medium text-gray-600 mb-1">Wochenende (Sa-So)</h5>
              <div className="text-xl font-bold">
                {Math.round(
                  weekdayAnalysis.weekdayData
                    .filter(d => d.sort > 5)
                    .reduce((sum, d) => sum + (d.morgenSys || 0), 0) / 
                  weekdayAnalysis.weekdayData.filter(d => d.sort > 5 && d.morgenSys).length
                )}
                <span className="text-sm text-gray-600 ml-1">mmHg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekdayAnalysis;