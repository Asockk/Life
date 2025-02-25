// utils/validationUtils.js

// Validiert die Blutdruckwerte
export const validateBloodPressure = (values) => {
  const errors = {};
  
  // Systolischer Blutdruck (80-220 mmHg)
  if (values.morgenSys) {
    if (isNaN(values.morgenSys) || values.morgenSys < 80 || values.morgenSys > 220) {
      errors.morgenSys = 'Systolischer Wert muss zwischen 80 und 220 liegen';
    }
  }
  
  if (values.abendSys) {
    if (isNaN(values.abendSys) || values.abendSys < 80 || values.abendSys > 220) {
      errors.abendSys = 'Systolischer Wert muss zwischen 80 und 220 liegen';
    }
  }
  
  // Diastolischer Blutdruck (40-120 mmHg)
  if (values.morgenDia) {
    if (isNaN(values.morgenDia) || values.morgenDia < 40 || values.morgenDia > 120) {
      errors.morgenDia = 'Diastolischer Wert muss zwischen 40 und 120 liegen';
    }
  }
  
  if (values.abendDia) {
    if (isNaN(values.abendDia) || values.abendDia < 40 || values.abendDia > 120) {
      errors.abendDia = 'Diastolischer Wert muss zwischen 40 und 120 liegen';
    }
  }
  
  // Puls (40-200 Schläge/Min)
  if (values.morgenPuls) {
    if (isNaN(values.morgenPuls) || values.morgenPuls < 40 || values.morgenPuls > 200) {
      errors.morgenPuls = 'Puls muss zwischen 40 und 200 liegen';
    }
  }
  
  if (values.abendPuls) {
    if (isNaN(values.abendPuls) || values.abendPuls < 40 || values.abendPuls > 200) {
      errors.abendPuls = 'Puls muss zwischen 40 und 200 liegen';
    }
  }
  
  // Systolisch muss größer als diastolisch sein
  if (values.morgenSys && values.morgenDia && Number(values.morgenSys) <= Number(values.morgenDia)) {
    errors.morgenDia = 'Diastolischer Wert muss kleiner als systolischer Wert sein';
  }
  
  if (values.abendSys && values.abendDia && Number(values.abendSys) <= Number(values.abendDia)) {
    errors.abendDia = 'Diastolischer Wert muss kleiner als systolischer Wert sein';
  }
  
  return errors;
};

// Validiert das vollständige Formular
export const validateForm = (values, validateBloodPressure) => {
  const errors = validateBloodPressure(values);
  
  // Datum und Wochentag validieren
  if (values.datum) {
    const date = new Date(values.datum);
    const weekday = date.getDay(); // 0 = Sonntag, 1 = Montag, ...
    const weekdayMap = { 'So': 0, 'Mo': 1, 'Di': 2, 'Mi': 3, 'Do': 4, 'Fr': 5, 'Sa': 6 };
    
    if (weekdayMap[values.tag] !== weekday) {
      errors.tag = 'Wochentag stimmt nicht mit Datum überein';
    }
  }
  
  return errors;
};

// Aktualisiert den Wochentag basierend auf dem Datum
export const getWeekdayFromDate = (dateValue) => {
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    const weekdayMap = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return weekdayMap[date.getDay()];
  }
  return '';
};

// Formatiert das Datum für die Anzeige
export const formatDateForDisplay = (dateValue) => {
  if (dateValue && dateValue.includes('-')) {
    const [year, month, day] = dateValue.split('-');
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
  }
  return dateValue;
};