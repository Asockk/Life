// services/__tests__/encryptionService.test.js
import {
  encryptData,
  decryptData,
  encryptSensitiveFields,
  decryptSensitiveFields,
  isEncryptionAvailable,
  getEncryptionStatus
} from '../encryptionService';

// Mock sessionStorage for tests
const mockSessionStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value;
  },
  clear: function() {
    this.store = {};
  }
};

// Replace global sessionStorage with mock
global.sessionStorage = mockSessionStorage;

describe('encryptData and decryptData', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  test('encrypts and decrypts string data correctly', () => {
    const originalData = 'This is sensitive data';
    const encrypted = encryptData(originalData);
    
    expect(encrypted).not.toBe(originalData);
    expect(typeof encrypted).toBe('string');
    
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(originalData);
  });

  test('encrypts and decrypts object data correctly', () => {
    const originalData = { 
      systolic: 120, 
      diastolic: 80,
      notes: 'Test notes'
    };
    
    const encrypted = encryptData(originalData);
    expect(encrypted).not.toBe(originalData);
    expect(typeof encrypted).toBe('string');
    
    const decrypted = decryptData(encrypted);
    expect(decrypted).toEqual(originalData);
  });

  test('handles null and undefined gracefully', () => {
    expect(encryptData(null)).toBe(null);
    expect(encryptData(undefined)).toBe(null);
    expect(decryptData(null)).toBe(null);
    expect(decryptData(undefined)).toBe(null);
  });

  test('handles empty strings', () => {
    const encrypted = encryptData('');
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe('');
  });

  test('handles numbers', () => {
    const originalData = 12345;
    const encrypted = encryptData(originalData);
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(originalData);
  });

  test('generates consistent encryption key per session', () => {
    const data = 'test data';
    const encrypted1 = encryptData(data);
    const encrypted2 = encryptData(data);
    
    // Same data encrypted twice in same session should produce different results
    // due to AES randomization, but both should decrypt to same value
    const decrypted1 = decryptData(encrypted1);
    const decrypted2 = decryptData(encrypted2);
    
    expect(decrypted1).toBe(data);
    expect(decrypted2).toBe(data);
  });

  test('handles legacy unencrypted data', () => {
    const legacyData = { test: 'data' };
    const legacyString = JSON.stringify(legacyData);
    
    // decryptData should handle unencrypted JSON strings
    const result = decryptData(legacyString);
    expect(result).toEqual(legacyData);
  });
});

describe('encryptSensitiveFields and decryptSensitiveFields', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  test('encrypts only sensitive fields', () => {
    const originalData = {
      id: 'test-123',
      datum: '26. Februar 2025',
      morgenSys: 120,
      morgenDia: 80,
      morgenPuls: 70,
      abendSys: 125,
      abendDia: 82,
      abendPuls: 72,
      notizen: 'Test notes'
    };
    
    const encrypted = encryptSensitiveFields(originalData);
    
    // Non-sensitive fields should remain unchanged
    expect(encrypted.id).toBe(originalData.id);
    expect(encrypted.datum).toBe(originalData.datum);
    
    // Sensitive fields should be encrypted
    expect(encrypted.morgenSys).not.toBe(originalData.morgenSys);
    expect(encrypted.morgenDia).not.toBe(originalData.morgenDia);
    expect(encrypted.morgenPuls).not.toBe(originalData.morgenPuls);
    expect(encrypted.abendSys).not.toBe(originalData.abendSys);
    expect(encrypted.abendDia).not.toBe(originalData.abendDia);
    expect(encrypted.abendPuls).not.toBe(originalData.abendPuls);
    expect(encrypted.notizen).not.toBe(originalData.notizen);
  });

  test('decrypts sensitive fields correctly', () => {
    const originalData = {
      id: 'test-123',
      datum: '26. Februar 2025',
      morgenSys: 120,
      morgenDia: 80,
      morgenPuls: 70,
      abendSys: 125,
      abendDia: 82,
      abendPuls: 72,
      notizen: 'Test notes'
    };
    
    const encrypted = encryptSensitiveFields(originalData);
    const decrypted = decryptSensitiveFields(encrypted);
    
    expect(decrypted).toEqual(originalData);
    
    // Verify numeric fields are numbers, not strings
    expect(typeof decrypted.morgenSys).toBe('number');
    expect(typeof decrypted.morgenDia).toBe('number');
    expect(typeof decrypted.morgenPuls).toBe('number');
  });

  test('handles missing sensitive fields', () => {
    const partialData = {
      id: 'test-123',
      datum: '26. Februar 2025',
      morgenSys: 120,
      morgenDia: 80
      // Missing other fields
    };
    
    const encrypted = encryptSensitiveFields(partialData);
    const decrypted = decryptSensitiveFields(encrypted);
    
    expect(decrypted.morgenSys).toBe(120);
    expect(decrypted.morgenDia).toBe(80);
    expect(decrypted.morgenPuls).toBeUndefined();
    expect(decrypted.abendSys).toBeUndefined();
  });

  test('handles null values in sensitive fields', () => {
    const dataWithNulls = {
      id: 'test-123',
      morgenSys: null,
      morgenDia: null,
      notizen: null
    };
    
    const encrypted = encryptSensitiveFields(dataWithNulls);
    const decrypted = decryptSensitiveFields(encrypted);
    
    expect(decrypted.morgenSys).toBe(null);
    expect(decrypted.morgenDia).toBe(null);
    expect(decrypted.notizen).toBe(null);
  });

  test('preserves original object if not an object', () => {
    expect(encryptSensitiveFields(null)).toBe(null);
    expect(encryptSensitiveFields('string')).toBe('string');
    expect(encryptSensitiveFields(123)).toBe(123);
    
    expect(decryptSensitiveFields(null)).toBe(null);
    expect(decryptSensitiveFields('string')).toBe('string');
    expect(decryptSensitiveFields(123)).toBe(123);
  });
});

describe('isEncryptionAvailable', () => {
  test('returns true when encryption works', () => {
    expect(isEncryptionAvailable()).toBe(true);
  });

  test('handles encryption failures gracefully', () => {
    // Mock encryptData to throw error
    const originalEncrypt = global.encryptData;
    global.encryptData = () => { throw new Error('Encryption failed'); };
    
    // Should return false instead of throwing
    expect(() => isEncryptionAvailable()).not.toThrow();
    
    // Restore original
    global.encryptData = originalEncrypt;
  });
});

describe('getEncryptionStatus', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  test('returns correct status when encryption is available', () => {
    const status = getEncryptionStatus();
    
    expect(status.available).toBe(true);
    expect(status.algorithm).toBe('AES-256');
    expect(status.keyStorage).toBe('Session Storage');
  });

  test('detects when encryption key exists', () => {
    // No key initially
    let status = getEncryptionStatus();
    expect(status.active).toBe(false);
    
    // Trigger key generation by encrypting something
    encryptData('test');
    
    // Now key should exist
    status = getEncryptionStatus();
    expect(status.active).toBe(true);
  });
});