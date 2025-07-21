// services/storageService.js
// Service für die lokale Datenpersistenz mit IndexedDB und localStorage Fallback
import { encryptSensitiveFields, decryptSensitiveFields } from './encryptionService';
import { repairMeasurementData, needsDataRepair } from '../utils/dataMigration';

// Database Constants
const DB_NAME = 'BlutdruckTrackerDB';
const DB_VERSION = 1;
const STORES = {
  MEASUREMENTS: 'messungen',
  CONTEXT_FACTORS: 'kontextfaktoren',
  SETTINGS: 'einstellungen'
};

/**
 * Standardisiertes Datumsformat für internen Vergleich
 * @param {string} dateStr - Datumsstring im Format "26. Februar 2025" oder ähnlich
 * @param {string} tag - Wochentag (z.B. "Mi", "Do")
 * @returns {string} Standardisiertes Datum im Format "YYYY-Tag-DD-MM"
 */
function standardizeDateFormat(dateStr, tag) {
  if (!dateStr || !tag) return null;
  
  try {
    // Jahr extrahieren
    let year = null;
    if (dateStr.match(/\b(20\d{2})\b/)) {
      year = dateStr.match(/\b(20\d{2})\b/)[1];
    } else {
      // Aktuelles Jahr als Fallback
      year = new Date().getFullYear();
    }
    
    // Tag und Monat extrahieren
    let day, month;
    
    // Format "26. Februar 2025"
    if (dateStr.includes('.')) {
      const parts = dateStr.split('. ');
      day = parts[0].trim();
      
      if (parts.length > 1) {
        const monthParts = parts[1].split(' ');
        month = monthParts[0].trim();
      }
    }
    // Format "Februar 26 2025"
    else if (dateStr.includes(' ')) {
      const parts = dateStr.split(' ');
      month = parts[0].trim();
      
      // Behandle Fälle, wo das Tag Kommas oder andere Zeichen enthalten könnte
      if (parts.length > 1) {
        day = parts[1].replace(/,/g, '').trim();
      }
    }
    
    // Fallback, wenn Tag oder Monat nicht extrahiert werden konnten
    if (!day || !month) {
      console.warn('Konnte Tag oder Monat nicht aus dem Datum extrahieren:', dateStr);
      // Versuche, wenigstens einen vernünftigen Wert zurückzugeben
      day = day || '01';
      month = month || 'Januar';
    }
    
    // Monat in Zahl umwandeln
    const monthMap = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12',
      // Englische Monatsnamen für den Fall, dass das JSON englische Daten enthält
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const monthNum = monthMap[month];
    if (!monthNum) {
      console.warn('Unbekannter Monat:', month);
      // Fallback auf Januar
      return `${year}-${tag}-${day.padStart(2, '0')}-01`;
    }
    
    // Tag mit führender Null
    const dayWithZero = day.padStart(2, '0');
    
    // Einheitliches Format: "YYYY-Tag-DD-MM"
    return `${year}-${tag}-${dayWithZero}-${monthNum}`;
  } catch (error) {
    console.error('Fehler bei der Datumsstandarisierung:', error, dateStr, tag);
    // Fallback auf ein einfaches Format mit dem heutigen Datum
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${tag}-${day}-${month}`;
  }
}

/**
 * Initialisiert die IndexedDB-Datenbank und erstellt die benötigten Stores
 * @returns {Promise} Promise mit der DB-Verbindung oder Error
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('Ihr Browser unterstützt IndexedDB nicht. Fallback auf localStorage.');
      return reject(new Error('IndexedDB wird nicht unterstützt'));
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    // Error-Handler
    request.onerror = (event) => {
      console.error('IndexedDB-Fehler:', event.target.error);
      reject(new Error('Fehler beim Öffnen der IndexedDB'));
    };
    
    // Upgrade-Handler (bei erster Installation oder Versionsänderung)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.MEASUREMENTS)) {
        db.createObjectStore(STORES.MEASUREMENTS, { keyPath: 'id' });
        console.log('Messungen-Store erstellt');
      }
      
      if (!db.objectStoreNames.contains(STORES.CONTEXT_FACTORS)) {
        // Für Kontextfaktoren, verwenden wir das Datum als Schlüssel
        db.createObjectStore(STORES.CONTEXT_FACTORS, { keyPath: 'datum' });
        console.log('Kontextfaktoren-Store erstellt');
      }
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        console.log('Einstellungen-Store erstellt');
      }
    };
    
    // Success-Handler
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // Event-Handler für Datenbankfehler
      db.onerror = (event) => {
        console.error('Datenbankfehler:', event.target.errorCode);
      };
      
      resolve(db);
    };
  });
}

// ======================================================================
// Funktionen für Messungen (Blutdruckwerte)
// ======================================================================

/**
 * Speichert alle Blutdruckmessungen (transaktional und sicher)
 * @param {Array} data Array von Messungs-Objekten
 * @returns {Promise<boolean>} Erfolg der Operation
 */
export async function saveMeasurements(data) {
  console.log('[STORAGE] saveMeasurements called with:', data);
  try {
    // Sicherstellen, dass wir ein Array haben
    if (!Array.isArray(data)) {
      throw new Error('Daten müssen in einem Array geliefert werden');
    }
    
    // Ensure all measurements have a standardized date in the CORRECT format
    const enhancedData = data.map(measurement => {
      // Immer das _standardDate aktualisieren mit der lokalen Funktion
      const standardDate = standardizeDateFormat(measurement.datum, measurement.tag);
      // TEMPORÄR: Verschlüsselung deaktiviert wegen Datenproblemen
      // const encrypted = encryptSensitiveFields({ ...measurement, _standardDate: standardDate });
      // return encrypted;
      return { ...measurement, _standardDate: standardDate };
    });
    
    const db = await initDB();
    
    // WICHTIG: Erst alte Daten sichern, bevor wir löschen
    const backupData = await loadMeasurementsInternal(db);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.MEASUREMENTS], 'readwrite');
      const store = transaction.objectStore(STORES.MEASUREMENTS);
      
      // Transaktion als atomare Operation
      let addedCount = 0;
      const errors = [];
      
      // Schritt 1: Alte Daten löschen
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Schritt 2: Neue Daten hinzufügen
        enhancedData.forEach((measurement, index) => {
          const addRequest = store.add(measurement);
          
          addRequest.onsuccess = () => {
            addedCount++;
          };
          
          addRequest.onerror = (event) => {
            errors.push(`Fehler bei Messung ${index}: ${event.target.error}`);
          };
        });
      };
      
      clearRequest.onerror = (event) => {
        // Wenn Clear fehlschlägt, brechen wir ab
        reject(new Error(`Fehler beim Löschen alter Daten: ${event.target.error}`));
      };
      
      transaction.oncomplete = async () => {
        if (addedCount === enhancedData.length) {
          console.log(`${addedCount} Messungen erfolgreich gespeichert`);
          resolve(true);
        } else {
          // Nicht alle Daten konnten gespeichert werden
          console.error('Nicht alle Messungen konnten gespeichert werden:', errors);
          
          // Versuche Backup wiederherzustellen
          try {
            await restoreMeasurementsBackup(backupData);
            reject(new Error(`Speichern fehlgeschlagen. Backup wiederhergestellt. Fehler: ${errors.join(', ')}}`));
          } catch (restoreError) {
            reject(new Error(`Speichern und Backup-Wiederherstellung fehlgeschlagen: ${errors.join(', ')}}`));
          }
        }
      };
      
      transaction.onerror = async (event) => {
        console.error('Transaktion fehlgeschlagen:', event.target.error);
        
        // Versuche Backup wiederherzustellen
        try {
          await restoreMeasurementsBackup(backupData);
          reject(new Error(`Transaktion fehlgeschlagen. Backup wiederhergestellt.`));
        } catch (restoreError) {
          reject(new Error(`Transaktion und Backup-Wiederherstellung fehlgeschlagen`));
        }
      };
    });
  } catch (error) {
    console.error('Fehler bei saveMeasurements:', error);
    
    // Fallback auf localStorage mit Backup
    try {
      // Backup der alten Daten
      const oldData = localStorage.getItem('blutdruck_messungen');
      localStorage.setItem('blutdruck_messungen_backup', oldData || '[]');
      
      // TEMPORÄR: Verschlüsselung deaktiviert
      const dataToSave = data.map(measurement => {
        const standardDate = standardizeDateFormat(measurement.datum, measurement.tag);
        return { ...measurement, _standardDate: standardDate };
      });
      
      // Neue Daten speichern (mit Verschlüsselung wenn aktiviert)
      if (encryptedStorage.isEncryptionEnabled()) {
        await encryptedStorage.saveEncrypted('blutdruck_messungen', dataToSave);
      } else {
        localStorage.setItem('blutdruck_messungen', JSON.stringify(dataToSave));
      }
      console.log('Messungen in localStorage gespeichert (Fallback)');
      
      // Backup löschen nach erfolgreichem Speichern
      localStorage.removeItem('blutdruck_messungen_backup');
      return true;
    } catch (e) {
      console.error('Auch localStorage-Fallback fehlgeschlagen:', e);
      
      // Versuche Backup wiederherzustellen
      try {
        const backup = localStorage.getItem('blutdruck_messungen_backup');
        if (backup) {
          localStorage.setItem('blutdruck_messungen', backup);
        }
      } catch (restoreError) {
        console.error('Backup-Wiederherstellung fehlgeschlagen:', restoreError);
      }
      
      return false;
    }
  }
}

/**
 * Interne Funktion zum Laden von Messungen mit bestehender DB-Verbindung
 * @param {IDBDatabase} db Offene Datenbankverbindung
 * @returns {Promise<Array>} Array aller Messungen
 */
async function loadMeasurementsInternal(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MEASUREMENTS], 'readonly');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = () => {
      reject(new Error('Fehler beim Laden der Messungen für Backup'));
    };
  });
}

/**
 * Stellt Messungen aus Backup wieder her
 * @param {Array} backupData Backup-Daten
 * @returns {Promise<boolean>} Erfolg der Operation
 */
async function restoreMeasurementsBackup(backupData) {
  if (!backupData || !Array.isArray(backupData) || backupData.length === 0) {
    return true; // Nichts wiederherzustellen
  }
  
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MEASUREMENTS], 'readwrite');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    
    // Lösche aktuelle (fehlerhafte) Daten
    store.clear();
    
    // Stelle Backup wieder her
    backupData.forEach(measurement => {
      store.add(measurement);
    });
    
    transaction.oncomplete = () => {
      console.log('Backup erfolgreich wiederhergestellt');
      resolve(true);
    };
    
    transaction.onerror = () => {
      reject(new Error('Fehler beim Wiederherstellen des Backups'));
    };
  });
}

/**
 * Lädt alle Blutdruckmessungen
 * @returns {Promise<Array>} Array aller Messungen
 */
export async function loadMeasurements() {
  console.log('[STORAGE] loadMeasurements called');
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.MEASUREMENTS], 'readonly');
      const store = transaction.objectStore(STORES.MEASUREMENTS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const measurements = request.result;
        
        // Ensure all loaded measurements have standardized dates in the CORRECT format
        let enhancedMeasurements = measurements.map(measurement => {
          // TEMPORÄR: Entschlüsselung deaktiviert
          // const decrypted = decryptSensitiveFields(measurement);
          const decrypted = measurement;
          
          // Repariere die Daten falls nötig
          const repaired = repairMeasurementData([decrypted])[0];
          
          // Immer das _standardDate aktualisieren mit der lokalen Funktion
          const standardDate = standardizeDateFormat(repaired.datum, repaired.tag);
          return { ...repaired, _standardDate: standardDate };
        });
        
        console.log(`${enhancedMeasurements.length} Messungen erfolgreich geladen`);
        resolve(enhancedMeasurements);
      };
      
      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Messungen'));
      };
    });
  } catch (error) {
    console.error('Fehler bei loadMeasurements:', error);
    
    // Fallback auf localStorage
    try {
      // Nur unverschlüsselte Daten aus localStorage laden
      const storedData = localStorage.getItem('blutdruck_messungen');
      let parsedData = storedData ? JSON.parse(storedData) : [];
      
      // Ensure all loaded measurements have standardized dates in the CORRECT format
      parsedData = parsedData.map(measurement => {
        // TEMPORÄR: Entschlüsselung deaktiviert
        // const decrypted = decryptSensitiveFields(measurement);
        const decrypted = measurement;
        
        // Repariere die Daten falls nötig
        const repaired = repairMeasurementData([decrypted])[0];
        
        // Immer das _standardDate aktualisieren mit der lokalen Funktion
        const standardDate = standardizeDateFormat(repaired.datum, repaired.tag);
        return { ...repaired, _standardDate: standardDate };
      });
      
      console.log(`${parsedData.length} Messungen aus localStorage geladen (Fallback)`);
      return parsedData;
    } catch (e) {
      console.error('Auch localStorage-Fallback fehlgeschlagen:', e);
      return [];
    }
  }
}

// ======================================================================
// Funktionen für Kontextfaktoren
// ======================================================================

/**
 * Kontextfaktoren-Objekt in normalisiertes Format umwandeln
 * @param {Object} contextFactors Kontextfaktoren-Objekt mit ISO-Datumsschlüsseln
 * @returns {Array} Array von Objekten mit Datum und Faktoren
 */
function normalizeContextFactors(contextFactors) {
  return Object.entries(contextFactors).map(([datum, factors]) => ({
    datum,
    ...factors
  }));
}

/**
 * Normalisiertes Kontextfaktoren-Array zurück in das ursprüngliche Format konvertieren
 * @param {Array} normalizedData Array von Objekten mit Datum und Faktoren
 * @returns {Object} Kontextfaktoren-Objekt mit ISO-Datumsschlüsseln
 */
function denormalizeContextFactors(normalizedData) {
  return normalizedData.reduce((result, item) => {
    const { datum, ...factors } = item;
    result[datum] = factors;
    return result;
  }, {});
}

/**
 * Speichert alle Kontextfaktoren (transaktional und sicher)
 * @param {Object} contextFactors Kontextfaktoren-Objekt
 * @returns {Promise<boolean>} Erfolg der Operation
 */
export async function saveContextFactors(contextFactors) {
  try {
    // Konvertiere das Objekt in ein Array von Einträgen für IndexedDB
    const normalizedData = normalizeContextFactors(contextFactors);
    
    const db = await initDB();
    
    // WICHTIG: Erst alte Daten sichern, bevor wir löschen
    const backupData = await loadContextFactorsInternal(db);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONTEXT_FACTORS], 'readwrite');
      const store = transaction.objectStore(STORES.CONTEXT_FACTORS);
      
      let addedCount = 0;
      const errors = [];
      
      // Schritt 1: Alte Daten löschen
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Schritt 2: Neue Daten hinzufügen
        normalizedData.forEach((entry, index) => {
          // TEMPORÄR: Verschlüsselung deaktiviert
          // const encryptedEntry = encryptData(entry);
          // const addRequest = store.add({ datum: entry.datum, encryptedData: encryptedEntry });
          const addRequest = store.add(entry);
          
          addRequest.onsuccess = () => {
            addedCount++;
          };
          
          addRequest.onerror = (event) => {
            errors.push(`Fehler bei Kontextfaktor ${index}: ${event.target.error}`);
          };
        });
      };
      
      clearRequest.onerror = (event) => {
        reject(new Error(`Fehler beim Löschen alter Kontextfaktoren: ${event.target.error}`));
      };
      
      transaction.oncomplete = async () => {
        if (addedCount === normalizedData.length) {
          console.log(`${addedCount} Kontextfaktoren erfolgreich gespeichert`);
          resolve(true);
        } else {
          console.error('Nicht alle Kontextfaktoren konnten gespeichert werden:', errors);
          
          // Versuche Backup wiederherzustellen
          try {
            await restoreContextFactorsBackup(backupData);
            reject(new Error(`Speichern fehlgeschlagen. Backup wiederhergestellt.`));
          } catch (restoreError) {
            reject(new Error(`Speichern und Backup-Wiederherstellung fehlgeschlagen`));
          }
        }
      };
      
      transaction.onerror = async (event) => {
        console.error('Transaktion fehlgeschlagen:', event.target.error);
        
        // Versuche Backup wiederherzustellen
        try {
          await restoreContextFactorsBackup(backupData);
          reject(new Error(`Transaktion fehlgeschlagen. Backup wiederhergestellt.`));
        } catch (restoreError) {
          reject(new Error(`Transaktion und Backup-Wiederherstellung fehlgeschlagen`));
        }
      };
    });
  } catch (error) {
    console.error('Fehler bei saveContextFactors:', error);
    
    // Fallback auf localStorage mit Backup
    try {
      // Backup der alten Daten
      const oldData = localStorage.getItem('blutdruck_kontextfaktoren');
      localStorage.setItem('blutdruck_kontextfaktoren_backup', oldData || '{}');
      
      // Kontextfaktoren direkt als JSON speichern
      localStorage.setItem('blutdruck_kontextfaktoren', JSON.stringify(contextFactors));
      console.log('Kontextfaktoren in localStorage gespeichert (Fallback)');
      
      // Backup löschen nach erfolgreichem Speichern
      localStorage.removeItem('blutdruck_kontextfaktoren_backup');
      return true;
    } catch (e) {
      console.error('Auch localStorage-Fallback fehlgeschlagen:', e);
      
      // Versuche Backup wiederherzustellen
      try {
        const backup = localStorage.getItem('blutdruck_kontextfaktoren_backup');
        if (backup) {
          localStorage.setItem('blutdruck_kontextfaktoren', backup);
        }
      } catch (restoreError) {
        console.error('Backup-Wiederherstellung fehlgeschlagen:', restoreError);
      }
      
      return false;
    }
  }
}

/**
 * Interne Funktion zum Laden von Kontextfaktoren mit bestehender DB-Verbindung
 * @param {IDBDatabase} db Offene Datenbankverbindung
 * @returns {Promise<Array>} Array aller Kontextfaktoren
 */
async function loadContextFactorsInternal(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONTEXT_FACTORS], 'readonly');
    const store = transaction.objectStore(STORES.CONTEXT_FACTORS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = () => {
      reject(new Error('Fehler beim Laden der Kontextfaktoren für Backup'));
    };
  });
}

/**
 * Stellt Kontextfaktoren aus Backup wieder her
 * @param {Array} backupData Backup-Daten
 * @returns {Promise<boolean>} Erfolg der Operation
 */
async function restoreContextFactorsBackup(backupData) {
  if (!backupData || !Array.isArray(backupData) || backupData.length === 0) {
    return true; // Nichts wiederherzustellen
  }
  
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONTEXT_FACTORS], 'readwrite');
    const store = transaction.objectStore(STORES.CONTEXT_FACTORS);
    
    // Lösche aktuelle (fehlerhafte) Daten
    store.clear();
    
    // Stelle Backup wieder her
    backupData.forEach(entry => {
      store.add(entry);
    });
    
    transaction.oncomplete = () => {
      console.log('Kontextfaktoren-Backup erfolgreich wiederhergestellt');
      resolve(true);
    };
    
    transaction.onerror = () => {
      reject(new Error('Fehler beim Wiederherstellen des Kontextfaktoren-Backups'));
    };
  });
}

/**
 * Lädt alle Kontextfaktoren
 * @returns {Promise<Object>} Kontextfaktoren-Objekt
 */
export async function loadContextFactors() {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CONTEXT_FACTORS], 'readonly');
      const store = transaction.objectStore(STORES.CONTEXT_FACTORS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const normalizedData = request.result;
        // TEMPORÄR: Entschlüsselung deaktiviert
        // const decryptedData = normalizedData.map(item => {
        //   if (item.encryptedData) {
        //     return decryptData(item.encryptedData);
        //   }
        //   return item;
        // });
        const contextFactors = denormalizeContextFactors(normalizedData);
        console.log(`${normalizedData.length} Kontextfaktoren erfolgreich geladen`);
        resolve(contextFactors);
      };
      
      request.onerror = () => {
        reject(new Error('Fehler beim Laden der Kontextfaktoren'));
      };
    });
  } catch (error) {
    console.error('Fehler bei loadContextFactors:', error);
    
    // Fallback auf localStorage
    try {
      const storedData = localStorage.getItem('blutdruck_kontextfaktoren');
      const parsedData = storedData ? JSON.parse(storedData) : {};
      console.log('Kontextfaktoren aus localStorage geladen (Fallback)');
      return parsedData;
    } catch (e) {
      console.error('Auch localStorage-Fallback fehlgeschlagen:', e);
      return {};
    }
  }
}

// ======================================================================
// Funktionen für App-Einstellungen
// ======================================================================

/**
 * Speichert eine Einstellung
 * @param {string} key Einstellungsschlüssel
 * @param {any} value Einstellungswert
 * @returns {Promise<boolean>} Erfolg der Operation
 */
export async function saveSetting(key, value) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      
      store.put({ key, value });
      
      transaction.oncomplete = () => {
        console.log(`Einstellung "${key}" erfolgreich gespeichert`);
        resolve(true);
      };
      
      transaction.onerror = () => {
        reject(new Error(`Fehler beim Speichern der Einstellung "${key}"`));
      };
    });
  } catch (error) {
    console.error(`Fehler bei saveSetting für "${key}":`, error);
    
    // Fallback auf localStorage
    try {
      localStorage.setItem(`blutdruck_setting_${key}`, JSON.stringify(value));
      console.log(`Einstellung "${key}" in localStorage gespeichert (Fallback)`);
      return true;
    } catch (e) {
      console.error('Auch localStorage-Fallback fehlgeschlagen:', e);
      return false;
    }
  }
}

/**
 * Lädt eine Einstellung
 * @param {string} key Einstellungsschlüssel
 * @param {any} defaultValue Standardwert, falls Einstellung nicht gefunden wird
 * @returns {Promise<any>} Einstellungswert oder defaultValue
 */
export async function loadSetting(key, defaultValue = null) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (request.result) {
          console.log(`Einstellung "${key}" erfolgreich geladen`);
          resolve(request.result.value);
        } else {
          console.log(`Einstellung "${key}" nicht gefunden, verwende Standardwert`);
          resolve(defaultValue);
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Fehler beim Laden der Einstellung "${key}"`));
      };
    });
  } catch (error) {
    console.error(`Fehler bei loadSetting für "${key}":`, error);
    
    // Fallback auf localStorage
    try {
      const storedValue = localStorage.getItem(`blutdruck_setting_${key}`);
      if (storedValue !== null) {
        const parsedValue = JSON.parse(storedValue);
        console.log(`Einstellung "${key}" aus localStorage geladen (Fallback)`);
        return parsedValue;
      }
      return defaultValue;
    } catch (e) {
      console.error('Auch localStorage-Fallback fehlgeschlagen:', e);
      return defaultValue;
    }
  }
}

