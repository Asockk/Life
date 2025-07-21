// utils/__tests__/validationUtils.test.js
import { 
  validateBloodPressureEntry,
  validatePulseValue,
  validateNotesLength,
  validateDate,
  sanitizeNumericInput,
  isValidTimeFormat
} from '../validationUtils';

describe('validateBloodPressureEntry', () => {
  test('validates complete valid entry', () => {
    const entry = {
      morgenSys: 120,
      morgenDia: 80,
      morgenPuls: 70,
      abendSys: 125,
      abendDia: 82,
      abendPuls: 72,
      notizen: 'Feeling good'
    };
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('allows entry with only morning values', () => {
    const entry = {
      morgenSys: 120,
      morgenDia: 80,
      morgenPuls: 70
    };
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(true);
  });

  test('allows entry with only evening values', () => {
    const entry = {
      abendSys: 125,
      abendDia: 82,
      abendPuls: 72
    };
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(true);
  });

  test('rejects entry with no values', () => {
    const entry = {};
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Mindestens eine Messung (Morgen oder Abend) muss eingegeben werden');
  });

  test('validates blood pressure ranges', () => {
    const entry = {
      morgenSys: 300,
      morgenDia: 200,
      morgenPuls: 250
    };
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Morgenwerte außerhalb des plausiblen Bereichs');
    expect(result.errors).toContain('Morgenpuls außerhalb des plausiblen Bereichs (30-200)');
  });

  test('checks systolic > diastolic rule', () => {
    const entry = {
      morgenSys: 80,
      morgenDia: 120
    };
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Systolischer Wert muss höher als diastolischer Wert sein (Morgen)');
  });

  test('validates notes length', () => {
    const entry = {
      morgenSys: 120,
      morgenDia: 80,
      notizen: 'a'.repeat(501)
    };
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Notizen dürfen maximal 500 Zeichen lang sein');
  });

  test('handles null values correctly', () => {
    const entry = {
      morgenSys: null,
      morgenDia: null,
      abendSys: 120,
      abendDia: 80
    };
    
    const result = validateBloodPressureEntry(entry);
    expect(result.isValid).toBe(true);
  });
});

describe('validatePulseValue', () => {
  test('accepts valid pulse values', () => {
    expect(validatePulseValue(60)).toBe(true);
    expect(validatePulseValue(72)).toBe(true);
    expect(validatePulseValue(85)).toBe(true);
    expect(validatePulseValue(120)).toBe(true);
  });

  test('rejects invalid pulse values', () => {
    expect(validatePulseValue(25)).toBe(false);
    expect(validatePulseValue(220)).toBe(false);
    expect(validatePulseValue(0)).toBe(false);
    expect(validatePulseValue(-60)).toBe(false);
    expect(validatePulseValue(null)).toBe(false);
  });

  test('handles edge cases', () => {
    expect(validatePulseValue(30)).toBe(true); // minimum valid
    expect(validatePulseValue(200)).toBe(true); // maximum valid
    expect(validatePulseValue(29)).toBe(false);
    expect(validatePulseValue(201)).toBe(false);
  });
});

describe('validateNotesLength', () => {
  test('accepts valid note lengths', () => {
    expect(validateNotesLength('')).toBe(true);
    expect(validateNotesLength('Short note')).toBe(true);
    expect(validateNotesLength('a'.repeat(500))).toBe(true);
  });

  test('rejects too long notes', () => {
    expect(validateNotesLength('a'.repeat(501))).toBe(false);
    expect(validateNotesLength('a'.repeat(1000))).toBe(false);
  });

  test('handles null and undefined', () => {
    expect(validateNotesLength(null)).toBe(true);
    expect(validateNotesLength(undefined)).toBe(true);
  });
});

describe('validateDate', () => {
  test('accepts valid date strings', () => {
    expect(validateDate('26. Februar 2025')).toBe(true);
    expect(validateDate('1. Januar 2024')).toBe(true);
    expect(validateDate('31. Dezember 2023')).toBe(true);
  });

  test('handles null and empty values', () => {
    expect(validateDate(null)).toBe(false);
    expect(validateDate('')).toBe(false);
    expect(validateDate(undefined)).toBe(false);
  });

  test('accepts various date formats', () => {
    expect(validateDate('February 26 2025')).toBe(true);
    expect(validateDate('26 Feb 2025')).toBe(true);
  });
});

describe('sanitizeNumericInput', () => {
  test('sanitizes numeric strings correctly', () => {
    expect(sanitizeNumericInput('120')).toBe(120);
    expect(sanitizeNumericInput('80.5')).toBe(80);
    expect(sanitizeNumericInput('  95  ')).toBe(95);
  });

  test('handles invalid inputs', () => {
    expect(sanitizeNumericInput('abc')).toBe(null);
    expect(sanitizeNumericInput('')).toBe(null);
    expect(sanitizeNumericInput(null)).toBe(null);
    expect(sanitizeNumericInput(undefined)).toBe(null);
  });

  test('handles negative numbers', () => {
    expect(sanitizeNumericInput('-120')).toBe(null);
    expect(sanitizeNumericInput('-80')).toBe(null);
  });

  test('passes through valid numbers', () => {
    expect(sanitizeNumericInput(120)).toBe(120);
    expect(sanitizeNumericInput(80)).toBe(80);
    expect(sanitizeNumericInput(0)).toBe(null);
  });
});

describe('isValidTimeFormat', () => {
  test('validates correct time formats', () => {
    expect(isValidTimeFormat('08:00')).toBe(true);
    expect(isValidTimeFormat('12:30')).toBe(true);
    expect(isValidTimeFormat('23:59')).toBe(true);
    expect(isValidTimeFormat('00:00')).toBe(true);
  });

  test('rejects invalid time formats', () => {
    expect(isValidTimeFormat('25:00')).toBe(false);
    expect(isValidTimeFormat('12:60')).toBe(false);
    expect(isValidTimeFormat('8:00')).toBe(false);
    expect(isValidTimeFormat('12:5')).toBe(false);
    expect(isValidTimeFormat('abc')).toBe(false);
    expect(isValidTimeFormat('')).toBe(false);
    expect(isValidTimeFormat(null)).toBe(false);
  });
});