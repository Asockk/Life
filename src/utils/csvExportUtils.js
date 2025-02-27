// utils/csvExportUtils.js

/**
 * Konvertiert Blutdruckdaten und Kontextfaktoren in ein CSV-Format 
 * @param {Array} data - Die Blutdruckdaten
 * @param {Object} contextFactors - Kontextfaktoren, falls vorhanden
 * @returns {string} - CSV-String
 */
export const convertDataToCSV = (data, contextFactors = {}) => {
  // Aktuelles Jahr für neue Einträge
  const currentYear = new Date().getFullYear();
  
  // Sortiere die Daten nach Datum für bessere Lesbarkeit
  const sortedData = [...data].sort((a, b) => {
    // Konvertiere Datumsformat für die Sortierung
    const parseDate = (dateStr) => {
      const months = {
        'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
        'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
      };
      
      let day, month, year = currentYear; // Aktuelles Jahr als Standard
      
      // Format "1. Januar 2025"
      if (dateStr.includes('.')) {
        const parts = dateStr.split('. ');
        day = parseInt(parts[0]);
        
        // Prüfen, ob ein Jahr vorhanden ist
        const restParts = parts[1].split(' ');
        month = restParts[0];
        
        if (restParts.length > 1) {
          const possibleYear = parseInt(restParts[restParts.length - 1]);
          if (!isNaN(possibleYear) && possibleYear > 2000) {
            year = possibleYear;
          }
        }
      } 
      // Format "Januar 1 2025"
      else if (dateStr.includes(' ')) {
        const parts = dateStr.split(' ');
        month = parts[0];
        day = parseInt(parts[1]);
        
        if (parts.length > 2) {
          const possibleYear = parseInt(parts[parts.length - 1]);
          if (!isNaN(possibleYear) && possibleYear > 2000) {
            year = possibleYear;
          }
        }
      } else {
        return new Date(0);
      }
      
      return new Date(year, months[month], day);
    };
    
    return parseDate(a.datum) - parseDate(b.datum);
  });
  
  // Deutsche Wochentage und Monatsnamen beibehalten (keine Übersetzung ins Englische)
  const dayTranslation = {
    'Mo': 'Montag', 'Di': 'Dienstag', 'Mi': 'Mittwoch', 'Do': 'Donnerstag',
    'Fr': 'Freitag', 'Sa': 'Samstag', 'So': 'Sonntag'
  };
  
  // CSV-Header erstellen
  const csvHeader = [
    'Tag', 'Datum',                     // Tag und Datum
    'Blutdruck Morgen', '', '',        // Morgen Sys, Dia, Puls
    'Blutdruck Abend', '', '',        // Abend Sys, Dia, Puls
    'Kontextfaktoren', '', '', '', '', ''  // Kontextfaktoren (6 Spalten für die Faktoren)
  ].join(';');
  
  // Unterüberschriften für die Spalten
  const csvSubheader = [
    '', '',                            // Tag und Datum
    'Sys', 'Dia', 'Puls',             // Morgen
    'Sys', 'Dia', 'Puls',             // Abend
    'Stress', 'Schlaf', 'Aktivität', 'Salz', 'Koffein', 'Alkohol'  // Kontextfaktoren
  ].join(';');
  
  // Daten in CSV-Zeilen umwandeln
  const csvRows = sortedData.map(entry => {
    // ISO-Datum (YYYY-MM-DD) aus dem Anzeigeformat extrahieren
    const getIsoDate = (displayDate) => {
      if (!displayDate) return '';
      
      let day, month, year = currentYear; // Aktuelles Jahr als Standard
      
      // Format "1. Januar 2025"
      if (displayDate.includes('.')) {
        const parts = displayDate.split('. ');
        day = parseInt(parts[0]);
        
        // Prüfen, ob ein Jahr vorhanden ist
        const restParts = parts[1].split(' ');
        month = restParts[0];
        
        if (restParts.length > 1) {
          const possibleYear = parseInt(restParts[restParts.length - 1]);
          if (!isNaN(possibleYear) && possibleYear > 2000) {
            year = possibleYear;
          }
        }
      } 
      // Format "Januar 1 2025"
      else if (displayDate.includes(' ')) {
        const parts = displayDate.split(' ');
        month = parts[0];
        day = parseInt(parts[1]);
        
        if (parts.length > 2) {
          const possibleYear = parseInt(parts[parts.length - 1]);
          if (!isNaN(possibleYear) && possibleYear > 2000) {
            year = possibleYear;
          }
        }
      } else {
        return '';
      }
      
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      const monthNum = months[month] || '01';
      return `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
    };
    
    // Kontextfaktoren für das Datum abrufen
    const isoDate = getIsoDate(entry.datum);
    const context = contextFactors[isoDate] || {};
    
    // Überprüfen, ob das Datum bereits ein Jahr enthält
    let germanDate = entry.datum;
    let hasYear = false;
    
    // Prüfen, ob bereits ein Jahr im Datum vorhanden ist
    if (germanDate.match(/\d{4}/)) {
      hasYear = true;
    }
    
    // Füge das aktuelle Jahr hinzu, wenn noch kein Jahr vorhanden ist
    if (!hasYear) {
      if (germanDate.includes('.')) {
        // Format "1. Januar"
        germanDate = `${germanDate} ${currentYear}`;
      } else if (germanDate.includes(' ')) {
        // Format "Januar 1"
        germanDate = `${germanDate} ${currentYear}`;
      }
    }
    
    // Der vollständige Wochentag auf Deutsch
    const germanDay = dayTranslation[entry.tag] || entry.tag;
    
    // CSV-Zeile erstellen
    return [
      germanDay, germanDate,    // Tag und Datum (auf Deutsch) mit Jahr
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
  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  link.href = url;
  link.setAttribute('download', `Blutdruck-Daten_${date}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Aufräumen
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return `Blutdruck-Daten_${date}.csv`;
};