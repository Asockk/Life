// utils/dataMigration.js

import { decryptSensitiveFields } from '../services/encryptionService';

/**
 * Konvertiert alte ID-Formate in das neue Format
 * @param {string|number} oldId - Alte ID (kann numerisch sein)
 * @returns {string} - Neue ID im Format bp_timestamp_random
 */
const migrateId = (oldId) => {
  // Wenn die ID bereits im neuen Format ist, behalte sie
  if (typeof oldId === 'string' && oldId.startsWith('bp_')) {
    return oldId;
  }
  
  // Generiere neue ID basierend auf der alten ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `bp_${timestamp}_${random}_migrated_${oldId}`;
};

/**
 * Konvertiert verschiedene Datumsformate in das deutsche Format
 * @param {string} dateStr - Datum in verschiedenen Formaten
 * @returns {string} - Datum im deutschen Format (z.B. "1. Januar")
 */
const migrateDateFormat = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  
  // Mapping für englische zu deutsche Monatsnamen
  const monthMap = {
    'January': 'Januar', 'February': 'Februar', 'March': 'März', 
    'April': 'April', 'May': 'Mai', 'June': 'Juni',
    'July': 'Juli', 'August': 'August', 'September': 'September',
    'October': 'Oktober', 'November': 'November', 'December': 'Dezember',
    // Kurzformen
    'Jan': 'Januar', 'Feb': 'Februar', 'Mar': 'März', 
    'Apr': 'April', 'Mai': 'Mai', 'Jun': 'Juni',
    'Jul': 'Juli', 'Aug': 'August', 'Sep': 'September',
    'Oct': 'Oktober', 'Nov': 'November', 'Dec': 'Dezember'
  };
  
  // Versuche verschiedene Formate zu erkennen
  let newDate = dateStr;
  
  // Format: "January 1" oder "January 1, 2025"
  const englishPattern = /^(\w+)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/;
  const englishMatch = dateStr.match(englishPattern);
  if (englishMatch) {
    const [, month, day] = englishMatch;
    const germanMonth = monthMap[month] || month;
    newDate = `${day}. ${germanMonth}`;
  }
  
  // Format: "1 January" oder "1 January 2025"
  const englishPattern2 = /^(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?$/;
  const englishMatch2 = dateStr.match(englishPattern2);
  if (englishMatch2) {
    const [, day, month] = englishMatch2;
    const germanMonth = monthMap[month] || month;
    newDate = `${day}. ${germanMonth}`;
  }
  
  // Entferne Jahr, falls vorhanden (für Konsistenz)
  newDate = newDate.replace(/,?\s*\d{4}$/, '').trim();
  
  return newDate;
};

/**
 * Migriert und repariert Daten, die möglicherweise durch Verschlüsselungsprobleme beschädigt wurden
 * @param {Array} data - Array von Messungen
 * @returns {Array} - Reparierte Daten
 */
