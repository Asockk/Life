// utils/validationUtils.js

// Validiert die Blutdruckwerte mit umfassenden Null-Checks
export const validateBloodPressure = (values) => {
  const errors = {};
  
  // Null/Undefined Check
  if (!values || typeof values !== 'object') {
    return { general: 'Ungültige Eingabedaten' };
  }
  
  // Hilfsfunktion für sichere Zahlenwert-Prüfung
  const isValidNumber = (value) => {
    return value !== null && value !== undefined && !isNaN(Number(value)) && isFinite(Number(value));
  };
  
  // Systolischer Blutdruck (50-250 mmHg) - erweiterte medizinische Bereiche
  if (values.morgenSys !== undefined && values.morgenSys !== null && values.morgenSys !== '') {
    const numValue = Number(values.morgenSys);
    if (!isValidNumber(values.morgenSys)) {
      errors.morgenSys = 'Bitte eine gültige Zahl eingeben';
    } else if (numValue < 50 || numValue > 250) {
      errors.morgenSys = 'Systolischer Wert muss zwischen 50 und 250 mmHg liegen';
    }
  }
  
  if (values.abendSys !== undefined && values.abendSys !== null && values.abendSys !== '') {
    const numValue = Number(values.abendSys);
    if (!isValidNumber(values.abendSys)) {
      errors.abendSys = 'Bitte eine gültige Zahl eingeben';
    } else if (numValue < 50 || numValue > 250) {
      errors.abendSys = 'Systolischer Wert muss zwischen 50 und 250 mmHg liegen';
    }
  }
  
  // Diastolischer Blutdruck (30-150 mmHg) - erweiterte medizinische Bereiche
  if (values.morgenDia !== undefined && values.morgenDia !== null && values.morgenDia !== '') {
    const numValue = Number(values.morgenDia);
    if (!isValidNumber(values.morgenDia)) {
      errors.morgenDia = 'Bitte eine gültige Zahl eingeben';
    } else if (numValue < 30 || numValue > 150) {
      errors.morgenDia = 'Diastolischer Wert muss zwischen 30 und 150 mmHg liegen';
    }
  }
  
  if (values.abendDia !== undefined && values.abendDia !== null && values.abendDia !== '') {
    const numValue = Number(values.abendDia);
    if (!isValidNumber(values.abendDia)) {
      errors.abendDia = 'Bitte eine gültige Zahl eingeben';
    } else if (numValue < 30 || numValue > 150) {
      errors.abendDia = 'Diastolischer Wert muss zwischen 30 und 150 mmHg liegen';
    }
  }
  
  // Puls (20-250 Schläge/Min) - erweiterte medizinische Bereiche
  if (values.morgenPuls !== undefined && values.morgenPuls !== null && values.morgenPuls !== '') {
    const numValue = Number(values.morgenPuls);
    if (!isValidNumber(values.morgenPuls)) {
      errors.morgenPuls = 'Bitte eine gültige Zahl eingeben';
    } else if (numValue < 20 || numValue > 250) {
      errors.morgenPuls = 'Puls muss zwischen 20 und 250 Schlägen/Min liegen';
    }
  }
  
  if (values.abendPuls !== undefined && values.abendPuls !== null && values.abendPuls !== '') {
    const numValue = Number(values.abendPuls);
    if (!isValidNumber(values.abendPuls)) {
      errors.abendPuls = 'Bitte eine gültige Zahl eingeben';
    } else if (numValue < 20 || numValue > 250) {
      errors.abendPuls = 'Puls muss zwischen 20 und 250 Schlägen/Min liegen';
    }
  }
  
  // Systolisch muss größer als diastolisch sein (medizinische Plausibilität)
  if (isValidNumber(values.morgenSys) && isValidNumber(values.morgenDia)) {
    const sys = Number(values.morgenSys);
    const dia = Number(values.morgenDia);
    if (sys > 0 && dia > 0 && sys <= dia) {
      errors.morgenDia = 'Diastolischer Wert muss kleiner als systolischer Wert sein';
    }
    // Warnung bei sehr kleiner Differenz
    if (sys > 0 && dia > 0 && (sys - dia) < 20) {
      errors.morgenWarning = 'Ungewöhnlich kleine Blutdruckamplitude';
    }
  }
  
  if (isValidNumber(values.abendSys) && isValidNumber(values.abendDia)) {
    const sys = Number(values.abendSys);
    const dia = Number(values.abendDia);
    if (sys > 0 && dia > 0 && sys <= dia) {
      errors.abendDia = 'Diastolischer Wert muss kleiner als systolischer Wert sein';
    }
    // Warnung bei sehr kleiner Differenz
    if (sys > 0 && dia > 0 && (sys - dia) < 20) {
      errors.abendWarning = 'Ungewöhnlich kleine Blutdruckamplitude';
    }
  }
  
  return errors;
};

