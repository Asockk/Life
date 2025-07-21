import cryptoService, { encryptedStorage } from '../cryptoService';

// Mock TextEncoder/TextDecoder
global.TextEncoder = class {
  encode(text) {
    return new Uint8Array([...text].map(char => char.charCodeAt(0)));
  }
};

global.TextDecoder = class {
  decode(data) {
    return String.fromCharCode(...new Uint8Array(data));
  }
};

// Mock crypto API
global.crypto = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    digest: jest.fn()
  }
};

describe('CryptoService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Basic Crypto Functions', () => {
    test('generates random salt', () => {
      const salt1 = cryptoService.generateSalt();
      const salt2 = cryptoService.generateSalt();
      
      expect(salt1).toBeInstanceOf(Uint8Array);
      expect(salt1.length).toBe(16);
      expect(salt1).not.toEqual(salt2); // Should be different
    });

    test('generates random IV', () => {
      const iv = cryptoService.generateIV();
      
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
    });

    test('checks if crypto is available', () => {
      expect(cryptoService.isAvailable()).toBeTruthy();
    });

    test('generates secure password', () => {
      const password = cryptoService.generateSecurePassword();
      
      expect(password).toHaveLength(16);
      expect(password).toMatch(/[a-zA-Z0-9!@#$%^&*]+/);
    });
  });

  describe('Encryption and Decryption', () => {
    test('encrypts and decrypts data successfully', async () => {
      const testData = {
        measurements: [
          { id: 1, sys: 120, dia: 80 },
          { id: 2, sys: 130, dia: 85 }
        ],
        sensitive: 'This is sensitive health data'
      };
      const password = 'TestPassword123!';

      // Mock crypto operations
      const mockKey = 'mock-key';
      const mockEncrypted = new ArrayBuffer(100);
      const mockDecrypted = new TextEncoder().encode(JSON.stringify(testData));

      crypto.subtle.importKey.mockResolvedValue('password-key');
      crypto.subtle.deriveKey.mockResolvedValue(mockKey);
      crypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
      crypto.subtle.decrypt.mockResolvedValue(mockDecrypted);

      // Encrypt
      const encrypted = await cryptoService.encrypt(testData, password);
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string'); // Base64 string

      // Decrypt
      const decrypted = await cryptoService.decrypt(encrypted, password);
      expect(decrypted).toEqual(testData);
    });

    test('fails to decrypt with wrong password', async () => {
      const testData = { secret: 'data' };
      const correctPassword = 'correct123';
      const wrongPassword = 'wrong456';

      crypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));

      // Encrypt with correct password
      const encrypted = await cryptoService.encrypt(testData, correctPassword);

      // Try to decrypt with wrong password
      await expect(cryptoService.decrypt(encrypted, wrongPassword))
        .rejects.toThrow('Entschlüsselung fehlgeschlagen');
    });
  });
});

describe('EncryptedStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    encryptedStorage.isEnabled = false;
    encryptedStorage.sessionPassword = null;
  });

  test('enables encryption with password', async () => {
    const password = 'SecurePass123!';
    
    // Mock hash function
    crypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
    
    const result = await encryptedStorage.enableEncryption(password);
    
    expect(result).toBe(true);
    expect(localStorage.getItem('bp_encryption_enabled')).toBe('true');
    expect(localStorage.getItem('bp_encryption_hash')).toBeTruthy();
    expect(encryptedStorage.isEnabled).toBe(true);
    expect(encryptedStorage.sessionPassword).toBe(password);
  });

  test('verifies password correctly', async () => {
    const password = 'TestPass123';
    
    // Mock consistent hash
    const mockHash = btoa('mock-hash');
    crypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
    jest.spyOn(cryptoService, 'hashPassword').mockResolvedValue(mockHash);
    
    // Enable encryption
    await encryptedStorage.enableEncryption(password);
    
    // Verify correct password
    const isValid = await encryptedStorage.verifyPassword(password);
    expect(isValid).toBe(true);
    
    // Verify wrong password
    jest.spyOn(cryptoService, 'hashPassword').mockResolvedValue('different-hash');
    const isInvalid = await encryptedStorage.verifyPassword('wrongpass');
    expect(isInvalid).toBe(false);
  });

  test('saves and loads encrypted data', async () => {
    const password = 'TestPass123';
    const testData = { 
      measurements: [{ id: 1, sys: 120, dia: 80 }] 
    };
    
    // Enable encryption
    encryptedStorage.isEnabled = true;
    encryptedStorage.sessionPassword = password;
    
    // Mock encrypt/decrypt
    jest.spyOn(cryptoService, 'encrypt').mockResolvedValue('encrypted-data');
    jest.spyOn(cryptoService, 'decrypt').mockResolvedValue(testData);
    
    // Save encrypted
    await encryptedStorage.saveEncrypted('test-key', testData);
    expect(localStorage.getItem('test-key_encrypted')).toBe('encrypted-data');
    expect(localStorage.getItem('test-key')).toBeNull();
    
    // Load encrypted
    const loaded = await encryptedStorage.loadEncrypted('test-key');
    expect(loaded).toEqual(testData);
  });

  test('falls back to unencrypted when encryption is disabled', async () => {
    const testData = { test: 'data' };
    
    // Encryption disabled
    encryptedStorage.isEnabled = false;
    
    // Save - should use regular localStorage
    await encryptedStorage.saveEncrypted('test-key', testData);
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify(testData));
    expect(localStorage.getItem('test-key_encrypted')).toBeNull();
    
    // Load
    const loaded = await encryptedStorage.loadEncrypted('test-key');
    expect(loaded).toEqual(testData);
  });

  test('throws error when trying to load encrypted data without password', async () => {
    // Set up encrypted data
    localStorage.setItem('bp_encryption_enabled', 'true');
    localStorage.setItem('test-key_encrypted', 'encrypted-data');
    
    // Try to load without password
    encryptedStorage.isEnabled = false;
    
    await expect(encryptedStorage.loadEncrypted('test-key'))
      .rejects.toThrow('Daten sind verschlüsselt - bitte erst entsperren');
  });

  test('gets correct encryption status', () => {
    // Not enabled
    let status = encryptedStorage.getStatus();
    expect(status.enabled).toBe(false);
    expect(status.unlocked).toBe(false);
    expect(status.available).toBeTruthy();
    
    // Enabled but locked
    localStorage.setItem('bp_encryption_enabled', 'true');
    status = encryptedStorage.getStatus();
    expect(status.enabled).toBe(true);
    expect(status.unlocked).toBe(false);
    expect(status.available).toBeTruthy();
    
    // Enabled and unlocked
    encryptedStorage.isEnabled = true;
    encryptedStorage.sessionPassword = 'test';
    status = encryptedStorage.getStatus();
    expect(status.enabled).toBe(true);
    expect(status.unlocked).toBe(true);
    expect(status.available).toBeTruthy();
  });
});