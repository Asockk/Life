// hooks/useBloodPressureData.js
// Verbesserte Version mit zentralisiertem State Management und Race Condition Vermeidung
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { prepareDataWithMovingAverages, prepareDataWithAverages, sortDataByDate, standardizeDateFormat } from '../utils/dataUtils';
import { getBloodPressureCategory } from '../utils/bloodPressureUtils';
import { validateForm } from '../utils/validationUtils';
import { useDialog } from '../contexts/DialogContext';

// Importieren der neuen Storage-Service-Funktionen
import { 
  saveMeasurements,
  loadMeasurements,
  saveContextFactors,
  loadContextFactors,
  saveSetting,
  loadSetting
} from '../services/storageService';
import syncService from '../services/syncService';

// Debounce-Funktion für verzögertes Speichern
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const useBloodPressureData = () => {
  // State für die Daten
  const [data, setData] = useState([]);
  const [viewType, setViewType] = useState('morgen'); // 'morgen' oder 'abend'
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  
  // State für Datenbereitschaft (initial loading)
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Refs für Race Condition Vermeidung
  const saveQueueRef = useRef({
    measurements: null,
    contextFactors: null,
    settings: null
  });
  const savingInProgressRef = useRef({
    measurements: false,
    contextFactors: false,
    settings: false
  });

  // Dialog-Kontext für Bestätigungsdialoge
  const { openConfirmDialog } = useDialog() || {};

  // Kontextfaktoren für alle Tage: { "YYYY-MM-DD": { stress: 2, sleep: 3, ... }, ... }
  const [contextFactors, setContextFactors] = useState({});
  
  // Korrelationsanalyse zwischen Faktoren und Blutdruckwerten
  const [factorCorrelations, setFactorCorrelations] = useState({});
  
  // State für den angezeigten Bericht
  const [showReport, setShowReport] = useState(false);
  
  // Cleanup für Timeouts
  const timeoutRefs = useRef([]);
  
  // ======================================================================
  // Initialisierung & Laden der gespeicherten Daten beim ersten Rendern
  // ======================================================================
  useEffect(() => {
    let mounted = true;
    
    async function initializeData() {
      try {
        // Messungen laden
        const storedData = await loadMeasurements();
        if (mounted) {
          if (storedData && storedData.length > 0) {
            setData(storedData);
            console.log(`${storedData.length} Messungen geladen`);
          } else {
            // Fallback: Die initialData als Beispieldaten verwenden
            setData([]);
            console.log('Keine gespeicherten Messungen gefunden.');
          }
        }
        
        // Kontextfaktoren laden
        const storedContextFactors = await loadContextFactors();
        if (mounted) {
          if (storedContextFactors && Object.keys(storedContextFactors).length > 0) {
            setContextFactors(storedContextFactors);
            console.log(`Kontextfaktoren für ${Object.keys(storedContextFactors).length} Tage geladen`);
          }
        }
        
        // Einstellungen laden (z.B. viewType)
        const savedViewType = await loadSetting('viewType', 'morgen');
        if (mounted) {
          setViewType(savedViewType);
        }
        
        // Markieren dass Daten geladen sind
        if (mounted) {
          setDataLoaded(true);
        }
      } catch (error) {
        console.error('Fehler beim Initialisieren der Daten:', error);
        if (mounted) {
          setStatusMessage({
            text: 'Fehler beim Laden der gespeicherten Daten',
            type: 'error'
          });
          // Trotzdem als geladen markieren
          setDataLoaded(true);
        }
      }
    }
    
    initializeData();
    
    // Cleanup-Funktion
    return () => {
      mounted = false;
    };
  }, []);
  
  // Funktion: Statusnachricht anzeigen - VERBESSERTE VERSION
  const showStatusMessage = useCallback((text, type) => {
    // Setze zunächst eine leere Nachricht, um sicherzustellen, dass eine neue Nachricht immer
    // einen neuen useEffect-Durchlauf in der StatusMessage-Komponente auslöst,
    // selbst wenn dieselbe Nachricht zweimal hintereinander gesendet wird
    setStatusMessage({ text: '', type: '' });
    
    // Dann setze die eigentliche Nachricht mit einem kleinen Zeitabstand
    const timeoutId = setTimeout(() => {
      setStatusMessage({ text, type });
    }, 10);
    
    // Timeout zur Cleanup-Liste hinzufügen
    timeoutRefs.current.push(timeoutId);
    
    // Die automatische Ausblendung wird jetzt in der StatusMessage-Komponente gesteuert
  }, []);
  
  // Zentralisierte Speicherfunktion mit Queue-Management
  const saveDataToStorage = useCallback(async (dataType, dataToSave) => {
    // Prüfe ob bereits gespeichert wird
    if (savingInProgressRef.current[dataType]) {
      // Queue das Update für später
      saveQueueRef.current[dataType] = dataToSave;
      return;
    }
    
    savingInProgressRef.current[dataType] = true;
    
    try {
      console.log('[SAVE-QUEUE] Saving', dataType, 'with data:', dataToSave);
      let result;
      switch (dataType) {
        case 'measurements':
          result = await saveMeasurements(dataToSave);
          console.log(`[SAVE-QUEUE] ${dataToSave.length} Messungen erfolgreich gespeichert`);
          break;
        case 'contextFactors':
          result = await saveContextFactors(dataToSave);
          console.log('Kontextfaktoren gespeichert');
          break;
        case 'settings':
          await saveSetting('viewType', dataToSave);
          console.log(`Ansichtstyp "${dataToSave}" gespeichert`);
          break;
        default:
          throw new Error(`Unbekannter Datentyp: ${dataType}`);
      }
      
      // Speichern erfolgreich, Status zurücksetzen
      savingInProgressRef.current[dataType] = false;
      
      // Prüfe ob in der Zwischenzeit neue Daten in die Queue gekommen sind
      if (saveQueueRef.current[dataType] !== null) {
        const queuedData = saveQueueRef.current[dataType];
        saveQueueRef.current[dataType] = null;
        // Rekursiv die Queue abarbeiten
        await saveDataToStorage(dataType, queuedData);
      }
    } catch (error) {
      console.error(`Fehler beim Speichern von ${dataType}:`, error);
      savingInProgressRef.current[dataType] = false;
      
      // Zeige Fehlermeldung
      showStatusMessage('Fehler beim Speichern. Bitte versuchen Sie es erneut.', 'error');
    }
  }, [showStatusMessage]);
  
  // Debounced Speicherfunktionen
  const debouncedSaveMeasurements = useMemo(
    () => debounce((dataToSave) => {
      if (dataLoaded) {
        saveDataToStorage('measurements', dataToSave);
      }
    }, 500),
    [dataLoaded, saveDataToStorage]
  );
  
  const debouncedSaveContextFactors = useMemo(
    () => debounce((dataToSave) => {
      if (dataLoaded) {
        saveDataToStorage('contextFactors', dataToSave);
      }
    }, 500),
    [dataLoaded, saveDataToStorage]
  );
  
  const debouncedSaveSettings = useMemo(
    () => debounce((dataToSave) => {
      if (dataLoaded) {
        saveDataToStorage('settings', dataToSave);
      }
    }, 500),
    [dataLoaded, saveDataToStorage]
  );
  
  // Speichern von Änderungen in der Datenbank
  useEffect(() => {
    console.log('[SAVE-EFFECT] Data changed. Loaded:', dataLoaded, 'Length:', data.length);
    if (dataLoaded) {
      console.log('[SAVE-EFFECT] Triggering save with data:', data);
      debouncedSaveMeasurements(data);
    }
  }, [data, dataLoaded, debouncedSaveMeasurements]);
  
  // Speichern von Änderungen bei Kontextfaktoren
  useEffect(() => {
    if (dataLoaded && Object.keys(contextFactors).length > 0) {
      debouncedSaveContextFactors(contextFactors);
    }
  }, [contextFactors, dataLoaded, debouncedSaveContextFactors]);
  
  // Speichern der viewType-Einstellung
  useEffect(() => {
    if (dataLoaded) {
      debouncedSaveSettings(viewType);
    }
  }, [viewType, dataLoaded, debouncedSaveSettings]);
  
  // Cleanup für alle Timeouts
  useEffect(() => {
    return () => {
      // Alle laufenden Timeouts clearen
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, []);

  // Prozessierte Daten mit berechneten Werten
  const dataWithMA = useMemo(() => 
    prepareDataWithMovingAverages(data), [data]
  );

  // Daten mit Durchschnittslinien
  const { data: dataWithAvgLines, averages } = useMemo(() => 
    prepareDataWithAverages(data), [data]
  );

  // Aktuelle Durchschnittswerte basierend auf viewType
  const avgValues = useMemo(() => ({
    sys: viewType === 'morgen' ? averages.morgen.sys : averages.abend.sys,
    dia: viewType === 'morgen' ? averages.morgen.dia : averages.abend.dia,
    puls: viewType === 'morgen' ? averages.morgen.puls : averages.abend.puls
  }), [viewType, averages]);

  // Blutdruckkategorie basierend auf Durchschnittswerten
  const bpCategory = useMemo(() => 
    getBloodPressureCategory(avgValues.sys, avgValues.dia), 
    [avgValues.sys, avgValues.dia]
  );

  // Min/Max-Werte für die Anzeige
  const minMaxValues = useMemo(() => {
    const sysField = viewType === 'morgen' ? 'morgenSys' : 'abendSys';
    const diaField = viewType === 'morgen' ? 'morgenDia' : 'abendDia';
    
    const sysValues = data.filter(d => d[sysField] > 0).map(d => d[sysField]);
    const diaValues = data.filter(d => d[diaField] > 0).map(d => d[diaField]);
    
    return {
      sysMin: sysValues.length > 0 ? Math.min(...sysValues) : 0,
      sysMax: sysValues.length > 0 ? Math.max(...sysValues) : 0,
      diaMin: diaValues.length > 0 ? Math.min(...diaValues) : 0,
      diaMax: diaValues.length > 0 ? Math.max(...diaValues) : 0,
    };
  }, [data, viewType]);

  // Letzte Kontextfaktoren finden (für Vorschlag bei neuen Einträgen)
  const getLatestContextFactors = useCallback(() => {
    const dates = Object.keys(contextFactors).sort().reverse();
    
    // Nehme die neuesten Kontextfaktoren, falls vorhanden
    if (dates.length > 0) {
      return contextFactors[dates[0]];
    }
    
    return null;
  }, [contextFactors]);

  // Extrahiert das Jahr aus einem Datumsstring
  const extractYearFromDate = (dateStr) => {
    if (!dateStr) return new Date().getFullYear(); // Aktuelles Jahr als Fallback
    
    // Suche nach einer vierstelligen Zahl, die das Jahr sein könnte
    const yearMatch = dateStr.match(/\b(20\d{2})\b/); // 2000-2099
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    // Kein Jahr gefunden, verwende aktuelles Jahr
    return new Date().getFullYear();
  };

  // Konvertiert ein Anzeigedatum wie "Januar 15" oder "1. Januar" in das Format "2025-01-15"
  const convertDisplayDateToISO = useCallback((displayDate) => {
    if (!displayDate) return null;
    
    // Jahr aus dem Datumsstring extrahieren (falls vorhanden)
    const year = extractYearFromDate(displayDate);
    
    // Fall 1: Format "Januar 15" oder "Januar 15 2024" (Standardformat)
    const monate = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    for (const [monat, nummer] of Object.entries(monate)) {
      if (displayDate.includes(monat)) {
        const parts = displayDate.split(' ');
        const tagIndex = parts.findIndex(p => /^\d{1,2}$/.test(p));
        
        if (tagIndex !== -1) {
          const tag = parts[tagIndex].padStart(2, '0');
          return `${year}-${nummer}-${tag}`;
        }
      }
    }
    
    // Fall 2: Format "26. Februar" (deutsches Format)
    const germanMatch = displayDate.match(/(\d{1,2})\.\s*(\w+)/);
    if (germanMatch) {
      const tag = germanMatch[1].padStart(2, '0');
      const monat = germanMatch[2];
      const monatNummer = monate[monat];
      
      if (monatNummer) {
        return `${year}-${monatNummer}-${tag}`;
      }
    }
    
    // Fall 3: ISO-Format bereits vorhanden
    if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return displayDate;
    }
    
    // Fallback: Versuche Date-Objekt zu erstellen
    try {
      const date = new Date(displayDate);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.warn('Fehler bei der Datumskonvertierung:', displayDate, e);
    }
    
    return null;
  }, []);

  // Holt Kontextfaktoren für ein bestimmtes Anzeigedatum
  const getContextForDisplayDate = useCallback((displayDate) => {
    const isoDate = convertDisplayDateToISO(displayDate);
    if (!isoDate) return null;
    
    return contextFactors[isoDate] || null;
  }, [contextFactors, convertDisplayDateToISO]);

  // ======================================================================
  // Korrelationsanalyse zwischen Kontextfaktoren und Blutdruckwerten
  // ======================================================================
  const analyzeFactorCorrelations = useCallback(() => {
    if (data.length < 5) return; // Benötige mindestens 5 Datenpunkte für sinnvolle Korrelation
    
    const factors = ['stress', 'sleep', 'exercise', 'alcohol', 'mood', 'weather'];
    const correlations = {};
    
    factors.forEach(factor => {
      // Sammle Datenpunkte mit diesem Faktor
      const dataPoints = data.filter(entry => {
        const isoDate = convertDisplayDateToISO(entry.datum);
        const context = contextFactors[isoDate];
        return context && context[factor] !== undefined;
      }).map(entry => {
        const isoDate = convertDisplayDateToISO(entry.datum);
        const context = contextFactors[isoDate];
        
        // Durchschnitt von Morgen- und Abendwerten verwenden
        const avgSys = (entry.morgenSys + entry.abendSys) / 2 || entry.morgenSys || entry.abendSys;
        const avgDia = (entry.morgenDia + entry.abendDia) / 2 || entry.morgenDia || entry.abendDia;
        
        return {
          factorValue: context[factor],
          sys: avgSys,
          dia: avgDia
        };
      });
      
      if (dataPoints.length >= 5) {
        // Berechne einfache Korrelation
        const avgFactorValue = dataPoints.reduce((sum, p) => sum + p.factorValue, 0) / dataPoints.length;
        const avgSys = dataPoints.reduce((sum, p) => sum + p.sys, 0) / dataPoints.length;
        const avgDia = dataPoints.reduce((sum, p) => sum + p.dia, 0) / dataPoints.length;
        
        let sysCorr = 0;
        let diaCorr = 0;
        let factorVar = 0;
        let sysVar = 0;
        let diaVar = 0;
        
        dataPoints.forEach(p => {
          const factorDiff = p.factorValue - avgFactorValue;
          const sysDiff = p.sys - avgSys;
          const diaDiff = p.dia - avgDia;
          
          sysCorr += factorDiff * sysDiff;
          diaCorr += factorDiff * diaDiff;
          factorVar += factorDiff * factorDiff;
          sysVar += sysDiff * sysDiff;
          diaVar += diaDiff * diaDiff;
        });
        
        // Pearson-Korrelationskoeffizient
        const sysPearson = sysCorr / Math.sqrt(factorVar * sysVar) || 0;
        const diaPearson = diaCorr / Math.sqrt(factorVar * diaVar) || 0;
        
        correlations[factor] = {
          sys: Math.round(sysPearson * 100) / 100,
          dia: Math.round(diaPearson * 100) / 100,
          dataPoints: dataPoints.length
        };
      }
    });
    
    setFactorCorrelations(correlations);
  }, [data, contextFactors, convertDisplayDateToISO]);

  // Analysiere Korrelationen wenn sich Daten oder Kontextfaktoren ändern
  useEffect(() => {
    if (dataLoaded && data.length > 0 && Object.keys(contextFactors).length > 0) {
      // Verzögere die Analyse etwas für bessere Performance
      const timeoutId = setTimeout(() => {
        analyzeFactorCorrelations();
      }, 1000);
      
      timeoutRefs.current.push(timeoutId);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dataLoaded, data, contextFactors, analyzeFactorCorrelations]);

  // Eintrag hinzufügen mit Duplikatprüfung basierend auf standardisierten Daten
  const addEntry = useCallback((formData, contextData) => {
    console.log('[useBloodPressureData] addEntry called with:', formData, contextData);
    
    // Validierung
    const validation = validateForm(formData);
    console.log('[useBloodPressureData] Validation result:', validation);
    
    if (!validation.isValid) {
      console.log('[useBloodPressureData] Validation failed:', validation.errors);
      showStatusMessage(validation.errors[0], 'error');
      return { success: false, message: validation.errors[0] };
    }

    // Generiere ID mit Zeitkomponente
    const now = new Date();
    const idTime = now.getTime();
    const idRandom = Math.floor(Math.random() * 1000);
    const newId = `${idTime}-${idRandom}`;

    // Extrahiere den Wochentag aus formData.tag oder formData.wochentag
    const tag = formData.tag || formData.wochentag;
    
    // Konvertiere das Datum in ein standardisiertes Format für den Vergleich
    const standardDate = standardizeDateFormat(formData.datum, tag);
    
    // Prüfe auf Duplikate
    const isDuplicate = data.some(entry => {
      if (!entry._standardDate || !standardDate) return false;
      return entry._standardDate === standardDate;
    });

    if (isDuplicate) {
      showStatusMessage('Ein Eintrag für dieses Datum existiert bereits!', 'error');
      return { success: false, message: 'Ein Eintrag für dieses Datum existiert bereits!' };
    }

    // Erstelle neuen Eintrag mit allen Feldern
    const newEntry = {
      id: newId,
      datum: formData.datum,
      tag: tag,
      _standardDate: standardDate, // Füge das standardisierte Datum hinzu
      morgenSys: formData.morgenSys || null,
      morgenDia: formData.morgenDia || null,
      morgenPuls: formData.morgenPuls || null,
      abendSys: formData.abendSys || null,
      abendDia: formData.abendDia || null,
      abendPuls: formData.abendPuls || null,
      notizen: formData.notizen || ''
    };

    // Aktualisiere Daten
    console.log('[ADD] Current data before add:', data);
    console.log('[ADD] New entry to add:', newEntry);
    const updatedData = sortDataByDate([...data, newEntry]);
    console.log('[ADD] Updated data after add:', updatedData);
    setData(updatedData);
    
    // Speichere Kontextfaktoren wenn vorhanden
    if (contextData && Object.keys(contextData).length > 0) {
      const isoDate = convertDisplayDateToISO(formData.datum);
      if (isoDate) {
        setContextFactors(prev => ({
          ...prev,
          [isoDate]: contextData
        }));
      }
    }

    // Queue for offline sync
    syncService.queueData('measurement', {
      ...newEntry,
      contextData: contextData || null
    });

    showStatusMessage('Eintrag erfolgreich hinzugefügt!', 'success');
    return { success: true, message: 'Eintrag erfolgreich hinzugefügt!' };
  }, [data, showStatusMessage, convertDisplayDateToISO, setData, setContextFactors]);

  // Eintrag aktualisieren
  const updateEntry = useCallback((id, formData, contextData) => {
    // Validierung
    const validation = validateForm(formData);
    if (!validation.isValid) {
      showStatusMessage(validation.errors[0], 'error');
      return { success: false, message: validation.errors[0] };
    }

    // Finde den existierenden Eintrag
    const existingEntry = data.find(entry => entry.id === id);
    if (!existingEntry) {
      showStatusMessage('Eintrag nicht gefunden!', 'error');
      return { success: false, message: 'Eintrag nicht gefunden!' };
    }

    // Konvertiere das Datum in ein standardisiertes Format für den Vergleich
    const tag = formData.tag || formData.wochentag || existingEntry.tag;
    const standardDate = standardizeDateFormat(formData.datum, tag);

    // Prüfe auf Duplikate (außer dem aktuellen Eintrag)
    const isDuplicate = data.some(entry => {
      if (entry.id === id) return false; // Ignoriere den aktuellen Eintrag
      if (!entry._standardDate || !standardDate) return false;
      return entry._standardDate === standardDate;
    });

    if (isDuplicate) {
      showStatusMessage('Ein Eintrag für dieses Datum existiert bereits!', 'error');
      return { success: false, message: 'Ein Eintrag für dieses Datum existiert bereits!' };
    }

    // Aktualisiere den Eintrag
    const updatedEntry = {
      ...existingEntry,
      datum: formData.datum,
      tag: tag,
      _standardDate: standardDate, // Aktualisiere das standardisierte Datum
      morgenSys: formData.morgenSys || null,
      morgenDia: formData.morgenDia || null,
      morgenPuls: formData.morgenPuls || null,
      abendSys: formData.abendSys || null,
      abendDia: formData.abendDia || null,
      abendPuls: formData.abendPuls || null,
      notizen: formData.notizen || ''
    };

    // Aktualisiere Daten
    const updatedData = sortDataByDate(
      data.map(entry => entry.id === id ? updatedEntry : entry)
    );
    setData(updatedData);
    
    // Aktualisiere Kontextfaktoren wenn vorhanden
    if (contextData) {
      // Lösche alte Kontextfaktoren wenn das Datum sich geändert hat
      const oldIsoDate = convertDisplayDateToISO(existingEntry.datum);
      const newIsoDate = convertDisplayDateToISO(formData.datum);
      
      if (oldIsoDate && newIsoDate && oldIsoDate !== newIsoDate) {
        setContextFactors(prev => {
          const newFactors = { ...prev };
          delete newFactors[oldIsoDate];
          if (Object.keys(contextData).length > 0) {
            newFactors[newIsoDate] = contextData;
          }
          return newFactors;
        });
      } else if (newIsoDate && Object.keys(contextData).length > 0) {
        setContextFactors(prev => ({
          ...prev,
          [newIsoDate]: contextData
        }));
      }
    }

    // Queue for offline sync
    syncService.queueData('measurement', {
      ...updatedEntry,
      contextData: contextData || null
    });

    showStatusMessage('Eintrag erfolgreich aktualisiert!', 'success');
    return { success: true, message: 'Eintrag erfolgreich aktualisiert!' };
  }, [data, showStatusMessage, convertDisplayDateToISO, setData, setContextFactors]);

  // Eintrag löschen
  const deleteEntry = useCallback((id) => {
    if (!openConfirmDialog) {
      // Fallback wenn Dialog-Kontext nicht verfügbar
      const confirmed = window.confirm('Möchten Sie diesen Eintrag wirklich löschen?');
      if (!confirmed) return;
      
      // Finde den zu löschenden Eintrag für Kontextfaktoren-Cleanup
      const entryToDelete = data.find(entry => entry.id === id);
      
      const updatedData = data.filter(entry => entry.id !== id);
      setData(updatedData);
      
      // Lösche auch zugehörige Kontextfaktoren
      if (entryToDelete) {
        const isoDate = convertDisplayDateToISO(entryToDelete.datum);
        if (isoDate && contextFactors[isoDate]) {
          setContextFactors(prev => {
            const newFactors = { ...prev };
            delete newFactors[isoDate];
            return newFactors;
          });
        }
      }
      
      showStatusMessage('Eintrag erfolgreich gelöscht!', 'success');
      return;
    }

    openConfirmDialog({
      title: 'Eintrag löschen',
      message: 'Möchten Sie diesen Eintrag wirklich löschen?',
      confirmText: 'Löschen',
      cancelText: 'Abbrechen',
      onConfirm: () => {
        // Finde den zu löschenden Eintrag für Kontextfaktoren-Cleanup
        const entryToDelete = data.find(entry => entry.id === id);
        
        const updatedData = data.filter(entry => entry.id !== id);
        setData(updatedData);
        
        // Lösche auch zugehörige Kontextfaktoren
        if (entryToDelete) {
          const isoDate = convertDisplayDateToISO(entryToDelete.datum);
          if (isoDate && contextFactors[isoDate]) {
            setContextFactors(prev => {
              const newFactors = { ...prev };
              delete newFactors[isoDate];
              return newFactors;
            });
          }
        }
        
        showStatusMessage('Eintrag erfolgreich gelöscht!', 'success');
      }
    });
  }, [data, openConfirmDialog, showStatusMessage, contextFactors, convertDisplayDateToISO]);

  // Daten importieren
  const importData = useCallback((importedData, importedContextFactors = null) => {
    try {
      if (!Array.isArray(importedData)) {
        showStatusMessage('Ungültiges Datenformat!', 'error');
        return { success: false };
      }

      // Validiere und standardisiere die importierten Daten
      const validatedData = importedData.map(entry => {
        const tag = entry.tag || 'Mo'; // Fallback auf Montag
        const standardDate = standardizeDateFormat(entry.datum, tag);
        
        return {
          ...entry,
          id: entry.id || `import-${Date.now()}-${Math.random()}`,
          tag: tag,
          _standardDate: standardDate,
          morgenSys: entry.morgenSys || 0,
          morgenDia: entry.morgenDia || 0,
          morgenPuls: entry.morgenPuls || 0,
          abendSys: entry.abendSys || 0,
          abendDia: entry.abendDia || 0,
          abendPuls: entry.abendPuls || 0,
          notizen: entry.notizen || ''
        };
      });

      // Sortiere die Daten
      const sortedData = sortDataByDate(validatedData);
      setData(sortedData);
      
      // Importiere Kontextfaktoren wenn vorhanden
      if (importedContextFactors && typeof importedContextFactors === 'object') {
        setContextFactors(importedContextFactors);
      }

      showStatusMessage(`${sortedData.length} Einträge erfolgreich importiert!`, 'success');
      return { success: true, count: sortedData.length };
    } catch (error) {
      console.error('Fehler beim Importieren:', error);
      showStatusMessage('Fehler beim Importieren der Daten!', 'error');
      return { success: false };
    }
  }, [showStatusMessage]);

  // Bericht anzeigen/verstecken
  const toggleReport = useCallback(() => {
    setShowReport(!showReport);
  }, [showReport]);

  // Return-Objekt mit allen öffentlichen Funktionen und Daten
  return {
    // Daten
    data,
    dataWithMA,
    dataWithAvgLines,
    
    // UI-Zustände
    viewType,
    setViewType,
    statusMessage,
    showReport,
    
    // Berechnete Werte
    avgValues,
    bpCategory,
    minMaxValues,
    
    // CRUD-Operationen
    addEntry,
    updateEntry,
    deleteEntry,
    importData,
    
    // Kontextfaktoren
    contextFactors,
    getContextForDisplayDate,
    getLatestContextFactors,
    factorCorrelations,
    
    // Bericht
    toggleReport
  };
};

export default useBloodPressureData;