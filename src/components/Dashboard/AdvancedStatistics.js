// components/Dashboard/AdvancedStatistics.js
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ComposedChart, Area, ReferenceLine } from 'recharts';
import { AlertTriangle, Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react';

const AdvancedStatistics = ({ data, contextFactors }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('daynight');
  
  // Tabs für die verschiedenen Analysen
  const tabs = [
    { id: 'daynight', label: 'Tag/Nacht-Rhythmus' },
    { id: 'weekday', label: 'Wochentagsanalyse' },
    { id: 'seasonal', label: 'Jahreszeitliche Schwankungen' },
    { id: 'correlation', label: 'Kontextfaktor-Korrelation' }
  ];
  
  // ================================================================
  // 1. Tag/Nacht-Rhythmus Analyse
  // ================================================================
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
    
    // Daten für den täglichen Verlauf (für alle Tage mit beiden Werten)
    const dailyPatternData = daysWithBothValues.map(entry => ({
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
  }, [data]);
  
  // ================================================================
  // 2. Wochentagsanalyse
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
  
  // ================================================================
  // 3. Jahreszeitliche Schwankungen
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
    
    // Initialisiere Monatsgruppen
    const monthGroups = {};
    for (let i = 1; i <= 12; i++) {
      monthGroups[i] = {
        systolicValues: [],
        diastolicValues: [],
        count: 0
      };
    }
    
    // Gruppiere Daten nach Monat
    data.forEach(entry => {
      // Extrahiere Monat aus Datum
      let month = null;
      
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
      
      // Sammle alle Systole- und Diastole-Werte
      if (entry.morgenSys > 0 && entry.morgenDia > 0) {
        monthGroups[month].systolicValues.push(entry.morgenSys);
        monthGroups[month].diastolicValues.push(entry.morgenDia);
        monthGroups[month].count++;
      }
      
      if (entry.abendSys > 0 && entry.abendDia > 0) {
        monthGroups[month].systolicValues.push(entry.abendSys);
        monthGroups[month].diastolicValues.push(entry.abendDia);
        monthGroups[month].count++;
      }
    });
    
    // Prüfe, ob wir genügend Monate mit Daten haben
    const monthsWithData = Object.values(monthGroups).filter(group => group.count > 0).length;
    
    if (monthsWithData < 2) {
      return { 
        hasEnoughData: false,
        message: "Daten aus mindestens 2 verschiedenen Monaten werden für eine jahreszeitliche Analyse benötigt."
      };
    }
    
    // Berechne Durchschnitt pro Monat
    const monthlyData = [];
    
    for (let i = 1; i <= 12; i++) {
      const group = monthGroups[i];
      
      if (group.count === 0) continue;
      
      const avgSys = Math.round(group.systolicValues.reduce((sum, val) => sum + val, 0) / group.systolicValues.length);
      const avgDia = Math.round(group.diastolicValues.reduce((sum, val) => sum + val, 0) / group.diastolicValues.length);
      
      monthlyData.push({
        month: i,
        name: monthNames[i-1],
        systolisch: avgSys,
        diastolisch: avgDia,
        count: group.count
      });
    }
    
    // Sortiere nach Monat
    monthlyData.sort((a, b) => a.month - b.month);
    
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
  }, [data]);
  
  // ================================================================
  // 4. Kontextfaktor-Korrelation
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
      let isoDate = null;
      
      // Format: "Januar 15"
      if (entry.datum.includes(' ') && !entry.datum.includes('.')) {
        const parts = entry.datum.split(' ');
        const month = parts[0];
        const day = parts[1];
        
        const monthMap = {
          'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
          'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
          'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
        };
        
        if (monthMap[month]) {
          isoDate = `2025-${monthMap[month]}-${day.padStart(2, '0')}`;
        }
      } 
      // Format: "15. Januar"
      else if (entry.datum.includes('.')) {
        const parts = entry.datum.split('. ');
        if (parts.length > 1) {
          const day = parts[0];
          const month = parts[1].split(' ')[0];
          
          const monthMap = {
            'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
            'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
            'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
          };
          
          if (monthMap[month]) {
            isoDate = `2025-${monthMap[month]}-${day.padStart(2, '0')}`;
          }
        }
      }
      
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
  }, [data, contextFactors]);
  
  // ================================================================
  // Hilfsfunktionen
  // ================================================================
  function calculateStandardDeviation(values) {
    if (!values || values.length < 2) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.round(Math.sqrt(variance) * 10) / 10;
  }
  
  // ================================================================
  // Rendering der UI
  // ================================================================
  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      {/* Header mit Toggle */}
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-lg font-semibold">Erweiterte Statistiken &amp; Trends</h2>
        <div className="text-blue-600">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4">
          {/* Tab-Navigation */}
          <div className="flex overflow-x-auto mb-4 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tab-Inhalte */}
          <div className="mt-4">
            {/* 1. Tag/Nacht-Rhythmus */}
            {activeTab === 'daynight' && (
              <div>
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <Clock size={18} className="mr-2 text-blue-600" /> 
                  Tag/Nacht-Rhythmus Ihres Blutdrucks
                </h3>
                
                {!dayNightAnalysis?.hasEnoughData ? (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
                    <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{dayNightAnalysis?.message || "Für diese Analyse werden mehr Daten benötigt."}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Durchschnittswerte im Tagesverlauf:</p>
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
                              <Legend />
                              <Bar dataKey="systolisch" name="Systolisch" fill="#ff4136" />
                              <Bar dataKey="diastolisch" name="Diastolisch" fill="#0074d9" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Morgen-Abend-Differenzen (Systolisch):</p>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={dayNightAnalysis.dailyPatternData}
                              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="datum" />
                              <YAxis domain={[-20, 20]} />
                              <Tooltip 
                                formatter={(value) => [`${value > 0 ? '+' : ''}${value} mmHg`, '']}
                                labelFormatter={(label) => `${label}`}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="sysdiff" 
                                name="Abend-Morgen Differenz" 
                                stroke="#8884d8" 
                                strokeWidth={2}
                              />
                              <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-md">
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
                  </>
                )}
              </div>
            )}
            
            {/* 2. Wochentagsanalyse */}
            {activeTab === 'weekday' && (
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
            )}
            
            {/* 3. Jahreszeitliche Schwankungen */}
            {activeTab === 'seasonal' && (
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
                              <XAxis dataKey="name" />
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
            )}
            
            {/* 4. Kontextfaktor-Korrelation */}
            {activeTab === 'correlation' && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStatistics;