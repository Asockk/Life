// components/Dashboard/AdvancedStatistics/hooks/useDateParser.js
import { useCallback } from 'react';

/**
 * Hook für einheitliche Datumsverarbeitung in allen Analysekomponenten
 * Stellt Funktionen zur Verfügung, um verschiedene deutsche Datumsformate zu verarbeiten
 */
export const useDateParser = () => {
  /**
   * Extrahiert das Jahr aus einem Datumsstring
   * @param {string} dateStr - Datumsstring (z.B. "15. Januar 2024")
   * @returns {number} - Jahr als Zahl oder aktuelles Jahr als Fallback
   */
  const extractYearFromDate = useCallback((dateStr) => {
    if (!dateStr) return new Date().getFullYear(); // Aktuelles Jahr als Fallback
    
    // Suche nach einer vierstelligen Zahl, die das Jahr sein könnte
    const yearMatch = dateStr.match(/\b(20\d{2})\b/); // 2000-2099
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    // Kein Jahr gefunden, verwende aktuelles Jahr
    return new Date().getFullYear();
  }, []);
  
  /**
   * Parst ein deutsches Datum in ein JavaScript Date-Objekt
   * @param {string} dateStr - Deutsches Datum (z.B. "15. Januar" oder "Januar 15")
   * @returns {Date|null} - JavaScript Date-Objekt oder null bei Fehler
   */
  const parseDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    
    // Jahr extrahieren (falls vorhanden)
    const year = extractYearFromDate(dateStr);
    
    // Deutsche Monatsnamen in Zahlen (0-11) für JS Date
    const months = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 
      'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7, 
      'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    let day, month;
    
    // Format "Januar 15" oder "Januar 15 2024"
    if (dateStr.includes(' ') && !dateStr.includes('.')) {
      const parts = dateStr.split(' ');
      if (parts.length >= 2 && months[parts[0]] !== undefined) {
        month = parts[0];
        day = parseInt(parts[1]);
        if (!isNaN(day)) {
          return new Date(year, months[month], day);
        }
      }
    }
    
    // Format "15. Januar" oder "15. Januar 2024"
    else if (dateStr.includes('.') && dateStr.includes(' ')) {
      const parts = dateStr.split('. ');
      if (parts.length >= 2) {
        day = parseInt(parts[0]);
        const monthPart = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
        month = monthPart;
        if (!isNaN(day) && months[month] !== undefined) {
          return new Date(year, months[month], day);
        }
      }
    }
    
    return null;
  }, [extractYearFromDate]);
  
  /**
   * Konvertiert ein Anzeigedatum in ein ISO-Datumsformat (YYYY-MM-DD)
   * Wird für den Zugriff auf Kontextfaktoren verwendet
   * @param {string} displayDate - Anzeigedatum (z.B. "15. Januar")
   * @returns {string|null} - ISO-Datum oder null bei Fehler
   */
  const convertDisplayDateToISO = useCallback((displayDate) => {
    if (!displayDate) return null;
    
    // Jahr aus dem Datumsstring extrahieren (falls vorhanden)
    const year = extractYearFromDate(displayDate);
    
    // Fall 1: Format "Januar 15" oder "Januar 15 2024" (Standardformat)
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
    
    // Fall 2: Format "15. Januar" oder "15. Januar 2024" (europäisches Format)
    if (displayDate.includes('.') && displayDate.includes(' ')) {
      let day, month;
      
      if (displayDate.startsWith(displayDate.match(/\d+/)[0])) {
        // Format "15. Januar"
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
  }, [extractYearFromDate]);

  /**
   * Formatiert ein Datum für die Anzeige im deutschen Format (TT. Monat YYYY)
   * @param {string|Date} date - Datum oder ISO-Datumsstring
   * @returns {string} - Formatiertes Datum im deutschen Format
   */
  const formatDateToDisplay = useCallback((date) => {
    let dateObj;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // ISO-Format (YYYY-MM-DD)
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Versuche, das Datum mit parseDate zu parsen
        dateObj = parseDate(date);
      }
    }
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return date; // Wenn das Parsen fehlschlägt, gib das Original zurück
    }
    
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    return `${day}. ${monthNames[month]} ${year}`;
  }, [parseDate]);
  
  return {
    parseDate,
    extractYearFromDate,
    convertDisplayDateToISO,
    formatDateToDisplay
  };
};

export default useDateParser;