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

// Parse CSV-Daten für den Import
export const parseCSVData = (text) => {
  try {
    // Zeilen aufteilen
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 3) {
      throw new Error('Die CSV-Datei enthält nicht genügend Daten.');
    }
    
    // Indizes der benötigten Spalten finden
    const headers = lines[0].split(';');
    const subHeaders = lines[1].split(';');
    
    // Tag und Datum
    const dayIndex = headers.indexOf('Day');
    const dateIndex = headers.indexOf('Date');
    
    if (dayIndex === -1 || dateIndex === -1) {
      throw new Error('Tag- oder Datumspalte wurde nicht gefunden.');
    }
    
    // Blutdruckwerte-Indizes finden
    const bpMorningIndex = headers.indexOf('Blood Pressure M');
    const bpEveningIndex = headers.indexOf('Blood Pressure E');
    
    if (bpMorningIndex === -1 || bpEveningIndex === -1) {
      throw new Error('Blutdruckdaten wurden nicht gefunden.');
    }
    
    // Kontextfaktoren-Indizes finden (optional)
    const contextFactorIndex = headers.indexOf('Context Factors');
    
    // Verarbeitung der Datensätze
    const results = [];
    let skippedCount = 0;
    let zeroValuesCount = 0;
    
    // Kontext-Faktoren für jeden Tag
    const contextFactors = {};
    
    // Ab Zeile 3 (Index 2) beginnen die Datensätze
    for (let i = 2; i < lines.length; i++) {
      const values = lines[i].split(';');
      
      // Überprüfen, ob die Zeile ausreichend Daten enthält
      if (values.length <= Math.max(dayIndex, dateIndex, bpMorningIndex + 2, bpEveningIndex + 2)) {
        skippedCount++;
        continue; // Überspringe unvollständige Zeilen
      }
      
      // Tag und Datum extrahieren
      const day = values[dayIndex];
      const dateStr = values[dateIndex];
      
      // Datum parsen - jetzt mit Unterstützung für verschiedene Formate einschließlich mit Jahr
      const parsedDate = parseDateFromCSV(dateStr);
      if (!parsedDate) {
        skippedCount++;
        continue; // Überspringen, wenn das Datum ungültig ist
      }
      
      const { germanMonth, germanDay } = parsedDate;
      
      // Blutdruckwerte extrahieren
      // Morgen: Sys, Dia, Pulse
      let morgenSys = parseFloat(values[bpMorningIndex].replace(',', '.')) || 0;
      let morgenDia = parseFloat(values[bpMorningIndex + 1].replace(',', '.')) || 0;
      let morgenPuls = parseFloat(values[bpMorningIndex + 2].replace(',', '.')) || 0;
      
      // Abend: Sys, Dia, Pulse
      let abendSys = parseFloat(values[bpEveningIndex].replace(',', '.')) || 0;
      let abendDia = parseFloat(values[bpEveningIndex + 1].replace(',', '.')) || 0;
      let abendPuls = parseFloat(values[bpEveningIndex + 2].replace(',', '.')) || 0;
      
      // Prüfen, ob mindestens ein gültiger Blutdruckwert (>0) vorhanden ist
      const hasMorningValues = morgenSys > 0 && morgenDia > 0;
      const hasEveningValues = abendSys > 0 && abendDia > 0;
      
      if (!hasMorningValues && !hasEveningValues) {
        skippedCount++;
        continue; // Überspringe Zeilen ohne Blutdruckwerte
      }
      
      // Einzelne Nullwerte zählen
      if (morgenSys === 0 || morgenDia === 0 || morgenPuls === 0 || 
          abendSys === 0 || abendDia === 0 || abendPuls === 0) {
        zeroValuesCount++;
      }
      
      // Wochentag kurz formatieren
      let tagKurz = translateDayToShortGerman(day);
      
      // Formatiertes Datum für die Anzeige im europäischen Format
      const formattedDate = `${germanDay}. ${germanMonth}`;
      
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
        abendPuls
      };
      
      results.push(entry);
      
      // Kontextfaktoren extrahieren, falls vorhanden
      if (contextFactorIndex !== -1 && values.length > contextFactorIndex + 5) {
        const stressValue = parseInt(values[contextFactorIndex]) || 0;
        const sleepValue = parseInt(values[contextFactorIndex + 1]) || 0;
        const activityValue = parseInt(values[contextFactorIndex + 2]) || 0;
        const saltValue = parseInt(values[contextFactorIndex + 3]) || 0;
        const caffeineValue = parseInt(values[contextFactorIndex + 4]) || 0;
        const alcoholValue = parseInt(values[contextFactorIndex + 5]) || 0;
        
        // Erstellung des ISO-Datums für die Kontextfaktoren (YYYY-MM-DD)
        const months = {
          'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
          'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
          'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
        };
        
        const monthNum = months[germanMonth];
        const isoDate = `2025-${monthNum}-${germanDay.padStart(2, '0')}`;
        
        // Nur Faktoren speichern, wenn sie gültige Werte haben
        const factors = {};
        if (stressValue >= 0) factors.stress = stressValue;
        if (sleepValue >= 0) factors.sleep = sleepValue;
        if (activityValue >= 0) factors.activity = activityValue;
        if (saltValue >= 0) factors.salt = saltValue;
        if (caffeineValue >= 0) factors.caffeine = caffeineValue;
        if (alcoholValue >= 0) factors.alcohol = alcoholValue;
        
        // Nur speichern, wenn mindestens ein Faktor vorhanden ist
        if (Object.keys(factors).length > 0) {
          contextFactors[isoDate] = factors;
        }
      }
    }
    
    // Überprüfen, ob Daten gefunden wurden
    if (results.length === 0) {
      throw new Error('Keine gültigen Datensätze mit Blutdruckwerten in der CSV-Datei gefunden.');
    }
    
    return {
      data: results,
      contextFactors,
      skippedCount,
      zeroValuesCount
    };
  } catch (error) {
    console.error('Fehler beim Parsen der CSV-Datei:', error);
    throw error;
  }
};

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