// ======================================================================
// Export/Import Funktionen (Backup/Restore)
// ======================================================================

/**
 * Exportiert alle Daten als JSON-Datei
 * @returns {Promise<string>} Dateiname des Downloads
 */
export async function exportAllData() {
  try {
    const measurements = await loadMeasurements();
    const contextFactors = await loadContextFactors();
    
    // Ensure all measurements have a standardized date in the CORRECT format
    const enhancedMeasurements = measurements.map(entry => {
      // Immer das _standardDate aktualisieren mit der lokalen Funktion
      const standardDate = standardizeDateFormat(entry.datum, entry.tag);
      return { ...entry, _standardDate: standardDate };
    });
    
    // Einstellungen holen (optional)
    let settings = {};
    try {
      settings = {
        viewType: await loadSetting('viewType', 'morgen'),
        // Weitere Einstellungen hier...
      };
    } catch (error) {
      console.warn('Einstellungen konnten nicht exportiert werden:', error);
    }
    
    // Export-Daten zusammenstellen
    const exportData = {
      appVersion: '1.0',
      exportDate: new Date().toISOString(),
      measurements: enhancedMeasurements,
      contextFactors,
      settings
    };
    
    // Daten als JSON-Datei anbieten
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Download-Link erstellen und klicken
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `blutdruck_backup_${dateStr}.json`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Aufräumen
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return filename;
  } catch (error) {
    console.error('Fehler beim Exportieren aller Daten:', error);
    throw error;
  }
}

