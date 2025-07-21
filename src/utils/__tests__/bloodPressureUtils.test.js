// utils/__tests__/bloodPressureUtils.test.js
import { 
  getBloodPressureCategory, 
  formatTableValue,
  validateBloodPressureValues,
  calculateMovingAverage,
  generateDateBasedId
} from '../bloodPressureUtils';

describe('getBloodPressureCategory', () => {
  test('returns invalid for null or zero values', () => {
    expect(getBloodPressureCategory(null, null)).toEqual({ category: "Ungültig", color: "#AAAAAA" });
    expect(getBloodPressureCategory(0, 0)).toEqual({ category: "Ungültig", color: "#AAAAAA" });
    expect(getBloodPressureCategory(120, 0)).toEqual({ category: "Ungültig", color: "#AAAAAA" });
    expect(getBloodPressureCategory(0, 80)).toEqual({ category: "Ungültig", color: "#AAAAAA" });
  });

  test('categorizes optimal blood pressure correctly', () => {
    expect(getBloodPressureCategory(115, 75)).toEqual({ category: "Optimal", color: "#2ECC40" });
    expect(getBloodPressureCategory(119, 79)).toEqual({ category: "Optimal", color: "#2ECC40" });
  });

  test('categorizes normal blood pressure correctly', () => {
    expect(getBloodPressureCategory(120, 80)).toEqual({ category: "Normal", color: "#01FF70" });
    expect(getBloodPressureCategory(125, 84)).toEqual({ category: "Normal", color: "#01FF70" });
    expect(getBloodPressureCategory(129, 84)).toEqual({ category: "Normal", color: "#01FF70" });
  });

  test('categorizes hochnormal blood pressure correctly', () => {
    expect(getBloodPressureCategory(130, 85)).toEqual({ category: "Hoch normal", color: "#FFDC00" });
    expect(getBloodPressureCategory(135, 89)).toEqual({ category: "Hoch normal", color: "#FFDC00" });
    expect(getBloodPressureCategory(139, 89)).toEqual({ category: "Hoch normal", color: "#FFDC00" });
  });

  test('categorizes Hypertonie Grad 1 correctly', () => {
    expect(getBloodPressureCategory(140, 90)).toEqual({ category: "Hypertonie Grad 1", color: "#FF851B" });
    expect(getBloodPressureCategory(150, 95)).toEqual({ category: "Hypertonie Grad 1", color: "#FF851B" });
    expect(getBloodPressureCategory(159, 99)).toEqual({ category: "Hypertonie Grad 1", color: "#FF851B" });
  });

  test('categorizes Hypertonie Grad 2 correctly', () => {
    expect(getBloodPressureCategory(160, 100)).toEqual({ category: "Hypertonie Grad 2", color: "#FF4136" });
    expect(getBloodPressureCategory(170, 105)).toEqual({ category: "Hypertonie Grad 2", color: "#FF4136" });
    expect(getBloodPressureCategory(179, 109)).toEqual({ category: "Hypertonie Grad 2", color: "#FF4136" });
  });

  test('categorizes Hypertonie Grad 3 correctly', () => {
    expect(getBloodPressureCategory(180, 110)).toEqual({ category: "Hypertonie Grad 3", color: "#85144b" });
    expect(getBloodPressureCategory(200, 120)).toEqual({ category: "Hypertonie Grad 3", color: "#85144b" });
  });

  test('uses higher category when systolic and diastolic fall into different categories', () => {
    // Systolic = Normal (129), Diastolic = Hypertonie Grad 1 (90)
    expect(getBloodPressureCategory(129, 90)).toEqual({ category: "Hypertonie Grad 1", color: "#FF851B" });
    
    // Systolic = Hypertonie Grad 2 (160), Diastolic = Normal (80)
    expect(getBloodPressureCategory(160, 80)).toEqual({ category: "Hypertonie Grad 2", color: "#FF4136" });
  });
});

describe('formatTableValue', () => {
  test('formats blood pressure values correctly', () => {
    expect(formatTableValue(120, 80)).toBe('120/80');
    expect(formatTableValue(135, 85)).toBe('135/85');
  });

  test('returns dash for missing values', () => {
    expect(formatTableValue(null, null)).toBe('-');
    expect(formatTableValue(120, null)).toBe('-');
    expect(formatTableValue(null, 80)).toBe('-');
    expect(formatTableValue(0, 80)).toBe('-');
  });
});

describe('validateBloodPressureValues', () => {
  test('validates correct blood pressure values', () => {
    expect(validateBloodPressureValues(120, 80).isValid).toBe(true);
    expect(validateBloodPressureValues(140, 90).isValid).toBe(true);
  });

  test('rejects invalid values', () => {
    expect(validateBloodPressureValues(null, null).isValid).toBe(false);
    expect(validateBloodPressureValues(0, 80).isValid).toBe(false);
    expect(validateBloodPressureValues(120, 0).isValid).toBe(false);
    expect(validateBloodPressureValues(-120, 80).isValid).toBe(false);
    expect(validateBloodPressureValues(120, -80).isValid).toBe(false);
  });

  test('rejects implausible values', () => {
    expect(validateBloodPressureValues(350, 80).isValid).toBe(false);
    expect(validateBloodPressureValues(120, 250).isValid).toBe(false);
    expect(validateBloodPressureValues(40, 80).isValid).toBe(false);
    expect(validateBloodPressureValues(120, 20).isValid).toBe(false);
  });

  test('rejects when diastolic is higher than systolic', () => {
    expect(validateBloodPressureValues(80, 120).isValid).toBe(false);
  });
});

describe('calculateMovingAverage', () => {
  test('calculates moving average correctly for a single index', () => {
    const data = [
      { morgenSys: 120, morgenDia: 80 },
      { morgenSys: 125, morgenDia: 82 },
      { morgenSys: 130, morgenDia: 85 },
      { morgenSys: 135, morgenDia: 87 },
      { morgenSys: 140, morgenDia: 90 }
    ];
    
    // calculateMovingAverage calculates for a single index
    expect(calculateMovingAverage(data, 0, 'morgenSys')).toBe(120);
    expect(calculateMovingAverage(data, 1, 'morgenSys')).toBe(123); // (120+125)/2
    expect(calculateMovingAverage(data, 2, 'morgenSys')).toBe(125); // (120+125+130)/3
  });

  test('handles missing values gracefully', () => {
    const data = [
      { morgenSys: 120, morgenDia: 80 },
      { morgenSys: null, morgenDia: null },
      { morgenSys: 130, morgenDia: 85 }
    ];
    
    expect(calculateMovingAverage(data, 2, 'morgenSys')).toBe(125); // (120+130)/2, skipping null
  });
});

describe('generateDateBasedId', () => {
  test('generates unique IDs', () => {
    const id1 = generateDateBasedId();
    // Wait a bit to ensure different timestamp
    const id2 = generateDateBasedId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^bp_\d+_[a-z0-9]+$/);
  });

  test('includes timestamp in ID', () => {
    const before = Date.now();
    const id = generateDateBasedId();
    const after = Date.now();
    
    const timestamp = parseInt(id.split('_')[1]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});