// utils/dataUtils.js
import { calculateMovingAverage, calculateAverage } from './bloodPressureUtils';

// Bereitet die Daten mit gleitenden Durchschnitten vor
export const prepareDataWithMovingAverages = (data) => {
  return data.map((item, index) => {
    const result = { ...item };
    
    // Berechne gleitende Durchschnitte
    result.morgenSysMA = calculateMovingAverage(data, index, 'morgenSys');
    result.morgenDiaMA = calculateMovingAverage(data, index, 'morgenDia');
    result.morgenPulsMA = calculateMovingAverage(data, index, 'morgenPuls');
    result.abendSysMA = calculateMovingAverage(data, index, 'abendSys');
    result.abendDiaMA = calculateMovingAverage(data, index, 'abendDia');
    result.abendPulsMA = calculateMovingAverage(data, index, 'abendPuls');
    
    return result;
  });
};

// Bereitet Daten mit Durchschnittslinien vor
export const prepareDataWithAverages = (data) => {
  const avgMorgenSys = calculateAverage(data, 'morgenSys');
  const avgMorgenDia = calculateAverage(data, 'morgenDia');
  const avgMorgenPuls = calculateAverage(data, 'morgenPuls');
  const avgAbendSys = calculateAverage(data, 'abendSys');
  const avgAbendDia = calculateAverage(data, 'abendDia');
  const avgAbendPuls = calculateAverage(data, 'abendPuls');
  
  // Verwende die berechneten Durchschnittswerte
  return {
    data: data.map(item => ({
      ...item,
      avgMorgenSys,
      avgMorgenDia,
      avgMorgenPuls,
      avgAbendSys,
      avgAbendDia,
      avgAbendPuls
    })),
    averages: {
      morgen: {
        sys: avgMorgenSys,
        dia: avgMorgenDia,
        puls: avgMorgenPuls
      },
      abend: {
        sys: avgAbendSys,
        dia: avgAbendDia,
        puls: avgAbendPuls
      }
    }
  };
};

// Sichere Konvertierung von Zahlen mit Komma zu Punkt
function safeParseFloat(value) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  
  // Sicherstellen, dass der Wert ein String ist, bevor replace aufgerufen wird
  const strValue = String(value).trim();
  return parseFloat(strValue.replace(',', '.')) || 0;
}

// Hilfsfunktion, um ein Datum in ein standardisiertes Format zu konvertieren
// Dies wird für den Vergleich beim Importieren verwendet
export const standardizeDateFormat = (dateStr, tag) => {
  // Versuche zuerst, das Datum zu parsen
  const parsedDate = parseDateFromCSV(dateStr);
  if (!parsedDate) return null;
  
  const { germanMonth, germanDay } = parsedDate;
  
  // Standardisierte Form: "Tag-DD-MM", z.B. "Mi-01-01"
  // Dies ist ein internes Format nur für den Vergleich, nicht für die Anzeige
  const monthMap = {
    'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
    'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
    'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
  };
  
  const monthNum = monthMap[germanMonth] || '01';
  const dayNum = germanDay.padStart(2, '0');
  
  return `${tag}-${dayNum}-${monthNum}`;
};

