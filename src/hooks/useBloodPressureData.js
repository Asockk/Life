// hooks/useBloodPressureData.js
// Verbesserte Version mit integrierter Kontextfaktor-Verwaltung
import { useState, useCallback, useMemo } from 'react';
import { initialData, prepareDataWithMovingAverages, prepareDataWithAverages, sortDataByDate, standardizeDateFormat } from '../utils/dataUtils';
import { getBloodPressureCategory, calculateAverage } from '../utils/bloodPressureUtils';
import { validateBloodPressure, validateForm, formatDateForDisplay } from '../utils/validationUtils';
import { useDialog } from '../contexts/DialogContext';

const useBloodPressureData = () => {
  // State für die Daten
  const [data, setData] = useState(initialData);
  const [viewType, setViewType] = useState('morgen'); // 'morgen' oder 'abend'
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Dialog-Kontext für Bestätigungsdialoge
  const { openConfirmDialog } = useDialog() || {};

  // Kontextfaktoren für alle Tage: { "YYYY-MM-DD": { stress: 2, sleep: 3, ... }, ... }
  const [contextFactors, setContextFactors] = useState({});
  
  // Korrelationsanalyse zwischen Faktoren und Blutdruckwerten
  const [factorCorrelations, setFactorCorrelations] = useState({});
  
  // State für den angezeigten Bericht
  const [showReport, setShowReport] = useState(false);
  
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
      sysMin: Math.min(...sysValues),
      sysMax: Math.max(...sysValues),
      diaMin: Math.min(...diaValues),
      diaMax: Math.max(...diaValues),
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

  // Konvertiert ein Anzeigedatum wie "Januar 15" oder "1. Januar" in das Format "2025-01-15"
  const convertDisplayDateToISO = useCallback((displayDate) => {
    if (!displayDate) return null;
    
    // Fall 1: Format "Januar 15" (Standardformat)
    if (displayDate.includes(' ') && !displayDate.includes('.')) {
      const [month, day] = displayDate.split(' ');
      const months = {
        'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
        'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
        'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
      };
      
      // Standard-Jahr 2025 verwenden
      return `2025-${months[month] || '01'}-${day.padStart(2, '0')}`;
    }
    
    // Fall 2: Format "1. Januar" (europäisches Format)
    if (displayDate.includes('.') && displayDate.includes(' ')) {
      let day, month;
      
      if (displayDate.startsWith(displayDate.match(/\d+/)[0])) {
        // Format "1. Januar"
        day = displayDate.match(/\d+/)[0];
        month = displayDate.split('. ')[1].trim();
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
      
      return `2025-${months[month] || '01'}-${day.padStart(2, '0')}`;
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
  }, [showStatusMessage, analyzeFactorCorrelations]);

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
  }, [showStatusMessage, analyzeFactorCorrelations]);

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