/**
 * Importiert Daten aus einer JSON-Datei
 * @param {string} jsonContent JSON-Inhalt als String
 * @returns {Promise<Object>} Ergebnisobjekt mit Erfolg und Anzahl der importierten Einträge
 */
export async function importAllData(jsonContent) {
  try {
    // JSON parsen
    let importData;
    try {
      importData = JSON.parse(jsonContent);
    } catch (err) {
      console.error('Fehler beim Parsen der JSON-Datei:', err);
      throw new Error('Die Datei enthält kein gültiges JSON-Format.');
    }
    
    // Daten validieren
    if (!importData.measurements || !Array.isArray(importData.measurements)) {
      throw new Error('Ungültiges Backup-Format: Messungen fehlen oder haben falsches Format');
    }
    
    console.log('Import: Backup mit', importData.measurements.length, 'Messungen geladen');
    
    // Sicherstellen, dass alle erforderlichen Felder vorhanden sind
    const validatedMeasurements = importData.measurements.filter(entry => {
      // Ein gültiger Eintrag muss mindestens id, tag und datum haben
      if (!entry.id || !entry.tag || !entry.datum) {
        console.warn('Import: Ungültiger Eintrag ignoriert:', entry);
        return false;
      }
      return true;
    });
    
    // Ensure standardized dates for all imported measurements in the CORRECT format
    const enhancedMeasurements = validatedMeasurements.map(entry => {
      try {
        // Immer das _standardDate aktualisieren mit der lokalen Funktion
        const standardDate = standardizeDateFormat(entry.datum, entry.tag);
        return { ...entry, _standardDate: standardDate };
      } catch (e) {
        console.warn('Import: Fehler bei der Standardisierung des Datums:', entry, e);
        // Trotzdem den Eintrag zurückgeben, aber mit einem Fallback-_standardDate
        return { 
          ...entry, 
          _standardDate: `${new Date().getFullYear()}-${entry.tag}-01-01` 
        };
      }
    });
    
    console.log('Import: Verarbeitet', enhancedMeasurements.length, 'gültige Messungen');
    
    try {
      // Messungen importieren (with enhanced measurements)
      await saveMeasurements(enhancedMeasurements);
      console.log('Import: Messungen erfolgreich gespeichert');
    } catch (e) {
      console.error('Import: Fehler beim Speichern der Messungen:', e);
      // Aber weitermachen mit dem Rest des Imports
    }
    
    // Kontextfaktoren importieren (falls vorhanden)
    if (importData.contextFactors && typeof importData.contextFactors === 'object') {
      try {
        await saveContextFactors(importData.contextFactors);
        console.log('Import: Kontextfaktoren erfolgreich gespeichert');
      } catch (e) {
        console.error('Import: Fehler beim Speichern der Kontextfaktoren:', e);
        // Aber weitermachen mit dem Rest des Imports
      }
    }
    
    // Einstellungen importieren (falls vorhanden)
    if (importData.settings && typeof importData.settings === 'object') {
      try {
        for (const [key, value] of Object.entries(importData.settings)) {
          await saveSetting(key, value);
        }
        console.log('Import: Einstellungen erfolgreich gespeichert');
      } catch (e) {
        console.error('Import: Fehler beim Speichern der Einstellungen:', e);
        // Aber weitermachen
      }
    }
    
    return {
      success: true,
      measurementsCount: enhancedMeasurements.length,
      contextFactorsCount: importData.contextFactors ? Object.keys(importData.contextFactors).length : 0,
      settingsCount: importData.settings ? Object.keys(importData.settings).length : 0
    };
  } catch (error) {
    console.error('Fehler beim Importieren der Daten:', error);
    throw error;
  }
}