// Parse CSV-Daten für den Import
export const parseCSVData = (text) => {
  try {
    // Zeilen aufteilen
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 3) { // Mindestens 2 Header-Zeilen + 1 Datenzeile
      throw new Error('Die CSV-Datei enthält nicht genügend Daten.');
    }
    
    // Bei deinem Format haben wir 2 Header-Zeilen
    const headers = lines[0].split(';');
    const subHeaders = lines[1].split(';');
    
    // Finde die Hauptspalten
    let dayIndex = headers.indexOf('Tag') !== -1 ? headers.indexOf('Tag') : headers.indexOf('Day');
    let dateIndex = headers.indexOf('Datum') !== -1 ? headers.indexOf('Datum') : headers.indexOf('Date');
    let bpMorningIndex = -1;
    let bpEveningIndex = -1;
    
    // Wenn die Standard-Indizes nicht gefunden werden, manuell suchen
    if (dayIndex === -1) {
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase().includes('tag') || 
            headers[i].toLowerCase().includes('day')) {
          dayIndex = i;
          break;
        }
      }
    }
    
    if (dateIndex === -1) {
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase().includes('datum') || 
            headers[i].toLowerCase().includes('date')) {
          dateIndex = i;
          break;
        }
      }
    }
    
    // Suche nach den Blutdruck-Spaltengruppen - WICHTIG: Sowohl deutsche als auch englische Begriffe erkennen
    for (let i = 0; i < headers.length; i++) {
      const headerLower = headers[i].toLowerCase();
      if (headerLower.includes('blood pressure m') || 
          headerLower.includes('blutdruck morgen')) {
        bpMorningIndex = i;
      } else if (headerLower.includes('blood pressure e') || 
                 headerLower.includes('blutdruck abend')) {
        bpEveningIndex = i;
      }
    }
    
    // Wenn nicht gefunden, verwende Fallback-Annahmen
    if (dayIndex === -1) dayIndex = 0;
    if (dateIndex === -1) dateIndex = 1;
    
    // Für dein Format wissen wir, dass die Unterspalten Sys, Dia, Pulse/Puls sind
    // Finde die genauen Indizes in der zweiten Header-Zeile
    let mSysIndex = -1, mDiaIndex = -1, mPulseIndex = -1;
    let eSysIndex = -1, eDiaIndex = -1, ePulseIndex = -1;
    
    // Wenn bpMorningIndex und bpEveningIndex gefunden wurden
    if (bpMorningIndex !== -1) {
      // In deinem Format sind die Werte direkt nach "Blood Pressure M" / "Blutdruck Morgen"
      mSysIndex = bpMorningIndex;
      mDiaIndex = bpMorningIndex + 1;
      mPulseIndex = bpMorningIndex + 2;
    } else {
      // Fallback: Suche nach Sys/Dia/Pulse in den Unterspalten
      for (let i = 0; i < subHeaders.length; i++) {
        const header = subHeaders[i].toLowerCase();
        if (header === 'sys') {
          mSysIndex = i;
        } else if (header === 'dia') {
          mDiaIndex = i;
        } else if (header === 'pulse' || header === 'puls') {
          mPulseIndex = i;
        }
      }
    }
    
    if (bpEveningIndex !== -1) {
      // In deinem Format sind die Werte direkt nach "Blood Pressure E" / "Blutdruck Abend"
      eSysIndex = bpEveningIndex;
      eDiaIndex = bpEveningIndex + 1;
      ePulseIndex = bpEveningIndex + 2;
    } else if (mSysIndex !== -1 && mDiaIndex !== -1 && mPulseIndex !== -1) {
      // Fallback: Wenn Morning-Indizes gefunden wurden, nutze die nächsten 3 Spalten für Evening
      eSysIndex = mPulseIndex + 1;
      eDiaIndex = mPulseIndex + 2;
      ePulseIndex = mPulseIndex + 3;
    }
    
    console.log(`Erkannte Spalten: 
      Tag = ${dayIndex}, 
      Datum = ${dateIndex}, 
      Morgen: Sys=${mSysIndex}, Dia=${mDiaIndex}, Pulse=${mPulseIndex}, 
      Abend: Sys=${eSysIndex}, Dia=${eDiaIndex}, Pulse=${ePulseIndex}`);
    
    // Verarbeitung der Datensätze
    const results = [];
    let skippedCount = 0;
    let zeroValuesCount = 0;
    
    // Start bei Zeile 2 (Index 2), da wir 2 Header-Zeilen haben
    for (let i = 2; i < lines.length; i++) {
      const values = lines[i].split(';');
      
      // Überprüfen, ob die Zeile ausreichend Daten enthält
      if (values.length <= Math.max(dayIndex, dateIndex, mSysIndex, mDiaIndex, mPulseIndex, eSysIndex, eDiaIndex, ePulseIndex)) {
        skippedCount++;
        continue; // Überspringe unvollständige Zeilen
      }
      
      // Tag und Datum extrahieren
      const day = values[dayIndex] ? values[dayIndex].trim() : '';
      const dateStr = values[dateIndex] ? values[dateIndex].trim() : '';
      
      if (!day || !dateStr) {
        skippedCount++;
        continue; // Überspringe Zeilen ohne Tag oder Datum
      }
      
      // Datum parsen
      const parsedDateResult = parseImportedDate(day, dateStr);
      if (!parsedDateResult) {
        skippedCount++;
        continue; // Überspringen, wenn das Datum ungültig ist
      }
      
      const { formattedDate, tagKurz } = parsedDateResult;
      
      // Blutdruckwerte extrahieren
      // Verwende direkt die ermittelten Spaltenindizes und prüfe Grenzen
      let morgenSys = mSysIndex !== -1 && mSysIndex < values.length ? safeParseFloat(values[mSysIndex]) : 0;
      let morgenDia = mDiaIndex !== -1 && mDiaIndex < values.length ? safeParseFloat(values[mDiaIndex]) : 0;
      let morgenPuls = mPulseIndex !== -1 && mPulseIndex < values.length ? safeParseFloat(values[mPulseIndex]) : 0;
      
      let abendSys = eSysIndex !== -1 && eSysIndex < values.length ? safeParseFloat(values[eSysIndex]) : 0;
      let abendDia = eDiaIndex !== -1 && eDiaIndex < values.length ? safeParseFloat(values[eDiaIndex]) : 0;
      let abendPuls = ePulseIndex !== -1 && ePulseIndex < values.length ? safeParseFloat(values[ePulseIndex]) : 0;
      
      // Prüfen, ob mindestens ein gültiger Blutdruckwert vorhanden ist
      const hasMorningValues = morgenSys > 0 && morgenDia > 0;
      const hasEveningValues = abendSys > 0 && abendDia > 0;
      
      if (!hasMorningValues && !hasEveningValues) {
        skippedCount++;
        continue; // Überspringe Zeilen ohne gültige Blutdruckwerte
      }
      
      // Einzelne Nullwerte zählen
      if (morgenSys === 0 || morgenDia === 0 || morgenPuls === 0 || 
          abendSys === 0 || abendDia === 0 || abendPuls === 0) {
        zeroValuesCount++;
      }
      
      // Eintrag erstellen
      const entry = {
        id: Date.now() + i, // Eindeutige ID generieren
        tag: tagKurz,
        datum: formattedDate,
        morgenSys,
        morgenDia,
        morgenPuls,
        abendSys,
        abendDia,
        abendPuls,
        // Standardisiertes Datum hinzufügen für spätere Duplikaterkennung
        _standardDate: standardizeDateFormat(formattedDate, tagKurz)
      };
      
      results.push(entry);
    }
    
    // Überprüfen, ob Daten gefunden wurden
    if (results.length === 0) {
      throw new Error('Keine gültigen Datensätze mit Blutdruckwerten in der CSV-Datei gefunden.');
    }
    
    return {
      data: results,
      contextFactors: {}, // Kontext-Faktoren werden hier nicht erfasst
      skippedCount,
      zeroValuesCount
    };
  } catch (error) {
    console.error('Fehler beim Parsen der CSV-Datei:', error);
    throw error;
  }
};

