// components/Dashboard/Statistics/SeasonalAnalysis.js
import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Calendar } from 'lucide-react';

const SeasonalAnalysis = ({ data, extractYearFromDate }) => {
  // ================================================================
  // Jahreszeitliche Schwankungen
  // ================================================================
  const seasonalAnalysis = useMemo(() => {
    if (!data || data.length < 30) {
      return { 
        hasEnoughData: false,
        message: "Für eine jahreszeitliche Analyse werden Daten über einen längeren Zeitraum benötigt (mindestens 30 Tage)."
      };
    }
    
    // Wir nutzen die Monate als Näherung für die Jahreszeiten
    const monthMapping = {
      'Januar': 1, 'Februar': 2, 'März': 3, 'April': 4, 
      'Mai': 5, 'Juni': 6, 'Juli': 7, 'August': 8, 
      'September': 9, 'Oktober': 10, 'November': 11, 'Dezember': 12
    };
    
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    // Initialisiere Monatsgruppen mit Jahr-Tracking
    const monthYearGroups = {};
    
    // Gruppiere Daten nach Monat und Jahr
    data.forEach(entry => {
      // Extrahiere Monat und Jahr aus Datum
      let month = null;
      let year = extractYearFromDate(entry.datum);
      
      // Format: "Januar 15"
      if (entry.datum.includes(' ') && !entry.datum.includes('.')) {
        const parts = entry.datum.split(' ');
        month = monthMapping[parts[0]];
      } 
      // Format: "15. Januar"
      else if (entry.datum.includes('.')) {
        const parts = entry.datum.split('. ');
        if (parts.length > 1) {
          const monthPart = parts[1].split(' ')[0];
          month = monthMapping[monthPart];
        }
      }
      
      if (!month) return;
      
      const monthYearKey = `${year}-${month}`;
      
      if (!monthYearGroups[monthYearKey]) {
        monthYearGroups[monthYearKey] = {
          month,
          year,
          systolicValues: [],
          diastolicValues: [],
          count: 0
        };
      }
      
      // Sammle alle Systole- und Diastole-Werte
      if (entry.morgenSys > 0 && entry.morgenDia > 0) {
        monthYearGroups[monthYearKey].systolicValues.push(entry.morgenSys);
        monthYearGroups[monthYearKey].diastolicValues.push(entry.morgenDia);
        monthYearGroups[monthYearKey].count++;
      }
      
      if (entry.abendSys > 0 && entry.abendDia > 0) {
        monthYearGroups[monthYearKey].systolicValues.push(entry.abendSys);
        monthYearGroups[monthYearKey].diastolicValues.push(entry.abendDia);
        monthYearGroups[monthYearKey].count++;
      }
    });
    
    // Prüfe, ob wir genügend Monate mit Daten haben
    const monthsWithData = Object.values(monthYearGroups).filter(group => group.count > 0).length;
    
    if (monthsWithData < 2) {
      return { 
        hasEnoughData: false,
        message: "Daten aus mindestens 2 verschiedenen Monaten werden für eine jahreszeitliche Analyse benötigt."
      };
    }
    
    // Berechne Durchschnitt pro Monat/Jahr
    const monthlyData = Object.values(monthYearGroups).map(group => {
      const avgSys = Math.round(group.systolicValues.reduce((sum, val) => sum + val, 0) / group.systolicValues.length);
      const avgDia = Math.round(group.diastolicValues.reduce((sum, val) => sum + val, 0) / group.diastolicValues.length);
      
      return {
        month: group.month,
        year: group.year,
        name: monthNames[group.month-1],
        displayName: `${monthNames[group.month-1]} ${group.year}`,
        systolisch: avgSys,
        diastolisch: avgDia,
        count: group.count
      };
    });
    
    // Sortiere nach Jahr und Monat für die korrekte chronologische Reihenfolge
    monthlyData.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year; // Zuerst nach Jahr sortieren (aufsteigend)
      }
      return a.month - b.month; // Dann nach Monat sortieren
    });
    
    // Gruppiere in Jahreszeiten (wenn möglich)
    const seasons = {
      winter: { months: [12, 1, 2], values: [], name: 'Winter' },
      spring: { months: [3, 4, 5], values: [], name: 'Frühling' },
      summer: { months: [6, 7, 8], values: [], name: 'Sommer' },
      autumn: { months: [9, 10, 11], values: [], name: 'Herbst' }
    };
    
    monthlyData.forEach(data => {
      for (const [season, info] of Object.entries(seasons)) {
        if (info.months.includes(data.month)) {
          info.values.push(data.systolisch);
          break;
        }
      }
    });
    
    // Berechne Durchschnitt pro Jahreszeit
    const seasonalData = [];
    
    for (const [season, info] of Object.entries(seasons)) {
      if (info.values.length > 0) {
        const avgSys = Math.round(info.values.reduce((sum, val) => sum + val, 0) / info.values.length);
        seasonalData.push({
          name: info.name,
          systolisch: avgSys,
          count: info.values.length
        });
      }
    }
    
    // Interpretation
    let interpretation = "";
    
    if (monthsWithData < 6) {
      interpretation = "Für eine vollständige jahreszeitliche Analyse werden Daten aus mehr Monaten benötigt. Die vorhandenen Daten geben jedoch erste Einblicke.";
    } else {
      // Suche nach jahreszeitlichen Mustern
      if (seasonalData.length >= 3) {
        const maxSeason = seasonalData.reduce((max, s) => s.systolisch > max.systolisch ? s : max, seasonalData[0]);
        const minSeason = seasonalData.reduce((min, s) => s.systolisch < min.systolisch ? s : min, seasonalData[0]);
        
        if (maxSeason.systolisch - minSeason.systolisch > 5) {
          interpretation = `Ihr Blutdruck scheint im ${maxSeason.name} höher zu sein als im ${minSeason.name}. Jahreszeitliche Schwankungen des Blutdrucks sind normal und können durch Temperaturen, Aktivitätslevel und Ernährung beeinflusst werden.`;
        } else {
          interpretation = "Es gibt keine signifikanten jahreszeitlichen Schwankungen in Ihrem Blutdruck basierend auf den verfügbaren Daten.";
        }
      } else {
        interpretation = "Es liegen noch nicht genügend Daten aus verschiedenen Jahreszeiten vor für eine saisonale Analyse.";
      }
    }
    
    return {
      hasEnoughData: true,
      monthlyData,
      seasonalData,
      monthsWithData,
      interpretation
    };
  }, [data, extractYearFromDate]);

  return (
    <div>
      <h3 className="text-md font-medium mb-3 flex items-center">
        <Calendar size={18} className="mr-2 text-blue-600" /> 
        Jahreszeitliche Blutdruckschwankungen
      </h3>
      
      {!seasonalAnalysis?.hasEnoughData ? (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
          <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{seasonalAnalysis?.message || "Für diese Analyse werden mehr Daten benötigt."}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Monatsübersicht (Systolisch):</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={seasonalAnalysis.monthlyData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayName" 
                      // Verwende benutzerdefinierte Ticks, die das Jahr enthalten
                      tickFormatter={(value) => value}
                    />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip 
                      formatter={(value) => [`${value} mmHg`, '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="systolisch" 
                      name="Systolisch" 
                      stroke="#ff4136" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {seasonalAnalysis.seasonalData.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Jahreszeitlicher Trend:</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={seasonalAnalysis.seasonalData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip 
                        formatter={(value) => [`${value} mmHg`, '']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="systolisch" 
                        name="Systolisch" 
                        fill="#ff4136"
                        barSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-sm mb-2">Jahreszeitliche Muster</h4>
            <p className="text-sm">{seasonalAnalysis.interpretation}</p>
            <p className="text-xs mt-2 text-gray-600">
              Daten aus {seasonalAnalysis.monthsWithData} von 12 Monaten verfügbar
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SeasonalAnalysis;