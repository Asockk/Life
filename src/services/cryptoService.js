// Crypto Service for encrypting sensitive health data
class CryptoService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12;
    this.saltLength = 16;
    this.tagLength = 128;
    this.pbkdf2Iterations = 100000;
  }

  // Generate a random salt
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(this.saltLength));
  }

  // Generate IV (Initialization Vector)
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  // Derive key from password
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.pbkdf2Iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt data
  async encrypt(data, password) {
    try {
      const encoder = new TextEncoder();
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = await this.deriveKey(password, salt);
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength
        },
        key,
        encoder.encode(JSON.stringify(data))
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Verschlüsselung fehlgeschlagen');
    }
  }

  // Decrypt data
  async decrypt(encryptedData, password) {
    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const encrypted = combined.slice(this.saltLength + this.ivLength);
      
      const key = await this.deriveKey(password, salt);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Entschlüsselung fehlgeschlagen - falsches Passwort?');
    }
  }

  // Check if encryption is available
  isAvailable() {
    return window.crypto && window.crypto.subtle;
  }

  // Generate a secure password
  generateSecurePassword() {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const length = 16;
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    
    return Array.from(randomValues)
      .map(byte => charset[byte % charset.length])
      .join('');
  }

  // Hash password for verification (not for encryption)
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
}

// Singleton instance
const cryptoService = new CryptoService();

// Encrypted Storage Service
class EncryptedStorageService {
  constructor() {
    this.cryptoService = cryptoService;
    this.isEnabled = false;
    this.sessionPassword = null;
  }

  // Enable encryption with password
  async enableEncryption(password) {
    if (!this.cryptoService.isAvailable()) {
      throw new Error('Verschlüsselung wird von diesem Browser nicht unterstützt');
    }

    try {
      // Store password hash for verification
      const passwordHash = await this.cryptoService.hashPassword(password);
      localStorage.setItem('bp_encryption_hash', passwordHash);
      localStorage.setItem('bp_encryption_enabled', 'true');
      
      this.sessionPassword = password;
      this.isEnabled = true;

      // Encrypt existing data
      await this.encryptExistingData();

      return true;
    } catch (error) {
      console.error('Failed to enable encryption:', error);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    const storedHash = localStorage.getItem('bp_encryption_hash');
    if (!storedHash) return false;
    
    const passwordHash = await this.cryptoService.hashPassword(password);
    return passwordHash === storedHash;
  }

  // Unlock with password
  async unlock(password) {
    const isValid = await this.verifyPassword(password);
    if (!isValid) {
      throw new Error('Falsches Passwort');
    }
    
    this.sessionPassword = password;
    this.isEnabled = true;
    return true;
  }

  // Lock (clear session password)
  lock() {
    this.sessionPassword = null;
  }

  // Disable encryption
  async disableEncryption(password) {
    const isValid = await this.verifyPassword(password);
    if (!isValid) {
      throw new Error('Falsches Passwort');
    }

    try {
      // Decrypt all data first
      await this.decryptAllData(password);
      
      // Remove encryption markers
      localStorage.removeItem('bp_encryption_hash');
      localStorage.removeItem('bp_encryption_enabled');
      
      this.sessionPassword = null;
      this.isEnabled = false;
      
      return true;
    } catch (error) {
      console.error('Failed to disable encryption:', error);
      throw error;
    }
  }

  // Check if encryption is enabled
  isEncryptionEnabled() {
    return localStorage.getItem('bp_encryption_enabled') === 'true';
  }

  // Save encrypted data
  async saveEncrypted(key, data) {
    if (!this.isEnabled || !this.sessionPassword) {
      // Fall back to unencrypted storage
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }

    try {
      const encrypted = await this.cryptoService.encrypt(data, this.sessionPassword);
      localStorage.setItem(key + '_encrypted', encrypted);
      localStorage.removeItem(key); // Remove unencrypted version
    } catch (error) {
      console.error('Encryption failed, saving unencrypted:', error);
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Load encrypted data
  async loadEncrypted(key) {
    const encryptedKey = key + '_encrypted';
    
    // Check for encrypted version first
    if (localStorage.getItem(encryptedKey)) {
      if (!this.isEnabled || !this.sessionPassword) {
        throw new Error('Daten sind verschlüsselt - bitte erst entsperren');
      }
      
      try {
        const encrypted = localStorage.getItem(encryptedKey);
        return await this.cryptoService.decrypt(encrypted, this.sessionPassword);
      } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
      }
    }
    
    // Fall back to unencrypted data
    const unencrypted = localStorage.getItem(key);
    if (unencrypted) {
      try {
        return JSON.parse(unencrypted);
      } catch (e) {
        return null;
      }
    }
    
    return null;
  }

  // Encrypt existing unencrypted data
  async encryptExistingData() {
    const keys = ['blutdruck_measurements', 'blutdruck_contextFactors'];
    
    for (const key of keys) {
      const unencrypted = localStorage.getItem(key);
      if (unencrypted) {
        try {
          const data = JSON.parse(unencrypted);
          await this.saveEncrypted(key, data);
        } catch (error) {
          console.error(`Failed to encrypt ${key}:`, error);
        }
      }
    }
  }

  // Decrypt all data (when disabling encryption)
  async decryptAllData(password) {
    const keys = ['blutdruck_measurements', 'blutdruck_contextFactors'];
    
    for (const key of keys) {
      const encryptedKey = key + '_encrypted';
      const encrypted = localStorage.getItem(encryptedKey);
      
      if (encrypted) {
        try {
          const data = await this.cryptoService.decrypt(encrypted, password);
          localStorage.setItem(key, JSON.stringify(data));
          localStorage.removeItem(encryptedKey);
        } catch (error) {
          console.error(`Failed to decrypt ${key}:`, error);
          throw error;
        }
      }
    }
  }

  // Get encryption status
  getStatus() {
    return {
      available: this.cryptoService.isAvailable(),
      enabled: this.isEncryptionEnabled(),
      unlocked: this.isEnabled && this.sessionPassword !== null
    };
  }
}

export const encryptedStorage = new EncryptedStorageService();
export default cryptoService;