// Validiert das vollständige Formular
export const validateForm = (formData) => {
  const errors = [];
  
  // Null/Undefined Check für formData
  if (!formData || typeof formData !== 'object') {
    return { isValid: false, errors: ['Ungültige Formulardaten'] };
  }
  
  // Datum validieren
  if (!formData.datum) {
    errors.push('Datum ist erforderlich');
  } else {
    // Prüfe ob Datum gültig ist
    try {
      const dateStr = formData.datum;
      // Akzeptiere verschiedene Datumsformate
      // Erlaubt: "15. Januar 2025", "Januar 15, 2025", "2025-01-15", "15.01.2025", "Januar 15 2025", "15 Januar 2025"
      const validDatePattern = /(\d{1,2}\.\s*\w+\s*\d{0,4})|(\w+\s+\d{1,2},?\s*\d{0,4})|(\d{4}-\d{2}-\d{2})|(\d{1,2}\.\d{1,2}\.\d{2,4})|(\d{1,2}\s+\w+\s*\d{0,4})/;
      if (!validDatePattern.test(dateStr)) {
        errors.push('Ungültiges Datumsformat');
      }
      
      // Prüfe ob Datum nicht in der Zukunft liegt
      const heute = new Date();
      heute.setHours(23, 59, 59, 999); // Ende des heutigen Tages
      
      // Versuche das Datum zu parsen
      const parts = dateStr.match(/\d+/g);
      if (parts && parts.length >= 3) {
        const jahr = parts.find(p => p.length === 4);
        if (jahr && Number(jahr) > heute.getFullYear()) {
          errors.push('Datum darf nicht in der Zukunft liegen');
        }
      }
    } catch (e) {
      errors.push('Ungültiges Datum');
    }
  }
  
  // Wochentag validieren (check both 'tag' and 'wochentag' for compatibility)
  const weekday = formData.tag || formData.wochentag;
  if (!weekday || !['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].includes(weekday)) {
    errors.push('Ungültiger Wochentag');
  }
  
  // Mindestens ein Blutdruckwert muss vorhanden sein
  const hasMorgenWerte = (formData.morgenSys && formData.morgenDia) || 
                        (Number(formData.morgenSys) > 0 && Number(formData.morgenDia) > 0);
  const hasAbendWerte = (formData.abendSys && formData.abendDia) || 
                       (Number(formData.abendSys) > 0 && Number(formData.abendDia) > 0);
  
  if (!hasMorgenWerte && !hasAbendWerte) {
    errors.push('Mindestens ein Blutdruckwert (Morgen oder Abend) ist erforderlich');
  }
  
  // Blutdruckwerte validieren
  const bpErrors = validateBloodPressure(formData);
  
  // Sammle alle Blutdruck-Validierungsfehler
  Object.values(bpErrors).forEach(error => {
    if (error && !error.includes('Warning')) { // Warnungen nicht als Fehler zählen
      errors.push(error);
    }
  });
  
  // Notizen-Länge validieren
  if (formData.notizen && formData.notizen.length > 500) {
    errors.push('Notizen dürfen maximal 500 Zeichen lang sein');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: Object.entries(bpErrors).filter(([key, value]) => key.includes('Warning')).map(([, value]) => value)
  };
};

// Aktualisiert den Wochentag basierend auf dem Datum
export const getWeekdayFromDate = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const weekdayMap = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      return weekdayMap[date.getDay()];
    }
  } catch (e) {
    console.warn('Fehler beim Bestimmen des Wochentags:', e);
  }
  return '';
};

// Formatiert das Datum für die Anzeige im europäischen Format
export const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    // ISO-Format (YYYY-MM-DD)
    if (dateValue && dateValue.includes('-') && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split('-');
      const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      
      const monthIndex = parseInt(month, 10) - 1;
      const dayNum = parseInt(day, 10);
      
      if (monthIndex >= 0 && monthIndex < 12 && dayNum > 0 && dayNum <= 31) {
        // Immer das Jahr anzeigen, unabhängig davon, ob es das aktuelle Jahr ist oder nicht
        return `${dayNum}. ${months[monthIndex]} ${year}`;
      }
    }
    
    // Wenn bereits im Anzeigeformat, direkt zurückgeben
    if (dateValue.match(/^\d{1,2}\.\s*\w+\s*\d{4}$/)) {
      return dateValue;
    }
    
    // Fallback
    return dateValue;
  } catch (e) {
    console.warn('Fehler beim Formatieren des Datums:', e);
    return dateValue;
  }
};

// Hilfsfunktion zur sicheren Datumskonvertierung
export const parseDateSafely = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // ISO-Format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateStr + 'T00:00:00');
    }
    
    // Deutsches Format (1. Januar 2024)
    const germanMatch = dateStr.match(/^(\d{1,2})\.\s*(\w+)\s*(\d{4})$/);
    if (germanMatch) {
      const [, day, monthName, year] = germanMatch;
      const months = {
        'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3,
        'Mai': 4, 'Juni': 5, 'Juli': 6, 'August': 7,
        'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
      };
      
      const month = months[monthName];
      if (month !== undefined) {
        return new Date(Number(year), month, Number(day));
      }
    }
    
    // Fallback: Versuche native Parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (e) {
    console.warn('Fehler beim Parsen des Datums:', e);
    return null;
  }
};