// Hilfsfunktionen für den Import

/**
 * Parst ein Datum aus einem CSV-Datensatz und unterstützt verschiedene Formate
 * @param {string} dateStr - Datum als String z.B. "January 15, 2025" oder "January 15" oder "15. January 2025"
 * @returns {Object|null} - Geparste Datumskomponenten oder null bei Fehler
 */
function parseDateFromCSV(dateStr) {
  if (!dateStr) return null;
  
  // Verschiedene Möglichkeiten, wie das Datum formatiert sein könnte
  
  // Versuch 1: "Month Day, Year" Format (z.B. "January 15, 2025")
  const americanDateRegex = /^(\w+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/;
  const americanDateMatch = dateStr.match(americanDateRegex);
  
  if (americanDateMatch) {
    const englishMonth = americanDateMatch[1];
    const day = americanDateMatch[2];
    // const year = americanDateMatch[3] || '2025'; // Standardmäßig 2025, wenn kein Jahr angegeben
    
    // Englische Monatsnamen in deutsche umwandeln
    const monthTranslation = {
      'January': 'Januar', 'February': 'Februar', 'March': 'März', 'April': 'April',
      'May': 'Mai', 'June': 'Juni', 'July': 'Juli', 'August': 'August',
      'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Dezember'
    };
    
    const germanMonth = monthTranslation[englishMonth] || englishMonth;
    return { germanMonth, germanDay: day };
  }
  
  // Versuch 2: "Day. Month Year" Format (z.B. "15. January 2025" oder "15. Januar")
  const europeanDateRegex = /^(\d{1,2})\.?\s+(\w+)(?:\s+(\d{4}))?$/;
  const europeanDateMatch = dateStr.match(europeanDateRegex);
  
  if (europeanDateMatch) {
    const day = europeanDateMatch[1];
    const month = europeanDateMatch[2];
    // const year = europeanDateMatch[3] || '2025'; // Standardmäßig 2025, wenn kein Jahr angegeben
    
    // Englische Monatsnamen in deutsche umwandeln
    const monthTranslation = {
      'January': 'Januar', 'February': 'Februar', 'March': 'März', 'April': 'April',
      'May': 'Mai', 'June': 'Juni', 'July': 'Juli', 'August': 'August',
      'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Dezember'
    };
    
    const germanMonth = monthTranslation[month] || month;
    return { germanMonth, germanDay: day };
  }
  
  // Versuch 3: Direktes deutsches Format "Januar 15"
  const germanAmericanDateRegex = /^(\w+)\s+(\d{1,2})$/;
  const germanAmericanDateMatch = dateStr.match(germanAmericanDateRegex);
  
  if (germanAmericanDateMatch) {
    const germanMonth = germanAmericanDateMatch[1];
    const germanDay = germanAmericanDateMatch[2];
    return { germanMonth, germanDay };
  }
  
  // Weitere Formate könnten hier hinzugefügt werden
  
  return null;
}

/**
 * Konvertiert englische oder deutsche Wochentage in deutsche Kurzform
 * @param {string} day - Wochentag (englisch oder deutsch)
 * @returns {string} - Deutsche Kurzform (Mo, Di, etc.)
 */
function translateDayToShortGerman(day) {
  if (!day) return '';
  
  const lowercaseDay = day.toLowerCase();
  
  // Englische Wochentage
  if (lowercaseDay.includes('monday') || lowercaseDay.includes('montag')) return 'Mo';
  if (lowercaseDay.includes('tuesday') || lowercaseDay.includes('dienstag')) return 'Di';
  if (lowercaseDay.includes('wednesday') || lowercaseDay.includes('mittwoch')) return 'Mi';
  if (lowercaseDay.includes('thursday') || lowercaseDay.includes('donnerstag')) return 'Do';
  if (lowercaseDay.includes('friday') || lowercaseDay.includes('freitag')) return 'Fr';
  if (lowercaseDay.includes('saturday') || lowercaseDay.includes('samstag')) return 'Sa';
  if (lowercaseDay.includes('sunday') || lowercaseDay.includes('sonntag')) return 'So';
  
  // Wenn bereits deutsche Kurzform, behalten wir diese bei
  if (['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'].includes(lowercaseDay)) {
    return day.charAt(0).toUpperCase() + day.charAt(1).toLowerCase();
  }
  
  // Fallback: Die ersten 2 Zeichen
  return day.slice(0, 2);
}