// Parse importiertes Datum (neuer, verbesserter Parser)
function parseImportedDate(weekdayStr, dateStr) {
  if (!weekdayStr || !dateStr) return null;
  
  try {
    // Wochentag in deutsche Kurzform umwandeln
    const tagKurz = translateDayToShortGerman(weekdayStr);
    
    // Prüfen ob das Format "Month Day" ist (z.B. "Januar 9")
    let germanDay, germanMonth;
    
    // Format: "Januar 9"
    if (dateStr.includes(' ') && !dateStr.includes('.')) {
      const parts = dateStr.split(' ');
      germanMonth = parts[0].trim();
      germanDay = parts[1].trim();
      
      // Jahreszahl entfernen, falls vorhanden
      if (germanDay.match(/\d{4}/)) {
        germanDay = germanDay.replace(/\d{4}/, '').trim();
      }
      if (parts.length > 2 && parts[2].match(/\d{4}/)) {
        // Jahreszahl in Teil 3, nur die ersten beiden Teile verwenden
      }
    } 
    // Format: "9. Januar"
    else if (dateStr.includes('.') && dateStr.includes(' ')) {
      const parts = dateStr.split('. ');
      germanDay = parts[0].trim();
      
      // Zweiter Teil könnte "Januar 2025" sein
      if (parts.length > 1) {
        const monthParts = parts[1].split(' ');
        germanMonth = monthParts[0].trim();
      }
    }
    // Format: "Januar 9, 2025" oder ähnliches mit Komma
    else if (dateStr.includes(',')) {
      const mainPart = dateStr.split(',')[0].trim();
      if (mainPart.includes(' ')) {
        const parts = mainPart.split(' ');
        germanMonth = parts[0].trim();
        germanDay = parts[1].trim();
      }
    }
    
    // Wenn wir den Monat und Tag haben, formatieren wir das Datum
    if (germanMonth && germanDay) {
      // Monat in deutsche Form umwandeln
      const monthTranslation = {
        'January': 'Januar', 'February': 'Februar', 'March': 'März', 'April': 'April',
        'May': 'Mai', 'June': 'Juni', 'July': 'Juli', 'August': 'August',
        'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Dezember',
        'Januar': 'Januar', 'Februar': 'Februar', 'März': 'März', 'April': 'April',
        'Mai': 'Mai', 'Juni': 'Juni', 'Juli': 'Juli', 'August': 'August',
        'September': 'September', 'Oktober': 'Oktober', 'November': 'November', 'Dezember': 'Dezember'
      };
      
      const deMonth = monthTranslation[germanMonth] || germanMonth;
      
      // Formatiertes Datum im europäischen Format: "Tag, Tag. Monat"
      const formattedDate = `${germanDay}. ${deMonth}`;
      
      return {
        formattedDate,
        tagKurz,
        germanDay,
        germanMonth: deMonth
      };
    }
  } catch (error) {
    console.error('Fehler beim Parsen des importierten Datums:', error);
  }
  
  return null;
}

