// hooks/useBloodPressureData.js
// Verbesserte Version mit integrierter Kontextfaktor-Verwaltung und lokaler Datenpersistenz
import { useState, useCallback, useMemo, useEffect } from 'react';
import { prepareDataWithMovingAverages, prepareDataWithAverages, sortDataByDate, standardizeDateFormat } from '../utils/dataUtils';
import { getBloodPressureCategory, calculateAverage } from '../utils/bloodPressureUtils';
import { validateBloodPressure, validateForm, formatDateForDisplay } from '../utils/validationUtils';
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

const useBloodPressureData = () => {
  // State für die Daten
  const [data, setData] = useState([]);
  const [viewType, setViewType] = useState('morgen'); // 'morgen' oder 'abend'
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  
  // State für Datenbereitschaft (initial loading)
  const [dataLoaded, setDataLoaded] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);

  // Dialog-Kontext für Bestätigungsdialoge
  const { openConfirmDialog } = useDialog() || {};

  // Kontextfaktoren für alle Tage: { "YYYY-MM-DD": { stress: 2, sleep: 3, ... }, ... }
  const [contextFactors, setContextFactors] = useState({});
  
  // Korrelationsanalyse zwischen Faktoren und Blutdruckwerten
  const [factorCorrelations, setFactorCorrelations] = useState({});
  
  // State für den angezeigten Bericht
  const [showReport, setShowReport] = useState(false);
  
  // ======================================================================
  // Initialisierung & Laden der gespeicherten Daten beim ersten Rendern
  // ======================================================================
  useEffect(() => {
    async function initializeData() {
      try {
        // Messungen laden
        const storedData = await loadMeasurements();
        if (storedData && storedData.length > 0) {
          setData(storedData);
          console.log(`${storedData.length} Messungen geladen`);
        } else {
          // Fallback: Die initialData als Beispieldaten verwenden
          setData([]);
          console.log('Keine gespeicherten Messungen gefunden.');
        }
        
        // Kontextfaktoren laden
        const storedContextFactors = await loadContextFactors();
        if (storedContextFactors && Object.keys(storedContextFactors).length > 0) {
          setContextFactors(storedContextFactors);
          console.log(`Kontextfaktoren für ${Object.keys(storedContextFactors).length} Tage geladen`);
        }
        
        // Einstellungen laden (z.B. viewType)
        const savedViewType = await loadSetting('viewType', 'morgen');
        setViewType(savedViewType);
        
        // Markieren dass Daten geladen sind
        setDataLoaded(true);
      } catch (error) {
        console.error('Fehler beim Initialisieren der Daten:', error);
        setStatusMessage({
          text: 'Fehler beim Laden der gespeicherten Daten',
          type: 'error'
        });
        // Trotzdem als geladen markieren
        setDataLoaded(true);
      }
    }
    
    initializeData();
  }, []);
  
  // Speichern von Änderungen in der Datenbank
  useEffect(() => {
    // Nicht beim ersten Laden speichern
    if (!dataLoaded || savingInProgress) return;
    
    async function saveDataChanges() {
      setSavingInProgress(true);
      try {
        await saveMeasurements(data);
        console.log(`${data.length} Messungen gespeichert`);
        setSavingInProgress(false);
      } catch (error) {
        console.error('Fehler beim Speichern der Messungen:', error);
        setSavingInProgress(false);
      }
    }
    
    saveDataChanges();
  }, [data, dataLoaded]);
  
  // Speichern von Änderungen bei Kontextfaktoren
  useEffect(() => {
    // Nicht beim ersten Laden speichern
    if (!dataLoaded || savingInProgress) return;
    
    async function saveContextChanges() {
      setSavingInProgress(true);
      try {
        await saveContextFactors(contextFactors);
        console.log('Kontextfaktoren gespeichert');
        setSavingInProgress(false);
      } catch (error) {
        console.error('Fehler beim Speichern der Kontextfaktoren:', error);
        setSavingInProgress(false);
      }
    }
    
    saveContextChanges();
  }, [contextFactors, dataLoaded]);
  
  // Speichern der viewType-Einstellung
  useEffect(() => {
    // Nicht beim ersten Laden speichern
    if (!dataLoaded) return;
    
    async function saveViewTypeSettings() {
      try {
        await saveSetting('viewType', viewType);
        console.log(`Ansichtstyp "${viewType}" gespeichert`);
      } catch (error) {
        console.error('Fehler beim Speichern der Ansicht:', error);
      }
    }
    
    saveViewTypeSettings();
  }, [viewType, dataLoaded]);
  
  // Funktion: Statusnachricht anzeigen - VERBESSERTE VERSION
  const showStatusMessage = useCallback((text, type) => {
    // Setze zunächst eine leere Nachricht, um sicherzustellen, dass eine neue Nachricht immer
    // einen neuen useEffect-Durchlauf in der StatusMessage-Komponente auslöst,
    // selbst wenn dieselbe Nachricht zweimal hintereinander gesendet wird
    setStatusMessage({ text: '', type: '' });
    
    // Dann setze die eigentliche Nachricht mit einem kleinen Zeitabstand
    setTimeout(() => {
      setStatusMessage({ text, type });
    }, 10);
    
    // Die automatische Ausblendung wird jetzt in der StatusMessage-Komponente gesteuert
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
    if (displayDate.includes(' ') && !displayDate.includes('.')) {
      const parts = displayDate.split(' ');
      const month = parts[0];
      let day = parts[1];
      
      // Falls der Tag Teil eines Jahr-Formats ist (z.B. "15, 2024"), bereinigen
      if (day.includes(',')) {
        day = day.split(',')[0];
      }
      
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      return `${year}-${months[month] || '01'}-${day.padStart(2, '0')}`;
    }
    
    // Fall 2: Format "1. Januar" oder "1. Januar 2024" (europäisches Format)
    if (displayDate.includes('.') && displayDate.includes(' ')) {
      let day, month;
      
      if (displayDate.startsWith(displayDate.match(/\d+/)[0])) {
        // Format "1. Januar"
        const parts = displayDate.split('. ');
        day = parts[0];
        
        // Der Rest könnte "Januar 2024" sein
        const monthParts = parts[1].split(' ');
        month = monthParts[0];
      } else {
        // Andere Varianten
        const parts = displayDate.split(' ');
        month = parts[0];
        day = parts[1].replace('.', '').trim();
      }
      
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      return `${year}-${months[month] || '01'}-${day.padStart(2, '0')}`;
    }
    
    // Fall 3: Bereits im ISO-Format (YYYY-MM-DD)
    if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return displayDate;
    }
    
    return null;
  }, []);

  // Hole Kontextfaktoren für ein spezifisches Anzeigedatum
  const getContextForDisplayDate = useCallback((displayDate) => {
    const isoDate = convertDisplayDateToISO(displayDate);
    if (!isoDate) return null;
    
    return contextFactors[isoDate] || null;
  }, [contextFactors, convertDisplayDateToISO]);
  
  // Analysiere Korrelationen zwischen Faktoren und Blutdruckwerten
  const analyzeFactorCorrelations = useCallback(() => {
    // Diese Funktion würde in einer echten Anwendung komplexere Analysen durchführen
    
    // Sammle verfügbare Daten für die Analyse
    const analysisData = data.map(entry => {
      const isoDate = convertDisplayDateToISO(entry.datum);
      if (!isoDate || !contextFactors[isoDate]) return null;
      
      // Verknüpfe Blutdruckdaten mit Kontextfaktoren
      return {
        ...entry,
        context: contextFactors[isoDate]
      };
    }).filter(item => item !== null);
    
    // Wenn nicht genug Daten für eine Analyse vorhanden sind
    if (analysisData.length < 3) {
      setFactorCorrelations({});
      return;
    }
    
    // Vereinfachte Korrelationsanalyse
    const stressCorrelation = calculateSimpleCorrelation(analysisData, 'stress', 'morgenSys');
    const sleepCorrelation = calculateSimpleCorrelation(analysisData, 'sleep', 'morgenSys');
    const saltCorrelation = calculateSimpleCorrelation(analysisData, 'salt', 'morgenSys');
    
    setFactorCorrelations({
      stress: { 
        impact: Math.abs(stressCorrelation) > 0.5 ? 'hoch' : 'mittel',
        effect: stressCorrelation > 0 ? 'erhöhend' : 'senkend',
        value: stressCorrelation
      },
      sleep: { 
        impact: Math.abs(sleepCorrelation) > 0.5 ? 'hoch' : 'mittel',
        effect: sleepCorrelation > 0 ? 'erhöhend' : 'senkend',
        value: sleepCorrelation
      },
      salt: { 
        impact: Math.abs(saltCorrelation) > 0.5 ? 'hoch' : 'mittel',
        effect: saltCorrelation > 0 ? 'erhöhend' : 'senkend',
        value: saltCorrelation
      }
    });
  }, [data, contextFactors, convertDisplayDateToISO]);
  
  // Einfache Korrelationsberechnung (vereinfacht)
  const calculateSimpleCorrelation = (data, contextFactor, bpField) => {
    // Dies ist eine vereinfachte Implementierung
    try {
      const validData = data.filter(item => 
        item.context[contextFactor] !== undefined && item[bpField] > 0
      );
      
      if (validData.length < 3) return 0;
      
      // Sehr einfache Korrelation: Durchschnitt bei hohen vs. niedrigen Werten
      const highContextValues = validData.filter(item => item.context[contextFactor] > 1);
      const lowContextValues = validData.filter(item => item.context[contextFactor] <= 1);
      
      if (highContextValues.length === 0 || lowContextValues.length === 0) return 0;
      
      const avgHighBP = highContextValues.reduce((sum, item) => sum + item[bpField], 0) / highContextValues.length;
      const avgLowBP = lowContextValues.reduce((sum, item) => sum + item[bpField], 0) / lowContextValues.length;
      
      // Normalisierte Differenz als Korrelationsmaß
      return (avgHighBP - avgLowBP) / 20; // Normalisieren auf einen Bereich von etwa -1 bis 1
    } catch (error) {
      console.error('Fehler bei der Korrelationsberechnung:', error);
      return 0;
    }
  };
  
  // Toggle für den Bericht
  const toggleReport = useCallback(() => {
    setShowReport(prev => !prev);
  }, []);
  
  // Prüft, ob bereits ein Eintrag für das angegebene Datum existiert
  const checkExistingEntry = useCallback((formattedDate, tag) => {
    return data.find(entry => 
      entry.datum === formattedDate && entry.tag === tag
    );
  }, [data]);

  // Funktionen zum Hinzufügen, Bearbeiten und Löschen von Einträgen mit Kontextfaktoren
  const addEntry = useCallback((formData, contextData = null) => {
    // Prüfe, ob das Formular gültig ist
    const errors = validateForm(formData, validateBloodPressure);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }
    
    // Datum formatieren für die Anzeige
    const displayDate = formatDateForDisplay(formData.datum);
    
    // ISO-Datum für Kontextfaktoren
    const isoDate = formData.datum;
    
    // Numerische Werte konvertieren
    const numericValues = {};
    ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls'].forEach(field => {
      numericValues[field] = formData[field] ? Number(formData[field]) : 0;
    });
    
    // Prüfen, ob bereits ein Eintrag für diesen Tag existiert
    const existingEntry = checkExistingEntry(displayDate, formData.tag);
    
    // Falls Eintrag bereits existiert und Dialog-Kontext verfügbar
    if (existingEntry && openConfirmDialog) {
      openConfirmDialog({
        title: "Eintrag überschreiben?",
        message: `Für ${formData.tag}, ${displayDate} existiert bereits ein Eintrag. Möchten Sie diesen überschreiben?`,
        onConfirm: () => {
          // Bestehenden Eintrag aktualisieren
          const updatedData = data.map(entry => {
            if (entry.id === existingEntry.id) {
              return {
                ...entry,
                ...numericValues
              };
            }
            return entry;
          });
          
          setData(updatedData);
          
          // Kontextfaktoren aktualisieren, falls vorhanden
          if (contextData && Object.keys(contextData).length > 0) {
            setContextFactors(prev => ({
              ...prev,
              [isoDate]: contextData
            }));
            
            // Korrelationsanalyse aktualisieren
            setTimeout(analyzeFactorCorrelations, 0);
          }
          
          showStatusMessage("Eintrag aktualisiert", "success");
        }
      });
      
      return { success: false, duplicate: true };
    }
    
    // Wenn kein Dialog-Kontext oder kein Duplikat gefunden
    if (!existingEntry) {
      // Neuen Eintrag erstellen
      const newEntry = {
        id: Date.now(),
        tag: formData.tag,
        datum: displayDate,
        ...numericValues
      };
      
      // Zu den Daten hinzufügen
      setData(prevData => [...prevData, newEntry]);
      
      // Kontextfaktoren speichern, falls vorhanden
      if (contextData && Object.keys(contextData).length > 0) {
        setContextFactors(prev => ({
          ...prev,
          [isoDate]: contextData
        }));
        
        // Korrelationsanalyse aktualisieren
        setTimeout(analyzeFactorCorrelations, 0);
      }
      
      showStatusMessage("Neuer Eintrag hinzugefügt", "success");
      
      return { success: true };
    } else {
      // Fallback für Browser ohne Dialog-Kontext
      const confirmOverwrite = window.confirm(`Für ${formData.tag}, ${displayDate} existiert bereits ein Eintrag. Möchten Sie diesen überschreiben?`);
      
      if (confirmOverwrite) {
        // Bestehenden Eintrag aktualisieren
        const updatedData = data.map(entry => {
          if (entry.id === existingEntry.id) {
            return {
              ...entry,
              ...numericValues
            };
          }
          return entry;
        });
        
        setData(updatedData);
        
        // Kontextfaktoren aktualisieren, falls vorhanden
        if (contextData && Object.keys(contextData).length > 0) {
          setContextFactors(prev => ({
            ...prev,
            [isoDate]: contextData
          }));
          
          // Korrelationsanalyse aktualisieren
          setTimeout(analyzeFactorCorrelations, 0);
        }
        
        showStatusMessage("Eintrag aktualisiert", "success");
        
        return { success: true };
      }
      
      return { success: false, duplicate: true };
    }
  }, [data, showStatusMessage, analyzeFactorCorrelations, formatDateForDisplay, checkExistingEntry, openConfirmDialog]);

  const updateEntry = useCallback((id, formData, contextData = null) => {
    // Prüfe, ob das Formular gültig ist
    const errors = validateForm(formData, validateBloodPressure);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }
    
    // Datum formatieren für die Anzeige
    const displayDate = formatDateForDisplay(formData.datum);
    
    // ISO-Datum für Kontextfaktoren
    const isoDate = formData.datum;
    
    // Numerische Werte konvertieren
    const numericValues = {};
    ['morgenSys', 'morgenDia', 'morgenPuls', 'abendSys', 'abendDia', 'abendPuls'].forEach(field => {
      numericValues[field] = formData[field] ? Number(formData[field]) : 0;
    });
    
    // Daten aktualisieren
    setData(prevData => prevData.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          tag: formData.tag,
          datum: displayDate,
          ...numericValues
        };
      }
      return entry;
    }));
    
    // Kontextfaktoren aktualisieren, falls vorhanden
    if (contextData) {
      // Wenn Kontextdaten leer sind, entferne sie
      if (Object.keys(contextData).length === 0) {
        setContextFactors(prev => {
          const newContexts = { ...prev };
          delete newContexts[isoDate];
          return newContexts;
        });
      } else {
        // Ansonsten speichere sie
        setContextFactors(prev => ({
          ...prev,
          [isoDate]: contextData
        }));
      }
      
      // Korrelationsanalyse aktualisieren
      setTimeout(analyzeFactorCorrelations, 0);
    }
    
    showStatusMessage("Eintrag aktualisiert", "success");
    return { success: true };
  }, [showStatusMessage, analyzeFactorCorrelations, formatDateForDisplay]);

  // VERBESSERTE deleteEntry-Funktion mit DialogContext
  const deleteEntry = useCallback((id) => {
    // Finde das Datum des zu löschenden Eintrags
    const entryToDelete = data.find(item => item.id === id);
    
    // Sicherstellen, dass der Dialog-Kontext verfügbar ist
    if (!openConfirmDialog) {
      // Fallback zur alten Methode, falls DialogContext nicht verfügbar ist
      const confirmed = window.confirm("Möchten Sie diesen Eintrag wirklich löschen?");
      if (confirmed) {
        // Lösche Blutdruckeintrag
        setData(prevData => prevData.filter(item => item.id !== id));
        
        // Wenn Eintrag gefunden wurde, lösche auch zugehörige Kontextfaktoren
        if (entryToDelete) {
          const isoDate = convertDisplayDateToISO(entryToDelete.datum);
          if (isoDate && contextFactors[isoDate]) {
            setContextFactors(prev => {
              const newContexts = { ...prev };
              delete newContexts[isoDate];
              return newContexts;
            });
          }
        }
        
        showStatusMessage("Eintrag erfolgreich gelöscht", "success");
      }
      return;
    }
    
    // Moderner Bestätigungsdialog
    openConfirmDialog({
      title: "Eintrag löschen",
      message: "Möchten Sie diesen Blutdruck-Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      onConfirm: () => {
        // Lösche Blutdruckeintrag
        setData(prevData => prevData.filter(item => item.id !== id));
        
        // Wenn Eintrag gefunden wurde, lösche auch zugehörige Kontextfaktoren
        if (entryToDelete) {
          const isoDate = convertDisplayDateToISO(entryToDelete.datum);
          if (isoDate && contextFactors[isoDate]) {
            setContextFactors(prev => {
              const newContexts = { ...prev };
              delete newContexts[isoDate];
              return newContexts;
            });
          }
        }
        
        showStatusMessage("Eintrag erfolgreich gelöscht", "success");
      }
    });
  }, [data, contextFactors, showStatusMessage, convertDisplayDateToISO, openConfirmDialog]);

  // Verbesserte Funktion zum Importieren von Daten mit zuverlässiger Duplikaterkennung
  const importData = useCallback((importedData, importedContext = null) => {
    if (!importedData || importedData.length === 0) {
      return false;
    }
    
    // Bestehende Daten
    const existingData = [...data];
    
    // Erstelle ein Set von standardisierten Datumsformaten für bestehende Daten
    // um effizient prüfen zu können, ob ein Datum bereits existiert
    const existingDatesSet = new Set();
    
    existingData.forEach(item => {
      // Generiere ein standardisiertes Datum, das unabhängig vom Format vergleichbar ist
      const standardDate = standardizeDateFormat(item.datum, item.tag);
      if (standardDate) {
        existingDatesSet.add(standardDate);
      }
    });
    
    // Führe die importierten Daten mit den bestehenden zusammen,
    // überschreibe existierende und füge neue hinzu
    const mergedData = [...existingData];
    const newEntries = [];
    let updatedCount = 0;
    
    importedData.forEach(newEntry => {
      // Standardisiertes Datum aus dem Import (falls vorhanden)
      const standardDate = newEntry._standardDate || standardizeDateFormat(newEntry.datum, newEntry.tag);
      
      if (standardDate && existingDatesSet.has(standardDate)) {
        // Wir haben bereits einen Eintrag mit diesem Datum - finden und aktualisieren
        const existingIndex = existingData.findIndex(item => {
          const itemStandardDate = standardizeDateFormat(item.datum, item.tag);
          return itemStandardDate === standardDate;
        });
        
        if (existingIndex !== -1) {
          // Eintrag mit diesem Datum ersetzen
          mergedData[existingIndex] = {
            ...mergedData[existingIndex], // ID und andere Felder beibehalten
            morgenSys: newEntry.morgenSys,
            morgenDia: newEntry.morgenDia,
            morgenPuls: newEntry.morgenPuls,
            abendSys: newEntry.abendSys,
            abendDia: newEntry.abendDia,
            abendPuls: newEntry.abendPuls
          };
          updatedCount++;
        }
      } else {
        // Neuer Eintrag, den wir hinzufügen
        newEntries.push(newEntry);
        // Das standardisierte Datum zum Set hinzufügen, um Duplikate im Import zu vermeiden
        if (standardDate) {
          existingDatesSet.add(standardDate);
        }
      }
    });
    
    // Füge alle neuen Einträge hinzu
    const resultData = [...mergedData, ...newEntries];
    
    // Nach Datum sortieren und Daten aktualisieren
    const sortedData = sortDataByDate(resultData);
    setData(sortedData);
    
    // Wenn Kontextdaten importiert wurden, diese auch importieren
    if (importedContext && typeof importedContext === 'object') {
      setContextFactors(prev => ({
        ...prev,
        ...importedContext
      }));
      
      // Korrelationsanalyse aktualisieren
      setTimeout(analyzeFactorCorrelations, 0);
    }
    
    // Status-Nachricht anzeigen
    showStatusMessage(
      `${newEntries.length} neue Einträge importiert, ${updatedCount} Einträge aktualisiert`, 
      'success'
    );
    
    return true;
  }, [data, showStatusMessage, analyzeFactorCorrelations]);
  
  return {
    // Daten
    data,
    dataWithMA,
    dataWithAvgLines,
    viewType,
    setViewType,
    
    // Berechnete Werte
    avgValues,
    bpCategory,
    minMaxValues,
    
    // Status
    statusMessage,
    showStatusMessage,
    dataLoaded,
    
    // CRUD Operationen
    addEntry,
    updateEntry,
    deleteEntry,
    importData,
    
    // Kontextfaktoren-Verwaltung
    contextFactors,
    getContextForDisplayDate,
    getLatestContextFactors,
    factorCorrelations,
    
    // Berichtsfunktionen
    showReport,
    toggleReport
  };
};

export default useBloodPressureData;