/**
 * Löscht alle gespeicherten Daten (Factory Reset)
 * @returns {Promise<boolean>} Erfolg der Operation
 */
export async function clearAllData() {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      // Alle Stores in einer Transaktion leeren
      const transaction = db.transaction(
        [STORES.MEASUREMENTS, STORES.CONTEXT_FACTORS, STORES.SETTINGS], 
        'readwrite'
      );
      
      const measurementsStore = transaction.objectStore(STORES.MEASUREMENTS);
      const contextFactorsStore = transaction.objectStore(STORES.CONTEXT_FACTORS);
      const settingsStore = transaction.objectStore(STORES.SETTINGS);
      
      measurementsStore.clear();
      contextFactorsStore.clear();
      settingsStore.clear();
      
      transaction.oncomplete = () => {
        console.log('Alle Daten erfolgreich gelöscht');
        
        // Auch localStorage leeren (Fallback-Daten)
        localStorage.removeItem('blutdruck_messungen');
        localStorage.removeItem('blutdruck_kontextfaktoren');
        
        // Alle Einstellungen aus localStorage entfernen
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('blutdruck_setting_')) {
            localStorage.removeItem(key);
          }
        });
        
        resolve(true);
      };
      
      transaction.onerror = () => {
        reject(new Error('Fehler beim Löschen aller Daten'));
      };
    });
  } catch (error) {
    console.error('Fehler bei clearAllData:', error);
    
    // Fallback: Direkt localStorage leeren
    try {
      localStorage.removeItem('blutdruck_messungen');
      localStorage.removeItem('blutdruck_kontextfaktoren');
      
      // Alle Einstellungen aus localStorage entfernen
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('blutdruck_setting_')) {
          localStorage.removeItem(key);
        }
      });
      
      return true;
    } catch (e) {
      console.error('Auch localStorage-Fallback fehlgeschlagen:', e);
      return false;
    }
  }
}