// Sortiert die Daten nach Datum
export const sortDataByDate = (data) => {
  const monthOrder = {
    'Januar': 1, 'Februar': 2, 'März': 3, 'April': 4, 
    'Mai': 5, 'Juni': 6, 'Juli': 7, 'August': 8, 
    'September': 9, 'Oktober': 10, 'November': 11, 'Dezember': 12
  };
  
  return [...data].sort((a, b) => {
    let aMonth, aDay, bMonth, bDay;
    
    // Europäisches Format: "1. Januar"
    if (a.datum.includes('.')) {
      const parts = a.datum.split('. ');
      aDay = parseInt(parts[0]);
      aMonth = parts[1].split(' ')[0]; // Falls Jahr enthalten ist
    } 
    // Amerikanisches Format: "Januar 1"
    else if (a.datum.includes(' ')) {
      const parts = a.datum.split(' ');
      aMonth = parts[0];
      aDay = parseInt(parts[1]);
    }
    
    // Dasselbe für b.datum
    if (b.datum.includes('.')) {
      const parts = b.datum.split('. ');
      bDay = parseInt(parts[0]);
      bMonth = parts[1].split(' ')[0];
    } else if (b.datum.includes(' ')) {
      const parts = b.datum.split(' ');
      bMonth = parts[0];
      bDay = parseInt(parts[1]);
    }
    
    // Nach Monat sortieren
    const monthDiff = monthOrder[aMonth] - monthOrder[bMonth];
    if (monthDiff !== 0) return monthDiff;
    
    // Nach Tag sortieren
    return aDay - bDay;
  });
};