export const repairMeasurementData = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(entry => {
    // Erstelle eine Kopie des Eintrags
    const repaired = { ...entry };
    
    // Migriere ID falls nötig
    if (repaired.id) {
      repaired.id = migrateId(repaired.id);
    } else {
      // Generiere neue ID wenn keine vorhanden
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      repaired.id = `bp_${timestamp}_${random}_generated`;
    }
    
    // Migriere Datumsformat
    if (repaired.datum) {
      repaired.datum = migrateDateFormat(repaired.datum);
    }
    
    // Stelle sicher, dass tag vorhanden ist
    if (!repaired.tag && repaired.datum) {
      // Versuche Wochentag aus Datum zu extrahieren oder setze Default
      const wochentage = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const today = new Date();
      repaired.tag = wochentage[today.getDay()];
    }
    
    // Liste der numerischen Felder
    const numericFields = ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls'];
    
    // Versuche jedes Feld zu reparieren
    numericFields.forEach(field => {
      const value = repaired[field];
      
      // Wenn der Wert undefined, null oder 0 ist, lasse ihn
      if (value === undefined || value === null || value === 0) {
        repaired[field] = null;
        return;
      }
      
      // Wenn es bereits eine gültige Zahl ist
      if (typeof value === 'number' && value > 0) {
        return; // Alles gut
      }
      
      // Wenn es ein String ist, versuche zu konvertieren
      if (typeof value === 'string') {
        // Versuche zuerst normale Konvertierung
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) {
          repaired[field] = numValue;
        } else {
          // Könnte verschlüsselt sein, versuche zu entschlüsseln
          try {
            const decrypted = decryptSensitiveFields({ [field]: value });
            if (decrypted[field] && typeof decrypted[field] === 'number') {
              repaired[field] = decrypted[field];
            } else {
              repaired[field] = null;
            }
          } catch (e) {
            // Entschlüsselung fehlgeschlagen, setze auf null
            console.warn(`Konnte Feld ${field} nicht entschlüsseln:`, e);
            repaired[field] = null;
          }
        }
      }
    });
    
    // Stelle sicher, dass notizen ein String ist
    if (repaired.notizen && typeof repaired.notizen !== 'string') {
      repaired.notizen = String(repaired.notizen);
    }
    
    // Entferne _standardDate falls vorhanden (wird später neu generiert)
    delete repaired._standardDate;
    
    return repaired;
  });
};

/**
 * Prüft ob die Daten Migrationsprobleme haben
 * @param {Array} data - Array von Messungen
 * @returns {boolean} - True wenn Migration benötigt wird
 */
export const needsDataRepair = (data) => {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  return data.some(entry => {
    // Prüfe auf alte ID-Formate
    if (entry.id && (typeof entry.id === 'number' || !entry.id.startsWith('bp_'))) {
      return true;
    }
    
    // Prüfe auf englische Datumsformate
    if (entry.datum && /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(entry.datum)) {
      return true;
    }
    
    // Prüfe auf fehlenden Wochentag
    if (!entry.tag) {
      return true;
    }
    
    // Prüfe ob irgendwelche Einträge verschlüsselte Strings in numerischen Feldern haben
    const numericFields = ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls'];
    
    return numericFields.some(field => {
      const value = entry[field];
      // Wenn es ein String ist und nicht numerisch
      return value && typeof value === 'string' && isNaN(Number(value));
    });
  });
};

/**
 * Migriert alte localStorage-Daten in das neue Format
 * Diese Funktion sollte beim App-Start aufgerufen werden
 * @returns {Promise<boolean>} - True wenn Migration durchgeführt wurde
 */
export const migrateOldDataFormats = async () => {
  try {
    // Prüfe ob alte Daten im localStorage existieren
    const oldMessungen = localStorage.getItem('blutdruck_messungen');
    if (!oldMessungen) {
      return false; // Keine Daten zu migrieren
    }
    
    let data;
    try {
      data = JSON.parse(oldMessungen);
    } catch (e) {
      console.error('Konnte alte Daten nicht parsen:', e);
      return false;
    }
    
    // Prüfe ob Migration benötigt wird
    if (!needsDataRepair(data)) {
      console.log('Keine Migration erforderlich');
      return false;
    }
    
    console.log('Starte Datenmigration für', data.length, 'Einträge');
    
    // Erstelle Backup
    const backupKey = `blutdruck_messungen_backup_${Date.now()}`;
    localStorage.setItem(backupKey, oldMessungen);
    
    // Migriere die Daten
    const migratedData = repairMeasurementData(data);
    
    // Speichere die migrierten Daten
    localStorage.setItem('blutdruck_messungen', JSON.stringify(migratedData));
    
    // Markiere Migration als abgeschlossen
    localStorage.setItem('blutdruck_migration_completed', new Date().toISOString());
    
    console.log('Migration erfolgreich abgeschlossen');
    
    // Optional: Lösche sehr alte Backups (älter als 30 Tage)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('blutdruck_messungen_backup_')) {
        const timestamp = parseInt(key.split('_').pop());
        if (timestamp < thirtyDaysAgo) {
          localStorage.removeItem(key);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Fehler bei der Datenmigration:', error);
    return false;
  }
};