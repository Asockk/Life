// utils/bloodPressureUtils.js
// Bewerte Blutdruck-Kategorie nach ESC/ESH 2018 Guidelines
// Die Kategorie wird durch den höheren Wert (systolisch ODER diastolisch) bestimmt
export const getBloodPressureCategory = (systolic, diastolic) => {
  // Validierung der Eingabewerte
  if (!systolic || !diastolic || systolic <= 0 || diastolic <= 0) {
    return { category: "Ungültig", color: "#AAAAAA" };
  }
  
  // Plausibilitätsprüfung
  if (systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) {
    return { category: "Unplausibel", color: "#AAAAAA" };
  }
  
  // Prüfung ob systolisch < diastolisch (medizinisch unmöglich)
  if (systolic <= diastolic) {
    return { category: "Fehlerhaft", color: "#AAAAAA" };
  }
  
  // Kategorisierung nach ESC/ESH 2018 Guidelines
  // WICHTIG: Der höhere Wert bestimmt die Kategorie
  if (systolic >= 180 || diastolic >= 110) {
    return { category: "Hypertonie Grad 3", color: "#85144b" };
  } else if (systolic >= 160 || diastolic >= 100) {
    return { category: "Hypertonie Grad 2", color: "#FF4136" };
  } else if (systolic >= 140 || diastolic >= 90) {
    return { category: "Hypertonie Grad 1", color: "#FF851B" };
  } else if (systolic >= 130 || diastolic >= 85) {
    return { category: "Hoch normal", color: "#FFDC00" };
  } else if (systolic >= 120 || diastolic >= 80) {
    return { category: "Normal", color: "#01FF70" };
  } else if (systolic < 120 && diastolic < 80) {
    return { category: "Optimal", color: "#2ECC40" };
  }
  
  // Fallback (sollte nie erreicht werden)
  return { category: "Unbekannt", color: "#AAAAAA" };
};

// Berechne Durchschnitt für ein bestimmtes Feld
export const calculateAverage = (data, key) => {
  // Null/Undefined Check
  if (!data || !Array.isArray(data) || data.length === 0) return 0;
  
  // Nur gültige numerische Werte für den Durchschnitt verwenden
  const validValues = data
    .filter(entry => entry && typeof entry[key] === 'number' && entry[key] > 0 && isFinite(entry[key]))
    .map(entry => entry[key]);
    
  if (validValues.length === 0) return 0;
  
  // Sichere Division mit Prüfung auf Division durch 0
  const sum = validValues.reduce((sum, value) => sum + value, 0);
  const average = sum / validValues.length;
  
  // Prüfung auf gültiges Ergebnis
  if (!isFinite(average)) return 0;
  
  return Math.round(average);
};

// Berechne 3-Tage-Durchschnitt für ein bestimmtes Feld
export const calculateMovingAverage = (data, index, field) => {
  // Validierung
  if (!data || !Array.isArray(data) || index < 0 || index >= data.length) {
    return 0;
  }
  
  // Sicherer Zugriff auf das Feld
  const currentValue = data[index] && data[index][field];
  if (typeof currentValue !== 'number' || !isFinite(currentValue)) {
    return 0;
  }
  
  if (index >= 2) {
    // Berechne 3-Tage-Durchschnitt, nur gültige numerische Werte
    const values = [];
    for (let i = 0; i <= 2; i++) {
      const entry = data[index - i];
      if (entry && typeof entry[field] === 'number' && entry[field] > 0 && isFinite(entry[field])) {
        values.push(entry[field]);
      }
    }
    
    if (values.length === 0) return currentValue;
    
    const sum = values.reduce((sum, v) => sum + v, 0);
    const average = sum / values.length;
    
    return isFinite(average) ? Math.round(average) : currentValue;
  }
  
  // Für die ersten beiden Einträge normale Werte nehmen
  return currentValue;
};

// Formatierung für die Tabelle (Sys/Dia/Puls)
export const formatTableValue = (sys, dia, puls) => {
  // Validierung: Blutdruckwerte müssen beide vorhanden und gültig sein
  const sysValid = typeof sys === 'number' && sys > 0 && isFinite(sys);
  const diaValid = typeof dia === 'number' && dia > 0 && isFinite(dia);
  
  if (!sysValid || !diaValid) {
    return '-'; // Zeige Strich bei ungültigen Werten
  }
  
  // Puls ist optional, zeige nur wenn vorhanden und gültig
  const pulsValid = typeof puls === 'number' && puls > 0 && isFinite(puls);
  
  if (pulsValid) {
    return `${sys}/${dia}/${puls}`;
  } else {
    return `${sys}/${dia}`;
  }
};

// Blutdruck-Kategorien für die Legende nach ESC/ESH 2018 Guidelines
export const bloodPressureCategories = [
  { name: "Optimal", range: "<120 UND <80 mmHg", color: "#2ECC40", description: "Idealer Blutdruck" },
  { name: "Normal", range: "120-129 UND/ODER 80-84 mmHg", color: "#01FF70", description: "Normaler Blutdruck" },
  { name: "Hoch normal", range: "130-139 UND/ODER 85-89 mmHg", color: "#FFDC00", description: "Leicht erhöht" },
  { name: "Hypertonie Grad 1", range: "140-159 UND/ODER 90-99 mmHg", color: "#FF851B", description: "Mild erhöht" },
  { name: "Hypertonie Grad 2", range: "160-179 UND/ODER 100-109 mmHg", color: "#FF4136", description: "Deutlich erhöht" },
  { name: "Hypertonie Grad 3", range: "≥180 UND/ODER ≥110 mmHg", color: "#85144b", description: "Stark erhöht" }
];

// Hilfsfunktion zur Validierung von Blutdruckwerten
export const validateBloodPressureValues = (systolic, diastolic) => {
  const errors = [];
  
  // Typ-Prüfung
  if (typeof systolic !== 'number' || isNaN(systolic)) {
    errors.push('Systolischer Wert muss eine Zahl sein');
  }
  if (typeof diastolic !== 'number' || isNaN(diastolic)) {
    errors.push('Diastolischer Wert muss eine Zahl sein');
  }
  
  // Bereichs-Prüfung
  if (systolic < 50 || systolic > 300) {
    errors.push('Systolischer Wert außerhalb des plausiblen Bereichs (50-300)');
  }
  if (diastolic < 30 || diastolic > 200) {
    errors.push('Diastolischer Wert außerhalb des plausiblen Bereichs (30-200)');
  }
  
  // Logik-Prüfung
  if (systolic <= diastolic) {
    errors.push('Systolischer Wert muss größer als diastolischer Wert sein');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};