// Beispieldaten für die App - im europäischen Format
export const initialData = [
  { id: 1, tag: 'Mi', datum: '1. Januar', morgenSys: 128, morgenDia: 67, morgenPuls: 53, abendSys: 134, abendDia: 75, abendPuls: 54 },
  { id: 2, tag: 'Do', datum: '2. Januar', morgenSys: 130, morgenDia: 68, morgenPuls: 49, abendSys: 138, abendDia: 64, abendPuls: 57 },
  { id: 3, tag: 'Fr', datum: '3. Januar', morgenSys: 122, morgenDia: 63, morgenPuls: 46, abendSys: 137, abendDia: 69, abendPuls: 51 },
  { id: 4, tag: 'Sa', datum: '4. Januar', morgenSys: 129, morgenDia: 65, morgenPuls: 51, abendSys: 126, abendDia: 68, abendPuls: 45 },
  { id: 5, tag: 'So', datum: '5. Januar', morgenSys: 129, morgenDia: 66, morgenPuls: 49, abendSys: 130, abendDia: 67, abendPuls: 46 },
  { id: 6, tag: 'Mo', datum: '6. Januar', morgenSys: 140, morgenDia: 72, morgenPuls: 52, abendSys: 134, abendDia: 70, abendPuls: 48 },
  { id: 7, tag: 'Di', datum: '7. Januar', morgenSys: 132, morgenDia: 65, morgenPuls: 50, abendSys: 132, abendDia: 69, abendPuls: 50 }
];

// Diese Funktion speziell für das Format "1. January, 2025" optimiert
function parseDateFromCSV(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Für das Format "1. January, 2025"
  const europeanFullDateRegex = /^(\d{1,2})\.\s*(\w+),?\s*\d{4}$/;
  const match = dateStr.match(europeanFullDateRegex);
  
  if (match) {
    const day = match[1];
    const month = match[2];
    
    // Englische und deutsche Monatsnamen in deutsche umwandeln
    const monthTranslation = {
      'January': 'Januar', 'February': 'Februar', 'March': 'März', 'April': 'April',
      'May': 'Mai', 'June': 'Juni', 'July': 'Juli', 'August': 'August',
      'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Dezember',
      'Januar': 'Januar', 'Februar': 'Februar', 'März': 'März', 'April': 'April',
      'Mai': 'Mai', 'Juni': 'Juni', 'Juli': 'Juli', 'August': 'August',
      'September': 'September', 'Oktober': 'Oktober', 'November': 'November', 'Dezember': 'Dezember'
    };
    
    const germanMonth = monthTranslation[month] || month;
    return { germanMonth, germanDay: day };
  }
  
  // Wenn das spezielle Format nicht passt, versuche die allgemeine Funktion
  return generalParseDateFromCSV(dateStr);
}

// Allgemeine Datumsparser-Funktion als Fallback
function generalParseDateFromCSV(dateStr) {
  // Leere Strings, undefined oder null abfangen
  if (!dateStr.trim()) return null;
  
  // Format mit Wochentag entfernen, falls vorhanden
  if (dateStr.includes(',')) {
    dateStr = dateStr.split(',')[1].trim();
  }
  
  // Formatkorrektur für Daten mit Leerzeichen und Punkt
  if (dateStr.match(/\d+\.\s+\w+/)) {
    dateStr = dateStr.replace(/(\d+)\.(\s+)(\w+)/, '$1.$3');
  }
  
  // Fall 1: "Month Day" Format (z.B. "Januar 1" oder "January 1")
  const americanDateRegex = /^(\w+)\s+(\d{1,2})(?:\s+(\d{4}))?$/;
  const americanDateMatch = dateStr.match(americanDateRegex);
  
  if (americanDateMatch) {
    const month = americanDateMatch[1];
    const day = americanDateMatch[2];
    
    // Englische und deutsche Monatsnamen in deutsche umwandeln
    const monthTranslation = {
      'January': 'Januar', 'February': 'Februar', 'March': 'März', 'April': 'April',
      'May': 'Mai', 'June': 'Juni', 'July': 'Juli', 'August': 'August',
      'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Dezember',
      'Januar': 'Januar', 'Februar': 'Februar', 'März': 'März', 'April': 'April',
      'Mai': 'Mai', 'Juni': 'Juni', 'Juli': 'Juli', 'August': 'August',
      'September': 'September', 'Oktober': 'Oktober', 'November': 'November', 'Dezember': 'Dezember'
    };
    
    const germanMonth = monthTranslation[month] || month;
    return { germanMonth, germanDay: day };
  }
  
  // Fall 2: "Day. Month" Format (z.B. "1. Januar" oder "1. January")
  const europeanDateRegex = /^(\d{1,2})[\.\s]+(\w+)(?:\s+(\d{4}))?$/;
  const europeanDateMatch = dateStr.match(europeanDateRegex);
  
  if (europeanDateMatch) {
    const day = europeanDateMatch[1];
    const month = europeanDateMatch[2];
    
    // Englische und deutsche Monatsnamen in deutsche umwandeln
    const monthTranslation = {
      'January': 'Januar', 'February': 'Februar', 'March': 'März', 'April': 'April',
      'May': 'Mai', 'June': 'Juni', 'July': 'Juli', 'August': 'August',
      'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Dezember',
      'Januar': 'Januar', 'Februar': 'Februar', 'März': 'März', 'April': 'April',
      'Mai': 'Mai', 'Juni': 'Juni', 'Juli': 'Juli', 'August': 'August',
      'September': 'September', 'Oktober': 'Oktober', 'November': 'November', 'Dezember': 'Dezember'
    };
    
    const germanMonth = monthTranslation[month] || month;
    return { germanMonth, germanDay: day };
  }
  
  // Fall 3: "DD.MM.YYYY" Format
  const shortDateRegex = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/;
  const shortDateMatch = dateStr.match(shortDateRegex);
  
  if (shortDateMatch) {
    const day = shortDateMatch[1];
    const monthNum = parseInt(shortDateMatch[2]);
    
    // Monate in deutsche Namen umwandeln
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    const germanMonth = months[monthNum - 1] || 'Januar';
    return { germanMonth, germanDay: day };
  }
  
  // Fall 4: ISO-Format "YYYY-MM-DD"
  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoDateMatch = dateStr.match(isoDateRegex);
  
  if (isoDateMatch) {
    const year = isoDateMatch[1];
    const month = parseInt(isoDateMatch[2]);
    const day = isoDateMatch[3];
    
    // Monate in deutsche Namen umwandeln
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    const germanMonth = months[month - 1] || 'Januar';
    return { germanMonth, germanDay: day };
  }
  
  return null;
}

