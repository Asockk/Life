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
    
    // Verarbeitung der Datensätze
    const results = [];
    let skippedCount = 0;
    let zeroValuesCount = 0;
    
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
      const date = values[dateIndex];
      
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
      let tagKurz = '';
      switch (day.toLowerCase()) {
        case 'monday': tagKurz = 'Mo'; break;
        case 'tuesday': tagKurz = 'Di'; break;
        case 'wednesday': tagKurz = 'Mi'; break;
        case 'thursday': tagKurz = 'Do'; break;
        case 'friday': tagKurz = 'Fr'; break;
        case 'saturday': tagKurz = 'Sa'; break;
        case 'sunday': tagKurz = 'So'; break;
        // Auch deutsche Wochentage unterstützen
        case 'montag': tagKurz = 'Mo'; break;
        case 'dienstag': tagKurz = 'Di'; break;
        case 'mittwoch': tagKurz = 'Mi'; break;
        case 'donnerstag': tagKurz = 'Do'; break;
        case 'freitag': tagKurz = 'Fr'; break;
        case 'samstag': tagKurz = 'Sa'; break;
        case 'sonntag': tagKurz = 'So'; break;
        default: tagKurz = day.slice(0, 2); // Verwende die ersten zwei Buchstaben, falls nicht erkannt
      }
      
      // Eintrag erstellen
      const entry = {
        id: Date.now() + i, // Eindeutige ID generieren
        tag: tagKurz,
        datum: date,
        morgenSys,
        morgenDia,
        morgenPuls,
        abendSys,
        abendDia,
        abendPuls
      };
      
      results.push(entry);
    }
    
    // Überprüfen, ob Daten gefunden wurden
    if (results.length === 0) {
      throw new Error('Keine gültigen Datensätze mit Blutdruckwerten in der CSV-Datei gefunden.');
    }
    
    return {
      data: results,
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
    // Datum-Strings im Format "Monat Tag" (z.B. "Januar 1")
    const [aMonth, aDay] = a.datum.split(' ');
    const [bMonth, bDay] = b.datum.split(' ');
    
    // Nach Monat sortieren
    const monthDiff = monthOrder[aMonth] - monthOrder[bMonth];
    if (monthDiff !== 0) return monthDiff;
    
    // Nach Tag sortieren
    return parseInt(aDay) - parseInt(bDay);
  });
};

// Beispieldaten für die App
export const initialData = [
  { id: 1, tag: 'Mi', datum: 'Januar 1', morgenSys: 128, morgenDia: 67, morgenPuls: 53, abendSys: 134, abendDia: 75, abendPuls: 54 },
  { id: 2, tag: 'Do', datum: 'Januar 2', morgenSys: 130, morgenDia: 68, morgenPuls: 49, abendSys: 138, abendDia: 64, abendPuls: 57 },
  { id: 3, tag: 'Fr', datum: 'Januar 3', morgenSys: 122, morgenDia: 63, morgenPuls: 46, abendSys: 137, abendDia: 69, abendPuls: 51 },
  { id: 4, tag: 'Sa', datum: 'Januar 4', morgenSys: 129, morgenDia: 65, morgenPuls: 51, abendSys: 126, abendDia: 68, abendPuls: 45 },
  { id: 5, tag: 'So', datum: 'Januar 5', morgenSys: 129, morgenDia: 66, morgenPuls: 49, abendSys: 130, abendDia: 67, abendPuls: 46 },
  { id: 6, tag: 'Mo', datum: 'Januar 6', morgenSys: 140, morgenDia: 72, morgenPuls: 52, abendSys: 134, abendDia: 70, abendPuls: 48 },
  { id: 7, tag: 'Di', datum: 'Januar 7', morgenSys: 132, morgenDia: 65, morgenPuls: 50, abendSys: 132, abendDia: 69, abendPuls: 50 }
];