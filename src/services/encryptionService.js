// services/encryptionService.js
import CryptoJS from 'crypto-js';

// Generiere einen eindeutigen Schlüssel basierend auf Browser-Fingerprint
const generateDeviceKey = () => {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Füge einen festen Salt hinzu für zusätzliche Sicherheit
    salt: 'blutdruck-tracker-2025'
  };
  
  // Erstelle einen Hash aus den Geräteinformationen
  return CryptoJS.SHA256(JSON.stringify(deviceInfo)).toString();
};

// Hole oder erstelle einen Verschlüsselungsschlüssel
const getEncryptionKey = () => {
  let key = sessionStorage.getItem('blutdruck_encryption_key');
  
  if (!key) {
    // Generiere einen neuen Schlüssel für diese Session
    key = generateDeviceKey();
    sessionStorage.setItem('blutdruck_encryption_key', key);
  }
  
  return key;
};

// Verschlüssele Daten
export const encryptData = (data) => {
  try {
    if (!data) return null;
    
    const key = getEncryptionKey();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Verschlüssele mit AES
    const encrypted = CryptoJS.AES.encrypt(dataString, key).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Fehler beim Verschlüsseln:', error);
    // Im Fehlerfall gebe unverschlüsselte Daten zurück (Fallback)
    return data;
  }
};

// Entschlüssele Daten
export const decryptData = (encryptedData) => {
  try {
    if (!encryptedData) return null;
    
    // Prüfe ob die Daten bereits unverschlüsselt sind
    // (Zahlen oder bereits geparste Objekte)
    if (typeof encryptedData === 'number' || 
        (typeof encryptedData === 'object' && encryptedData !== null)) {
      return encryptedData;
    }
    
    // Prüfe ob es ein numerischer String ist (unverschlüsselt)
    if (typeof encryptedData === 'string' && !isNaN(Number(encryptedData))) {
      return encryptedData;
    }
    
    const key = getEncryptionKey();
    
    // Entschlüssele mit AES
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Wenn die Entschlüsselung einen leeren String ergibt, 
    // waren die Daten wahrscheinlich nicht verschlüsselt
    if (!decryptedString) {
      return encryptedData;
    }
    
    // Versuche JSON zu parsen, falls möglich
    try {
      return JSON.parse(decryptedString);
    } catch {
      // Wenn es kein JSON ist, gebe den String zurück
      return decryptedString;
    }
  } catch (error) {
    console.warn('Entschlüsselung fehlgeschlagen, verwende Originalwert:', error.message);
    // Im Fehlerfall gebe die Originaldaten zurück
    return encryptedData;
  }
};

// Verschlüssele sensible Felder in einem Objekt
export const encryptSensitiveFields = (obj, sensitiveFields = ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls', 'notizen']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const encrypted = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      // Prüfe ob der Wert bereits verschlüsselt ist (String statt Zahl)
      if (field !== 'notizen' && typeof encrypted[field] === 'string' && isNaN(Number(encrypted[field]))) {
        // Wert ist wahrscheinlich bereits verschlüsselt, nichts zu tun
        return;
      }
      
      encrypted[field] = encryptData(encrypted[field]);
    }
  });
  
  return encrypted;
};

// Entschlüssele sensible Felder in einem Objekt
export const decryptSensitiveFields = (obj, sensitiveFields = ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls', 'notizen']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const decrypted = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      // Prüfe ob der Wert bereits eine Zahl ist (unverschlüsselt)
      if (field !== 'notizen' && typeof decrypted[field] === 'number') {
        // Wert ist bereits entschlüsselt, nichts zu tun
        return;
      }
      
      // Versuche zu entschlüsseln
      const decryptedValue = decryptData(decrypted[field]);
      
      // Konvertiere numerische Werte zurück zu Zahlen
      if (field !== 'notizen' && decryptedValue !== null) {
        const numValue = Number(decryptedValue);
        // Wenn Konvertierung fehlschlägt, behalte den Originalwert
        decrypted[field] = !isNaN(numValue) ? numValue : decrypted[field];
      } else {
        decrypted[field] = decryptedValue;
      }
    }
  });
  
  return decrypted;
};

// Prüfe ob Verschlüsselung verfügbar ist
export const isEncryptionAvailable = () => {
  try {
    // Teste Verschlüsselung
    const testData = 'test';
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    return decrypted === testData;
  } catch {
    return false;
  }
};

// Zeige Verschlüsselungsstatus
export const getEncryptionStatus = () => {
  const available = isEncryptionAvailable();
  const keyExists = !!sessionStorage.getItem('blutdruck_encryption_key');
  
  return {
    available,
    active: available && keyExists,
    algorithm: 'AES-256',
    keyStorage: 'Session Storage'
  };
};