/**
 * Konvertiert englische oder deutsche Wochentage in deutsche Kurzform
 * @param {string} day - Wochentag (englisch oder deutsch)
 * @returns {string} - Deutsche Kurzform (Mo, Di, etc.)
 */
function translateDayToShortGerman(day) {
  if (!day || typeof day !== 'string') return 'Mo'; // Fallback zu Montag
  
  const lowercaseDay = day.toLowerCase().trim();
  
  // Englische und deutsche Wochentage
  const dayMap = {
    'monday': 'Mo', 'montag': 'Mo',
    'tuesday': 'Di', 'dienstag': 'Di',
    'wednesday': 'Mi', 'mittwoch': 'Mi',
    'thursday': 'Do', 'donnerstag': 'Do',
    'friday': 'Fr', 'freitag': 'Fr',
    'saturday': 'Sa', 'samstag': 'Sa',
    'sunday': 'So', 'sonntag': 'So'
  };
  
  // Direkter Match mit dem dayMap
  for (const [key, value] of Object.entries(dayMap)) {
    if (lowercaseDay.includes(key)) return value;
  }
  
  // Wenn bereits deutsche Kurzform, behalten wir diese bei
  if (['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'].includes(lowercaseDay)) {
    return day.charAt(0).toUpperCase() + day.charAt(1).toLowerCase();
  }
  
  // Fallback: Die ersten 2 Zeichen oder feste Zuordnung basierend auf typischen Zahlen
  if (lowercaseDay === '1' || lowercaseDay === '01') return 'Mo';
  if (lowercaseDay === '2' || lowercaseDay === '02') return 'Di';
  if (lowercaseDay === '3' || lowercaseDay === '03') return 'Mi';
  if (lowercaseDay === '4' || lowercaseDay === '04') return 'Do';
  if (lowercaseDay === '5' || lowercaseDay === '05') return 'Fr';
  if (lowercaseDay === '6' || lowercaseDay === '06') return 'Sa';
  if (lowercaseDay === '7' || lowercaseDay === '07' || lowercaseDay === '0') return 'So';
  
  // Letzte Möglichkeit: Die ersten 2 Zeichen oder "Mo" als Default
  return day.length >= 2 ? day.slice(0, 2) : 'Mo';
}