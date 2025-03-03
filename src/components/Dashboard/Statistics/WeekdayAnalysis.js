// components/Dashboard/Statistics/WeekdayAnalysis.js
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Calendar } from 'lucide-react';

const WeekdayAnalysis = ({ data }) => {
  // ================================================================
  // Wochentagsanalyse
  // ================================================================
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

  return (
    <div>
      <h3 className="text-md font-medium mb-3 flex items-center">
        <Calendar size={18} className="mr-2 text-blue-600" /> 
        Blutdruckschwankungen nach Wochentagen
      </h3>
      
      {!weekdayAnalysis || !weekdayAnalysis.hasEnoughData ? (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
          <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {!weekdayAnalysis ? "Diese Analyse benötigt Daten aus mindestens einer vollen Woche." : 
              "Es liegen noch nicht genügend Messungen für alle Wochentage vor."}
          </p>
        </div>
      ) : (
        <>
          <div className="h-72 mb-4">
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
                <Legend />
                <Bar dataKey="morgenSys" name="Morgen Systolisch" fill="#ff4136" />
                <Bar dataKey="abendSys" name="Abend Systolisch" fill="#ff851b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-sm mb-2">Wochentags-Muster</h4>
            <p className="text-sm">{weekdayAnalysis.interpretation}</p>
            
            <div className="mt-3 grid grid-cols-7 gap-1 text-xs">
              {weekdayAnalysis.weekdayData.sort((a, b) => a.sort - b.sort).map(day => (
                <div 
                  key={day.shortName} 
                  className="p-1 text-center rounded"
                  style={{ 
                    backgroundColor: day.morgenSys > 135 ? '#ffeeee' : 
                                    day.morgenSys < 120 ? '#eeffee' : '#ffffee'
                  }}
                >
                  <div className="font-medium">{day.shortName}</div>
                  <div className="mt-1">{day.morgenSys > 0 ? day.morgenSys : '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeekdayAnalysis;