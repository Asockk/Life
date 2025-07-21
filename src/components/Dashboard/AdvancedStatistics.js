// components/Dashboard/AdvancedStatistics.js
import React, { useState, useMemo } from 'react';
import { Clock, Calendar, TrendingUp, Activity, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ReferenceLine } from 'recharts';

const AdvancedStatistics = ({ data, contextFactors, darkMode }) => {
  // Chart Theme basierend auf Dark Mode
  const chartTheme = {
    text: darkMode ? '#d1d5db' : '#374151',
    grid: darkMode ? '#374151' : '#e5e7eb',
    tooltip: {
      contentStyle: {
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
        borderRadius: '0.375rem'
      },
      labelStyle: { color: darkMode ? '#d1d5db' : '#374151' },
      itemStyle: { color: darkMode ? '#d1d5db' : '#374151' }
    }
  };
  // Extrahiert das Jahr aus einem Datumsstring
  const extractYearFromDate = (dateStr) => {
    if (!dateStr) return new Date().getFullYear(); // Aktuelles Jahr als Fallback
    
    // Suche nach einer vierstelligen Zahl, die das Jahr sein könnte
    const yearMatch = dateStr.match(/\b(20\d{2})\b/); // 2000-2099
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    // Kein Jahr gefunden, verwende aktuelles Jahr
    return new Date().getFullYear();
  };
  
  // Hilfsfunktion zum Parsen eines Datums
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Jahr extrahieren (falls vorhanden)
    const year = extractYearFromDate(dateStr);
    
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    // Format: "Januar 15" oder "Januar 15 2024"
    if (dateStr.includes(' ') && !dateStr.includes('.')) {
      const parts = dateStr.split(' ');
      if (parts.length >= 2 && months[parts[0]] !== undefined) {
        const month = parts[0];
        const day = parseInt(parts[1]);
        if (!isNaN(day)) {
          return new Date(year, months[month], day);
        }
      }
    }
    
    // Format: "15. Januar" oder "15. Januar 2024"
    if (dateStr.includes('.') && dateStr.includes(' ')) {
      const parts = dateStr.split('. ');
      if (parts.length >= 2) {
        const day = parseInt(parts[0]);
        const monthPart = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
        if (!isNaN(day) && months[monthPart] !== undefined) {
          return new Date(year, months[monthPart], day);
        }
      }
    }
    
    return null;
  };
  
  // Hilfsfunktion zum Konvertieren eines Datums im Anzeigeformat in ISO-Format
  const convertDisplayDateToISO = (displayDate) => {
    if (!displayDate) return null;
    
    const year = extractYearFromDate(displayDate);
    
    // Fall 1: Format "Januar 15" oder "Januar 15 2024"
    if (displayDate.includes(' ') && !displayDate.includes('.')) {
      const parts = displayDate.split(' ');
      const month = parts[0];
      let day = parts[1];
      
      // Falls der Tag Teil eines Jahr-Formats ist (z.B. "15, 2024"), bereinigen
      if (day.includes(',')) {
        day = day.split(',')[0];
      }
      
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      return `${year}-${months[month] || '01'}-${day.padStart(2, '0')}`;
    }
    
    // Fall 2: Format "1. Januar" oder "1. Januar 2024"
    if (displayDate.includes('.') && displayDate.includes(' ')) {
      let day, month;
      
      if (displayDate.startsWith(displayDate.match(/\d+/)[0])) {
        // Format "1. Januar"
        const parts = displayDate.split('. ');
        day = parts[0];
        
        // Der Rest könnte "Januar 2024" sein
        const monthParts = parts[1].split(' ');
        month = monthParts[0];
      } else {
        // Andere Varianten
        const parts = displayDate.split(' ');
        month = parts[0];
        day = parts[1].replace('.', '').trim();
      }
      
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      return `${year}-${months[month] || '01'}-${day.padStart(2, '0')}`;
    }
    
    // Fall 3: Bereits im ISO-Format (YYYY-MM-DD)
    if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return displayDate;
    }
    
    return null;
  };
  
  // Hilfsfunktion für Standardabweichung-Berechnung
  const calculateStandardDeviation = (values) => {
    if (!values || values.length < 2) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.round(Math.sqrt(variance) * 10) / 10;
  };
  
  // ================================================================
  // Tag/Nacht-Rhythmus Analyse
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
    
    // Sortiere die Tage chronologisch
    const sortedDays = [...daysWithBothValues].sort((a, b) => {
      const dateA = parseDate(a.datum);
      const dateB = parseDate(b.datum);
      
      if (!dateA || !dateB) return 0;
      return dateA - dateB;  // Chronologische Sortierung
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
  }, [data]);
  
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
  }, [data, extractYearFromDate, convertDisplayDateToISO]);
  
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
  
  // State für die Akkordeon-Abschnitte
  const [expandedSections, setExpandedSections] = useState({
    daynight: true,
    weekday: false,
    seasonal: false,
    correlation: false
  });
  
  // Toggle-Funktion für Akkordeon-Abschnitte
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Rendering der UI
  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <div className={`p-4 rounded-lg shadow-sm mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Erweiterte Statistiken &amp; Trends</h2>
      
      {/* Akkordeon-Layout für bessere Mobile-Ansicht */}
      <div className="space-y-4">
        {/* 1. Tag/Nacht-Rhythmus */}
        <div className={`border rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => toggleSection('daynight')}
          >
            <div className="flex items-center">
              <Clock size={22} className="text-blue-600 mr-3" />
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Tag/Nacht-Rhythmus</h3>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {!dayNightAnalysis?.hasEnoughData 
                    ? "Nicht genügend Daten verfügbar" 
                    : dayNightAnalysis.timeDiff.sys > 0 
                      ? `Abends ${dayNightAnalysis.timeDiff.sys > 0 ? '+' : ''}${dayNightAnalysis.timeDiff.sys} mmHg höher als morgens`
                      : dayNightAnalysis.timeDiff.sys < 0
                        ? `Morgens ${Math.abs(dayNightAnalysis.timeDiff.sys)} mmHg höher als abends`
                        : "Stabil über den Tag"}
                </p>
              </div>
            </div>
            <div>
              {expandedSections.daynight ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
          
          {expandedSections.daynight && (
            <div className={`p-4 pt-0 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              {!dayNightAnalysis?.hasEnoughData ? (
                <div className={`p-3 rounded-md flex items-start border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                  <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>{dayNightAnalysis?.message || "Für diese Analyse werden mehr Daten benötigt."}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className={`p-3 rounded-md mb-3 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{dayNightAnalysis.interpretation}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Morgen-Abend-Vergleich:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-2 rounded">
                          <div className="border-r border-gray-200 pr-2">
                            <p><span className="font-medium">Morgens:</span> {dayNightAnalysis.avgMorning.sys}/{dayNightAnalysis.avgMorning.dia} mmHg</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Abends:</span> {dayNightAnalysis.avgEvening.sys}/{dayNightAnalysis.avgEvening.dia} mmHg</p>
                          </div>
                        </div>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Differenz:</span> 
                          <span className={dayNightAnalysis.timeDiff.sys > 0 ? 'text-red-600' : 'text-blue-600'}>
                            {' '}{dayNightAnalysis.timeDiff.sys > 0 ? '+' : ''}{dayNightAnalysis.timeDiff.sys}/
                            {dayNightAnalysis.timeDiff.dia > 0 ? '+' : ''}{dayNightAnalysis.timeDiff.dia} mmHg
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">Durchschnittswerte im Tagesverlauf:</p>
                  <div className="h-60 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dayNightAnalysis.chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
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
                  
                  {/* Täglicher Verlauf nur anzeigen, wenn genügend Datenpunkte */}
                  {dayNightAnalysis.dailyPatternData.length > 3 && (
                    <>
                      <p className="text-sm font-medium mb-2">Morgen-Abend-Differenzen (Systolisch):</p>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={dayNightAnalysis.dailyPatternData}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="datum" tick={{fontSize: 10}} />
                            <YAxis domain={[-40, 40]} />
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
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 2. Wochentagsanalyse */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => toggleSection('weekday')}
          >
            <div className="flex items-center">
              <Calendar size={22} className="text-green-600 mr-3" />
              <div>
                <h3 className="font-medium">Wochentagsanalyse</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {!weekdayAnalysis || !weekdayAnalysis.hasEnoughData 
                    ? "Nicht genügend Daten verfügbar" 
                    : "Erkennt Muster an verschiedenen Wochentagen"}
                </p>
              </div>
            </div>
            <div>
              {expandedSections.weekday ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
          
          {expandedSections.weekday && (
            <div className={`p-4 pt-0 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              {!weekdayAnalysis || !weekdayAnalysis.hasEnoughData ? (
                <div className={`p-3 rounded-md flex items-start border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                  <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                    {!weekdayAnalysis ? "Diese Analyse benötigt Daten aus mindestens einer vollen Woche." : 
                      "Es liegen noch nicht genügend Messungen für alle Wochentage vor."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-blue-50 rounded-md mb-3">
                    <p className="text-sm">{weekdayAnalysis.interpretation}</p>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-7 gap-1 text-xs mb-4">
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
                  
                  <p className="text-sm font-medium mb-2">Blutdruck nach Wochentagen:</p>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weekdayAnalysis.weekdayData.sort((a, b) => a.sort - b.sort)}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
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
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 3. Jahreszeitliche Schwankungen */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => toggleSection('seasonal')}
          >
            <div className="flex items-center">
              <TrendingUp size={22} className="text-orange-600 mr-3" />
              <div>
                <h3 className="font-medium">Jahreszeitliche Schwankungen</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {!seasonalAnalysis?.hasEnoughData 
                    ? "Nicht genügend langfristige Daten" 
                    : `Daten aus ${seasonalAnalysis.monthsWithData} von 12 Monaten verfügbar`}
                </p>
              </div>
            </div>
            <div>
              {expandedSections.seasonal ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
          
          {expandedSections.seasonal && (
            <div className={`p-4 pt-0 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              {!seasonalAnalysis?.hasEnoughData ? (
                <div className={`p-3 rounded-md flex items-start border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                  <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>{seasonalAnalysis?.message || "Für diese Analyse werden mehr Daten benötigt."}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-blue-50 rounded-md mb-3">
                    <p className="text-sm">{seasonalAnalysis.interpretation}</p>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">Monatlicher Blutdruckverlauf:</p>
                  <div className="h-60 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={seasonalAnalysis.monthlyData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="displayName" 
                          tick={{fontSize: 10}}
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
                  
                  {seasonalAnalysis.seasonalData.length > 0 && (
                    <>
                      <p className="text-sm font-medium mb-2">Jahreszeitliche Trends:</p>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={seasonalAnalysis.seasonalData}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
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
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 4. Kontextfaktor-Korrelation */}
        <div className={`border rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => toggleSection('correlation')}
          >
            <div className="flex items-center">
              <Activity size={22} className="text-purple-600 mr-3" />
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Kontextfaktor-Korrelation</h3>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {!contextCorrelationAnalysis?.hasEnoughData 
                    ? "Nicht genügend Kontextdaten" 
                    : "Analysiert Einflussfaktoren auf Ihren Blutdruck"}
                </p>
              </div>
            </div>
            <div>
              {expandedSections.correlation ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
          
          {expandedSections.correlation && (
            <div className={`p-4 pt-0 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              {!contextCorrelationAnalysis?.hasEnoughData ? (
                <div className={`p-3 rounded-md flex items-start border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                  <AlertTriangle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>{contextCorrelationAnalysis?.message || "Für diese Analyse werden mehr Daten benötigt."}</p>
                </div>
              ) : (
                <>
                  <div className={`p-3 rounded-md mb-3 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>{contextCorrelationAnalysis.interpretation}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {Object.entries(contextCorrelationAnalysis.factorAnalysis)
                      .filter(([_, info]) => info.correlation && info.impact !== 'gering')
                      .map(([factor, info]) => (
                        <div key={factor} className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{info.name}</h4>
                          
                          {!info.hasEnoughDataPoints ? (
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                                    <XAxis dataKey="name" tick={{ fill: chartTheme.text }} />
                                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: chartTheme.text }} />
                                    <Tooltip 
                                      contentStyle={chartTheme.tooltip.contentStyle}
                                      labelStyle={chartTheme.tooltip.labelStyle}
                                      itemStyle={chartTheme.tooltip.itemStyle}
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
                                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Einfluss: </span>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedStatistics;