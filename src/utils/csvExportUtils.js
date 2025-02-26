// utils/csvExportUtils.js

/**
 * Konvertiert Blutdruckdaten und Kontextfaktoren in ein CSV-Format 
 * @param {Array} data - Die Blutdruckdaten
 * @param {Object} contextFactors - Kontextfaktoren, falls vorhanden
 * @returns {string} - CSV-String
 */
export const convertDataToCSV = (data, contextFactors = {}) => {
  // Sortiere die Daten nach Datum für bessere Lesbarkeit
  const sortedData = [...data].sort((a, b) => {
    // Konvertiere Datumsformat für die Sortierung
    const parseDate = (dateStr) => {
      const months = {
        'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
        'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
      };
      
      let day, month;
      
      // Format "1. Januar"
      if (dateStr.includes('.')) {
        const parts = dateStr.split('. ');
        day = parseInt(parts[0]);
        month = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
      } 
      // Format "Januar 1"
      else if (dateStr.includes(' ')) {
        const parts = dateStr.split(' ');
        month = parts[0];
        day = parseInt(parts[1]);
      } else {
        return new Date(0);
      }
      
      return new Date(2025, months[month], day);
    };
    
    return parseDate(a.datum) - parseDate(b.datum);
  });
  
  // Den Monatsnamen in englisch konvertieren für bessere Importkompatibilität
  const monthTranslation = {
    'Januar': 'January', 'Februar': 'February', 'März': 'March', 'April': 'April',
    'Mai': 'May', 'Juni': 'June', 'Juli': 'July', 'August': 'August',
    'September': 'September', 'Oktober': 'October', 'November': 'November', 'Dezember': 'December'
  };
  
  // Deutsche Wochentage zu englischen Versionen konvertieren
  const dayTranslation = {
    'Mo': 'Monday', 'Di': 'Tuesday', 'Mi': 'Wednesday', 'Do': 'Thursday',
    'Fr': 'Friday', 'Sa': 'Saturday', 'So': 'Sunday'
  };
  
  // CSV-Header erstellen
  const csvHeader = [
    'Day', 'Date',                     // Tag und Datum
    'Blood Pressure M', '', '',        // Morgen Sys, Dia, Puls
    'Blood Pressure E', '', '',        // Abend Sys, Dia, Puls
    'Context Factors', '', '', '', '', ''  // Kontextfaktoren (6 Spalten für die Faktoren)
  ].join(';');
  
  // Unterüberschriften für die Spalten
  const csvSubheader = [
    '', '',                            // Tag und Datum
    'Sys', 'Dia', 'Pulse',             // Morgen
    'Sys', 'Dia', 'Pulse',             // Abend
    'Stress', 'Sleep', 'Activity', 'Salt', 'Caffeine', 'Alcohol'  // Kontextfaktoren
  ].join(';');
  
  // Daten in CSV-Zeilen umwandeln
  const csvRows = sortedData.map(entry => {
    // ISO-Datum (YYYY-MM-DD) aus dem Anzeigeformat extrahieren
    const getIsoDate = (displayDate) => {
      if (!displayDate) return '';
      
      let day, month;
      
      // Format "1. Januar"
      if (displayDate.includes('.')) {
        const parts = displayDate.split('. ');
        day = parseInt(parts[0]);
        month = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
      } 
      // Format "Januar 1"
      else if (displayDate.includes(' ')) {
        const parts = displayDate.split(' ');
        month = parts[0];
        day = parseInt(parts[1]);
      } else {
        return '';
      }
      
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      const monthNum = months[month] || '01';
      return `2025-${monthNum}-${String(day).padStart(2, '0')}`;
    };
    
    // Kontextfaktoren für das Datum abrufen
    const isoDate = getIsoDate(entry.datum);
    const context = contextFactors[isoDate] || {};
    
    // Datum im englischen Format für den Export, aber europäisches Format
    const germanMonth = entry.datum.includes('.') 
      ? entry.datum.split('. ')[1].split(' ')[0] 
      : entry.datum.split(' ')[0];
    
    const day = entry.datum.includes('.') 
      ? entry.datum.split('. ')[0] 
      : entry.datum.split(' ')[1];
      
    const englishMonth = monthTranslation[germanMonth] || germanMonth;
    const englishDate = `${day}. ${englishMonth}, 2025`;
    
    // Der vollständige Wochentag auf Englisch
    const englishDay = dayTranslation[entry.tag] || entry.tag;
    
    // CSV-Zeile erstellen
    return [
      englishDay, englishDate,    // Tag und Datum (mit Jahr)
      entry.morgenSys || 0, entry.morgenDia || 0, entry.morgenPuls || 0,   // Morgen-Werte
      entry.abendSys || 0, entry.abendDia || 0, entry.abendPuls || 0,      // Abend-Werte
      context.stress !== undefined ? context.stress : '',      // Stress
      context.sleep !== undefined ? context.sleep : '',        // Schlaf
      context.activity !== undefined ? context.activity : '',  // Aktivität
      context.salt !== undefined ? context.salt : '',          // Salzkonsum
      context.caffeine !== undefined ? context.caffeine : '',  // Koffein
      context.alcohol !== undefined ? context.alcohol : ''     // Alkohol
    ].join(';');
  });
  
  // CSV-String zusammenbauen
  return [csvHeader, csvSubheader, ...csvRows].join('\n');
};

/**
 * Generiert eine CSV-Datei aus den Blutdruckdaten und bietet sie zum Download an
 * @param {Array} data - Die Blutdruckdaten
 * @param {Object} contextFactors - Kontextfaktoren
 */
export const exportToCSV = (data, contextFactors = {}) => {
  // Daten in CSV konvertieren
  const csvContent = convertDataToCSV(data, contextFactors);
  
  // CSV-Datei zum Download anbieten
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Download-Link erstellen und klicken
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `Blutdruck-Daten_${date}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Aufräumen
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return `Blutdruck-Daten_${date}.csv`;
};