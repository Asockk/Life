// utils/bloodPressureUtils.js
// Bewerte Blutdruck-Kategorie
export const getBloodPressureCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) {
    return { category: "Optimal", color: "#2ECC40" };
  } else if ((systolic >= 120 && systolic <= 129) && diastolic < 80) {
    return { category: "Normal", color: "#01FF70" };
  } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return { category: "Hoch normal", color: "#FFDC00" };
  } else if ((systolic >= 140 && systolic <= 159) || (diastolic >= 90 && diastolic <= 99)) {
    return { category: "Hypertonie Grad 1", color: "#FF851B" };
  } else if ((systolic >= 160 && systolic <= 179) || (diastolic >= 100 && diastolic <= 109)) {
    return { category: "Hypertonie Grad 2", color: "#FF4136" };
  } else if (systolic >= 180 || diastolic >= 110) {
    return { category: "Hypertonie Grad 3", color: "#85144b" };
  }
  return { category: "Unbekannt", color: "#AAAAAA" };
};

// Berechne Durchschnitt für ein bestimmtes Feld
export const calculateAverage = (data, key) => {
  if (data.length === 0) return 0;
  
  // Nur nicht-0 Werte für den Durchschnitt verwenden
  const validValues = data.filter(entry => entry[key] > 0).map(entry => entry[key]);
  if (validValues.length === 0) return 0;
  
  return Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
};

// Berechne 3-Tage-Durchschnitt für ein bestimmtes Feld
export const calculateMovingAverage = (data, index, field) => {
  if (index >= 2) {
    // Berechne 3-Tage-Durchschnitt, ignoriere Nullwerte
    const values = [data[index][field], data[index-1][field], data[index-2][field]].filter(v => v > 0);
    return values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;
  }
  // Für die ersten beiden Einträge normale Werte nehmen
  return data[index][field];
};

// Formatierung für die Tabelle (Sys/Dia/Puls)
export const formatTableValue = (sys, dia, puls) => {
  if ((sys === 0 && dia === 0) || (sys === 0 || dia === 0)) {
    return '-'; // Zeige Strich bei 0-Werten
  }
  return `${sys}/${dia}/${puls}`;
};

// Blutdruck-Kategorien für die Legende
export const bloodPressureCategories = [
  { name: "Optimal", range: "<120/<80 mmHg", color: "#2ECC40" },
  { name: "Normal", range: "120-129/<80 mmHg", color: "#01FF70" },
  { name: "Hoch normal", range: "130-139/80-89 mmHg", color: "#FFDC00" },
  { name: "Hypertonie Grad 1", range: "140-159/90-99 mmHg", color: "#FF851B" },
  { name: "Hypertonie Grad 2", range: "160-179/100-109 mmHg", color: "#FF4136" },
  { name: "Hypertonie Grad 3", range: "≥180/≥110 mmHg", color: "#85144b" }
];