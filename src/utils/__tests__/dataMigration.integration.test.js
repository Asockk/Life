// dataMigration.integration.test.js
// Integrationstests mit realistischen Datenszenarien

import { repairMeasurementData, needsDataRepair, migrateOldDataFormats } from '../dataMigration';
import { saveMeasurements, loadMeasurements, exportAllData, clearAllData } from '../../services/storageService';

// Mock für window.location.reload
delete window.location;
window.location = { reload: jest.fn() };

describe('Datenmigration Integrationstests', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Realistische Datenszenarien', () => {
    it('sollte alte Daten vom Januar 2024 korrekt migrieren', async () => {
      // Simuliere alte Daten, wie sie in der App gespeichert waren
      const alteJanuarDaten = [
        {
          id: 1,
          datum: "January 15",
          tag: "Mo",
          morgenSys: "128",
          morgenDia: "82",
          morgenPuls: "65",
          abendSys: 135,
          abendDia: 88,
          abendPuls: 72,
          notizen: "Nach dem Sport"
        },
        {
          id: 2,
          datum: "16. Januar",
          tag: "Di",
          morgenSys: 125,
          morgenDia: 80,
          morgenPuls: 63,
          abendSys: "130",
          abendDia: "85",
          abendPuls: "68"
        }
      ];

      localStorage.setItem('blutdruck_messungen', JSON.stringify(alteJanuarDaten));
      
      // Führe Migration aus
      const migrationResult = await migrateOldDataFormats();
      expect(migrationResult).toBe(true);

      // Lade migrierte Daten
      const migratedData = JSON.parse(localStorage.getItem('blutdruck_messungen'));
      
      // Überprüfe erste Messung
      expect(migratedData[0].id).toMatch(/^bp_.*_migrated_1$/);
      expect(migratedData[0].datum).toBe('15. Januar');
      expect(migratedData[0].morgenSys).toBe(128);
      expect(migratedData[0].morgenDia).toBe(82);
      expect(migratedData[0].morgenPuls).toBe(65);
      
      // Überprüfe zweite Messung
      expect(migratedData[1].id).toMatch(/^bp_.*_migrated_2$/);
      expect(migratedData[1].datum).toBe('16. Januar');
      expect(migratedData[1].abendSys).toBe(130);
      expect(migratedData[1].abendDia).toBe(85);
    });

    it('sollte verschlüsselte Daten korrekt behandeln', async () => {
      const verschluesselteDaten = [
        {
          id: "bp_1234567890",
          datum: "1. Februar",
          tag: "Do",
          morgenSys: "U2FsdGVkX1+AbCdEfGhIjKlMnOpQrStUvWxYz", // Simuliert verschlüsselt
          morgenDia: 75,
          morgenPuls: null,
          abendSys: 128,
          abendDia: "U2FsdGVkX1+ZyXwVuTsRqPoNmLkJiHgFeDcBa", // Simuliert verschlüsselt
          abendPuls: 65
        }
      ];

      localStorage.setItem('blutdruck_messungen', JSON.stringify(verschluesselteDaten));
      
      const migrationResult = await migrateOldDataFormats();
      expect(migrationResult).toBe(true);

      const migratedData = JSON.parse(localStorage.getItem('blutdruck_messungen'));
      
      // Verschlüsselte Werte sollten auf null gesetzt werden
      expect(migratedData[0].morgenSys).toBe(null);
      expect(migratedData[0].abendDia).toBe(null);
      
      // Unverschlüsselte Werte sollten erhalten bleiben
      expect(migratedData[0].morgenDia).toBe(75);
      expect(migratedData[0].abendSys).toBe(128);
      expect(migratedData[0].abendPuls).toBe(65);
    });

    it('sollte gemischte Datenformate über mehrere Monate korrekt verarbeiten', async () => {
      const gemischteDaten = [
        // Dezember 2023 - Altes Format
        {
          id: 1,
          datum: "December 28",
          morgenSys: "118",
          morgenDia: "78",
          morgenPuls: "58"
        },
        // Januar 2024 - Teilweise neues Format
        {
          id: "measurement_20240115",
          datum: "15. Januar",
          tag: "Mo",
          morgenSys: 125,
          morgenDia: 82,
          morgenPuls: 64,
          abendSys: 132,
          abendDia: 86,
          abendPuls: 70
        },
        // Februar 2024 - Neues Format mit _standardDate
        {
          id: "bp_1707123456789_abc",
          datum: "5. Februar",
          tag: "Mo",
          morgenSys: 122,
          morgenDia: 80,
          morgenPuls: 62,
          _standardDate: "2024-Mo-05-02"
        }
      ];

      localStorage.setItem('blutdruck_messungen', JSON.stringify(gemischteDaten));
      
      const migrationResult = await migrateOldDataFormats();
      expect(migrationResult).toBe(true);

      const migratedData = JSON.parse(localStorage.getItem('blutdruck_messungen'));
      
      // Alle sollten migriert sein
      expect(migratedData).toHaveLength(3);
      
      // Dezember-Eintrag
      expect(migratedData[0].datum).toBe('28. Dezember');
      expect(migratedData[0].tag).toBeDefined();
      expect(migratedData[0].morgenSys).toBe(118);
      
      // Januar-Eintrag
      expect(migratedData[1].id).toMatch(/^bp_.*_migrated_measurement_20240115$/);
      
      // Februar-Eintrag (bereits im neuen Format)
      expect(migratedData[2].id).toBe('bp_1707123456789_abc');
      expect(migratedData[2]._standardDate).toBeUndefined(); // Wird entfernt und neu generiert
    });

    it('sollte Backup erstellen und bei Fehler wiederherstellen können', async () => {
      const originaleDaten = [
        {
          id: "bp_123",
          datum: "1. März",
          tag: "Fr",
          morgenSys: 120,
          morgenDia: 80,
          morgenPuls: 60
        }
      ];

      localStorage.setItem('blutdruck_messungen', JSON.stringify(originaleDaten));
      
      // Führe Migration aus
      await migrateOldDataFormats();
      
      // Prüfe ob Backup erstellt wurde
      const backupKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('blutdruck_messungen_backup_')
      );
      expect(backupKeys.length).toBeGreaterThan(0);
      
      // Backup sollte originale Daten enthalten
      const backupData = JSON.parse(localStorage.getItem(backupKeys[0]));
      expect(backupData).toEqual(originaleDaten);
    });
  });

  describe('Fehlerbehandlung', () => {
    it('sollte bei korrupten Daten nicht abstürzen', async () => {
      // Setze korrupte JSON-Daten
      localStorage.setItem('blutdruck_messungen', '{"invalid": json structure');
      
      const migrationResult = await migrateOldDataFormats();
      expect(migrationResult).toBe(false);
      
      // Originaldaten sollten erhalten bleiben
      expect(localStorage.getItem('blutdruck_messungen')).toBe('{"invalid": json structure');
    });

    it('sollte leere oder null-Werte korrekt behandeln', async () => {
      const datenMitNullWerten = [
        {
          id: null,
          datum: "",
          tag: undefined,
          morgenSys: 0,
          morgenDia: null,
          morgenPuls: "",
          notizen: null
        }
      ];

      localStorage.setItem('blutdruck_messungen', JSON.stringify(datenMitNullWerten));
      
      const migrationResult = await migrateOldDataFormats();
      expect(migrationResult).toBe(true);

      const migratedData = JSON.parse(localStorage.getItem('blutdruck_messungen'));
      
      // ID sollte generiert werden
      expect(migratedData[0].id).toMatch(/^bp_.*_generated$/);
      
      // Tag sollte gesetzt werden
      expect(migratedData[0].tag).toBeDefined();
      
      // Numerische Null-Werte sollten null bleiben
      expect(migratedData[0].morgenSys).toBe(null);
      expect(migratedData[0].morgenDia).toBe(null);
      expect(migratedData[0].morgenPuls).toBe(null);
    });
  });

  describe('Performance mit vielen Daten', () => {
    it('sollte 1000 Einträge in angemessener Zeit migrieren', async () => {
      // Generiere 1000 alte Einträge
      const vieleDaten = [];
      for (let i = 1; i <= 1000; i++) {
        vieleDaten.push({
          id: i,
          datum: `January ${(i % 31) + 1}`,
          tag: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i % 7],
          morgenSys: String(110 + (i % 30)),
          morgenDia: String(70 + (i % 20)),
          morgenPuls: String(60 + (i % 15))
        });
      }

      localStorage.setItem('blutdruck_messungen', JSON.stringify(vieleDaten));
      
      const startTime = Date.now();
      const migrationResult = await migrateOldDataFormats();
      const endTime = Date.now();
      
      expect(migrationResult).toBe(true);
      
      // Migration sollte weniger als 5 Sekunden dauern
      expect(endTime - startTime).toBeLessThan(5000);
      
      const migratedData = JSON.parse(localStorage.getItem('blutdruck_messungen'));
      expect(migratedData).toHaveLength(1000);
      
      // Stichprobe prüfen
      expect(migratedData[0].datum).toBe('1. Januar');
      expect(migratedData[0].morgenSys).toBe(110);
      expect(migratedData[999].id).toMatch(/^bp_.*_migrated_1000$/);
    });
  });

  describe('Export vor Migration', () => {
    it('sollte Daten vor Migration exportieren können', async () => {
      const testDaten = [
        {
          id: 1,
          datum: "March 1",
          tag: "Do",
          morgenSys: "125",
          morgenDia: "82",
          morgenPuls: "65"
        }
      ];

      // Speichere alte Daten direkt in localStorage
      localStorage.setItem('blutdruck_messungen', JSON.stringify(testDaten));
      
      // Lade die Daten über den Service (mit Migration)
      const geladeneDaten = await loadMeasurements();
      
      // Daten sollten migriert sein
      expect(geladeneDaten[0].datum).toBe('1. März');
      expect(geladeneDaten[0].morgenSys).toBe(125);
      
      // Export sollte funktionieren
      const mockCreateElement = jest.spyOn(document, 'createElement');
      const mockClick = jest.fn();
      const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      
      mockCreateElement.mockImplementation((tagName) => {
        if (tagName === 'a') {
          return { click: mockClick, href: '', download: '' };
        }
        return {};
      });

      await exportAllData();
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });
});