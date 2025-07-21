// dataMigration.test.js
import { repairMeasurementData, needsDataRepair, migrateOldDataFormats } from '../dataMigration';

describe('dataMigration', () => {
  describe('needsDataRepair', () => {
    it('sollte false zurückgeben für leere Arrays', () => {
      expect(needsDataRepair([])).toBe(false);
      expect(needsDataRepair(null)).toBe(false);
      expect(needsDataRepair(undefined)).toBe(false);
    });

    it('sollte true zurückgeben für alte numerische IDs', () => {
      const oldData = [
        { id: 1, datum: '1. Januar', tag: 'Mo' },
        { id: 2, datum: '2. Januar', tag: 'Di' }
      ];
      expect(needsDataRepair(oldData)).toBe(true);
    });

    it('sollte true zurückgeben für IDs ohne bp_ Präfix', () => {
      const oldData = [
        { id: 'measurement_123', datum: '1. Januar', tag: 'Mo' }
      ];
      expect(needsDataRepair(oldData)).toBe(true);
    });

    it('sollte true zurückgeben für englische Datumsformate', () => {
      const oldData = [
        { id: 'bp_123', datum: 'January 1', tag: 'Mo' },
        { id: 'bp_124', datum: '1 February 2025', tag: 'Di' }
      ];
      expect(needsDataRepair(oldData)).toBe(true);
    });

    it('sollte true zurückgeben für fehlende Wochentage', () => {
      const oldData = [
        { id: 'bp_123', datum: '1. Januar' }
      ];
      expect(needsDataRepair(oldData)).toBe(true);
    });

    it('sollte true zurückgeben für verschlüsselte numerische Felder', () => {
      const oldData = [
        { id: 'bp_123', datum: '1. Januar', tag: 'Mo', morgenSys: 'U2FsdGVkX1+...' }
      ];
      expect(needsDataRepair(oldData)).toBe(true);
    });

    it('sollte false zurückgeben für bereits migrierte Daten', () => {
      const newData = [
        { 
          id: 'bp_123456_abc', 
          datum: '1. Januar', 
          tag: 'Mo', 
          morgenSys: 120,
          morgenDia: 80,
          morgenPuls: 60
        }
      ];
      expect(needsDataRepair(newData)).toBe(false);
    });
  });

  describe('repairMeasurementData', () => {
    it('sollte numerische IDs in das neue Format konvertieren', () => {
      const oldData = [
        { id: 1, datum: '1. Januar', tag: 'Mo' }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0].id).toMatch(/^bp_\d+_[a-z0-9]+_migrated_1$/);
    });

    it('sollte fehlende IDs generieren', () => {
      const oldData = [
        { datum: '1. Januar', tag: 'Mo' }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0].id).toMatch(/^bp_\d+_[a-z0-9]+_generated$/);
    });

    it('sollte englische Datumsformate konvertieren', () => {
      const oldData = [
        { id: 'bp_123', datum: 'January 1', tag: 'Mo' },
        { id: 'bp_124', datum: '15 February', tag: 'Di' },
        { id: 'bp_125', datum: 'March 3, 2025', tag: 'Mi' }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0].datum).toBe('1. Januar');
      expect(repaired[1].datum).toBe('15. Februar');
      expect(repaired[2].datum).toBe('3. März');
    });

    it('sollte fehlende Wochentage ergänzen', () => {
      const oldData = [
        { id: 'bp_123', datum: '1. Januar' }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0].tag).toBeDefined();
      expect(['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']).toContain(repaired[0].tag);
    });

    it('sollte String-Zahlen in numerische Werte konvertieren', () => {
      const oldData = [
        { 
          id: 'bp_123', 
          datum: '1. Januar', 
          tag: 'Mo',
          morgenSys: '120',
          morgenDia: '80',
          morgenPuls: '60',
          abendSys: '130',
          abendDia: '85',
          abendPuls: '65'
        }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0].morgenSys).toBe(120);
      expect(repaired[0].morgenDia).toBe(80);
      expect(repaired[0].morgenPuls).toBe(60);
      expect(repaired[0].abendSys).toBe(130);
      expect(repaired[0].abendDia).toBe(85);
      expect(repaired[0].abendPuls).toBe(65);
    });

    it('sollte ungültige numerische Werte auf null setzen', () => {
      const oldData = [
        { 
          id: 'bp_123', 
          datum: '1. Januar', 
          tag: 'Mo',
          morgenSys: 'invalid',
          morgenDia: undefined,
          morgenPuls: 0,
          abendSys: null
        }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0].morgenSys).toBe(null);
      expect(repaired[0].morgenDia).toBe(null);
      expect(repaired[0].morgenPuls).toBe(null);
      expect(repaired[0].abendSys).toBe(null);
    });

    it('sollte _standardDate entfernen (wird später neu generiert)', () => {
      const oldData = [
        { 
          id: 'bp_123', 
          datum: '1. Januar', 
          tag: 'Mo',
          _standardDate: '2025-Mo-01-01'
        }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0]._standardDate).toBeUndefined();
    });

    it('sollte Notizen als String sicherstellen', () => {
      const oldData = [
        { 
          id: 'bp_123', 
          datum: '1. Januar', 
          tag: 'Mo',
          notizen: 123
        }
      ];
      const repaired = repairMeasurementData(oldData);
      
      expect(repaired[0].notizen).toBe('123');
    });
  });

  describe('migrateOldDataFormats', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('sollte false zurückgeben wenn keine Daten vorhanden sind', async () => {
      const result = await migrateOldDataFormats();
      expect(result).toBe(false);
    });

    it('sollte false zurückgeben wenn Daten bereits migriert sind', async () => {
      const modernData = [
        { 
          id: 'bp_123456_abc', 
          datum: '1. Januar', 
          tag: 'Mo',
          morgenSys: 120
        }
      ];
      localStorage.setItem('blutdruck_messungen', JSON.stringify(modernData));
      
      const result = await migrateOldDataFormats();
      expect(result).toBe(false);
    });

    it('sollte alte Daten migrieren und Backup erstellen', async () => {
      const oldData = [
        { 
          id: 1, 
          datum: 'January 1', 
          morgenSys: '120'
        }
      ];
      localStorage.setItem('blutdruck_messungen', JSON.stringify(oldData));
      
      const result = await migrateOldDataFormats();
      expect(result).toBe(true);
      
      // Prüfe ob migrierte Daten gespeichert wurden
      const migratedData = JSON.parse(localStorage.getItem('blutdruck_messungen'));
      expect(migratedData[0].id).toMatch(/^bp_/);
      expect(migratedData[0].datum).toBe('1. Januar');
      expect(migratedData[0].morgenSys).toBe(120);
      
      // Prüfe ob Backup erstellt wurde
      const backupKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('blutdruck_messungen_backup_')
      );
      expect(backupKeys.length).toBe(1);
      
      // Prüfe ob Migration als abgeschlossen markiert wurde
      expect(localStorage.getItem('blutdruck_migration_completed')).toBeTruthy();
    });

    it('sollte bei Fehlern false zurückgeben', async () => {
      // Setze ungültiges JSON
      localStorage.setItem('blutdruck_messungen', 'invalid json');
      
      const result = await migrateOldDataFormats();
      expect(result).toBe(false);
    });

    it('sollte alte Backups löschen', async () => {
      // Erstelle ein altes Backup (31 Tage alt)
      const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000);
      localStorage.setItem(`blutdruck_messungen_backup_${oldTimestamp}`, '[]');
      
      // Erstelle ein aktuelles Backup
      const newTimestamp = Date.now() - (1 * 24 * 60 * 60 * 1000);
      localStorage.setItem(`blutdruck_messungen_backup_${newTimestamp}`, '[]');
      
      // Führe Migration aus
      const oldData = [{ id: 1, datum: 'January 1' }];
      localStorage.setItem('blutdruck_messungen', JSON.stringify(oldData));
      
      await migrateOldDataFormats();
      
      // Prüfe ob altes Backup gelöscht wurde
      expect(localStorage.getItem(`blutdruck_messungen_backup_${oldTimestamp}`)).toBeNull();
      
      // Prüfe ob neues Backup noch vorhanden ist
      expect(localStorage.getItem(`blutdruck_messungen_backup_${newTimestamp}`)).toBe('[]');
    });
  });
});